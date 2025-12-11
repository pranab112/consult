#!/bin/bash

echo "======================================="
echo "Railway Database Migration"
echo "======================================="
echo ""

PROJECT_ID="430eb8d2-fc14-46e4-9ebe-3efcdc430d8c"
echo "Project: studyabroad-fullstack"
echo ""

# First, let's check if we can connect to Railway
echo "Checking Railway connection..."
railway status 2>/dev/null || {
    echo "❌ Not connected to Railway. Linking project..."
    railway link $PROJECT_ID
}

echo ""
echo "Running database migration on Railway..."
echo "This will create all necessary tables."
echo ""

# Run the migration command on Railway
railway run npm run db:migrate:prod

echo ""
echo "======================================="
echo "Migration attempt completed!"
echo "======================================="
echo ""
echo "Check your Railway PostgreSQL dashboard:"
echo "https://railway.com/project/$PROJECT_ID"
echo ""
echo "The tables should now be visible in the PostgreSQL Data tab"