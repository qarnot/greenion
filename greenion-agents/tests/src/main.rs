use anyhow::{ensure, Context, Result};
use reqwest::header::CONTENT_TYPE;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::process::Stdio;
use std::{
    fs::File,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    path::PathBuf,
    process::Command,
    thread::sleep,
    time::Duration,
};

fn main() -> Result<()> {
    run_installer()?;
    println!("Installed greenion agents");
    write_configs()?;
    println!("Wrote configs");
    copy_certs()?;
    println!("Copied certs");

    run_tests()?;

    Ok(())
}

fn run_tests() -> Result<()> {
    test_case(TestCase {
        name: "Easy".to_owned(),
        body: Box::new(
            |TestParams {
                 server_listener, ..
             }| {
                const CLIENT_MSG: &[u8] = b"Hello from the client!";
                const SERVER_MSG: &[u8] = b"Hello from the server!";

                let mut client_buf = [0; SERVER_MSG.len()];
                let mut server_buf = [0; CLIENT_MSG.len()];

                let mut client_sock = TcpStream::connect("127.0.0.1:1123")?;
                let mut server_sock = server_listener.accept()?.0;

                client_sock.write_all(CLIENT_MSG)?;
                server_sock.write_all(SERVER_MSG)?;

                client_sock.read_exact(&mut client_buf)?;
                server_sock.read_exact(&mut server_buf)?;

                // easier to read as strings
                let client_buf = String::from_utf8(client_buf.to_vec())?;
                let server_msg = String::from_utf8(SERVER_MSG.to_vec())?;
                let server_buf = String::from_utf8(server_buf.to_vec())?;
                let client_msg = String::from_utf8(CLIENT_MSG.to_vec())?;

                ensure!(
                    client_buf == server_msg,
                    "Expected {} got {}",
                    server_msg,
                    client_buf
                );
                ensure!(
                    server_buf == client_msg,
                    "Expected {} got {}",
                    client_msg,
                    server_buf
                );

                Ok(())
            },
        ),
        ..Default::default()
    })?;

    test_case(TestCase {
        name: "12Mo message".to_owned(),
        body: Box::new(
            |TestParams {
                 server_listener, ..
             }| {
                let client_msg: &[u8] = &b"HelloClient!".repeat(1 << 20);
                let server_msg: &[u8] = &b"HelloServer!".repeat(1 << 20);

                let mut client_buf = vec![0; server_msg.len()];
                let mut server_buf = vec![0; client_msg.len()];

                let mut client_sock = TcpStream::connect("127.0.0.1:1123")?;
                let mut server_sock = server_listener.accept()?.0;

                client_sock.write_all(client_msg)?;
                server_sock.write_all(server_msg)?;

                client_sock.read_exact(&mut client_buf)?;
                server_sock.read_exact(&mut server_buf)?;

                ensure!(
                    client_buf.len() == server_msg.len(),
                    "Expected {} got {}",
                    server_msg.len(),
                    client_buf.len()
                );
                ensure!(
                    server_buf.len() == client_msg.len(),
                    "Expected {} got {}",
                    client_msg.len(),
                    server_buf.len()
                );

                // good luck manually diffing 12Mo of bytes
                ensure!(
                    client_buf == server_msg,
                    "Expected {:#?} got {:#?}",
                    server_msg,
                    client_buf
                );
                ensure!(
                    server_buf == client_msg,
                    "Expected {:#?} got {:#?}",
                    client_msg,
                    server_buf
                );

                Ok(())
            },
        ),
        ..Default::default()
    })?;

    test_case(TestCase {
        name: "Expired jwt".to_owned(),
        jwt_exp: 1729596384, // 2024-10-22T13:26:48
        body: Box::new(|TestParams { client_stdout, .. }| {
            ensure!(
                client_stdout.any(|l| {
                    let l = l.unwrap();
                    l.contains("JWT token expired")
                }),
                "The agent should have detected that the jwt was expired."
            );
            Ok(())
        }),
        ..Default::default()
    })?;

    test_case(TestCase {
        name: "Wrong jwt machine id".to_owned(),
        jwt_machine_id: "ID9999".to_owned(),
        body: Box::new(|TestParams { client_stdout, .. }| {
            ensure!(client_stdout.any(|l| {
                let l = l.unwrap();
                l.contains("Server ID doesn't match : expected ID9999 got ID1234")
            }));
            Ok(())
        }),
        ..Default::default()
    })?;

    if cfg!(target_os = "linux") {
        test_case(TestCase {
            name: "Wrong jwt machine port".to_owned(),
            jwt_machine_port: 9000,
            body: Box::new(|TestParams { client_stdout, .. }| {
                ensure!(client_stdout.any(|l| {
                    let l = l.unwrap();
                    l.contains("Connection refused")
                }));
                Ok(())
            }),
            ..Default::default()
        })?;
    } else {
        println!(
            "Skipping 'Wrong jwt machine port' test as it's just blocking forever on windows..."
        );
    }

    test_case(TestCase {
        name: "Wrong root ca".to_owned(),
        jwt: Some("eyJhbGciOiJSUzI1NiIsImtpZCI6InY0bng5elFzdTc1d3dQVmRoSmN5U3J4SnpuSEtXVkg0Mjd2clpCSWtDSzQiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjgyMTAyNjY4NzY3OTksIm1hY2hpbmVfaWQiOiJJRDEyMzQiLCJtYWNoaW5lX2lwIjoiMTI3LjAuMC4xIiwibWFjaGluZV9wb3J0Ijo5NDQ3LCJ1c2VyX2lkIjoiVUlEOTk4NyJ9.T4OHXmIq25Mfmqg6qqnH4J5bmzgFg8OLUKO4ExyvEk8sLxF4NFziFC1BlWDzuVwQD9mhg69DAiJt-v1mBajcESlzokDS0brbkybFPsair4sentK67SY7fTxCtJb0S1Yl3_JJg-0m72B5CppuWSddGBADSk36x_tYRYeVmmqvN_KdI1DJ1EnRq5FN9KPBTLMDylAQTX5Nbg_pv2W86Z9d7oipMSw_b3Q26pVEF5Ntf2_K0nDWNf5aI1OD9MuabEGicQmz8nxkAkggSv3FKlNoFj4nKAb1QZ40cMjmvxpZgsauI998jMGESMzsKReaw8sLqeX0YPK2CnkDrPzhkaBpsA".to_owned()),
        body: Box::new(|TestParams { client_stdout, .. }| {
            ensure!(client_stdout.any(|l| {
                let l = l.unwrap();
                 l.contains("Could not get valid KID")
             }));
            Ok(())
        }),
        ..Default::default()
    })?;

    if cfg!(target_os = "linux") {
        test_case(TestCase {
            name: "Someone is already connected".to_owned(),
            body: Box::new(|TestParams { final_jwt, .. }| {
                let mut second_client_handle = start_client(&final_jwt)?;
                let mut second_client_stdout =
                    BufReader::new(second_client_handle.stdout.as_mut().unwrap()).lines();
                ensure!(second_client_stdout.any(|l| {
                    let l = l.unwrap();
                    l.contains("Someone else is already connected")
                }));

                let exit_result = second_client_handle.wait()?;
                ensure!(!exit_result.success());
                Ok(())
            }),
            ..Default::default()
        })?;
    } else {
        println!(
            "Skipping 'Someone is already connected' test as it's just blocking forever on windows..."
        );
    }

    println!("\x1b[1;32mAll proxification test passed!\x1b[0m");
    Ok(())
}

struct TestCase {
    name: String,
    body: Box<dyn Fn(TestParams) -> Result<()>>,

    jwt_exp: usize,
    jwt_machine_port: i16,
    jwt_machine_id: String,
    /// Overrides the fetched jwt
    jwt: Option<String>,
}

struct TestParams<'a> {
    server_listener: TcpListener,
    client_stdout: &'a mut std::io::Lines<BufReader<&'a mut std::process::ChildStdout>>,
    /// jwt used to launch the client
    final_jwt: &'a str,
}

impl Default for TestCase {
    fn default() -> Self {
        Self {
            name: "Undefined!".to_owned(),
            body: Box::new(|_| panic!("Test body not defined!")),
            jwt_exp: 8210266876799, // some time in the year 262_142
            jwt_machine_id: "ID1234".to_owned(),
            jwt_machine_port: 9447,
            jwt: None,
        }
    }
}

fn test_case(test: TestCase) -> Result<()> {
    println!("Running test case '{}'...", &test.name);
    let jwt = if let Some(jwt) = test.jwt {
        jwt
    } else {
        let jwt_request_body = format!(
            r#"{{
               "aud": "{}",
               "exp": {},
               "sub":"UID9987",
               "machineExternalIp": "127.0.0.1",
               "machineExternalPort": {},
               "sessionId": 123
               }}"#,
            test.jwt_machine_id, test.jwt_exp, test.jwt_machine_port,
        );
        reqwest::blocking::Client::new()
            .request(reqwest::Method::POST, "http://localhost:8080/jwt/sign")
            .header(CONTENT_TYPE, "application/json")
            .body(jwt_request_body)
            .send()?
            .json::<JwtResponse>()?
            .jwt
    };
    let jwt = format!("greenion-open://{jwt}");

    let server_listener = TcpListener::bind("127.0.0.1:1122")?;

    let mut server_handle = start_server()?;
    let mut client_handle = start_client(&jwt)?;

    sleep(Duration::from_secs(1));

    let mut client_stdout = client_handle.stdout.take().unwrap();
    let mut server_stdout = server_handle.stdout.take().unwrap();
    let res = {
        let mut client_stdout = BufReader::new(&mut client_stdout).lines();

        let test_params = TestParams {
            server_listener,
            client_stdout: &mut client_stdout,
            final_jwt: &jwt,
        };

        (test.body)(test_params)
    };
    client_handle.kill()?;
    client_handle.wait()?;
    server_handle.kill()?;
    server_handle.wait()?;

    let test_name = test.name.clone();
    res.with_context(move || {
            let mut client_stdout_str = String::new();
            let mut server_stdout_str = String::new();
            BufReader::new(&mut client_stdout).read_to_string(&mut client_stdout_str).unwrap();
            BufReader::new(&mut server_stdout).read_to_string(&mut server_stdout_str).unwrap();
            format!("\x1b[1;31m'{}' test failed!\x1b[0m. Details below:\nClient stdout:\n{}\nServer stdout:\n{}\n", &test_name,client_stdout_str, server_stdout_str)
        })?;

    println!("\x1b[1;32m'{}' test passed!\x1b[0m", &test.name);
    Ok(())
}

#[cfg(target_os = "linux")]
fn start_server() -> Result<std::process::Child> {
    Command::new("greenion-server")
        .stdout(Stdio::piped())
        .spawn()
        .context("Could not start greenion server")
}

#[cfg(target_os = "linux")]
fn start_client(jwt: &str) -> Result<std::process::Child> {
    Command::new("greenion-client")
        .stdout(Stdio::piped())
        .arg(jwt)
        .spawn()
        .context("Could not start greenion client")
}

#[cfg(target_os = "windows")]
fn start_server() -> Result<std::process::Child, anyhow::Error> {
    Command::new(r".\greenion_server.exe")
        .env("GREENION_SERVER_CONFIG_FILE", "server_config.toml")
        .stdout(Stdio::piped())
        .spawn()
        .context("Could not start greenion server")
}

#[cfg(target_os = "windows")]
fn start_client(jwt: &str) -> Result<std::process::Child, anyhow::Error> {
    Command::new(r".\greenion_client.exe")
        .arg(jwt)
        .stdout(Stdio::piped())
        .spawn()
        .context("Could not start greenion client")
}

fn write_configs() -> Result<()> {
    let client_config = if cfg!(target_os = "linux") {
        r#"
[client_auth_config]
jwks_url = "http://localhost:8080/.well-known/jwks.json"

[client_network_config]
listening_port = 1123

[sanzu_client_launch_config]
sanzu_client_external_startup = true
"#
    } else {
        r#"
[client_auth_config]
jwks_url = "http://localhost:8080/.well-known/jwks.json"
ca_cert_file = "certs\\rootCA.crt"

[client_network_config]
listening_port = 1123

[sanzu_client_launch_config]
sanzu_client_external_startup = true
"#
    };

    let server_config = if cfg!(target_os = "linux") {
        r#"
[server_auth_config]
jwks_url = "http://localhost:8080/.well-known/jwks.json"

[server_network_config]
server_port = 9447
server_listening_ip = "0.0.0.0"

[sanzu_server_launch_config]
sanzu_server_external_startup = true
sanzu_server_port = 1122
"#
    } else {
        r#"
[server_auth_config]
jwks_url = "http://localhost:8080/.well-known/jwks.json"
cert_file = "certs\\cert.pem"
private_key_file = "certs\\key.pem"

[server_network_config]
server_port = 9447
server_listening_ip = "0.0.0.0"

[sanzu_server_launch_config]
sanzu_server_external_startup = true
sanzu_server_port = 1122
"#
    };

    let client_config_path = dirs::config_dir()
        .context("Failed to get system config folder")?
        .join("GreenionClient")
        .join("client_config.toml");

    let server_config_path = PathBuf::from(if cfg!(target_os = "linux") {
        "/etc/greenion-server/server_config.toml"
    } else if cfg!(target_os = "windows") {
        r"server_config.toml"
    } else {
        panic!("os not supported")
    });

    fs_extra::dir::create_all(client_config_path.parent().unwrap(), false)?;
    fs_extra::dir::create_all(server_config_path.parent().unwrap(), false)?;

    File::options()
        .write(true)
        .create(true)
        .truncate(true)
        .open(client_config_path)?
        .write_all(client_config.as_bytes())?;

    File::options()
        .write(true)
        .create(true)
        .truncate(true)
        .open(server_config_path)?
        .write_all(server_config.as_bytes())?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn copy_certs() -> Result<(), anyhow::Error> {
    let copy_opts = fs_extra::dir::CopyOptions::new().overwrite(true);

    let client_cert_path = "/etc/greenion-client";
    let server_cert_path = "/etc/greenion-server";

    fs_extra::dir::create_all(client_cert_path, false)?;
    fs_extra::dir::create_all(server_cert_path, false)?;

    fs_extra::dir::copy("./certs", client_cert_path, &copy_opts)?;
    fs_extra::dir::copy("./certs", server_cert_path, &copy_opts)?;

    Ok(())
}

#[cfg(target_os = "windows")]
fn copy_certs() -> Result<(), anyhow::Error> {
    // not copying certs to /Programs Files as it requires admin priviledges
    Ok(())
}

#[cfg(target_os = "linux")]
fn run_installer() -> Result<()> {
    use anyhow::ensure;

    fn shell_cmd(cmd: &str) -> Result<()> {
        let status = Command::new("sh")
            .args(&["-c", cmd])
            .status()
            .context(format!("Failed to launch command {cmd}"))?;
        ensure!(status.success(), "Command {cmd} failed");
        Ok(())
    }

    let is_root = users::get_current_uid() == 0;
    if is_root {
        shell_cmd("apt-get update")?;
        shell_cmd("apt-get install -y ./installers/Greenion-Server_*.deb ./installers/Greenion-Client_*.deb" )?;
    } else {
        shell_cmd("sudo apt-get update")?;
        shell_cmd("sudo apt-get install -y ./installers/Greenion-Server_*.deb ./installers/Greenion-Client_*.deb" )?;
    };
    Ok(())
}

#[cfg(target_os = "windows")]
fn run_installer() -> Result<()> {
    // not installing anymore as it requires admin priviledges
    Ok(())
}

#[derive(Deserialize)]
struct JwtResponse {
    jwt: String,
}
