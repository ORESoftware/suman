#!/usr/bin/env bash

#set -e;

rm -rf node_modules
npm cache verify # npm cache clean

npm install --loglevel=warn --production;

npm link -f;

npm link suman;


which_istanbul="$(which istanbul)"

if [[ -z "$which_istanbul" ]]; then
    npm install -g istanbul --silent
fi
