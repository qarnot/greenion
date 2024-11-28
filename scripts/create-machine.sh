#!/bin/bash

extract_http_response() {
    local response="$1"
    
    # Extract http code
    local http_code="${response: -3}"
    
    # Extract body
    local body="${response:0:${#response}-3}"
    
    echo "$http_code" "$body"
}

# Function to display usage
usage() {
  echo "Usage: $0 -n NAME -e IP -u PORT -i EXTERNAL_IP -p EXTERNAL_PORT"
  echo "Example: $0 -n TheServer -e 192.168.0.34 -u 9447 -i 194.264.2.5 -p 7432"
  exit 1
}

# Parse options using getopts
while getopts ":n:e:p:i:u:" opt; do
  case $opt in
    n) NAME="$OPTARG"
    ;;
    e) IP="$OPTARG"
    ;;
    u) PORT="$OPTARG"
    ;;
    i) EXTERNAL_IP="$OPTARG"
    ;;
    p) EXTERNAL_PORT="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2; usage
    ;;
    :) echo "Option -$OPTARG requires an argument." >&2; usage
    ;;
  esac
done


if [ -z "$EXTERNAL_IP" ] || [ -z "$EXTERNAL_PORT" ]; then
  echo "Error: Both -i (external ip) and -p (external port) must be provided."
  usage
fi


# Source environment variables
source_env_files() {
    if [ -f ./docker-resources/.env.app ]; then
        source ./docker-resources/.env.app
    else
        echo "Warning: Environment file .env.app not found."
    fi

    if [ -f ./docker-resources/kratos/.env.kratos ]; then
        source ./docker-resources/kratos/.env.kratos
    else
        echo "Warning: Environment file .env.kratos not found."
    fi
}

printf "\n##### Initializing script ####\n\n"
source_env_files



# Check env var
required_vars=(
    "HYDRA_PUBLIC_URL"
    "HYDRA_CLIENT_ID"
    "HYDRA_CLIENT_SECRET"
    "SERVE_ADMIN_BASE_URL"
    "SERVICES_CATALOG_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error : Environment variable $var is undefined."
        exit 1
    fi
done

echo "Running script with following env vars:"
echo "HYDRA_CLIENT_ID=$HYDRA_CLIENT_ID"
echo "HYDRA_CLIENT_SECRET=<not displayed>"
echo "HYDRA_PUBLIC_URL=$HYDRA_PUBLIC_URL"
echo "SERVE_ADMIN_BASE_URL=$SERVE_ADMIN_BASE_URL"
echo "SERVICES_CATALOG_URL=$SERVICES_CATALOG_URL"



printf "\n##### Creating access token ####\n\n"
auth_header=$(printf "%s" "$HYDRA_CLIENT_ID:$HYDRA_CLIENT_SECRET" | base64 -w0)
echo "Requesting access token from Ory Hydra..."

response=$(curl -s -w "%{http_code}" -X POST "$HYDRA_PUBLIC_URL/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $auth_header" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "audience=rest-app rest-catalog" \
  --data-urlencode "scope=admin")

read http_code body < <(extract_http_response "$response")

# Checking response
if [ "$http_code" -ne 200 ]; then
    echo "Erreur HTTP : $http_code"
    echo "Could not get access token from ory hydra: $body"
    exit 1
fi

# Extract access token from body
access_token=$(echo "$body" | jq -r '.access_token')


echo access_token

if [ -z "$access_token" ]; then
    echo "Error: Could not retrieve access token from ory hydra response."
    exit 1
fi
echo "Access token obtained: $access_token"

printf "\n##### Creating machine in rest app ####\n\n"

response=$(curl -s -w "%{http_code}" -X POST http://$DOMAIN:5001/api/v1/machines \
    -H "Cookie: webapp_session=$access_token" \
    -H "Content-Type: application/json" \
    -d '{"ip": "'$IP'", "name": "'$NAME'", "port": '$PORT', "externalPort": '$EXTERNAL_PORT', "externalIp": "'$EXTERNAL_IP'"}')
read http_code body < <(extract_http_response "$response")
body="${response::-3}"

# Checking response
if [ "$http_code" -ne 200 ] && [ "$http_code" -ne 201 ]; then
    echo "Erreur HTTP : $http_code"
    echo "Could not create machine in api: $body"
    exit 1
fi

echo "##### Machine successfully created !"

echo "Name : $( jq .machine.name <(echo $body))"
echo "ExternalIp : $( jq .machine.externalIp <(echo $body))"
echo "ExternalPort : $( jq .machine.externalPort <(echo $body))"

echo "ID : $( jq .machine.id <(echo $body))"
echo "CreatedAt : $( jq .machine.createdAt <(echo $body))"

printf "\n## Signed certificate :\n\n"
echo "$( jq .signedCertificate <(echo $body))"
printf "\n## Private key :\n\n"
echo "$( jq .privateKey <(echo $body))"

