#!/bin/bash

# Install npm dependencies
echo "Installing npm dependencies..."
npm i

# Transpile JS to TS
echo "Transpiling code..."
npm exec tsc
