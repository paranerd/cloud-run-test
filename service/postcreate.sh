#!/bin/bash

echo "postcreate.sh has been called"

echo "Service Name: " $SERVICE_NAME
echo "Service URL: " $SERVICE_URL
URL=$(gcloud run services describe cloud-run-test --platform managed --format 'value(status.url)' --project $GOOGLE_CLOUD_PROJECT --region $GOOGLE_CLOUD_REGION)
echo "URL: " $URL

gcloud run services update $SERVICE_NAME --update-env-vars SERVICE_URL_TWO=$SERVICE_URL --region $GOOGLE_CLOUD_REGION
