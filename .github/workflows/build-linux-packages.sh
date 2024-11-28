#!/bin/sh

set -eux

OUTPUT_DIR="$(pwd)/output"
RUNTIME_DEPENDENCIES=

case "$MATRIX_VERSION" in 
  ubuntu-22.04)
    export DEPENDS_LIBAVUTIL=libavutil56
    export DEPENDS_LIBAVCODEC=libavcodec58
    ;;
  ubuntu-24.04)
    export DEPENDS_LIBAVUTIL=libavutil58
    export DEPENDS_LIBAVCODEC=libavcodec60
    ;;
  *)
    echo TODO: add runtime dependencies versions in the build script for $MATRIX_VERSION
    exit 1
    ;;
esac

if ! command -v rustup ; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  export PATH="$PATH:~/.cargo/bin/"
fi

echo 'deb [trusted=yes] https://repo.goreleaser.com/apt/ /' | sudo tee /etc/apt/sources.list.d/goreleaser.list
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  cmake                                         \
  dpkg-dev                                      \
  ffmpeg                                        \
  g++                                           \
  libasound2-dev                                \
  libavdevice-dev                               \
  libavfilter-dev                               \
  libavformat-dev                               \
  libavutil-dev                                 \
  libclang-dev                                  \
  libdbus-1-dev                                 \
  libkrb5-dev                                   \
  libpam0g-dev                                  \
  libx264-dev                                   \
  libx264-dev                                   \
  libxcb-render0-dev                            \
  libxcb-shape0-dev                             \
  libxcb-xfixes0-dev                            \
  libxdamage-dev                                \
  libxext-dev                                   \
  nfpm                                          \
  protobuf-compiler                             \
  protobuf-compiler                             \
  x264                                          \
  xcb                                           \

mkdir "$OUTPUT_DIR"

cargo --color always build --manifest-path sanzu/Cargo.toml --release
cargo --color always build --manifest-path greenion-agents/Cargo.toml --release --bin greenion-client
cargo --color always build --manifest-path greenion-agents/Cargo.toml --release --bin greenion-server

nfpm package --config packaging/nfpm_server.yaml --packager deb --target "$OUTPUT_DIR/Greenion-Server_amd64-$MATRIX_VERSION.deb"
nfpm package --config packaging/nfpm_client.yaml --packager deb --target "$OUTPUT_DIR/Greenion-Client_amd64-$MATRIX_VERSION.deb"
