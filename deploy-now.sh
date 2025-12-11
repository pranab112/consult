#!/bin/bash

# Quick Deploy Script for StudyAbroad App

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   StudyAbroad Railway Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Login to Railway
echo -e "${YELLOW}Step 1: Logging in to Railway...${NC}"
railway login

# Step 2: Initialize or link project
echo -e "${YELLOW}Step 2: Creating new Railway project...${NC}"
railway init -n studyabroad-fullstack

# Step 3: Add PostgreSQL
echo -e "${YELLOW}Step 3: Adding PostgreSQL database...${NC}"
echo "Please select PostgreSQL when prompted:"
railway add

# Step 4: Set environment variables
echo -e "${YELLOW}Step 4: Setting environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRES_IN=7d

# Step 5: Install dependencies
echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
npm install
cd backend && npm install && cd ..

# Step 6: Build application
echo -e "${YELLOW}Step 6: Building application...${NC}"
npm run build

# Step 7: Deploy
echo -e "${YELLOW}Step 7: Deploying to Railway...${NC}"
railway up

# Step 8: Get deployment URL
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Your app is deployed at:${NC}"
railway domain

echo ""
echo -e "${BLUE}View logs:${NC} railway logs --tail"
echo -e "${BLUE}Open app:${NC} railway open"