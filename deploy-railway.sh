#!/bin/bash

# Railway Deployment Script
# This script handles deployment to Railway with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
RAILWAY_CONFIG="railway.json"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    Railway Deployment Script${NC}"
    echo -e "${BLUE}========================================${NC}"
}

check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"

    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}Railway CLI is not installed!${NC}"
        echo "Install it using: npm install -g @railway/cli"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Warning: .env file not found${NC}"
        echo "Creating from .env.example..."
        cp .env.example .env
        echo -e "${RED}Please fill in your Railway token in .env file${NC}"
        exit 1
    fi

    # Load environment variables
    export $(cat .env | grep -v '^#' | xargs)

    # Check for Railway token
    if [ -z "$RAILWAY_TOKEN" ]; then
        echo -e "${RED}RAILWAY_TOKEN not set in .env file${NC}"
        echo "Get your token from: https://railway.app/account/tokens"
        exit 1
    fi

    echo -e "${GREEN}All requirements met!${NC}"
}

deploy_production() {
    echo -e "${YELLOW}Deploying to Production...${NC}"

    # Set Railway token
    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    # Link to project if not linked
    if [ ! -f ".railway/config.json" ]; then
        echo "Linking to Railway project..."
        if [ -z "$RAILWAY_PROJECT_ID" ]; then
            railway link
        else
            railway link $RAILWAY_PROJECT_ID
        fi
    fi

    # Deploy to production
    railway up --environment production

    echo -e "${GREEN}Deployment to production completed!${NC}"

    # Show deployment URL
    echo -e "${BLUE}Deployment URL:${NC}"
    railway domain
}

deploy_staging() {
    echo -e "${YELLOW}Deploying to Staging...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    # Deploy to staging environment
    railway up --environment staging

    echo -e "${GREEN}Deployment to staging completed!${NC}"
}

deploy_preview() {
    echo -e "${YELLOW}Creating Preview Deployment...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    # Create preview deployment from current branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    railway up --environment preview-$BRANCH

    echo -e "${GREEN}Preview deployment created!${NC}"
}

rollback() {
    echo -e "${YELLOW}Rolling back to previous deployment...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    # Get deployment history
    echo "Recent deployments:"
    railway status

    read -p "Enter deployment ID to rollback to: " DEPLOYMENT_ID

    # Perform rollback
    railway rollback $DEPLOYMENT_ID

    echo -e "${GREEN}Rollback completed!${NC}"
}

manage_env_vars() {
    echo -e "${YELLOW}Managing Environment Variables...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    echo "1. List all variables"
    echo "2. Set a variable"
    echo "3. Delete a variable"
    echo "4. Import from .env file"
    read -p "Choose an option: " OPTION

    case $OPTION in
        1)
            railway variables
            ;;
        2)
            read -p "Variable name: " VAR_NAME
            read -p "Variable value: " VAR_VALUE
            railway variables set "$VAR_NAME=$VAR_VALUE"
            ;;
        3)
            read -p "Variable name to delete: " VAR_NAME
            railway variables delete $VAR_NAME
            ;;
        4)
            echo "Importing variables from .env file..."
            while IFS='=' read -r key value; do
                if [[ ! "$key" =~ ^#.* ]] && [ -n "$key" ]; then
                    railway variables set "$key=$value"
                fi
            done < .env
            echo -e "${GREEN}Variables imported!${NC}"
            ;;
    esac
}

view_logs() {
    echo -e "${YELLOW}Viewing deployment logs...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    echo "1. View build logs"
    echo "2. View deployment logs"
    echo "3. Stream live logs"
    read -p "Choose an option: " OPTION

    case $OPTION in
        1)
            railway logs --build
            ;;
        2)
            railway logs
            ;;
        3)
            railway logs --tail
            ;;
    esac
}

run_command() {
    echo -e "${YELLOW}Running command on Railway...${NC}"

    export RAILWAY_TOKEN=$RAILWAY_TOKEN

    read -p "Enter command to run: " COMMAND
    railway run $COMMAND
}

# Main menu
main_menu() {
    print_header
    check_requirements

    echo ""
    echo "Select deployment option:"
    echo "1. Deploy to Production"
    echo "2. Deploy to Staging"
    echo "3. Create Preview Deployment"
    echo "4. Rollback Deployment"
    echo "5. Manage Environment Variables"
    echo "6. View Logs"
    echo "7. Run Command on Railway"
    echo "8. Exit"
    echo ""

    read -p "Enter your choice (1-8): " CHOICE

    case $CHOICE in
        1)
            deploy_production
            ;;
        2)
            deploy_staging
            ;;
        3)
            deploy_preview
            ;;
        4)
            rollback
            ;;
        5)
            manage_env_vars
            ;;
        6)
            view_logs
            ;;
        7)
            run_command
            ;;
        8)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option!${NC}"
            exit 1
            ;;
    esac
}

# Run main menu
main_menu