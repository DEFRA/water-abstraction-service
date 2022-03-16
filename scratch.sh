#!/bin/bash

cd "$(dirname "$0")" || exit

export $(grep -v '^#' ../water-abstraction-orchestration/secrets/.env | xargs)
export $(grep -v '^#' ../water-abstraction-orchestration/shared/variables.env | xargs)

echo "Stop water api in pm2"
pm2 stop water-api

echo "Check git branch"
git status
echo "View log file changes"
cat src/modules/acceptance-tests/controller.js

node . &
sleep 10 && echo "Run 2" && curl --location --request POST 'http://localhost:8001/water/1.0/acceptance-tests/tear-down' \
--header "Authorization: Bearer ${JWT_TOKEN}" &

wait

