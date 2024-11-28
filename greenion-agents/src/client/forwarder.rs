use log::{error, info, warn};
use tokio::time::timeout;

use crate::client::errors::GreenionClientIntermediateError;

use super::ClientForwarder;

impl ClientForwarder {
    pub async fn forward(mut self) -> anyhow::Result<(), GreenionClientIntermediateError> {
        let sanzu_stream = match self.initial_timeout {
            Some(time) => {
                let Ok(res_sanzu_stream) = timeout(time, self.sanzu_listener.accept()).await else {
                    error!("Timed out while accepting local sanzu client stream");
                    return Err(GreenionClientIntermediateError::new(
                        "Timed out while connecting to local sanzu client".into(),
                    ));
                };
                res_sanzu_stream
            }
            None => self.sanzu_listener.accept().await,
        };

        let mut sanzu_stream = match sanzu_stream {
            Ok(ss) => {
                info!("Sanzu client successfully connected to greenion agent client");
                ss.0
            }
            Err(e) => {
                error!("Could not accept Sanzu client connection request : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Error when connecting to sanzu client. Please try again.".into(),
                ));
            }
        };

        if sanzu_stream.set_nodelay(true).is_err() {
            warn!("Could not disable buffering on sanzu stream");
        }

        let res =
            tokio::io::copy_bidirectional(&mut self.outbound_tls_stream, &mut sanzu_stream).await;

        match res {
            Ok((v1, v2)) => {
                info!("Client forwarder exited : wrote {} and {} bytes", v1, v2);
            }
            Err(e) => {
                error!("Client forwarder exited with error {}", e);
            }
        }

        Ok(())
    }
}
