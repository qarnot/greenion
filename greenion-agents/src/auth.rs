pub mod jwt;
pub mod x509;

use anyhow::anyhow;
use log::{debug, error};
use rustls::pki_types::{CertificateDer, PrivateKeyDer};
use std::{
    fs::File,
    io::{Cursor, Read},
};

pub fn load_private_key(filename: &str) -> anyhow::Result<PrivateKeyDer<'static>> {
    let mut f = match File::open(filename) {
        Ok(v) => v,
        Err(e) => {
            error!("Could not open private key file {} : {}", filename, e);
            return Err(anyhow!("Could not open certificate file {}", filename));
        }
    };

    let mut file_contents = String::new();
    f.read_to_string(&mut file_contents)?;
    file_contents = file_contents.replace("\\r\\n", "\n");
    file_contents = file_contents.replace("\"", "");
    let mut c: Cursor<String> = Cursor::new(file_contents);

    match rustls_pemfile::private_key(&mut c) {
        Ok(pk) => {
            debug!("Parsed private key {} successfully", filename);
            match pk {
                Some(v) => Ok(v),
                None => {
                    error!(
                        "Private key file {} doesn't contain any private keys",
                        filename
                    );
                    Err(anyhow!("Private key file is empty"))
                }
            }
        }
        Err(e) => {
            error!(
                "Could not deserialize private key pemfile at {} : {}",
                filename, e
            );
            Err(anyhow!("Could not read private key file {}", filename))
        }
    }
}

pub fn load_certs(filename: &str) -> anyhow::Result<Vec<CertificateDer<'static>>> {
    let mut f = match File::open(filename) {
        Ok(v) => v,
        Err(e) => {
            error!("Could not open certificate file {} : {}", filename, e);
            return Err(anyhow!("Could not open certificate file {}", filename));
        }
    };

    let mut file_contents = String::new();
    f.read_to_string(&mut file_contents)?;
    file_contents = file_contents.replace("\\r\\n", "\n");
    file_contents = file_contents.replace("\"", "");
    let mut c: Cursor<String> = Cursor::new(file_contents);

    let vec_res = rustls_pemfile::certs(&mut c).collect::<Result<Vec<_>, _>>();

    match vec_res {
        Ok(vector) => {
            debug!("Parsed certificate pem file {} successfully", filename);
            if vector.is_empty() {
                error!("Certificate file {} doesn't contain certificates", filename);
                Err(anyhow!("Certificate file is empty"))
            } else {
                Ok(vector)
            }
        }
        Err(e) => {
            error!("Could not deserialize cert pemfile at {} : {}", filename, e);
            Err(anyhow!("Could not read certificate file {}", filename))
        }
    }
}
