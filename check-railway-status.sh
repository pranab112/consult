#!/bin/bash

echo "Railway Project Status Check"
echo "============================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI not installed${NC}"
    exit 1
fi

# Check authentication
echo -e "${YELLOW}1. Authentication Status:${NC}"
railway whoami

# Check project
echo -e "\n${YELLOW}2. Current Project:${NC}"
railway status

# Try to list services
echo -e "\n${YELLOW}3. Available Services:${NC}"
railway service 2>&1 || echo "No services linked"

# Check for PostgreSQL
echo -e "\n${YELLOW}4. Database Status:${NC}"
if railway variables 2>&1 | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}PostgreSQL is configured${NC}"
else
    echo -e "${RED}PostgreSQL NOT configured - Add it in Railway dashboard${NC}"
fi

# Check deployment URL
echo -e "\n${YELLOW}5. Deployment URL:${NC}"
railway domain 2>&1 || echo "No domain configured yet"

echo -e "\n${YELLOW}Dashboard:${NC} https://railway.app/project/496c4927-5356-4744-bf07-0d83ebbd18ad"
echo -e "\n${YELLOW}Action Required:${NC}"
echo "1. Open Railway dashboard (link above)"
echo "2. Check if services are running"
echo "3. Add PostgreSQL if not present"
echo "4. Check deployment logs in the dashboard"