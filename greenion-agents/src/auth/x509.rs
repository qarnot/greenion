use anyhow::{anyhow, bail, Result};
use log::error;
use x509_parser::{certificate::X509Certificate, prelude::FromDer};

pub fn validate_x509_machine_id(
    server_cert: &X509Certificate,
    ca_cert: &X509Certificate,
    machine_id: &str,
) -> Result<()> {
    let ca_pubkey = ca_cert.public_key();
    match server_cert.verify_signature(Some(ca_pubkey)) {
        Ok(()) => {}
        Err(e) => {
            error!("Validation failed for server certificate : {}", e);
            bail!("Server certificate signature is invalid");
        }
    };

    let id = match extract_id_from_certificate(server_cert) {
        Ok(s) => s,
        Err(e) => {
            error!("Could not extract id from '{}'", e);
            bail!("Could not extract machine id from server certificate");
        }
    };

    if id != machine_id {
        Err(anyhow!(
            "Server ID doesn't match : expected {} got {}",
            machine_id,
            id
        ))
    } else {
        Ok(())
    }
}

pub fn parse_x509(bytes: &[u8]) -> anyhow::Result<X509Certificate> {
    match X509Certificate::from_der(bytes) {
        Ok(v) => Ok(v.1),
        Err(e) => {
            error!("Could not parse provided X509 : {}", e);
            bail!("Could not parse x509 from provided bytes");
        }
    }
}

pub fn extract_id_from_certificate(certificate: &X509Certificate) -> Result<String> {
    let Some(cn) = certificate.subject().iter_common_name().next() else {
        error!("No CN in provided certificate");
        bail!("No CN in certificate");
    };

    match cn.as_str() {
        Ok(v) => Ok(v.to_owned()),
        Err(e) => {
            error!("Could not convert CN to string : {}", e);
            bail!("CN could not be converted to string");
        }
    }
}
