#!/bin/sh

set -e

if ! command -v rustup ; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  export PATH="$PATH:~/.cargo/bin/"
fi

rustup target add x86_64-pc-windows-gnu
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  mingw-w64                                     \
  cmake                                         \
  nasm                                          \
  libclang-dev                                  \
  protobuf-compiler                             \
  librust-clang-sys-dev                         \
  wixl                                          \

cargo install --force --locked bindgen-cli

OUTPUT_DIR="$(pwd)/output"

mkdir -p "$OUTPUT_DIR/agent"
mkdir "$OUTPUT_DIR/default_config"

cd greenion-agents

cargo --color always build --target x86_64-pc-windows-gnu --release
cp target/x86_64-pc-windows-gnu/release/*.exe "$OUTPUT_DIR/agent/"

wget https://github.com/qarnot/sanzu/releases/download/sanzu-qarnot-v0.1.4/sanzu-windows-qarnot-v0.1.4.zip
unzip sanzu-windows-qarnot-v0.1.4.zip
unzip -d "$OUTPUT_DIR/sanzu_zip" sanzu-windows-release/sanzu-0.1.4-x86_64-pc-windows-gnu.zip

# TODO: stop regenerating certs
(cd certs/ && ./script.sh)

cp -r config/default/*/* "$OUTPUT_DIR/default_config/"
cp certs/rootCA.crt "$OUTPUT_DIR"
cp installer/server/GreenionServerInstaller.wxs "$OUTPUT_DIR"
cp installer/client/GreenionClientInstaller.wxs "$OUTPUT_DIR"
