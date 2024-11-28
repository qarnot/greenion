use anyhow::anyhow;
use anyhow::Context;
use std::{env, fs::create_dir_all, path::PathBuf};

use log::error;
use native_dialog::MessageDialog;

use crate::auth::x509::parse_x509;

pub fn get_client_config_file_path() -> anyhow::Result<PathBuf> {
    if let Ok(v) = env::var("GREENION_CLIENT_CONFIG_FILE") {
        return Ok(PathBuf::from(v));
    }

    Ok(dirs::config_dir()
        .context("Failed to get system config folder")?
        .join("GreenionClient")
        .join("client_config.toml"))
}

pub fn get_client_log_folder() -> Result<PathBuf, anyhow::Error> {
    let default_log_folder = dirs::data_dir()
        .context("logs: unsupported system: data dir is not available")?
        .join("GreenionClient")
        .join("Logs");
    let logs_folder = env::var("GREENION_CLIENT_LOGS_FOLDER")
        .map(PathBuf::from)
        .unwrap_or(default_log_folder);
    Ok(logs_folder)
}

pub fn setup_client_agent_log_folder() -> anyhow::Result<PathBuf> {
    let logs_folder = get_client_log_folder()?;

    if create_dir_all(&logs_folder).is_err() {
        return Err(anyhow!(
            "Could not create log folder {}",
            logs_folder.display()
        ));
    };

    println!("Logging to folder {}", logs_folder.display());
    Ok(logs_folder)
}

pub fn setup_client_agent_log_file() -> anyhow::Result<PathBuf> {
    Ok(setup_client_agent_log_folder()?.join("greenion-agent-client.log"))
}

pub fn print_message_dialog(msg: &str) {
    let _ = MessageDialog::new()
        .set_title("Greenion Agent Client")
        .set_text(msg)
        .set_type(native_dialog::MessageType::Error)
        .show_alert();
}

pub fn check_is_certificate_cacert(ca_cert: &[u8]) -> bool {
    const EXPECTED_CN: &str = "GREENION-CA";

    let ca_cert = match parse_x509(ca_cert) {
        Ok(v) => v,
        Err(_) => {
            return false;
        }
    };

    let common_name = ca_cert
        .subject()
        .iter_common_name()
        .next()
        .unwrap()
        .as_str()
        .unwrap();

    if common_name != EXPECTED_CN {
        error!(
            "Expected certificate Subject.CN to start with '{EXPECTED_CN}' but got '{common_name}'"
        );
        return false;
    }

    true
}
