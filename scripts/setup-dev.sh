#!/bin/sh

set -xe 

npm ci 
npm run config:copy:all
npm run ca:create
# here we start hydra on background to create an oauth2 client afterward
npm run debug:hydra &

# sleeping to let hydra start
sleep 20

output="$(npm run hydra:oauth2:create-client)"

echo "$output" > /tmp/greenion-app-client-oauth2.txt


client_id="$(grep '^CLIENT ID' < /tmp/greenion-app-client-oauth2.txt | cut -f2)"
echo "client_id : $client_id"
client_secret="$(grep '^CLIENT SECRET' < /tmp/greenion-app-client-oauth2.txt| cut -f2)"
echo "client secret : $client_secret"

((cat docker-resources/.env.sample.app | grep -v HYDRA_CLIENT_ID | grep -v HYDRA_CLIENT_SECRET ); echo "HYDRA_CLIENT_ID=$client_id" ; echo "HYDRA_CLIENT_SECRET=$client_secret" ) > docker-resources/.env.app

npm run hydra:jwks:create-session-vdi

sleep 20

jwk="$(jq -r '.keys[0].kid' < ./rest-auth/src/config/jwks.json)"

echo "jwk : $jwk"

((cat docker-resources/.env.sample.common | grep -v HYDRA_JWKS_SESSION_VDI_KID) ; echo "HYDRA_JWKS_SESSION_VDI_KID=$jwk" ) > docker-resources/.env.common 

docker stop greenion-hydra-1

npm run debug
