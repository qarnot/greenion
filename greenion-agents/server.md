# Greenion agent server

# Setting up the agent for production

## Configuration of the server agent

Upon installing the server agent, you will need to configure it.

On Windows, the folder for configuration is `C:\Program Files (x86)\GreenionServer\Config`, on Linux it is `/etc/greenion-server/`.

The first step is to open (in this folder) `server_config.toml` and replace all occurences of `greenion.local` with the value you entered for the `$DOMAIN` environment variable (public IP address of the server or it's domain name).

Then you may change other options. Defaults for these options are defined in `src/conf/server_config.rs`. Here is an explanation for some of them : 

```
[server_auth_config]
cert_file : string = path to the server's public certificate
private_key_file : string = path to the server's private key
jwks_url : string = URL of the jwks endpoint
webapp_url : string = URL of the web application

[server_network_config]
server_port : int = port the greenion server agent will listen on
server_listening_ip : string = address the greenion server agent will listen on
timeout_secs : int = number of seconds before giving up on a request
handshake_timeout_secs : int = number of seconds before giving up on the hanshake

[sanzu_server_launch_config]
sanzu_server_external_startup : bool = if true : run sanzu server upon a successful connection. If false, assume that sanzu server is already running and just connect to it
sanzu_server_path : string = path of the sanzu server binary
sanzu_server_port : int = port of sanzu server
sanzu_log_file : string = file where sanzu server logs (stdout) will be redirected to
sanzu_server_startup_timeout : int = number of seconds before assuming sanzu_server failed to start
sanzu_server_codec : string = FFmpeg codec name passed to sanzu
sanzu_server_config_path : string = path of the sanzu config
```

For a more exhaustive list, please read the `greenion-agents/src/conf/server_config.rs`.

Then, you need to create two files : one in `C:\Program Files (x86)\GreenionServer\Key\cert.pem` with the content of the server's certificate, one in `C:\Program Files (x86)\GreenionServer\Key\key.pem` with the content of the server's private key. These certs and keys are obtained right after registering a machine in the webapp.

> [!WARNING]
> The private key of the VDI server is private and must not be shared. Anyone that obtain your private key can impersonate as your VDI server !


Then, when registering the server in the web application, you will obtain (as explained in [this section](<README#Infrastructure for authentication>)) a private key and a certificate. You must copy the certificate in a file named `C:\Program Files (x86)\GreenionServer\Key\cert.pem` and the private key in a file named `C:\Program Files (x86)\GreenionServer\Key\key.pem`. You may have to create the folder `C:\Program Files (x86)\GreenionServer\Key` manually if it doesn't already exist.

> [!WARNING]  
> By default on Windows, `C:\Program Files (x86)\GreenionServer\Key` is not read-protected so all users of the VDI server can look at the folder and see the server's private key. You may change this yourself using the steps [available here](https://answers.microsoft.com/en-us/windows/forum/all/how-do-i-change-folder-and-file-permissions/465f2b42-63dd-4486-8dd1-c870290efeed)


On linux, place the certificate and keys at `/etc/greenion-server/certs/cert.pem` and `/etc/greenion-server/certs/key.pem`.


If for some reason you must store your private key file and/or certificate in another folder, you can do so by modifying the agent config like so : 

```toml
[server_auth_config]
cert_file = "C:\\Some\\Other\\Location\\for\\cert.pem"
private_key_file = "C:\\Some\\Other\\Location\\for\\key.pem"
```

> [!IMPORTANT]
> You must escape slashes by using \\ as folder delimiters

You can also override the location of the greenion agent configuration file by setting the `GREENION_CLIENT_CONFIG_FILE` environment variable.

```sh
export GREENION_CLIENT_CONFIG_FILE="/some/other/location.toml"
```

## Service

When installing greenion agent server, a service named "GreenionAgentService" that runs at system startup is enabled. If you don't want to reboot the computer to access your VDI server, start this service manually using `services.msc`.

## Port forwarding

If your client is not on the same network as your server, you will need to host your VDI server behind a public ip and open the relevant port (TCP mode) in your NAT configuration. The port to open is specified in the `server_port` option in the configuration file, and equals 9447 if not explicitely specified.
It is this public IP address that must be specified in the greenion web application as the machine's public address when registering the machine.

For example, here is a guide to help you setup port forwarding on pfsense routers.
https://docs.netgate.com/pfsense/en/latest/nat/port-forwards.html

You can search for `<router model> port forwarding` on Google and you will find a guide for your router.


## Logs

Greenion Agent Server stores its log files in `C:\Program Files (x86)\GreenionServer\Logs` on Windows or `/home/Alice/.local/share/GreenionServer/Logs` on Linux.
It can be overriden with the `GREENION_SERVER_LOGS_FOLDER` environment variable.
- `greenion-agent-server.log` : log file of the greenion-agent-server
- `sanzu_server_logs.log` : log file of sanzu server
hint: Alice is the name of the user who launched the agent. On linux it will be root if you installed greenion-agent through the .deb file.

