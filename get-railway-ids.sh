#!/bin/bash

echo "Getting Railway Service IDs..."
echo "=============================="
echo ""

# Use the Railway GraphQL API to get service details
TOKEN="55c9c656-9c36-49db-978b-9fa7444fa3b4"
PROJECT_ID="496c4927-5356-4744-bf07-0d83ebbd18ad"

echo "Fetching project details..."
echo ""

# Query Railway API
curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { project(id: \"'$PROJECT_ID'\") { id name environments { edges { node { id name services { edges { node { id name } } } } } } } }"
  }' | python3 -m json.tool 2>/dev/null || {
    echo "Failed to fetch data. Trying alternative method..."
    echo ""
    echo "Please go to Railway dashboard and:"
    echo "1. Click on your Web Service"
    echo "2. Look at the URL - it contains the service ID"
    echo "   Example: /project/xxx/service/[THIS-IS-SERVICE-ID]"
    echo ""
    echo "3. Click on PostgreSQL service"
    echo "4. Look at the URL for PostgreSQL service ID"
    echo ""
    echo "Share both service IDs with me"
  }

echo ""
echo "Alternative: Check browser URL"
echo "=============================="
echo "When you click on a service in Railway, the URL shows:"
echo "https://railway.app/project/PROJECT_ID/service/SERVICE_ID"
echo ""
echo "Copy the SERVICE_ID part for both:"
echo "- Web application service"
echo "- PostgreSQL service"