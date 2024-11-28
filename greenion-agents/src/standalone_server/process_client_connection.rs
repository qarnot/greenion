use anyhow::{anyhow, bail};
use log::{error, info};
use std::{net::SocketAddr, sync::Arc, time::Duration};
use tokio::{
    net::TcpStream,
    sync::{Semaphore, TryAcquireError},
    time::timeout,
};
use tokio_rustls::TlsAcceptor;

use crate::{
    close_session,
    conf::server_config::ServerConfig,
    proto::{
        common::send_msg_async,
        messages::{ServerStartProxy, StartProxyStatus},
    },
    standalone_server::{Authenticator, SanzuServerWrapper, StandaloneServerForwarder},
};

pub async fn process_client_connection(
    stream: tokio::net::TcpStream,
    client_addr: SocketAddr,
    acceptor: TlsAcceptor,
    machine_id: &str,
    server_agent_config: ServerConfig,
    sem_connected_clients: Arc<Semaphore>,
) -> anyhow::Result<()> {
    let outbound_tls_stream = acceptor.accept(stream).await?;
    let mut outbound_tls_stream = tokio_rustls::TlsStream::Server(outbound_tls_stream);

    let (client_id, client_jwt_str, client_claims) = Authenticator {
        local_machine_id: machine_id.to_string(),
        jwks_url: server_agent_config.server_auth_config.jwks_url.clone(),
        timeout: Duration::from_secs(3),
    }
    .authenticate(&mut outbound_tls_stream, client_addr)
    .await?;

    let _permit = match Arc::clone(&sem_connected_clients).try_acquire_owned() {
        Ok(permit) => permit,
        Err(TryAcquireError::NoPermits) => {
            send_msg_async(
                &mut outbound_tls_stream,
                ServerStartProxy {
                    result: StartProxyStatus::ServerBusy.into(),
                },
                None,
            )
            .await?;
            return Err(anyhow::anyhow!(
                "A second client tried to connect. Refusing his connection"
            ));
        }
        Err(TryAcquireError::Closed) => unreachable!(),
    };
    info!("[{}@{}] Connection authenticated", client_id, client_addr);

    if server_agent_config
        .sanzu_server_launch_config
        .sanzu_server_external_startup
    {
        info!(
            "[{}@{}] Config says that sanzu server startup is externally managed.",
            client_id, client_addr
        );
    } else {
        info!(
            "[{}@{}] Config says that sanzu server startup is internally managed.",
            client_id, client_addr
        );

        let mut sss = SanzuServerWrapper::new(
            server_agent_config
                .sanzu_server_launch_config
                .sanzu_server_path
                .as_str(),
            server_agent_config
                .sanzu_server_launch_config
                .sanzu_server_config_path
                .as_str(),
            server_agent_config
                .sanzu_server_launch_config
                .sanzu_server_codec
                .as_str(),
            Some(
                server_agent_config
                    .sanzu_server_launch_config
                    .sanzu_log_file
                    .clone(),
            ),
            Duration::from_secs(1),
        );

        let _ = sss.start();
        tokio::task::spawn_blocking(move || sss.wait());
        // task::spawn(move || sss.wait());
    }

    info!(
        "[{}@{}] Connecting to 127.0.0.1:{}",
        client_id,
        client_addr,
        &server_agent_config
            .sanzu_server_launch_config
            .sanzu_server_port
    );

    let sanzu_stream_res = {
        if server_agent_config
            .sanzu_server_launch_config
            .sanzu_server_external_startup
        {
            TcpStream::connect(format!(
                "127.0.0.1:{}",
                &server_agent_config
                    .sanzu_server_launch_config
                    .sanzu_server_port
            ))
            .await
        } else {
            match timeout(
                Duration::from_secs(
                    server_agent_config
                        .sanzu_server_launch_config
                        .sanzu_server_startup_timeout,
                ),
                TcpStream::connect(format!(
                    "127.0.0.1:{}",
                    &server_agent_config
                        .sanzu_server_launch_config
                        .sanzu_server_port
                )),
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    error!(
                        "Timed out ({} secs) while connecting to sanzu server",
                        server_agent_config
                            .sanzu_server_launch_config
                            .sanzu_server_startup_timeout
                    );
                    send_msg_async(
                        &mut outbound_tls_stream,
                        ServerStartProxy {
                            result: StartProxyStatus::SanzuStartError.into(),
                        },
                        None,
                    )
                    .await?;
                    return Err(anyhow!("Timed out while connecting to sanzu server"));
                }
            }
        }
    };

    let sanzu_stream = match sanzu_stream_res {
        Ok(v) => {
            info!(
                "[{}@{}] Successfully connected to sanzu server",
                client_id, client_addr
            );
            v
        }
        Err(e) => {
            error!(
                "[{}@{}] Failed to connect to local sanzu server : {}",
                client_id, client_addr, e
            );
            send_msg_async(
                &mut outbound_tls_stream,
                ServerStartProxy {
                    result: StartProxyStatus::SanzuStartError.into(),
                },
                None,
            )
            .await?;
            return Err(anyhow!("Could not connect to local sanzu server"));
        }
    };

    send_msg_async(
        &mut outbound_tls_stream,
        ServerStartProxy {
            result: StartProxyStatus::StartProxy.into(),
        },
        None,
    )
    .await?;

    let _forward = StandaloneServerForwarder {
        outbound_tls_stream,
        sanzu_stream,
        client_id: client_id.clone(),
        client_addr,
        timeout: Duration::from_secs(
            server_agent_config
                .sanzu_server_launch_config
                .sanzu_server_startup_timeout,
        ),
    }
    .forward()
    .await;
    info!("Connection with {}@{} ended", client_id, client_addr);

    info!(
        "Dropping client count semaphore as session with {}@{} just ended",
        client_id, client_addr
    );
    drop(_permit);
    info!(
        "Informing web application that session id {} with {} just ended",
        client_claims.session_id, client_addr
    );

    if let Err(e) = close_session(crate::CloseSessionArgs {
        base_url: server_agent_config.server_auth_config.webapp_url.to_owned(),
        jwt: client_jwt_str.to_owned(),
        session_id: client_claims.session_id,
    })
    .await
    {
        error!(
            "Could not inform web application that session id {} with {} just ended : {}",
            client_claims.session_id, client_addr, e
        );
        bail!(
            "Could not inform web application that session id {} with {} just ended : {}",
            client_claims.session_id,
            client_addr,
            e
        );
    };
    info!(
        "Ending session id {} with web app worked",
        client_claims.session_id
    );

    Ok(())
}
