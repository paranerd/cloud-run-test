#!/bin/bash

# Run Terraform deployment
terraform -chdir=../terraform/ init
terraform -chdir=../terraform/ apply -auto-approve
