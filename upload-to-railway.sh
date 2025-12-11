#!/bin/bash

echo "Uploading your local code to Railway..."
echo "This will update your deployment with all the fixes."

# Upload to Railway (will prompt for service selection)
railway up

echo "Upload complete! Check Railway dashboard for build progress."