#!/bin/bash

echo "postcreate.sh has been called"

gcloud run services update $SERVICE_NAME --update-env-vars SERVICE_URL=$SERVICE_URL
