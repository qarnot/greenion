#!/bin/sh

set -xe

cd ./greenion-agents/tests/

docker build -t rust-ubuntu -f ./Dockerfile.linux .
if docker run --network=host --name=greenion-test -d -v .:/app rust-ubuntu sleep 1000d 2>/dev/null; then
  echo created the test container
fi

docker exec greenion-test bash -c "
killall greenion-server
killall greenion-client

(
  cd /local-jwks-server-1.4.0
  export JWK_KEY_FILE='/app/certs/rootCA.key'
  go run ./cmd/server/server.go >/dev/null &

  until go run ./cmd/health/health.go; do 
    echo waiting on jwks server...
  done
)

cd /app
RUST_BACKTRACE=1 cargo --color always run
"
