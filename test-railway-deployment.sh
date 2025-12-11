#!/bin/bash

APP_URL="https://studyabroad-fullstack-production.up.railway.app"

echo "Testing Railway Deployment"
echo "=========================="
echo "URL: $APP_URL"
echo ""

# Test different endpoints
echo "1. Health Check:"
curl -s "$APP_URL/health" -w "\n   Status: %{http_code}\n" 2>&1 | head -5

echo ""
echo "2. Main Page:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$APP_URL"

echo ""
echo "3. API Test:"
curl -s -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  -w "\n   Status: %{http_code}\n" 2>&1 | head -5

echo ""
echo "=========================="
echo "Diagnosis:"
if curl -s "$APP_URL/health" | grep -q "502"; then
    echo "❌ App is crashing (502 error)"
    echo ""
    echo "Common causes:"
    echo "1. PORT mismatch - App might be listening on wrong port"
    echo "2. Database connection failing"
    echo "3. Missing environment variables"
    echo "4. Build/compilation errors"
    echo ""
    echo "Check Railway logs for the actual error!"
else
    echo "✅ App might be working"
fi