use greenion_agents::{
    auth::{
        jwt::{get_jwks, parse_and_validate_jwt},
        load_certs,
    },
    client::{
        errors::{exit_with_greenion_client_final_error_popup, GreenionClientFinalError},
        main_connect::main_connect,
        utils::{
            check_is_certificate_cacert, get_client_config_file_path, setup_client_agent_log_file,
        },
    },
    close_session,
    conf::{client_args::get_jwt, client_config::build_client_config},
    setup_fern, CloseSessionArgs,
};
use log::{debug, error, info, warn};
use std::{env, time::Duration};
use tokio::time::sleep;

const PAUSE_BETWEEN_RETRIES: Duration = Duration::from_millis(2000);

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let log_file = setup_client_agent_log_file().unwrap_or_default();

    let _ = setup_fern(log_file.as_path());

    info!("Starting greenion-agent-client");
    let config_file_path = get_client_config_file_path().unwrap_or_default();
    debug!(
        "Attempting to read configuration at {}",
        config_file_path.display()
    );
    let agent_config = build_client_config(config_file_path.as_path()).unwrap_or_default();
    info!("Read config at {}", config_file_path.display());

    let agent_auth_config = &agent_config.client_auth_config;
    let agent_network_config = &agent_config.client_network_config;

    let args: Vec<String> = env::args().collect();
    let jwt_string = match get_jwt(&args) {
        Ok(v) => v,
        Err(e) => GreenionClientFinalError::exit_complete(
            "Failed to initialize greenion client agent",
            &e.to_string(),
        ),
    };

    let timeout = Duration::from_secs(agent_network_config.timeout_secs as u64);

    let jwks = match get_jwks(agent_auth_config.jwks_url.as_str(), timeout).await {
        Ok(v) => v,
        Err(e) => GreenionClientFinalError::exit_complete(
            "Failed to initialize greenion client agent",
            &e.to_string(),
        ),
    };
    let jwt = match parse_and_validate_jwt(&jwt_string, &jwks) {
        Ok(v) => v,
        Err(e) => {
            let inner = format!("{}. Please refresh the web application to get a new one", e);
            GreenionClientFinalError::exit_complete(
                "Failed to initialize greenion client agent",
                inner.as_str(),
            )
        }
    };

    let csa = CloseSessionArgs {
        base_url: agent_auth_config.webapp_url.to_owned(),
        jwt: jwt_string.to_owned(),
        session_id: jwt.session_id,
    };

    let ca_certs = match load_certs(&agent_auth_config.ca_cert_file) {
        Ok(v) => v,
        Err(e) => {
            let _ = close_session(csa).await;
            GreenionClientFinalError::exit_complete(
                "Failed to initialize greenion client agent",
                &e.to_string(),
            );
        }
    };

    let ca_cert = match ca_certs.first() {
        Some(v) => v,
        None => {
            let _ = close_session(csa).await;
            GreenionClientFinalError::exit_complete(
                "Failed to initialize greenion client agent",
                "Could not get first CA certificate",
            );
        }
    };

    if !check_is_certificate_cacert(ca_cert) {
        let _ = close_session(csa).await;
        GreenionClientFinalError::exit_complete("Failed to initialize greenion client agent","Certificate common name is incorrect, you probably have the wrong file for the ca_cert_file config field" )
    }

    let mut last_result = Ok(());
    for i in 0..=agent_network_config.max_retries {
        if i > 0 {
            let trials_left = agent_network_config.max_retries - i + 1;
            let msg = format!(
                "An error occured when connecting to server !\nRetrying {} more time{}...",
                trials_left,
                if trials_left > 1 { "s" } else { "" }
            );
            let _ = notifica::notify("Greenion Agent Client", msg.as_str());
            info!("Retry #{i} starting...");
        }
        let connect_res =
            main_connect(&jwt, &timeout, &jwt_string, &jwks, ca_cert, &agent_config).await;
        let error = match connect_res {
            Ok(()) => break,
            Err(e) => e,
        };
        warn!("Failed to connect to the server: {error}.");
        if i == agent_network_config.max_retries {
            last_result = Err(error);
        } else {
            sleep(PAUSE_BETWEEN_RETRIES).await;
        }
    }

    let _ = close_session(csa).await;
    match last_result {
        Ok(()) => Ok(()),
        Err(e) => {
            error!("Ran out of retries, giving up now.");
            exit_with_greenion_client_final_error_popup(e);
        }
    }
}
