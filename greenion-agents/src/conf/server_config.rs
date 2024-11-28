use anyhow::anyhow;
use clap::Parser;
use serde::Deserialize;
use std::{fs::File, io::Read, path::Path};
use toml;

use crate::standalone_server::utils::get_server_log_folder;

#[derive(Debug, Deserialize, Clone, Default)]
pub struct ServerConfig {
    #[serde(default)]
    pub server_auth_config: ServerAuthConfig,
    #[serde(default)]
    pub server_network_config: ServerNetworkConfig,
    #[serde(default)]
    pub sanzu_server_launch_config: SanzuServerLaunchConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerAuthConfig {
    #[serde(default = "default_cert_file")]
    pub cert_file: String,
    #[serde(default = "default_private_key_file")]
    pub private_key_file: String,
    #[serde(default = "default_jwks_url")]
    pub jwks_url: String,
    #[serde(default = "default_webapp_url")]
    pub webapp_url: String,
}

impl Default for ServerAuthConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<ServerAuthConfig>(&c).unwrap()
    }
}

fn default_cert_file() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionServer\\Key\\cert.pem".to_string()
    } else {
        "/etc/greenion-server/certs/cert.pem".to_string()
    }
}
fn default_private_key_file() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionServer\\Key\\key.pem".to_string()
    } else {
        "/etc/greenion-server/certs/key.pem".to_string()
    }
}
fn default_jwks_url() -> String {
    "http://greenion.local:5004/.well-known/jwks.json".to_string()
}
fn default_webapp_url() -> String {
    "http://greenion.local:5001/".to_string()
}

#[derive(Parser, Debug, Deserialize, Clone)]
pub struct ServerNetworkConfig {
    #[serde(default = "default_server_port")]
    pub server_port: u16,
    #[serde(default = "default_server_listening_ip")]
    pub server_listening_ip: String,
    #[serde(default = "default_timeout_secs")]
    pub timeout_secs: u16,
    #[serde(default = "default_handshake_timeout_secs")]
    pub handshake_timeout_secs: u16,
}

impl Default for ServerNetworkConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<ServerNetworkConfig>(&c).unwrap()
    }
}

fn default_server_port() -> u16 {
    9447
}
fn default_server_listening_ip() -> String {
    "0.0.0.0".to_string()
}
fn default_timeout_secs() -> u16 {
    3
}
fn default_handshake_timeout_secs() -> u16 {
    5
}

#[derive(Parser, Debug, Deserialize, Clone)]
pub struct SanzuServerLaunchConfig {
    #[serde(default = "default_sanzu_server_port")]
    pub sanzu_server_port: u16,
    #[serde(default = "default_sanzu_server_external_startup")]
    pub sanzu_server_external_startup: bool,
    #[serde(default = "default_sanzu_server_path")]
    pub sanzu_server_path: String,
    #[serde(default = "default_sanzu_server_config_path")]
    pub sanzu_server_config_path: String,
    #[serde(default = "default_sanzu_log_file")]
    pub sanzu_log_file: String,
    #[serde(default = "default_sanzu_server_codec")]
    pub sanzu_server_codec: String,
    #[serde(default = "default_sanzu_server_startup_timeout")]
    pub sanzu_server_startup_timeout: u64,
}

impl Default for SanzuServerLaunchConfig {
    fn default() -> Self {
        let c = String::new();
        toml::from_str::<SanzuServerLaunchConfig>(&c).unwrap()
    }
}

fn default_sanzu_server_port() -> u16 {
    1122
}
fn default_sanzu_server_external_startup() -> bool {
    false
}
fn default_sanzu_server_path() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionServer\\SanzuServer\\sanzu_server.exe".to_string()
    } else {
        "/etc/greenion-server/sanzu-server-wrapper.sh".to_string()
    }
}
fn default_sanzu_server_config_path() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionServer\\Config\\sanzu_server_config.toml".to_string()
    } else {
        "/etc/greenion-server/sanzu_server_config.toml".to_string()
    }
}
fn default_sanzu_log_file() -> String {
    get_server_log_folder()
        .join("sanzu_server_logs.log")
        .to_string_lossy()
        .to_string()
}
fn default_sanzu_server_codec() -> String {
    "libx264".to_string()
}
fn default_sanzu_server_startup_timeout() -> u64 {
    5
}

pub fn default_windows_wakeup_exe_path() -> String {
    if cfg!(target_os = "windows") {
        "C:\\Program Files (x86)\\GreenionServer\\Agent\\windows-wakeup.exe".to_string()
    } else {
        panic!("Wakeup exe not implemented for Linux");
    }
}

pub fn build_server_config(config_file: &Path) -> anyhow::Result<ServerConfig> {
    let mut content = String::new();
    match File::open(config_file) {
        Ok(mut f) => match f.read_to_string(&mut content) {
            Ok(_) => {}
            Err(_) => {
                return Err(anyhow!(
                    "Could not read config file {}",
                    config_file.display()
                ))
            }
        },
        Err(_) => {
            return Err(anyhow!(
                "Config file {} does not exist",
                config_file.display()
            ))
        }
    };
    toml::from_str::<ServerConfig>(&content).map_err(anyhow::Error::new)
}
