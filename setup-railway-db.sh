#!/bin/bash

echo "======================================="
echo "Railway Database Setup"
echo "======================================="
echo ""

# Get the DATABASE_URL from Railway PostgreSQL service
echo "To get your DATABASE_URL:"
echo "1. Go to: https://railway.com/project/430eb8d2-fc14-46e4-9ebe-3efcdc430d8c/service/5630508e-9ef3-474f-ae33-de661acceedf/connect"
echo "2. Copy the DATABASE_URL from the Connect tab"
echo ""

read -p "Paste your DATABASE_URL here: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

# Export for the Node script
export DATABASE_URL="$DATABASE_URL"

echo ""
echo "Creating database tables..."

# Run the migration
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    console.log('Connecting to Railway PostgreSQL...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'backend', 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Creating tables...');
    await pool.query(schema);

    console.log('✅ All tables created successfully!');

    // List all tables
    const result = await pool.query(\`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    \`);

    console.log('\\nTables created:');
    result.rows.forEach(row => {
      console.log(\`  ✓ \${row.tablename}\`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Details:', error.detail);
  } finally {
    await pool.end();
  }
}

createTables();
"

echo ""
echo "======================================="
echo "Setup completed!"
echo "======================================="
echo ""
echo "Your Railway PostgreSQL now has all the tables."
echo "Check at: https://railway.com/project/430eb8d2-fc14-46e4-9ebe-3efcdc430d8c/service/5630508e-9ef3-474f-ae33-de661acceedf/data"