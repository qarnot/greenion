use anyhow::anyhow;
use log::{debug, error, info, warn};
use std::fs::{File, OpenOptions};
use std::path::Path;
use std::process::Command;
use std::thread::sleep;

use super::{SanzuServerLinuxHandles, SanzuServerWrapper};

impl SanzuServerWrapper {
    pub fn start(&mut self) -> anyhow::Result<()> {
        let sanzu_log_file = self.sanzu_log_file.to_owned();
        let sanzu_server_path = self.sanzu_server_path.to_owned();
        let mut logfile: Option<File> = None;
        if let Some(logfile_name) = sanzu_log_file {
            match OpenOptions::new()
                .create(true)
                .read(true)
                .append(true)
                .open(logfile_name.clone())
            {
                Ok(v) => {
                    info!("Opening sanzu log file at {} worked", &logfile_name);
                    logfile = Some(v);
                }
                Err(e) => {
                    error!("Could not create sanzu server log file : {}", e);
                    return Err(anyhow!("Could not create sanzu server log file"));
                }
            }
        } else {
            warn!("No log file provided for sanzu server. Running sanzu server without saving it's logs.");
        }

        match Path::new(&self.sanzu_server_path).try_exists() {
            Ok(v) => {
                if !v {
                    error!(
                        "Sanzu server path ({}) doesn't exist",
                        &self.sanzu_server_path
                    );
                    return Err(anyhow!("Sanzu server path doesn't exist"));
                }
            }
            Err(e) => {
                error!(
                    "Sanzu server path ({}) does not point to an existing binary",
                    &self.sanzu_server_path
                );
                error!("{}", e);
                return Err(anyhow!("Sanzu server path points to a non existing binary"));
            }
        }

        info!("Starting sanzu server at '{}'...", &self.sanzu_server_path);

        let mut _sanzu_cmd = Command::new(sanzu_server_path);
        _sanzu_cmd.args(["-f", &self.sanzu_server_config]);
        _sanzu_cmd.args(["-x", "-e", &self.sanzu_server_codec]);

        if let Some(logfile) = logfile {
            _sanzu_cmd.stderr(logfile);
        }
        //.env("RUST_LOG", "debug")
        let mut _sanzu_process = match _sanzu_cmd.spawn() {
            Ok(v) => {
                debug!("Started sanzu server");
                v
            }
            Err(e) => {
                error!("Could not start sanzu server : {}", e);
                return Err(anyhow!("Could not start sanzu server"));
            }
        };

        self.handles = Some(SanzuServerLinuxHandles {
            sanzu_server_process_child: _sanzu_process,
        });

        sleep(self.sanzu_wait_time);

        Ok(())
    }

    pub fn wait(self) -> anyhow::Result<()> {
        if let Some(mut handles) = self.handles {
            let _ = handles.sanzu_server_process_child.wait();
        }
        Ok(())
    }
}
