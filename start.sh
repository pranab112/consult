#!/bin/sh

echo "Starting StudyAbroad Consultancy Application..."
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:+set}"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Start the backend server
cd backend && npm start