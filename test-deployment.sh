#!/bin/bash

# Get the deployment URL from user
echo "Enter your Railway app URL (e.g., studyabroad-fullstack-production.up.railway.app):"
read APP_URL

# Add https:// if not present
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
    APP_URL="https://$APP_URL"
fi

echo "Testing deployment at: $APP_URL"
echo "================================"

# Test health endpoint
echo -n "1. Testing health check... "
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$APP_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASSED"
    echo "   Response: $(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE")"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
fi

# Test main page
echo -n "2. Testing main page... "
MAIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$MAIN_CODE" = "200" ] || [ "$MAIN_CODE" = "304" ]; then
    echo "✅ PASSED (HTTP $MAIN_CODE)"
else
    echo "❌ FAILED (HTTP $MAIN_CODE)"
fi

# Test API auth endpoint
echo -n "3. Testing API endpoint... "
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$APP_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}')
if [ "$API_CODE" = "401" ] || [ "$API_CODE" = "400" ]; then
    echo "✅ API responding correctly (HTTP $API_CODE)"
elif [ "$API_CODE" = "200" ]; then
    echo "✅ API working (HTTP $API_CODE)"
else
    echo "❌ API issue (HTTP $API_CODE)"
fi

echo ""
echo "================================"
echo "Deployment Status Summary:"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Your app is deployed and running!"
    echo "🌐 URL: $APP_URL"
    echo "📊 Database: Check Railway dashboard for PostgreSQL status"
else
    echo "❌ There might be an issue with the deployment"
    echo "Check Railway dashboard logs for details"
fi