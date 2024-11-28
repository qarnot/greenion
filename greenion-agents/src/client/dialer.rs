#![allow(async_fn_in_trait)]
use log::error;
use log::{debug, info};
use rustls::pki_types::{CertificateDer, ServerName};
use std::{sync::Arc, time::Duration};
use tokio::net::TcpStream;
use tokio::time::timeout;
use tokio_rustls::TlsConnector;
use tokio_rustls::TlsStream;

use super::errors::GreenionClientIntermediateError;

pub trait Dialer {
    async fn dial(
        self,
    ) -> anyhow::Result<
        (TlsStream<TcpStream>, CertificateDer<'static>),
        GreenionClientIntermediateError,
    >;
}

pub struct StandaloneDialer {
    pub server_ip: String,
    pub server_port: u16,
    pub timeout: Duration,
    pub cert: CertificateDer<'static>,
}

impl Dialer for StandaloneDialer {
    async fn dial(
        self,
    ) -> anyhow::Result<
        (TlsStream<TcpStream>, CertificateDer<'static>),
        GreenionClientIntermediateError,
    > {
        let mut root_cert_store = rustls::RootCertStore::empty();
        debug!("Built client root cert store");

        let Ok(_) = root_cert_store.add(self.cert.clone()) else {
            error!("Failed to add CA certificate to client root cert store");
            return Err(GreenionClientIntermediateError::new(
                "Failed to create local CA root store".into(),
            ));
        };
        debug!("Added ca cert to root_cert_store");
        let tls_config = rustls::ClientConfig::builder()
            .with_root_certificates(root_cert_store)
            .with_no_client_auth();
        let connector = TlsConnector::from(Arc::new(tls_config));

        let address_string = format!("{}:{}", self.server_ip, self.server_port);

        let Ok(stream) = timeout(self.timeout, TcpStream::connect(&address_string)).await else {
            error!("Timed out while dialing {}", address_string);
            return Err(GreenionClientIntermediateError::new(format!(
                "Timed out while dialing {}",
                &address_string
            )));
        };

        let stream = match stream {
            Ok(s) => {
                info!("TCP connection established to {}", address_string);
                s
            }
            Err(e) => {
                error!("Could not dial {} : {}", address_string, e);
                return Err(GreenionClientIntermediateError::new(format!(
                    "Could not dial {}",
                    address_string
                )));
            }
        };

        match stream.set_nodelay(true) {
            Ok(_) => {
                debug!("set outbount tcp stream nodelay worked");
            }
            Err(e) => {
                error!("Could not set stream as nodelay : {}", e);
            }
        };

        let server_name = match ServerName::try_from(self.server_ip.to_owned()) {
            Ok(sn) => sn,
            Err(e) => {
                error!(
                    "Could not build server name from '{}' : {}",
                    &self.server_ip, e
                );
                return Err(GreenionClientIntermediateError::new(format!(
                    "Could not build server name from '{}'",
                    &self.server_ip
                )));
            }
        };

        let Ok(tls_stream) = timeout(self.timeout, connector.connect(server_name, stream)).await
        else {
            error!("Timed out while establishing TLS stream");
            return Err(GreenionClientIntermediateError::new(
                "Timed out while establishing TLS stream with server".into(),
            ));
        };

        let tls_stream = match tls_stream {
            Ok(ts) => {
                info!("TLS connection established to '{}'", address_string);
                ts
            }
            Err(e) => {
                error!(
                    "Could not establish TLS stream with {} : {}",
                    address_string, e
                );
                return Err(GreenionClientIntermediateError::new(
                    "Could not establish a TLS stream with the server".into(),
                ));
            }
        };

        let Some(certificate) = tls_stream.get_ref().1.peer_certificates() else {
            error!("Server did not provide any TLS certificate");
            return Err(GreenionClientIntermediateError::new(
                "Server did not provide any TLS certificate".into(),
            ));
        };

        let cert = match certificate.first() {
            Some(crt) => crt,
            None => {
                error!("Could not get server's first certificate");
                return Err(GreenionClientIntermediateError::new(
                    "Could not get server's first certificate".into(),
                ));
            }
        }
        .to_owned();

        Ok((TlsStream::Client(tls_stream), cert))
    }
}
