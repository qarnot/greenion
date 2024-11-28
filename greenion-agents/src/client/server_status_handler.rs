use log::{error, info};
use prost::Message;
use std::{io::Cursor, time::Duration};
use tokio::net::TcpStream;
use tokio_rustls::TlsStream;

use crate::{
    client::errors::GreenionClientIntermediateError,
    proto::{
        common::recv_msg_async,
        messages::{ServerStartProxy, StartProxyStatus},
    },
};

pub struct ServerStatusHandler {
    pub stream: TlsStream<TcpStream>,
    pub timeout: Duration,
}

impl ServerStatusHandler {
    pub async fn handle(
        mut self,
    ) -> anyhow::Result<TlsStream<TcpStream>, GreenionClientIntermediateError> {
        let server_status = match recv_msg_async(&mut self.stream, Some(self.timeout)).await {
            Ok(msg) => msg,
            Err(e) => {
                error!("Could not get server's status : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not get server's status.".into(),
                ));
            }
        };

        let server_status = match ServerStartProxy::decode(Cursor::new(server_status)) {
            Ok(status) => status,
            Err(e) => {
                error!("Server's first message was not its status : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Server's first message was not its status.".into(),
                ));
            }
        };

        match server_status.result() {
            StartProxyStatus::StartProxy => {
                info!("Server is available for streaming, proceding");
            }
            StartProxyStatus::InternalServerError => {
                // not reachable for now as it's never sent
                error!("An internal server error occured. Please check the server logs.");
                return Err(GreenionClientIntermediateError::new(
                    "An internal server error occured. Please check the server logs.".into(),
                ));
            }
            StartProxyStatus::ServerBusy => {
                error!(
                "The server you're trying to connect to is busy. Someone else is already connected."
            );
                return Err(GreenionClientIntermediateError::new(
                "The server you're trying to connect to is busy. Someone else is already connected".into()));
            }
            StartProxyStatus::SanzuStartError => {
                error!("Failed to start the sanzu server. Please check its logs");
                return Err(GreenionClientIntermediateError::new(
                    "Failed to start the sanzu server. Please check its logs".into(),
                ));
            }
        }
        Ok(self.stream)
    }
}
