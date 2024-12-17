#!/bin/bash
docker compose run --rm server npm install
docker compose run --rm client npm install
docker compose up --build

# Attention les nodes modules sont faits sur des conteneurs docker pour fonctionner 
# sous Windows car des bibliotheques comme decrypt meme si installées par npm ne sont pas 
# les memes pour Windows et linux. 
# Du coup si nouveau paquet à refaire il faut refaire les conteneurs, sinon le module ne s'installe pas 
# Remove folder /uploads before doing ./fill-db.sh 