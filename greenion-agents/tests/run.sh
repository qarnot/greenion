set -xe

cd ./greenion-agents/tests/

export DEBIAN_FRONTEND=noninteractive
if ! command -v rustup ; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  export PATH="$PATH:~/.cargo/bin/"
fi

curl -o local-jwks-server-src.zip https://codeload.github.com/murar8/local-jwks-server/zip/refs/tags/v1.4.0
unzip 'local-jwks-server-src.zip'
mv local-jwks-server-1.4.0/ ./certs/local-jwks-server

(
  cd ./certs/local-jwks-server
  git init
  git apply ../local-jwks-server-flat-aud.patch
  export JWK_KEY_FILE='../rootCA.key'
  go run ./cmd/server/server.go >/dev/null &

  until go run ./cmd/health/health.go; do 
    echo waiting on jwks server...
  done
)


cargo run
