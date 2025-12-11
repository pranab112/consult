#!/bin/bash

echo "======================================="
echo "Running Database Migration on Railway"
echo "======================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it in Railway environment variables."
    echo ""
    echo "To set DATABASE_URL in Railway:"
    echo "1. Go to your Railway project"
    echo "2. Click on the PostgreSQL service"
    echo "3. Go to 'Connect' tab"
    echo "4. Copy the DATABASE_URL"
    echo "5. Go to your web service"
    echo "6. Go to 'Variables' tab"
    echo "7. Add: DATABASE_URL = <paste the URL>"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Build the backend if needed
echo "Building backend..."
cd backend
npm run build

echo ""
echo "Running migration..."
npm run db:migrate:prod

echo ""
echo "======================================="
echo "Migration completed!"
echo "======================================="
echo ""
echo "You can now check your Railway PostgreSQL dashboard"
echo "The tables should be visible in the Data tab"