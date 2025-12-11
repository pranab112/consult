// Test script to verify database connection
const { Pool } = require('pg');

// Test with a local database or Railway database
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL provided');
  console.error('');
  console.error('Please run with:');
  console.error('DATABASE_URL="your-database-url" node test-db-local.js');
  console.error('');
  console.error('To get DATABASE_URL from Railway:');
  console.error('1. Go to your Railway project');
  console.error('2. Click on PostgreSQL service (add one if missing)');
  console.error('3. Go to Connect tab');
  console.error('4. Copy the DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    console.log('Server time:', result.rows[0].now);

    // Check existing tables
    const tables = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    if (tables.rows.length > 0) {
      console.log('\nExisting tables:');
      tables.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    } else {
      console.log('\n⚠️  No tables found. Database is empty.');
      console.log('Run the migration to create tables.');
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('1. Invalid DATABASE_URL');
    console.error('2. Database service not running');
    console.error('3. Network/firewall issues');
  } finally {
    await pool.end();
  }
}

testConnection();