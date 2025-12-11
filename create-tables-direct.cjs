const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// You'll need to replace this with your actual DATABASE_URL from Railway
const DATABASE_URL = process.env.DATABASE_URL || 'YOUR_DATABASE_URL_HERE';

if (DATABASE_URL === 'YOUR_DATABASE_URL_HERE') {
  console.error('❌ Please replace YOUR_DATABASE_URL_HERE with your actual Railway PostgreSQL URL');
  console.error('');
  console.error('To get your DATABASE_URL:');
  console.error('1. Go to https://railway.com/project/430eb8d2-fc14-46e4-9ebe-3efcdc430d8c');
  console.error('2. Click on the PostgreSQL service');
  console.error('3. Go to "Connect" tab');
  console.error('4. Copy the DATABASE_URL');
  console.error('5. Replace it in this file or set it as environment variable');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    console.log('Connecting to database...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'backend', 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Creating tables...');
    await pool.query(schema);

    console.log('✅ All tables created successfully!');

    // List all tables
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('\nTables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename}`);
    });

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    if (error.detail) console.error('Details:', error.detail);
  } finally {
    await pool.end();
  }
}

createTables();