extern crate prost_build;

fn main() {
    prost_build::compile_protos(&["src/proto/messages.proto3"], &["src/proto"]).unwrap();
}
