use anyhow::anyhow;
use log::error;
use std::{
    env::{self, args},
    fs::create_dir_all,
    panic,
    path::PathBuf,
    str::FromStr,
};

pub fn get_server_config_file_path() -> anyhow::Result<PathBuf> {
    if let Ok(v) = env::var("GREENION_SERVER_CONFIG_FILE") {
        return Ok(PathBuf::from(v));
    }

    if cfg!(target_os = "windows") {
        Ok(PathBuf::from_str(
            "C:\\Program Files (x86)\\GreenionServer\\Config\\server_config.toml",
        )?)
    } else if cfg!(target_os = "linux") {
        Ok(PathBuf::from_str(
            "/etc/greenion-server/server_config.toml",
        )?)
    } else {
        Err(anyhow!("macos not supported"))
    }
}

pub fn get_server_log_folder() -> PathBuf {
    let logs_folder = env::var("GREENION_SERVER_LOGS_FOLDER")
        .map(PathBuf::from)
        .unwrap_or_else(|_|
    if cfg!(target_os = "windows") {
        if let Ok(program_files_folder) = env::var("programfiles(x86)") {
            PathBuf::from(program_files_folder)
                .join("GreenionServer")
                .join("Logs")
        } else {
            println!("Failed to get programfiles through environment variable, getting it from the executable path");

            // This part assumes that the program has not been moved to the root
        PathBuf::from(args().next().unwrap()) // C:\Program Files (x86)\GreenionServer\Agent\greenion-server.exe
            .parent() // C:\Program Files (x86)\GreenionServer\Agent
            .unwrap()
            .parent() // C:\Program Files (x86)\GreenionServer
            .unwrap()
            .join("Logs") // C:\Program Files (x86)\GreenionServer\Logs
        }
    } else {
        dirs::data_dir()
                .expect("unsupported system: data dir is not available. Try overriding it with the `GREENION_SERVER_LOGS_FOLDER` environment variable instead.")
            .join("GreenionServer")
            .join("Logs")
    }
    );
    logs_folder
}

pub fn setup_server_agent_log_folder() -> anyhow::Result<PathBuf> {
    let logs_folder = get_server_log_folder();

    if create_dir_all(&logs_folder).is_err() {
        return Err(anyhow!(
            "Could not create log folder {}",
            logs_folder.display()
        ));
    };

    println!("Logging to folder {}", logs_folder.display());
    Ok(logs_folder)
}

pub fn setup_server_panic_hook() {
    panic::set_hook(Box::new(|panic_info| {
        error!("Greenion agent server panicked : {:?}", panic_info);
        let backtrace = std::backtrace::Backtrace::force_capture();
        error!("Backtrace: {}", backtrace);
    }));
}
