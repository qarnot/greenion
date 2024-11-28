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
  echo "Usage: $0 -u USER_EMAIL -p USER_PASSWORD [-r ROLE]"
  exit 1
}

# Set default role
USER_ROLE="admin"

# Parse options using getopts
while getopts ":u:p:r:" opt; do
  case $opt in
    u) USER_EMAIL="$OPTARG"
    ;;
    p) USER_PASSWORD="$OPTARG"
    ;;
    r) USER_ROLE="$OPTARG"
       if [[ "$USER_ROLE" != "admin" && "$USER_ROLE" != "user" ]]; then
           echo "Error: Invalid role. Role must be 'admin' or 'user'."
           exit 1
       fi
    ;;
    \?) echo "Invalid option -$OPTARG" >&2; usage
    ;;
    :) echo "Option -$OPTARG requires an argument." >&2; usage
    ;;
  esac
done

if [ -z "$USER_EMAIL" ] || [ -z "$USER_PASSWORD" ]; then
  echo "Error: Both -u (user email) and -p (password) must be provided."
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



USER_TRAITS=$(cat <<EOF
{
  "credentials": {
    "password": {
      "config": {
        "password": "$USER_PASSWORD"
      }
    }
  },
  "traits": {
    "email": "$USER_EMAIL"
  },
  "metadata_public": {
    "role": "$USER_ROLE"
  }
}
EOF
)

printf "\n##### Creating access token ####\n\n"
auth_header=$(printf "%s" "$HYDRA_CLIENT_ID:$HYDRA_CLIENT_SECRET" | base64 -w0)
echo "Requesting access token from Ory Hydra..."

response=$(curl -s -w "%{http_code}" -X POST "$HYDRA_PUBLIC_URL/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $auth_header" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "audience=rest-catalog" \
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

if [ -z "$access_token" ]; then
    echo "Error: Could not retrieve access token from ory hydra response."
    exit 1
fi
echo "Access token obtained: $access_token"

printf "\n##### Creating ory kratos user if it does not exist ####\n\n"
echo "Fetching all identities from Ory Kratos..."
response=$(curl -s -w "%{http_code}" -X GET "$SERVE_ADMIN_BASE_URL/admin/identities")
read http_code body < <(extract_http_response "$response")

# Vérification du code de réponse
if [ "$http_code" -ne 200 ]; then
    echo "Erreur HTTP : $http_code"
    echo "Could not list kratos identities: $body"
    exit 1
fi
identities_response=$body

echo "Checking if a user with email '$USER_EMAIL' already exists..."
user_uuid=$(echo "$identities_response" | jq -r --arg email "$USER_EMAIL" '.[] | select(.traits.email == $email) | .id')

if [[ -n "$user_uuid" ]]; then
    echo "User with email '$USER_EMAIL' already exists. No new user will be created."
else
    echo "No user with email '$USER_EMAIL' found. Proceeding with creation..."
    response=$(curl -s -w "%{http_code}" -X POST "$SERVE_ADMIN_BASE_URL/admin/identities" \
    -H "Content-Type: application/json" \
    -d "$USER_TRAITS")
    read http_code body < <(extract_http_response "$response")

    # Checking response
    if [ "$http_code" -ne 200 ] && [ "$http_code" -ne 201 ]; then
        echo "Erreur HTTP : $http_code"
        echo "Could not create user kratos identity: $body"
        exit 1
    fi

    user_uuid=$(echo "$body" | jq -r '.id')

    echo "User created with UUID: $user_uuid and role $USER_ROLE" 
fi

printf "\n##### Creating user in api catalog ####\n\n"
echo "Creating $user_uuid in api catalog"
response=$(curl -s -w "%{http_code}" -X POST "$SERVICES_CATALOG_URL"/api/v1/users \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json" \
    -d '{"uuid": "'$user_uuid'"}')
read http_code body < <(extract_http_response "$response")

# Checking response
if [ "$http_code" -ne 200 ] && [ "$http_code" -ne 201 ]; then
    echo "Erreur HTTP : $http_code"
    echo "Could not create user in api catalog: $body"
    exit 1
fi
echo "Response from api catalog: $body"
