use super::SanzuServerWrapper;
use crate::standalone_server::SanzuServerWindowsHandles;
use anyhow::anyhow;
use anyhow::Context;
use core::time::Duration;
use log::{debug, error, info, warn};
use std::ffi::c_void;
use std::mem::size_of;
use std::ops::BitOr;
use std::path::Path;
use std::thread::sleep;
use windows::Win32::Foundation::{BOOL, HANDLE, INVALID_HANDLE_VALUE};
use windows::Win32::Security::SECURITY_ATTRIBUTES;
use windows::Win32::Storage::FileSystem::*;
use windows::Win32::System::Threading::*;
use windows::{Win32::Foundation::*, Win32::Security::*, Win32::System::RemoteDesktop::*};
use windows_core::Free;
use windows_strings::*;

impl SanzuServerWrapper {
    pub fn start(&mut self) -> anyhow::Result<()> {
        let mut startup_info = STARTUPINFOW {
            cb: size_of::<STARTUPINFOW>() as u32,
            lpDesktop: PWSTR::from_raw(h!("winsta0\\default").as_ptr() as *mut u16),
            dwFlags: STARTF_USESTDHANDLES,
            hStdInput: INVALID_HANDLE_VALUE,
            ..Default::default()
        };

        let mut logfile_handle: Option<HANDLE> = None;
        if let Some(logfile) = &self.sanzu_log_file {
            match Self::open_sanzu_server_log_file_handle(logfile.as_str()) {
                Ok(logf_handle) => {
                    logfile_handle = Some(logf_handle);
                    startup_info.hStdOutput = logf_handle;
                    startup_info.hStdError = logf_handle;
                }
                Err(_) => {
                    warn!(
                        "Could not open sanzu log file for writing. Running it without saving its logs"
                    );
                }
            };
        }
        let mut console_token = Self::make_token_with_console_access()
            .context("error when retrieving token with session access")?;

        let mut sanzu_process_info = PROCESS_INFORMATION::default();
        let mut wakeup_process_info = PROCESS_INFORMATION::default();

        match Path::new(&self.sanzu_server_path).try_exists() {
            Ok(v) => {
                if !v {
                    error!(
                        "Sanzu server path ({}) doesn't exist",
                        &self.sanzu_server_path
                    );
                    return Err(anyhow!("Sanzu server path doesn't exist"));
                }
            }
            Err(e) => {
                error!(
                    "Sanzu server path ({}) does not point to an existing binary",
                    &self.sanzu_server_path
                );
                error!("{}", e);
                if let Some(mut fh) = logfile_handle {
                    unsafe {
                        fh.free();
                    }
                }
                return Err(anyhow!("Sanzu server path points to a non existing binary"));
            }
        }

        info!("Waking up server and ensuring that it will not sleep during the session");
        let _wakeup_process = unsafe {
            CreateProcessAsUserW(
                console_token,
                PCWSTR::from_raw(HSTRING::from(self.wakeup_exe_path.clone()).as_ptr()),
                PWSTR::null(),
                None,
                None,
                BOOL::from(true),
                HIGH_PRIORITY_CLASS
                    .bitor(CREATE_UNICODE_ENVIRONMENT)
                    .bitor(CREATE_NO_WINDOW),
                None,
                PCWSTR::null(),
                &startup_info as *const STARTUPINFOW,
                &mut wakeup_process_info as *mut PROCESS_INFORMATION,
            )
        };
        unsafe {
            wakeup_process_info.hProcess.free();
            wakeup_process_info.hThread.free();
        };

        info!("Starting sanzu server at '{}'...", &self.sanzu_server_path);

        let commandline_str: String = format!(
            "{:?} -x -f {:?} -e {:?} \0",
            self.sanzu_server_path, self.sanzu_server_config, self.sanzu_server_codec,
        );

        info!("Starting sanzu server with command : '{}'", commandline_str);

        let mut command_line: Vec<u16> = commandline_str.encode_utf16().collect();

        let _sanzu_process = unsafe {
            CreateProcessAsUserW(
                console_token,
                PCWSTR::from_raw(HSTRING::from(self.sanzu_server_path.clone()).as_ptr()),
                PWSTR::from_raw(command_line.as_mut_ptr()),
                None,
                None,
                BOOL::from(true),
                HIGH_PRIORITY_CLASS
                    .bitor(CREATE_UNICODE_ENVIRONMENT)
                    .bitor(CREATE_NO_WINDOW),
                None,
                PCWSTR::null(),
                &startup_info as *const STARTUPINFOW,
                &mut sanzu_process_info as *mut PROCESS_INFORMATION,
            )
        };
        unsafe {
            console_token.free();
        };

        debug!(
            "Started sanzu server, sleeping for {} seconds...",
            self.sanzu_wait_time.as_secs()
        );
        sleep(self.sanzu_wait_time);
        debug!("Done, let's see if sanzu server is still up");

        let wait_rest = unsafe { WaitForSingleObject(sanzu_process_info.hProcess, 0) };
        if wait_rest != WAIT_TIMEOUT {
            error!("Sanzu server crashed");
            unsafe {
                sanzu_process_info.hProcess.free();
                sanzu_process_info.hThread.free();
                if let Some(mut h) = logfile_handle {
                    h.free();
                }
            }
            Err(anyhow!("sanzu server crashed upon startup"))
        } else {
            info!("Sanzu server seems to have started up correctly");
            self.handles = Some(SanzuServerWindowsHandles {
                sanzu_server_process_handle: sanzu_process_info.hProcess,
                sanzu_server_thread_handle: sanzu_process_info.hThread,
                sanzu_server_logfile_handle: logfile_handle,
            });
            Ok(())
        }
    }

    pub fn wait(self) {
        if let Some(mut handles) = self.handles {
            loop {
                let wait_rest =
                    unsafe { WaitForSingleObject(handles.sanzu_server_process_handle, 0) };
                if wait_rest != WAIT_TIMEOUT {
                    error!("Waiting for sanzu server : sanzu server is not alive anymore. Cleaning remaining handles");
                    unsafe {
                        handles.sanzu_server_process_handle.free();
                        handles.sanzu_server_thread_handle.free();
                        if let Some(mut h) = handles.sanzu_server_logfile_handle {
                            h.free();
                        }
                        error!("Reseting default process sleep settings");
                        return;
                    }
                }
                sleep(Duration::from_secs(5));
            }
        }
    }

    fn open_sanzu_server_log_file_handle(logfile: &str) -> anyhow::Result<HANDLE> {
        let sanzu_server_log_file = std::env::temp_dir().join(logfile);
        let mut security_attributes = SECURITY_ATTRIBUTES {
            bInheritHandle: BOOL::from(true),
            ..Default::default()
        };

        let handle_res = unsafe {
            CreateFileW(
                PCWSTR::from_raw(HSTRING::from(sanzu_server_log_file.as_path()).as_ptr()),
                // GENERIC_WRITE.0,
                FILE_APPEND_DATA.0,
                FILE_SHARE_READ,
                Some(&mut security_attributes as *mut SECURITY_ATTRIBUTES),
                CREATE_ALWAYS,
                windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES(0),
                HANDLE::default(),
            )
        };

        let mut handle = match handle_res {
            Ok(h) => {
                info!(
                    "Creating sanzu log file ({}) worked",
                    sanzu_server_log_file.to_str().unwrap()
                );
                h
            }
            Err(e) => {
                warn!(
                    "Creating sanzu log file ({}) didn't work : {}",
                    sanzu_server_log_file.to_str().unwrap(),
                    e
                );
                return Err(anyhow!(
                    "Creating sanzu log file ({}) didn't work",
                    sanzu_server_log_file.to_str().unwrap()
                ));
            }
        };

        let position = unsafe { SetFilePointer(handle, 0, None, FILE_END) };

        if position == INVALID_SET_FILE_POINTER {
            warn!("Could not seek to the end of the sanzu server log file");
            unsafe {
                handle.free();
            }
            return Err(anyhow!(
                "Could not seek to the end of the sanzu server log file"
            ));
        }

        Ok(handle)
    }

    fn make_token_with_console_access() -> anyhow::Result<HANDLE> {
        let console_session_id: u32 = unsafe { WTSGetActiveConsoleSessionId() };
        info!(
            "Got the following console session id : {}",
            console_session_id
        );
        if console_session_id == 0xFFFFFFFF {
            error!("Got console session id of {}", { console_session_id });
            return Err(anyhow!("could not get console session id"));
        }
        let mut current_token = HANDLE::default();
        let ret_open_process_token =
            unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_DUPLICATE, &mut current_token) };
        match ret_open_process_token {
            Ok(_) => debug!("Got greenion-agent-server's process token"),
            Err(_) => {
                error!("Could not get greenion-agent-server's process token");
                return Err(anyhow!(
                    "Could not get greenion-agent-server's process token"
                ));
            }
        };

        let mut new_token = HANDLE::default();
        let ret_duplicate_token = unsafe {
            DuplicateTokenEx(
                current_token,
                TOKEN_ALL_ACCESS,
                None,
                SecurityImpersonation,
                TokenPrimary,
                &mut new_token,
            )
        };
        match ret_duplicate_token {
            Ok(..) => debug!("Duplicated token successfully"),
            Err(..) => {
                error!("Could not duplicate token");
                unsafe {
                    current_token.free();
                    // let _ = CloseHandle(current_token);
                }
                return Err(anyhow!("Could not duplicate token"));
            }
        };

        unsafe {
            current_token.free();
            // let _ = CloseHandle(current_token);
        }

        let ptr_console_session_id = Box::into_raw(Box::new(console_session_id));
        let console_ptr: *const c_void = ptr_console_session_id as *const _ as *const c_void;
        let ret_set_token_information = unsafe {
            SetTokenInformation(
                new_token,
                TokenSessionId,
                console_ptr,
                std::mem::size_of::<u32>() as u32,
            )
        };

        if ret_set_token_information.is_err() {
            error!("Could not add session id info to token");
            unsafe {
                new_token.free();
                // let _ = CloseHandle(new_token);
            }
            return Err(anyhow!("Could not add session id to token"));
        }

        debug!("Added session id info to token worked");

        // So that console_ptr gets dropped
        let _box_console_session_id = unsafe { Box::from_raw(ptr_console_session_id) };

        Ok(new_token)
    }
}
