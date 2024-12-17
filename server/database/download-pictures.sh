#!/bin/bash

if [ ! -d "$PICTURES_FOLDER" ]; then
  git clone "$PICTURES_REPO_URL" "$PICTURES_FOLDER"
  rm -rf "$PICTURES_FOLDER/.git"
else
  echo "Repository folder already exists. Please remove or rename it."
fi

if [ $? -eq 0 ]; then
  echo "Repository successfully cloned/updated in $PICTURES_FOLDER"
else
  echo "Failed to clone/pull repository."
fi
