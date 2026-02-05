import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Global error handling middleware
 * This catches all errors thrown in the application
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    url: req.url,
    error: err.stack,
  });
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Specific error handling
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { 
      error: err.message,
      stack: err.stack 
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
