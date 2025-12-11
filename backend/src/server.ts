import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
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
const PORT = parseInt(process.env.PORT || '5000', 10);

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
    environment: process.env.NODE_ENV,
    version: '1.0.1' // Force rebuild
  });
});

// Test endpoint to verify deployment
app.get('/test-deploy', (_req, res) => {
  const fs = require('fs');
  const distExists = fs.existsSync(path.join(__dirname, '../../dist'));
  const indexExists = fs.existsSync(path.join(__dirname, '../../dist/index.html'));

  res.json({
    message: 'Testing deployment',
    dirname: __dirname,
    cwd: process.cwd(),
    distExists,
    indexExists,
    files: fs.readdirSync(path.join(__dirname, '../..')).slice(0, 20)
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/agencies', agenciesRouter);

// Serve static files from React build
// In production, __dirname is backend/dist, so we go up 2 levels to reach root
const frontendPath = path.join(__dirname, '../../dist');
console.log('Frontend path:', frontendPath);
console.log('__dirname:', __dirname);
console.log('cwd:', process.cwd());

app.use(express.static(frontendPath));

// Catch-all route for React app - must come AFTER all API routes but BEFORE error handler
app.use((req, res, next) => {
  // Skip API routes and health check
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }

  const indexPath = path.join(__dirname, '../../dist/index.html');
  console.log('Looking for index.html at:', indexPath);

  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Debug info to understand the path structure
    res.status(404).json({
      message: 'Frontend not built. Run npm run build:frontend',
      api: 'API is working at /api/*',
      health: 'Check /health for status',
      lookingFor: indexPath,
      dirname: __dirname,
      cwd: process.cwd(),
      files: require('fs').readdirSync(path.join(__dirname, '../..')).slice(0, 10)
    });
  }
});

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

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`Server is listening on http://0.0.0.0:${PORT}`);
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