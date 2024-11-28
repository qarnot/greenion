use std::{
    fmt::{self},
    process::exit,
};

use log::error;

use super::utils::print_message_dialog;

#[derive(Debug)]
pub struct GreenionClientFinalError {
    toplevel_message: String,
    detailed_error: GreenionClientIntermediateError,
}

impl fmt::Display for GreenionClientFinalError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.to_popup_string())
    }
}

impl GreenionClientFinalError {
    pub fn new(toplevel_msg: &str, error: GreenionClientIntermediateError) -> Self {
        Self {
            toplevel_message: toplevel_msg.to_owned(),
            detailed_error: error,
        }
    }

    pub fn to_popup_string(&self) -> String {
        let s = format!(
            r#"Greenion Agent Client panicked !
{} :
{}
"#,
            self.toplevel_message, self.detailed_error.msg
        );
        s
    }

    pub fn make_complete(toplevel_msg: &str, inner_error_msg: &str) -> Self {
        Self {
            toplevel_message: toplevel_msg.to_owned(),
            detailed_error: GreenionClientIntermediateError {
                msg: inner_error_msg.to_owned(),
            },
        }
    }

    pub fn exit_complete(toplevel_msg: &str, inner_error_msg: &str) -> ! {
        let e = GreenionClientFinalError::make_complete(toplevel_msg, inner_error_msg);
        exit_with_greenion_client_final_error_popup(e);
    }
}

pub fn exit_with_greenion_client_final_error_popup(error: GreenionClientFinalError) -> ! {
    let message = error.to_popup_string();
    error!("Greenion agent client exited : {}", error);
    print_message_dialog(message.as_str());
    exit(1);
}

#[derive(Debug)]
pub struct GreenionClientIntermediateError {
    msg: String,
}

impl fmt::Display for GreenionClientIntermediateError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "GreenionClientIntermediateError : {}", self.msg)
    }
}

impl GreenionClientIntermediateError {
    pub fn new(msg: String) -> Self {
        Self {
            msg: msg.to_owned(),
        }
    }
}
