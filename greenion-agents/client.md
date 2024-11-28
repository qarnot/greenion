# Greenion agent client

# Setting up the agent for production

## Configuration of the client agent

Upon installing the client agent, you will need to configure it.

On Windows, the folder for configuration is `C:\Users\Alice\AppData\Roaming\GreenionClient\Config`, on Linux it is `$HOME/.config/GreenionClient/`.

On Windows, you will find a file named `C:\Users\Alice\AppData\Roaming\GreenionClient\Config\client_config.toml`, on Linux you will need to copy it over to modify it :

```sh
mkdir -p ~/.config/GreenionClient/
cp /etc/greenion-client/client_config.toml ~/.config/GreenionClient/client_config.toml
```

> [!NOTE]
> The configuration file location can be overriden with the environment variable GREENION_CLIENT_CONFIG_FILE
> Example : `export GREENION_CLIENT_CONFIG_FILE="/some/folder/for/client_config.toml"`

You then need to open (in this folder) `client_config.toml` and replace all occurences of `greenion.local` with the value you entered for the `$DOMAIN` environment variable (public IP address of the server or it's domain name).

Then you may change other options. Defaults for these options are defined in `src/conf/client_config.rs`. Here is an explanation for some of them : 

```
[client_auth_config]
ca_cert_file : String = path to the CA's certificate
jwks_url : string = URL of the jwks endpoint
webapp_url : string = URL of the web application

[client_network_config]
timeout_secs : int = number of seconds before giving up on a request
listening_port : int = local port used for communication between greenion-agent-client and sanzu client
max_retries : int = number of times the client tries to connect to the VDI server before giving up

[sanzu_client_launch_config]
sanzu_client_external_startup : bool = if true : run sanzu client upon a successful connection. If false, assume that sanzu client is already running and just connect to it
sanzu_client_exe_path : string = path of the sanzu client binary
sanzu_client_config_path : string = path of the sanzu client config file
sanzu_log_file : string = file where sanzu client logs (stdout) will be redirected to
```

For a more exhaustive list, please read the `greenion-agents/src/conf/client_config.rs`.

Then, you need to copy the `rootCa.key.pem` in `C:\Program Files (x86)\GreenionClient\Agent\rootCa.crt` on Windows or `/etc/greenion-client/certs/rootCA.crt` on Linux. This file is generated when setting up the webapp and is stored in `./rest-auth/certs/rootCA.key.pem`.


You may need to reboot right after installing the agent to activate the greenion-client open handler.

## Logs

Greenion Agent Client stores its log files in `C:\Users\Alice\AppData\Roaming\GreenionClient\Logs` on Windows or `$HOME/.local/share/GreenionClient/Logs` on Linux.
It can be overriden with the `GREENION_CLIENT_LOGS_FOLDER` environment variable.
- `greenion-agent-client.log` : log file of the greenion-agent-client
- `sanzu_client_logs.log` : log file of sanzu client
