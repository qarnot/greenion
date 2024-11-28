use log::{error, info};

use super::StandaloneServerForwarder;

impl StandaloneServerForwarder {
    pub async fn forward(mut self) -> anyhow::Result<()> {
        match self.sanzu_stream.set_nodelay(true) {
            Ok(_) => {}
            Err(e) => {
                error!("Could not set sanzu stream as nodelay : {}", e);
            }
        };

        let res =
            tokio::io::copy_bidirectional(&mut self.outbound_tls_stream, &mut self.sanzu_stream)
                .await;

        match res {
            Ok((v1, v2)) => {
                info!("Server forwarder exited : wrote {} and {} bytes", v1, v2);
            }
            Err(e) => {
                error!("Server forwarder exited with error {}", e);
            }
        }
        Ok(())
    }
}
