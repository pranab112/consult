#!/bin/bash

echo "======================================"
echo "Complete Railway Fix Script"
echo "======================================"
echo ""

# Project details
PROJECT_ID="430eb8d2-fc14-46e4-9ebe-3efcdc430d8c"
WEB_SERVICE_ID="2fa7b5b3-0b3d-4872-8230-83b1ab5e82ac"
DB_SERVICE_ID="5630508e-9ef3-474f-ae33-de661acceedf"
ENV_ID="96e76bd8-d3a5-4c68-9c3b-9d83204f690b"

echo "Project: studyabroad-fullstack"
echo "Web Service ID: $WEB_SERVICE_ID"
echo "PostgreSQL ID: $DB_SERVICE_ID"
echo ""

# Update local config
echo "1. Updating local Railway config..."
mkdir -p .railway
echo "{\"projectId\": \"$PROJECT_ID\"}" > .railway/config.json
echo "✅ Config updated"

# Check current status
echo ""
echo "2. Checking project status..."
railway status

# Try to link service
echo ""
echo "3. Attempting to link to web service..."
railway link $PROJECT_ID 2>/dev/null || echo "Already linked"

# Manual instructions for variables
echo ""
echo "======================================"
echo "MANUAL STEPS REQUIRED IN RAILWAY DASHBOARD:"
echo "======================================"
echo ""
echo "Since API access is limited, please do the following:"
echo ""
echo "1. Go to: https://railway.com/project/$PROJECT_ID/service/$WEB_SERVICE_ID"
echo ""
echo "2. Click on 'Variables' tab"
echo ""
echo "3. Add these variables (click 'New Variable' for each):"
echo ""
echo "   DATABASE_URL = \${{Postgres.DATABASE_URL}}"
echo "   NODE_ENV = production"
echo "   JWT_SECRET = WMOMHDuawUdbAm074Zw52UFF26XhchQalz48NhXY7/g="
echo "   JWT_EXPIRES_IN = 7d"
echo "   PORT = 5000"
echo ""
echo "4. After adding all variables, the app will auto-redeploy"
echo ""
echo "5. Once deployed, go to Settings → Domains"
echo "   - Click 'Generate Domain' if none exists"
echo "   - Copy the domain URL"
echo ""

# Open the correct service page
echo "Opening Railway dashboard to the correct service..."
open "https://railway.com/project/$PROJECT_ID/service/$WEB_SERVICE_ID?environmentId=$ENV_ID"

echo ""
echo "======================================"
echo "After you've added the variables and got the URL:"
echo "======================================"
echo ""
read -p "Enter your Railway app URL (once you have it): " APP_URL

if [ ! -z "$APP_URL" ]; then
    # Add https if not present
    if [[ ! "$APP_URL" =~ ^https?:// ]]; then
        APP_URL="https://$APP_URL"
    fi

    echo ""
    echo "Testing deployment at: $APP_URL"
    echo "--------------------------------"

    # Test health
    echo -n "Health check: "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health")

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ WORKING!"
        curl -s "$APP_URL/health" | python3 -m json.tool
    else
        echo "❌ Not responding (HTTP $HTTP_CODE)"
        echo "Check Railway logs for errors"
    fi
fi

echo ""
echo "======================================"
echo "Quick Links:"
echo "======================================"
echo "Web Service: https://railway.com/project/$PROJECT_ID/service/$WEB_SERVICE_ID"
echo "PostgreSQL: https://railway.com/project/$PROJECT_ID/service/$DB_SERVICE_ID"
echo "Deployments: https://railway.com/project/$PROJECT_ID/service/$WEB_SERVICE_ID/deployments"