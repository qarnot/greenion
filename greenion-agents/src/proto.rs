pub mod common;

pub mod messages {
    include!(concat!(env!("OUT_DIR"), "/messages.rs"));
}
