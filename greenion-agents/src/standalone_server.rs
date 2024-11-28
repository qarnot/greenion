pub mod authenticator;
use std::{net::SocketAddr, time::Duration};
use tokio::net::TcpStream;
use tokio_rustls::TlsStream;
pub mod forwarder;
pub mod process_client_connection;
pub mod utils;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HANDLE;

pub struct SanzuServerWrapper {
    pub sanzu_server_path: String,
    pub sanzu_server_config: String,
    pub sanzu_server_codec: String,
    pub sanzu_log_file: Option<String>,
    pub sanzu_wait_time: Duration,
    #[cfg(target_os = "windows")]
    pub wakeup_exe_path: String,
    #[cfg(target_os = "windows")]
    handles: Option<SanzuServerWindowsHandles>,
    #[cfg(target_os = "linux")]
    handles: Option<SanzuServerLinuxHandles>,
}

impl SanzuServerWrapper {
    pub fn new(
        sanzu_server_path: &str,
        sanzu_server_config: &str,
        sanzu_server_codec: &str,
        sanzu_log_file: Option<String>,
        sanzu_wait_time: Duration,
    ) -> Self {
        Self {
            sanzu_server_path: sanzu_server_path.to_string(),
            sanzu_server_config: sanzu_server_config.to_string(),
            sanzu_server_codec: sanzu_server_codec.to_string(),
            #[cfg(target_os = "windows")]
            wakeup_exe_path: crate::conf::server_config::default_windows_wakeup_exe_path(),
            sanzu_log_file,
            sanzu_wait_time,
            handles: None,
        }
    }
}

pub struct Authenticator {
    pub local_machine_id: String,
    pub jwks_url: String,
    pub timeout: Duration,
}

pub struct StandaloneServerForwarder {
    pub outbound_tls_stream: TlsStream<TcpStream>,
    pub sanzu_stream: TcpStream,
    pub client_addr: SocketAddr,
    pub client_id: String,
    pub timeout: Duration,
}

#[cfg(target_os = "linux")]
pub mod sanzu_server_starter_linux;
#[cfg(target_os = "linux")]
pub use sanzu_server_starter_linux as sanzu_server_starter;

#[cfg(target_os = "windows")]
pub mod sanzu_server_starter_windows;
#[cfg(target_os = "windows")]
pub use sanzu_server_starter_windows as sanzu_server_starter;

#[cfg(target_os = "linux")]
pub struct SanzuServerLinuxHandles {
    pub sanzu_server_process_child: std::process::Child,
}

#[cfg(target_os = "windows")]
pub struct SanzuServerWindowsHandles {
    pub sanzu_server_process_handle: HANDLE,
    pub sanzu_server_thread_handle: HANDLE,
    pub sanzu_server_logfile_handle: Option<HANDLE>,
}

#[cfg(target_os = "windows")]
unsafe impl Send for SanzuServerWindowsHandles {}
#[cfg(target_os = "windows")]
unsafe impl Sync for SanzuServerWindowsHandles {}
