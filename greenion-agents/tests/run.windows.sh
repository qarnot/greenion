set -xe

cd ./greenion-agents/tests

7z.exe x -y '.\installers\GreenionServerInstaller.msi'
7z.exe x -y '.\installers\GreenionClientInstaller.msi'

(
  cd ./certs
  git.exe clone https://github.com/murar8/local-jwks-server.git
  cd ./local-jwks-server
  git.exe checkout v1.4.0
  git.exe apply ../local-jwks-server-flat-aud.patch
  export JWK_KEY_FILE='..\rootCA.key'
  go.exe run ./cmd/server/server.go >/dev/null &

  until go.exe run ./cmd/health/health.go; do 
    echo waiting on jwks server...
  done
)

timeout 300 cargo.exe run
