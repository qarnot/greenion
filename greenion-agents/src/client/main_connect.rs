use std::{process::ExitStatus, time::Duration};

use jwks::Jwks;
use log::{debug, error, info};
use rustls::pki_types::CertificateDer;
use tokio::{net::TcpListener, task::JoinHandle};

use crate::{
    auth::jwt::Claims,
    client::{
        authenticator::{Authenticate, Authenticator},
        dialer::{Dialer, StandaloneDialer},
        errors::GreenionClientIntermediateError,
        ClientForwarder, SanzuClientStarter,
    },
    conf::client_config::ClientConfig,
};

use super::{errors::GreenionClientFinalError, server_status_handler::ServerStatusHandler};

static CLIENT_VERSION: &str = "v0.0.1";

pub async fn main_connect(
    jwt: &Claims,
    timeout: &Duration,
    jwt_string: &str,
    jwks: &Jwks,
    cert: &CertificateDer<'static>,
    agent_config: &ClientConfig,
) -> Result<(), GreenionClientFinalError> {
    let timeout = timeout.to_owned();
    let agent_network_config = agent_config.client_network_config.to_owned();
    let agent_sanzu_client_launch_config = agent_config.sanzu_client_launch_config.to_owned();

    let standalone_dialer = StandaloneDialer {
        server_ip: jwt.machine_ip.to_owned(),
        server_port: jwt.machine_port,
        timeout,
        cert: cert.clone(),
    };

    let res_dial = standalone_dialer.dial().await;
    let (stream, certificate) = match res_dial {
        Ok(v) => {
            info!("Dialing worked");
            v
        }
        Err(e) => {
            return Err(GreenionClientFinalError::new("Failed to dial server", e));
        }
    };

    let authenticator = Authenticator {
        stream,
        timeout,
        jwt: jwt_string.to_owned(),
        client_version: CLIENT_VERSION.to_string(),
        jwks: jwks.to_owned(),
        server_cert: certificate.clone(),
        ca_cert: cert.to_owned(),
    };

    let res_authenticator = authenticator.authenticate().await;

    let outbound_tls_stream = match res_authenticator {
        Ok(v) => {
            info!("Authentication worked");
            v
        }
        Err(e) => {
            error!("Could not authenticate : {}", e);
            return Err(GreenionClientFinalError::new(
                "Failed to authenticate to server",
                e,
            ));
        }
    };

    let res_sshandler = ServerStatusHandler {
        stream: outbound_tls_stream,
        timeout,
    }
    .handle()
    .await;
    let outbound_tls_stream = match res_sshandler {
        Ok(v) => {
            info!("Server status was OK");
            v
        }
        Err(e) => {
            return Err(GreenionClientFinalError::new(
                "Error occured when checking server status",
                e,
            ));
        }
    };

    let local_binding_addr = format!("127.0.0.1:{}", agent_network_config.listening_port);

    let wait_duration: Duration = if agent_sanzu_client_launch_config.sanzu_client_external_startup
    {
        Duration::from_secs(60 * 2)
    } else {
        Duration::from_secs(3)
    };

    let sanzu_stream_binder = match tokio::time::timeout(
        wait_duration,
        TcpListener::bind(&local_binding_addr),
    )
    .await
    {
        Ok(v) => match v {
            Ok(v) => {
                debug!("Bound to {} successfully", &local_binding_addr);
                v
            }
            Err(e) => {
                error!("Could not bind to {} : {}", local_binding_addr, e);
                let inter_err = GreenionClientIntermediateError::new(format!("Port {} may already be in use on this computer, or we need more permissions to use it.", agent_network_config.listening_port));
                return Err(GreenionClientFinalError::new(
                    "Could not setup local sanzu client",
                    inter_err,
                ));
            }
        },
        Err(e) => {
            error!("Timed out while binding to local listening port : {}", e);
            let inter_err = GreenionClientIntermediateError::new(format!("Port {} may already be in use on this computer, or we need more permissions to use it.", agent_network_config.listening_port));
            return Err(GreenionClientFinalError::new(
                "Could not setup local sanzu client",
                inter_err,
            ));
        }
    };

    let sanzu_client_task: Option<
        JoinHandle<anyhow::Result<ExitStatus, GreenionClientIntermediateError>>,
    > = if agent_sanzu_client_launch_config.sanzu_client_external_startup {
        info!("Config says that sanzu client is externally managed");
        info!("Skipping sanzu client startup");
        None
    } else {
        Some(tokio::spawn(async move {
            let scw = SanzuClientStarter {
                sanzu_client_config_path: agent_sanzu_client_launch_config
                    .sanzu_client_config_path
                    .clone(),
                sanzu_client_exe_path: agent_sanzu_client_launch_config
                    .sanzu_client_exe_path
                    .clone(),
                sanzu_client_log_file: agent_sanzu_client_launch_config.sanzu_log_file.clone(),
                port: agent_network_config.listening_port,
            };
            scw.run().await
        }))
    };

    let proxification_task = tokio::spawn(async move {
        let cf = ClientForwarder {
            outbound_tls_stream,
            sanzu_listener: sanzu_stream_binder,
            initial_timeout: {
                if agent_sanzu_client_launch_config.sanzu_client_external_startup {
                    None
                } else {
                    Some(Duration::from_secs(2))
                }
            },
        };

        cf.forward().await
    });

    match sanzu_client_task {
        Some(sz_cli_task) => {
            tokio::select! {
                biased;
                task_spawn_ret = sz_cli_task => {
                    match task_spawn_ret {
                        Ok(sz_cli_res) => {
                            match sz_cli_res {
                                Ok(_) => Ok(()) ,
                                Err(intermediate_error) => {
                                    Err(GreenionClientFinalError::new("Error with core remote desktop", intermediate_error))
                                }
                            }
                        },
                        Err(_) => {
                            Err(GreenionClientFinalError::make_complete("Error with core remote desktop", ""))
                        }
                    }
                },
                task_spawn_ret = proxification_task => {
                    match task_spawn_ret {
                        Ok(v) => {
                            match v {
                                Ok(_) => Ok(()),
                                Err(intermediate_error) => {
                                    Err(GreenionClientFinalError::new("Error with proxification", intermediate_error))
                                }
                            }
                        },
                        Err(_) => {
                            Err(GreenionClientFinalError::make_complete("Error with proxification", ""))
                        }
                    }
                }
            }
        }
        None => {
            tokio::select! {
                task_spawn_ret = proxification_task => {
                    match  task_spawn_ret {
                        Ok(v) => {
                            match v {
                                Ok(_) => Ok(()),
                                Err(e) => {
                                    Err(GreenionClientFinalError::new("Error with proxification", e))
                                }
                            }
                        },
                        Err(_) => {
                            Err(GreenionClientFinalError::make_complete("Error with proxification", ""))
                        }
                    }
                }
            }
        }
    }
}
