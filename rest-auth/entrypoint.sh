#!/bin/bash

if [ ! -f $CERTIFICATES_CA_CERTIFICATE ] || [ ! -f $CERTIFICATES_CA_PRIVATE_KEY ]; then
  echo "Please generate a CA using npm script ca:create-ca"
fi

exec "$@"
