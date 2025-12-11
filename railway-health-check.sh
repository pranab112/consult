#!/bin/bash

echo "======================================"
echo "Railway Deployment Health Check"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Railway CLI authentication
echo -e "${YELLOW}1. Railway Authentication:${NC}"
railway whoami || echo -e "${RED}Not authenticated${NC}"

# Check project status
echo -e "\n${YELLOW}2. Project Status:${NC}"
railway status

# Open dashboard
echo -e "\n${YELLOW}3. Opening Railway Dashboard:${NC}"
echo "Please check the following in your dashboard:"
echo ""
echo -e "${BLUE}Services Tab:${NC}"
echo "  □ Is there a web service running?"
echo "  □ Is PostgreSQL service running?"
echo ""
echo -e "${BLUE}Deployments Tab:${NC}"
echo "  □ What's the latest deployment status?"
echo "  □ Any error messages in logs?"
echo ""
echo -e "${BLUE}Settings Tab → Domains:${NC}"
echo "  □ What's your app URL?"
echo ""
echo -e "${BLUE}Variables Tab:${NC}"
echo "  □ DATABASE_URL (should be auto-set)"
echo "  □ NODE_ENV = production"
echo "  □ JWT_SECRET (should be set)"
echo "  □ JWT_EXPIRES_IN = 7d"

# Open the dashboard
open "https://railway.app/project/496c4927-5356-4744-bf07-0d83ebbd18ad"

echo ""
echo "======================================"
echo -e "${GREEN}Please provide the following info:${NC}"
echo "======================================"
echo "1. App URL from Settings → Domains:"
echo "   (e.g., something-production.up.railway.app)"
echo ""
echo "2. Latest deployment status:"
echo "   □ Building"
echo "   □ Deploying"
echo "   □ Active"
echo "   □ Failed"
echo ""
echo "3. Any error messages in logs?"
echo ""

# Prompt for URL to test
echo -e "${YELLOW}Enter your Railway app URL to test:${NC}"
echo "(Just paste the domain, e.g., myapp-production.up.railway.app)"
read -p "URL: " APP_URL

if [ ! -z "$APP_URL" ]; then
    # Add https if not present
    if [[ ! "$APP_URL" =~ ^https?:// ]]; then
        APP_URL="https://$APP_URL"
    fi

    echo ""
    echo -e "${YELLOW}Testing your deployment...${NC}"
    echo "======================================"

    # Test health endpoint
    echo -n "Health check endpoint: "
    HEALTH=$(curl -s -w "\nSTATUS:%{http_code}" "$APP_URL/health" 2>/dev/null)
    STATUS=$(echo "$HEALTH" | grep "STATUS:" | cut -d: -f2)

    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ WORKING${NC}"
        echo "Response: $(echo "$HEALTH" | grep -v "STATUS:")"
    else
        echo -e "${RED}❌ FAILED (HTTP $STATUS)${NC}"
    fi

    # Test main page
    echo -n "Main application page: "
    MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null)
    if [ "$MAIN_STATUS" = "200" ] || [ "$MAIN_STATUS" = "304" ]; then
        echo -e "${GREEN}✅ WORKING (HTTP $MAIN_STATUS)${NC}"
    else
        echo -e "${RED}❌ Issue (HTTP $MAIN_STATUS)${NC}"
    fi

    # Test API
    echo -n "API endpoint test: "
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$APP_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}' 2>/dev/null)

    if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "400" ] || [ "$API_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ API RESPONDING (HTTP $API_STATUS)${NC}"
    else
        echo -e "${RED}❌ API Issue (HTTP $API_STATUS)${NC}"
    fi

    echo ""
    echo "======================================"
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}🎉 Your Railway deployment is working!${NC}"
        echo -e "URL: ${BLUE}$APP_URL${NC}"
    else
        echo -e "${YELLOW}⚠️ There might be an issue${NC}"
        echo "Check the Railway dashboard logs for details"
    fi
else
    echo -e "${RED}No URL provided - skipping tests${NC}"
fi