use std::{
    collections::HashMap,
    path::Path,
    time::{Duration, SystemTime},
};

use anyhow::anyhow;
use chrono::Utc;
use log::{error, info, Level};
use reqwest::{Client, StatusCode};

pub mod auth;
pub mod client;
pub mod conf;
pub mod proto;
pub mod standalone_server;

pub fn setup_fern(logfile: &Path) -> anyhow::Result<()> {
    let fern_logfile = fern::log_file(logfile);

    let mut fern_builder = fern::Dispatch::new()
        .format(|out, message, record| {
            if record.level() == Level::Error {
                out.finish(format_args!(
                    "[{} {} {}] at {}:{} {}",
                    humantime::format_rfc3339_seconds(SystemTime::now()),
                    record.level(),
                    record.target(),
                    record.file().unwrap_or_default(),
                    record.line().unwrap_or_default(),
                    message
                ))
            } else {
                out.finish(format_args!(
                    "[{} {} {}] {}",
                    humantime::format_rfc3339_seconds(SystemTime::now()),
                    record.level(),
                    record.target(),
                    message
                ))
            }
        })
        .level(log::LevelFilter::Debug)
        .chain(std::io::stdout());

    match fern_logfile {
        Ok(flogfile) => fern_builder = fern_builder.chain(flogfile),
        Err(e) => {
            println!("Could not create log file {} : {}", logfile.display(), e);
            println!("Logging only to stdout");
        }
    }
    if let Err(e) = fern_builder.apply() {
        error!("Could not setup logging : {}", e);
        Err(anyhow!("Could not setup logging"))
    } else {
        Ok(())
    }
}

#[derive(Clone)]
pub struct CloseSessionArgs {
    pub base_url: String,
    pub jwt: String,
    pub session_id: u32,
}

pub async fn close_session(close_session_args: CloseSessionArgs) -> anyhow::Result<()> {
    let CloseSessionArgs {
        base_url,
        jwt,
        session_id,
    } = close_session_args;

    let url = format!("{}/api_catalog/v1/sessions/{}", base_url, session_id);
    info!("Closing session id {} at {}", session_id, url.as_str());

    let _client = Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .unwrap();
    let mut map = HashMap::new();
    map.insert("closedAt", Utc::now().to_rfc3339());
    let url = format!("{}/api_catalog/v1/sessions/{}", base_url, session_id);

    info!("Closing session id {} at url {}", session_id, url);
    let res = _client.put(url).json(&map).bearer_auth(jwt).send().await;

    match res {
        Ok(v) => {
            if v.status() != StatusCode::OK {
                error!("Could not close session id {} on the web application : received status code {}", session_id, v.status());
                Err(anyhow!(
                    "Could not close session id {} on the web application",
                    session_id
                ))
            } else {
                info!("Call to close session id {} worked", session_id);
                Ok(())
            }
        }
        Err(e) => {
            error!(
                "Could not contact backend to close session id {} : {}",
                session_id, e
            );
            Err(anyhow!(
                "Could not send request to close session {}",
                session_id
            ))
        }
    }
}
