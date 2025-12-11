#!/bin/bash

echo "Railway Variables Fix"
echo "===================="
echo ""
echo "This script will help you set up the required environment variables."
echo ""

# Check if logged in
railway whoami || exit 1

echo ""
echo "Step 1: First, get your PostgreSQL DATABASE_URL"
echo "------------------------------------------------"
echo "1. In Railway dashboard, click on your PostgreSQL service"
echo "2. Go to Variables tab"
echo "3. Copy the DATABASE_URL value"
echo ""
read -p "Paste your DATABASE_URL here: " DB_URL

if [ -z "$DB_URL" ]; then
    echo "No DATABASE_URL provided. Exiting."
    exit 1
fi

echo ""
echo "Step 2: Setting environment variables..."
echo "----------------------------------------"

# Set all required variables
railway variables --set "DATABASE_URL=$DB_URL" --service web 2>/dev/null || {
    echo ""
    echo "Could not set via CLI. Please set manually in Railway dashboard:"
    echo ""
    echo "COPY THESE VARIABLES TO YOUR WEB SERVICE:"
    echo "=========================================="
    echo "DATABASE_URL=$DB_URL"
    echo "NODE_ENV=production"
    echo "JWT_SECRET=WMOMHDuawUdbAm074Zw52UFF26XhchQalz48NhXY7/g="
    echo "JWT_EXPIRES_IN=7d"
    echo "PORT=5000"
    echo "=========================================="
    echo ""
    echo "After adding these variables:"
    echo "1. Go to Deployments tab"
    echo "2. Click 'Redeploy' on the latest deployment"
}

echo ""
echo "Opening Railway dashboard..."
open "https://railway.app/project/496c4927-5356-4744-bf07-0d83ebbd18ad/service"