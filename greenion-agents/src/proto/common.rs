use std::time::Duration;

use anyhow::{anyhow, Error, Result};
use byteorder::{ByteOrder, LittleEndian};
use log::error;
use prost::Message;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio_rustls::TlsStream;

const MAX_PACKET_SIZE: u32 = 10 * 1024 * 1024;

pub fn check_version_matches(client_ver: &str, server_ver: &str) -> bool {
    client_ver == server_ver
}

pub async fn send_msg_async<T>(
    stream: &mut TlsStream<tokio::net::TcpStream>,
    msg: T,
    timeout: Option<Duration>,
) -> Result<(), Error>
where
    T: Message,
{
    let mut size_buffer = vec![0u8; 4];
    let len = msg.encoded_len() as u32;
    LittleEndian::write_u32(&mut size_buffer, len);
    let mut data_buffer = vec![];
    msg.encode(&mut data_buffer)?;
    size_buffer.append(&mut data_buffer);

    let tt = timeout.unwrap_or(Duration::from_secs(3));
    let Ok(_written) = tokio::time::timeout(tt, stream.write_all(&size_buffer)).await else {
        return Err(anyhow!(
            "Timed out ({} seconds) while writing {} bytes to network socket",
            tt.as_secs(),
            size_buffer.len()
        ));
    };
    Ok(())
}

pub async fn recv_msg_async(
    stream: &mut TlsStream<tokio::net::TcpStream>,
    timeout: Option<Duration>,
) -> anyhow::Result<Vec<u8>> {
    let mut size_buffer = vec![0u8; 4];
    stream.read_exact(&mut size_buffer).await?;

    let msg_size = LittleEndian::read_u32(&size_buffer);
    if msg_size > MAX_PACKET_SIZE {
        error!(
            "Tried to receive a packet of size {} which is over the max {}",
            msg_size, MAX_PACKET_SIZE
        );
        return Err(anyhow!("Received a packet over the size limit"));
    }
    let mut data_buffer = vec![0u8; msg_size.try_into().expect("failed to convert size")];

    let tt = timeout.unwrap_or(Duration::from_secs(3));

    let Ok(read) = tokio::time::timeout(tt, stream.read_exact(&mut data_buffer)).await else {
        return Err(anyhow!(
            "Timed out ({} seconds) while reading {} bytes to network socket",
            tt.as_secs(),
            data_buffer.len()
        ));
    };
    read?;

    Ok(data_buffer)
}
