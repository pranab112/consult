import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    logger.info('Starting database migration...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute the schema
    await pool.query(schema);

    logger.info('Database migration completed successfully!');
    logger.info('Tables created:');
    logger.info('- agencies');
    logger.info('- users');
    logger.info('- students');
    logger.info('- documents');
    logger.info('- universities');
    logger.info('- courses');
    logger.info('- applications');
    logger.info('- tasks');
    logger.info('- activity_logs');

    // Verify tables were created
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    logger.info('\nExisting tables in database:');
    result.rows.forEach(row => {
      logger.info(`  - ${row.tablename}`);
    });

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().then(() => {
    logger.info('Migration process completed');
    process.exit(0);
  }).catch((error) => {
    logger.error('Migration process failed:', error);
    process.exit(1);
  });
}

export { migrate };