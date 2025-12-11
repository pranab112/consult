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

      // Execute schema SQL in parts to handle complex statements
      try {
        // Create extensions
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create enum types
        await client.query(`CREATE TYPE user_role AS ENUM ('Owner', 'Counsellor', 'Viewer', 'Student')`).catch(() => {});
        await client.query(`CREATE TYPE document_status AS ENUM ('Pending', 'Uploaded', 'NotRequired')`).catch(() => {});
        await client.query(`CREATE TYPE country AS ENUM ('Australia', 'UK', 'Canada', 'USA', 'NewZealand', 'Germany', 'France', 'Japan', 'SouthKorea', 'Netherlands')`).catch(() => {});
        await client.query(`CREATE TYPE application_status AS ENUM ('InProgress', 'DocumentsSubmitted', 'ApplicationSubmitted', 'Accepted', 'Rejected', 'VisaProcessing', 'Completed')`).catch(() => {});

        // Read and execute full schema
        const schemaSQL = await fs.readFile(
          path.join(__dirname, 'schema.sql'),
          'utf-8'
        );

        // Split by semicolon and execute each statement
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await client.query(statement);
            } catch (err: any) {
              // Ignore errors for existing types/tables
              if (!err.message.includes('already exists')) {
                logger.warn('Schema statement warning:', err.message);
              }
            }
          }
        }

        logger.info('Database schema created successfully');
      } catch (schemaError) {
        logger.error('Schema creation error:', schemaError);
        // Continue anyway - tables might already exist
      }
    } else {
      logger.info('Database schema already exists');
    }

    client.release();
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

export { pool };