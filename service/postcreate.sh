#!/bin/bash

# Install Node dependencies
npm i --prefix ../service

# Transpile JS to TS
npm exec --prefix ../service tsc

# Run Terraform deployment
terraform -chdir=../terraform/ init
terraform -chdir=../terraform/ apply -auto-approve
