#!/bin/bash

echo "postcreate.sh has been called"

gcloud run services update $SERVICE_NAME --update-env-vars SERVICE_URL_TWO=$SERVICE_URL --region $GOOGLE_CLOUD_REGION
