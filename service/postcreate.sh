#!/bin/bash

echo "postcreate.sh has been called"

echo "Service Name: " $SERVICE_NAME
echo "Service URL: " $SERVICE_URL
URL=$(gcloud run services describe SERVICE --platform managed --region REGION --format 'value(status.url)'
)
echo "URL: " $URL

gcloud run services update $SERVICE_NAME --update-env-vars SERVICE_URL_TWO=$SERVICE_URL --region $GOOGLE_CLOUD_REGION
