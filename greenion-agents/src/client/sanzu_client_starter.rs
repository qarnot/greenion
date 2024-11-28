use std::{
    fs::OpenOptions,
    path::Path,
    process::{ExitStatus, Stdio},
};

use log::{debug, error, info, warn};
use tokio::process::Command;

use super::{errors::GreenionClientIntermediateError, SanzuClientStarter};

impl SanzuClientStarter {
    pub async fn run(&self) -> anyhow::Result<ExitStatus, GreenionClientIntermediateError> {
        info!("Launching sanzu client");
        debug!("Opening log file");
        let sanzu_client_log_file = OpenOptions::new()
            .create(true)
            .read(true)
            .append(true)
            .open(self.sanzu_client_log_file.as_str());

        match Path::new(&self.sanzu_client_config_path).try_exists() {
            Ok(v) => {
                if !v {
                    error!(
                        "Sanzu config file at '{}' doesn't exist",
                        &self.sanzu_client_config_path
                    );
                    return Err(GreenionClientIntermediateError::new(
                        "Sanzu client config file doesn't exist".to_string(),
                    ));
                } else {
                    debug!(
                        "Sanzu config file at '{}' exists",
                        &self.sanzu_client_config_path
                    );
                }
            }
            Err(e) => {
                error!(
                    "Sanzu config file at '{}' doesn't exist",
                    &self.sanzu_client_config_path
                );
                error!("{}", e);
                return Err(GreenionClientIntermediateError::new(format!(
                    "Sanzu client config file alledgedly located at {} doesn't exist",
                    self.sanzu_client_config_path
                )));
            }
        }

        let mut c = Command::new(self.sanzu_client_exe_path.as_str());
        c.env("RUST_LOG", "INFO")
            .arg("--config")
            .arg(self.sanzu_client_config_path.as_str())
            .arg("127.0.0.1")
            .arg(self.port.to_string())
            .arg("-w");

        match sanzu_client_log_file {
            Ok(logfile) => {
                debug!(
                    "Using log file {} for sanzu client",
                    self.sanzu_client_log_file
                );
                c.stderr(Stdio::from(logfile));
            }
            Err(e) => {
                warn!(
                    "Could not open {} as sanzu log file. Got error {}",
                    self.sanzu_client_log_file, e
                );
                warn!("Running sanzu without saving logs");
                c.stdout(Stdio::null());
            }
        }

        info!(
            "Attempting to launch sanzu client at {} with config file {}",
            self.sanzu_client_exe_path, self.sanzu_client_config_path
        );

        let Ok(mut client_spawn_res) = c.spawn() else {
            error!(
                "Could not spawn Sanzu client allegedly located at {}",
                self.sanzu_client_exe_path
            );
            return Err(GreenionClientIntermediateError::new(format!(
                "Could not spawn Sanzu Client allegedly located at {}",
                self.sanzu_client_exe_path
            )));
        };

        let return_status = client_spawn_res.wait().await;
        match return_status {
            Ok(s) => {
                info!("Sanzu client exited with status code {}", s);
                Ok(s)
            }
            Err(e) => {
                error!("Sanzu client crashed with error {}", e);
                Err(GreenionClientIntermediateError::new(
                    "Sanzu client crashed".into(),
                ))
            }
        }
    }
}
