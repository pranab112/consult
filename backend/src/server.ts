import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import studentsRouter from './routes/students';
import documentsRouter from './routes/documents';
import agenciesRouter from './routes/agencies';
import { initDatabase } from './db/init';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/agencies', agenciesRouter);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database (optional - continue if fails)
    if (process.env.DATABASE_URL) {
      try {
        await initDatabase();
        logger.info('Database connected successfully');
      } catch (dbError) {
        logger.warn('Database connection failed, running without database:', dbError);
        logger.info('App will run with limited functionality - add PostgreSQL in Railway');
      }
    } else {
      logger.warn('No DATABASE_URL found - add PostgreSQL in Railway dashboard');
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      if (!process.env.DATABASE_URL) {
        logger.info('⚠️ Running without database - Add PostgreSQL in Railway for full functionality');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;