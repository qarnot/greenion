use std::time::Duration;

use tokio::net::{TcpListener, TcpStream};
use tokio_rustls::TlsStream;

pub mod authenticator;
pub mod dialer;
pub mod errors;
pub mod forwarder;
pub mod main_connect;
pub mod sanzu_client_starter;
pub mod server_status_handler;
pub mod utils;

pub struct SanzuClientStarter {
    pub sanzu_client_exe_path: String,
    pub sanzu_client_config_path: String,
    pub sanzu_client_log_file: String,
    pub port: u16,
}

pub struct ClientForwarder {
    pub outbound_tls_stream: TlsStream<TcpStream>,
    pub sanzu_listener: TcpListener,
    pub initial_timeout: Option<Duration>,
}
