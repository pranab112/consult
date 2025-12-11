#!/bin/bash

# Quick Deploy Script for Railway
# For fast deployments without menu

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for Railway token
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "Error: RAILWAY_TOKEN not set"
    echo "Set it in .env file or export RAILWAY_TOKEN=your_token"
    exit 1
fi

# Deploy immediately
echo "Deploying to Railway..."
railway up

echo "Deployment complete!"
railway status