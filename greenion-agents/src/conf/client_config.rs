use anyhow::anyhow;
use log::error;
use serde::Deserialize;
use std::{
    fs::File,
    io::Read,
    path::{Path, PathBuf},
};
use toml;

use crate::client::utils::get_client_log_folder;

#[derive(Debug, Deserialize, Clone, Default)]
pub struct ClientConfig {
    #[serde(default)]
    pub client_auth_config: ClientAuthConfig,
    #[serde(default)]
    pub client_network_config: ClientNetworkConfig,
    #[serde(default)]
    pub sanzu_client_launch_config: SanzuClientLaunchConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ClientAuthConfig {
    #[serde(default = "default_ca_cert_file")]
    pub ca_cert_file: String,
    #[serde(default = "default_jwks_url")]
    pub jwks_url: String,
    #[serde(default = "default_webapp_url")]
    pub webapp_url: String,
}

impl Default for ClientAuthConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<ClientAuthConfig>(&c).unwrap()
    }
}

fn default_ca_cert_file() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionClient\\Agent\\rootCA.crt".to_string()
    } else {
        "/etc/greenion-client/certs/rootCA.crt".to_string()
    }
}
fn default_jwks_url() -> String {
    "http://greenion.local:5004/.well-known/jwks.json".to_string()
}
fn default_webapp_url() -> String {
    "http://greenion.local:5001/".to_string()
}

#[derive(Debug, Deserialize, Clone)]
pub struct ClientNetworkConfig {
    #[serde(default = "default_timeout_secs")]
    pub timeout_secs: u16,
    #[serde(default = "default_listening_port")]
    pub listening_port: u16,
    #[serde(default = "default_max_retries")]
    pub max_retries: u16,
}

impl Default for ClientNetworkConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<ClientNetworkConfig>(&c).unwrap()
    }
}

fn default_listening_port() -> u16 {
    1123
}
fn default_timeout_secs() -> u16 {
    3
}
fn default_max_retries() -> u16 {
    3
}

#[derive(Debug, Deserialize, Clone)]
pub struct SanzuClientLaunchConfig {
    #[serde(default = "default_sanzu_client_external_startup")]
    pub sanzu_client_external_startup: bool,
    #[serde(default = "default_sanzu_client_exe_path")]
    pub sanzu_client_exe_path: String,
    #[serde(default = "default_sanzu_client_config_path")]
    pub sanzu_client_config_path: String,
    #[serde(default = "default_sanzu_log_file")]
    pub sanzu_log_file: String,
}

impl Default for SanzuClientLaunchConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<SanzuClientLaunchConfig>(&c).unwrap()
    }
}

fn default_sanzu_client_external_startup() -> bool {
    false
}
fn default_sanzu_client_exe_path() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionClient\\SanzuClient\\sanzu_client.exe".to_string()
    } else {
        "/usr/bin/sanzu_client".to_string()
    }
}
fn default_sanzu_client_config_path() -> String {
    if cfg!(target_os = "windows") {
        dirs::config_local_dir()
            .expect("Failed to get %localappdata% dir for loading sanzu config")
            .join("GreenionClient")
            .join("sanzu_client_config.toml")
            .display()
            .to_string()
    } else {
        "/etc/greenion-client/sanzu_client_config.toml".to_string()
    }
}

fn default_sanzu_log_file() -> String {
    get_client_log_folder()
        .unwrap_or(PathBuf::from("/var/log/"))
        .join("sanzu_client_logs.log")
        .to_string_lossy()
        .to_string()
}

pub fn build_client_config(config_file: &Path) -> anyhow::Result<ClientConfig> {
    let mut content = String::new();
    match File::open(config_file) {
        Ok(mut f) => match f.read_to_string(&mut content) {
            Ok(_) => {}
            Err(e) => {
                error!(
                    "Could not read config file {} : {}",
                    config_file.display(),
                    e
                );
                return Err(anyhow!(
                    "Could not read config file {}",
                    config_file.display()
                ));
            }
        },
        Err(_) => {
            error!("Config file {} does not exist", config_file.display());
            return Err(anyhow!(
                "Config file {} does not exist",
                config_file.display()
            ));
        }
    };
    match toml::from_str::<ClientConfig>(&content) {
        Ok(v) => Ok(v),
        Err(e) => {
            error!(
                "Could not deserialize {} as a valid toml file : {}",
                config_file.display(),
                e
            );
            Err(anyhow!(
                "{} is not a valid TOML file",
                config_file.display()
            ))
        }
    }
}
