#!/bin/bash

cd "$(dirname "$0")" || exit

docker rm -f service-api

DOCKER_BUILDKIT=0 docker build -t service-api .

export $(grep -v '^#' ../water-abstraction-orchestration/secrets/.env | xargs)
export $(grep -v '^#' ../water-abstraction-orchestration/shared/variables.env | xargs)

PERMIT_URI=http://host.docker.internal:8004/API/1.0/
CRM_URI=http://host.docker.internal:8002/crm/1.0
RETURNS_URI=http://host.docker.internal:8006/returns/1.0
CHARGE_MODULE_ORIGIN=http://host.docker.internal:3005
EA_ADDRESS_FACADE_URI=http://host.docker.internal:9002
DATABASE_URL=postgres://water_user:password@host.docker.internal:5432/permits
REDIS_HOST=host.docker.internal

# Missing from shared variables ?
IDM_URI=http://host.docker.internal:8003/idm/1.0

echo "HOST --- ${REDIS_HOST}"
#
docker run \
  --name "service-api" \
  --add-host=host.docker.internal:host-gateway \
  --env SERVICE_NAME="water-api" \
  --env DATABASE_URL=${DATABASE_URL} \
  --env JWT_TOKEN=${JWT_TOKEN} \
  --env JWT_SECRET=${JWT_SECRET} \
  --env PERMIT_URI=${PERMIT_URI} \
  --env CRM_URI=${CRM_URI} \
  --env RETURNS_URI=${RETURNS_URI} \
  --env IDM_URI=${IDM_URI} \
  --env CHARGE_MODULE_ORIGIN=${CHARGE_MODULE_ORIGIN} \
  --env S3_BUCKET=${S3_BUCKET} \
  --env S3_KEY=${S3_KEY} \
  --env S3_SECRET=${S3_SECRET} \
  --env TEST_NOTIFY_KEY=${TEST_NOTIFY_KEY} \
  --env WHITELIST_NOTIFY_KEY=${WHITELIST_NOTIFY_KEY} \
  --env SLACK_HOOK=${SLACK_HOOK} \
  --env ERRBIT_KEY=${ERRBIT_KEY} \
  --env ERRBIT_SERVER=${ERRBIT_SERVER} \
  --env REDIS_HOST=${REDIS_HOST} \
  --env REDIS_PORT=${REDIS_PORT} \
  --env REDIS_PASSWORD=${REDIS_PASSWORD} \
  --env TEST_MODE=${TEST_MODE} \
  --env NODE_ENV=local \
  --env NALD_ZIP_PASSWORD=${NALD_ZIP_PASSWORD} \
  --env COGNITO_HOST=${COGNITO_HOST} \
  --env COGNITO_USERNAME=${COGNITO_USERNAME} \
  --env COGNITO_PASSWORD=${COGNITO_PASSWORD} \
  --env COMPANIES_HOUSE_API_KEY=${COMPANIES_HOUSE_API_KEY} \
  --env EA_ADDRESS_FACADE_URI=${EA_ADDRESS_FACADE_URI} \
  --env WATER_SERVICE_MAILBOX=${WATER_SERVICE_MAILBOX} \
  --env NALD_SERVICE_MAILBOX=${NALD_SERVICE_MAILBOX} \
  -p 8001:8001 \
  -d \
  service-api

  echo "Logs"
  docker logs service-api

  sleep 20

  curl --retry 2 --max-time 30 --location --request POST 'http://localhost:8001/water/1.0/acceptance-tests/tear-down' \
  --header "Authorization: Bearer ${JWT_TOKEN}"

  echo "Logs after curl"
  docker logs service-api


