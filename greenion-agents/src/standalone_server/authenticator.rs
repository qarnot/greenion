use anyhow::anyhow;
use log::{debug, error, info};
use prost::Message;
use std::{io::Cursor, net::SocketAddr};
use tokio::net::TcpStream;
use tokio_rustls::TlsStream;

use crate::{
    auth::jwt::{get_jwks, parse_and_validate_jwt, Claims},
    proto::{
        common::{recv_msg_async, send_msg_async},
        messages::{self, AuthResult},
    },
};

use super::Authenticator;

static SERVER_VERSION: &str = "v0.0.1";

impl Authenticator {
    // First return String : id, second return String : jwt
    pub async fn authenticate(
        &mut self,
        outbound_stream: &mut TlsStream<TcpStream>,
        client_addr: SocketAddr,
    ) -> anyhow::Result<(String, String, Claims)> {
        let sh = messages::ServerHello {
            version: SERVER_VERSION.to_owned(),
        };
        match send_msg_async(outbound_stream, sh, Some(self.timeout)).await {
            Ok(v) => v,
            Err(e) => {
                error!("Could not send server hello to {} : {}", client_addr, e);
                return Err(anyhow!("Could not send server hello"));
            }
        };
        debug!("Sent server hello successfully to {}", client_addr);

        let a = match recv_msg_async(outbound_stream, Some(self.timeout)).await {
            Ok(v) => v,
            Err(e) => {
                error!(
                    "Could not receive client hello sent by {} : {}",
                    client_addr, e
                );
                return Err(anyhow!("Could not receive client hello"));
            }
        };
        debug!("Received client hello sent by {}", client_addr);
        let ch = match messages::ClientHello::decode(&mut Cursor::new(a)) {
            Ok(v) => v,
            Err(e) => {
                error!(
                    "Could not decode client hello sent by {} : {}",
                    client_addr, e
                );
                return Err(anyhow!("Could not decode client hello"));
            }
        };
        debug!("Decoded client hello sent by {} successfully", client_addr);
        let jwks = match get_jwks(self.jwks_url.as_str(), self.timeout).await {
            Ok(v) => v,
            Err(e) => {
                error!(
                    "Could not fetch jwks from {} : {}",
                    self.jwks_url.as_str(),
                    e
                );
                return Err(anyhow!("Could not fetch jwks"));
            }
        };

        let claims = match parse_and_validate_jwt(ch.jwt.as_ref(), &jwks) {
            Ok(v) => v,
            Err(e) => {
                error!(
                    "Could not parse and validate JWT sent by {} : {}",
                    client_addr, e
                );
                return Err(anyhow!("Could not parse and validate JWT"));
            }
        };
        debug!(
            "Parsed and validated client JWT sent by {} successfully",
            client_addr
        );

        let id = claims.machine_id.clone();
        if id.is_empty() {
            error!("Client jwt machine id sent by {} is empty", client_addr);
            return Err(anyhow!("Empty target machine id"));
        }

        let mut sar = messages::ServerAuthResult::default();
        if id != self.local_machine_id.as_str() {
            error!(
                "Error when authenticating {}: server is machine '{}' and client can only connect to '{}' ",
                client_addr, self.local_machine_id, id
            );
            sar.result = AuthResult::AuthFailed as i32;
            match send_msg_async(outbound_stream, sar, Some(self.timeout)).await {
                Ok(()) => {}
                Err(e) => {
                    error!(
                        "Could not send auth failed message to {} : {}",
                        client_addr, e
                    );
                    return Err(anyhow!("Could not send auth failed message"));
                }
            };
            Err(anyhow!(
                "Authentication failed : {} tried to connect to {} but we are {}",
                client_addr,
                id,
                self.local_machine_id
            ))
        } else {
            sar.result = AuthResult::AuthOk as i32;
            match send_msg_async(outbound_stream, sar, Some(self.timeout)).await {
                Ok(()) => {
                    info!("Sent auth ok message to {} successfully", client_addr);
                    Ok((id.to_string(), ch.jwt.to_owned(), claims))
                }
                Err(e) => {
                    error!("Could not send auth result ok to {} : {}", client_addr, e);
                    Err(anyhow!("Could not send auth ok message"))
                }
            }
        }
    }
}
