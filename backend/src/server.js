import app from './app.js';
import config from './config/env.js';
import pool from './config/database.js';
import logger from './utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('✓ Database connection established');

    // Start listening
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(` EcoTrip Backend Server`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Port: ${PORT}`);
      logger.info(`Server URL: http://localhost:${PORT}`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info('='.repeat(50));
      
      if (config.env === 'development') {
        logger.info('\n Available endpoints:');
        logger.info('  POST   /api/auth/register');
        logger.info('  POST   /api/auth/login');
        logger.info('  GET    /api/auth/me');
        logger.info('  POST   /api/trips/generate');
        logger.info('  GET    /api/trips');
        logger.info('  GET    /api/trips/:id');
        logger.info('  GET    /api/stats/dashboard');
        logger.info('  GET    /api/admin/users');
        logger.info('  GET    /api/admin/emission-factors');
        logger.info('');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await pool.end();
    logger.info('✓ Database connection closed');
    
    logger.info('✓ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
