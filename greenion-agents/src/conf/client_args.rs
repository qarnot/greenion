use anyhow::anyhow;
use log::error;
use url::Url;

pub fn get_jwt(args: &[String]) -> anyhow::Result<String> {
    let uri_string = match args.get(1) {
        Some(v) => v,
        None => {
            error!("Error when retrieving JWT : Not enough arguments");
            return Err(anyhow!(
                "Not enough arguments. Please provide a connection token."
            ));
        }
    };

    let uri = match Url::parse(uri_string) {
        Ok(v) => v,
        Err(e) => {
            error!("{}", e);
            return Err(anyhow!("Not a URI"));
        }
    };

    if uri.scheme() != "greenion-open" {
        error!(
            "URI scheme is invalid : expected \"greenion-open\" found {} ",
            uri.scheme()
        );
        return Err(anyhow!("URI doesn't start with 'greenion-open://'"));
    }

    let jwt = match uri.host_str() {
        Some(v) => v,
        None => {
            error!("No host provided in first argument");
            return Err(anyhow!("Connection token is empty"));
        }
    };

    if jwt.is_empty() {
        error!("JWT token is empty");
        return Err(anyhow!("Conection token is empty"));
    }

    Ok(jwt.to_string())
}
