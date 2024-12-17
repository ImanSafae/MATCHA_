#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Rm node_modules/ and package-lock.json..."
rm -rf ./server/node_modules/ ./server/package-lock.json
rm -rf ./client/node_modules/ ./client/package-lock.json

echo "Stopping and removing volume..."
docker volume stop matcha_postgres-data

echo "Removing volume matcha_postgres-data..."
docker volume rm matcha_postgres-data

echo "Recreating and starting containers..."
docker-compose up -d

echo "Done!"

# docker rmi $(docker images -a -q)