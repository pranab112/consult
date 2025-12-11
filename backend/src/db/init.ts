import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initDatabase = async () => {
  try {
    // Test connection
    const client = await pool.connect();
    logger.info('Database connected successfully');

    // Check if tables exist
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!result.rows[0].exists) {
      logger.info('Initializing database schema...');
      const schemaSQL = await fs.readFile(
        path.join(__dirname, 'schema.sql'),
        'utf-8'
      );
      await client.query(schemaSQL);
      logger.info('Database schema created successfully');
    }

    client.release();
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

export { pool };