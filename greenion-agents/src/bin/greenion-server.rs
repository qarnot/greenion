use greenion_agents::auth::x509::{extract_id_from_certificate, parse_x509};
use greenion_agents::auth::{load_certs, load_private_key};
use greenion_agents::setup_fern;
use greenion_agents::standalone_server::process_client_connection::process_client_connection;
use greenion_agents::standalone_server::utils::{
    get_server_config_file_path, setup_server_agent_log_folder, setup_server_panic_hook,
};
use log::{error, info, warn};
use std::io::{self};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Semaphore;

use greenion_agents::conf::server_config::{build_server_config, ServerConfig};
use tokio::net::TcpListener;
use tokio_rustls::{rustls, TlsAcceptor};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = match setup_server_agent_log_folder() {
        Ok(log_folder) => setup_fern(log_folder.join("greenion-agent-server.log").as_path()),
        Err(e) => {
            println!("An error occurred while creating the logs folder: {}", e);
            setup_fern(PathBuf::default().as_path())
        }
    };

    setup_server_panic_hook();

    info!("Starting greenion-agent-server");
    let config_file_path = get_server_config_file_path().unwrap_or_default();
    let agent_config = build_server_config(config_file_path.as_path()).unwrap_or_else(|_| {
        warn!("Could not read config at {}", &config_file_path.display());
        warn!("Using default configuration");
        ServerConfig::default()
    });
    let agent_auth_config = agent_config.server_auth_config.clone();
    let agent_network_config = agent_config.server_network_config.clone();

    let certs = load_certs(&agent_auth_config.cert_file).unwrap_or_else(|_| {
        panic!(
            "Failed to load certificate at {}",
            &agent_auth_config.cert_file
        )
    });
    let key = load_private_key(&agent_auth_config.private_key_file).unwrap_or_else(|_| {
        panic!(
            "Failed to load private key at {} ",
            &agent_auth_config.private_key_file
        )
    });
    info!(
        "Loaded certificate ({}) and private key ({})",
        &agent_auth_config.cert_file, &agent_auth_config.private_key_file
    );
    let cert = parse_x509(
        certs
            .first()
            .expect("Failed to get first certificate while extracting machine ID"),
    )
    .expect("Could not parse server x509 certificate");

    let machine_id =
        extract_id_from_certificate(&cert).expect("Could not extract id from server certificate");

    let config = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(certs, key)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidInput, err))?;
    let acceptor = TlsAcceptor::from(Arc::new(config));

    let listening_on = format!(
        "{}:{}",
        &agent_network_config.server_listening_ip, &agent_network_config.server_port
    );
    info!(
        "Startup done. Listening for new connections on {} ",
        listening_on
    );
    let listener = TcpListener::bind(listening_on).await?;
    // limits the number of connected clients to 1
    let sem_connected_clients = Arc::new(Semaphore::new(1));

    loop {
        let local_config = agent_config.clone();
        let local_machine_id = machine_id.clone();
        let acceptor = acceptor.clone();

        let (stream, peer_addr) = match listener.accept().await {
            Ok((s, pa)) => (s, pa),
            Err(e) => {
                error!("Could not accept connection : {}", e);
                continue;
            }
        };

        info!("Got a connection from {}", peer_addr);

        match stream.set_nodelay(true) {
            Ok(_) => {}
            Err(e) => {
                error!("Could not set stream to {} as nodelay : {}", peer_addr, e);
            }
        };

        let sem_connected_clients = Arc::clone(&sem_connected_clients);
        tokio::spawn(async move {
            if let Err(err) = process_client_connection(
                stream,
                peer_addr,
                acceptor,
                local_machine_id.as_str(),
                local_config,
                sem_connected_clients,
            )
            .await
            {
                warn!("{}", err);
            }
        });
    }
}
