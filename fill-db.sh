#!/bin/bash
docker exec -i matcha-server ./database/download-pictures.sh
docker exec -i matcha-db psql -U postgres -d matcha_db < ./server/database/script.sql