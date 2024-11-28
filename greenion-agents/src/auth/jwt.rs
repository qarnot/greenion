use log::error;
use std::time::Duration;

use anyhow::{anyhow, bail};
use jsonwebtoken::{decode, decode_header, Validation};
use jwks::Jwks;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub exp: usize,
    #[serde(rename(deserialize = "sub"))]
    pub user_id: String,
    #[serde(rename(deserialize = "sessionId"))]
    pub session_id: u32,
    #[serde(rename(deserialize = "aud"))]
    pub machine_id: String,
    #[serde(rename(deserialize = "machineExternalIp"))]
    pub machine_ip: String,
    #[serde(rename(deserialize = "machineExternalPort"))]
    pub machine_port: u16,
}

pub async fn get_jwks(jwks_url: &str, timeout: Duration) -> anyhow::Result<jwks::Jwks> {
    match tokio::time::timeout(timeout, Jwks::from_jwks_url(jwks_url)).await {
        Err(e) => {
            error!("Timed out while retrieving JWKS from {} : {}", jwks_url, e);
            Err(anyhow!("Timed out while retrieving JWKS from {}", jwks_url))
        }
        Ok(v) => match v {
            Ok(jwks) => Ok(jwks),
            Err(e) => {
                error!("Could not retrieve JWKS from {} : {}", jwks_url, e);
                Err(anyhow!("Could not retrieve JWKS from {}", jwks_url))
            }
        },
    }
}

pub fn parse_and_validate_jwt(jwt: &str, jwks: &Jwks) -> anyhow::Result<Claims> {
    let header = match decode_header(jwt) {
        Ok(v) => v,
        Err(e) => {
            error!("Could not decode JWT header : {}", e);
            bail!("Connection token is invalid.");
        }
    };

    let Some(kid) = &header.kid else {
        error!("No KID in JWT header");
        bail!("Connection token is invalid.");
    };

    let Some(jwk) = jwks.keys.get(kid) else {
        error!("Could not get valid KID {} in JWKS", kid);
        bail!("Connection token is invalid.");
    };

    let mut validation = Validation::new(jsonwebtoken::Algorithm::RS256);
    validation.validate_aud = false;

    match decode::<Claims>(jwt, &jwk.decoding_key, &validation) {
        Ok(decoded_token) => Ok(decoded_token.claims),
        Err(e) => match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                error!("JWT token expired");
                bail!("Connection token is expired.");
            }
            e => {
                error!("Error when extracting claims from connection JWT : {:?}", e);
                bail!("Connection token is invalid.");
            }
        },
    }
}
