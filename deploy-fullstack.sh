#!/bin/bash

# Full-Stack Railway Deployment Script
# Deploys both frontend and backend with PostgreSQL

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Full-Stack Railway Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI not installed!${NC}"
    echo "Install: npm install -g @railway/cli"
    exit 1
fi

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}RAILWAY_TOKEN not set!${NC}"
    exit 1
fi

echo -e "${YELLOW}Setting up Railway project...${NC}"

# Link to project
if [ ! -f ".railway/config.json" ]; then
    echo "Select your Railway project:"
    railway link
fi

echo -e "${YELLOW}Adding PostgreSQL to Railway project...${NC}"

# Add PostgreSQL service
railway add

echo -e "${GREEN}PostgreSQL added! Railway will provide DATABASE_URL automatically${NC}"

echo -e "${YELLOW}Installing dependencies...${NC}"

# Install all dependencies
npm install
cd backend && npm install && cd ..

echo -e "${YELLOW}Building application...${NC}"

# Build both frontend and backend
npm run build

echo -e "${YELLOW}Setting environment variables...${NC}"

# Set required environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRES_IN=7d
railway variables set FRONTEND_URL=https://\${{RAILWAY_STATIC_URL}}

echo -e "${YELLOW}Deploying to Railway...${NC}"

# Deploy
railway up

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. View deployment: railway open"
echo "2. Check logs: railway logs"
echo "3. View database: railway connect postgres"
echo ""

# Get deployment URL
echo -e "${BLUE}Your app URL:${NC}"
railway domain