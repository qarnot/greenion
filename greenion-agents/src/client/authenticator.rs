#![allow(async_fn_in_trait)]

use std::io::Cursor;
use std::time::Duration;

use log::{debug, error, info};
use prost::Message;
use rustls::pki_types::CertificateDer;
use tokio::net::TcpStream;
use tokio_rustls::TlsStream;

use crate::auth::jwt::parse_and_validate_jwt;
use crate::auth::x509::parse_x509;
use crate::auth::x509::validate_x509_machine_id;
use crate::proto::common::check_version_matches;
use crate::proto::common::recv_msg_async;
use crate::proto::common::send_msg_async;
use crate::proto::messages;

use super::errors::GreenionClientIntermediateError;

pub struct Authenticator {
    pub stream: TlsStream<TcpStream>,
    pub timeout: Duration,
    pub jwt: String,
    pub client_version: String,
    pub jwks: jwks::Jwks,
    pub server_cert: CertificateDer<'static>,
    pub ca_cert: CertificateDer<'static>,
}

pub trait Authenticate {
    async fn authenticate(
        self,
    ) -> anyhow::Result<TlsStream<TcpStream>, GreenionClientIntermediateError>;
}

impl Authenticate for Authenticator {
    async fn authenticate(
        self,
    ) -> anyhow::Result<TlsStream<TcpStream>, GreenionClientIntermediateError> {
        info!("Authenticating to the server...");
        debug!("Parsing server certificate");
        let server_cert = match parse_x509(&self.server_cert) {
            Ok(v) => {
                debug!("Parsed server certificate");
                v
            }
            Err(e) => {
                error!("Could not parse server certificate : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not parse server certificate".into(),
                ));
            }
        };

        debug!("Parsing CA certificate");
        let ca_cert = match parse_x509(&self.ca_cert) {
            Ok(v) => {
                debug!("Parsed CA certificate");
                v
            }
            Err(e) => {
                error!("Could not parse CA certificate : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not parse CA certificate".into(),
                ));
            }
        };

        debug!("Parsing JWT to extract server machine id");
        let claims = match parse_and_validate_jwt(&self.jwt, &self.jwks) {
            Ok(c) => c,
            Err(e) => {
                let msg = format!("{} Please refresh the web application to get a new one.", e);
                return Err(GreenionClientIntermediateError::new(msg));
            }
        };
        debug!("Extracting machine id from jwt claims");
        let machine_id = &claims.machine_id;
        if machine_id.is_empty() {
            error!("Extracted server machine id is empty");
            return Err(GreenionClientIntermediateError::new(
                "Server machine id is empty".into(),
            ));
        }

        debug!("Validating server certificate");
        if let Err(e) = validate_x509_machine_id(&server_cert, &ca_cert, machine_id) {
            error!("Failed to authenticate server : {}", e);
            return Err(GreenionClientIntermediateError::new(e.to_string()));
        }

        info!("Server is legit. Proceding to greenion handshake");

        let mut stream = self.stream;
        let Ok(sh) = recv_msg_async(&mut stream, Some(self.timeout)).await else {
            error!("Failed to read server hello");
            return Err(GreenionClientIntermediateError::new(
                "Failed to read server hello".into(),
            ));
        };

        let Ok(sh) = messages::ServerHello::decode(&mut Cursor::new(sh)) else {
            error!("Could not deserialize server hello");
            return Err(GreenionClientIntermediateError::new(
                "Could not deserialize server hello".into(),
            ));
        };
        debug!("Received ServerHello");
        debug!("Server version is {}", &sh.version);

        if !check_version_matches(&self.client_version, &sh.version) {
            return Err(GreenionClientIntermediateError::new(format!(
                "Server version {} doesn't match client version {}",
                &sh.version, &self.client_version,
            )));
        }

        let ch = messages::ClientHello {
            version: self.client_version.to_owned(),
            jwt: self.jwt.to_owned(),
        };
        match send_msg_async(&mut stream, ch, Some(self.timeout)).await {
            Ok(_) => {}
            Err(e) => {
                error!("Could not send client hello : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not send client hello".into(),
                ));
            }
        }

        let sar = match recv_msg_async(&mut stream, Some(self.timeout)).await {
            Ok(v) => v,
            Err(e) => {
                error!("Could not receive server auth result : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not receive server authentication result".into(),
                ));
            }
        };

        let sar = match messages::ServerAuthResult::decode(&mut Cursor::new(sar)) {
            Ok(v) => v,
            Err(e) => {
                error!("Could not decode server auth result : {}", e);
                return Err(GreenionClientIntermediateError::new(
                    "Could not decode server authentication result".into(),
                ));
            }
        };
        match sar.result() {
            messages::AuthResult::AuthFailed => {
                error!("Error, Server refused client JWT.");
                return Err(GreenionClientIntermediateError::new(
                    "Server refused our authentication request".into(),
                ));
            }
            messages::AuthResult::AuthOk => {
                info!("Authentication successful");
            }
        }

        Ok(stream)
    }
}
