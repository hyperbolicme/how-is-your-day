// src/middleware/errorHandler.js
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = HTTP_STATUS.UNAUTHORIZED;
    message = 'Unauthorized access';
  } else if (err.code === 'ENOTFOUND') {
    status = HTTP_STATUS.BAD_GATEWAY;
    message = 'External service unavailable';
  } else if (err.status) {
    status = err.status;
    message = err.message;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler - place this before the general error handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = HTTP_STATUS.NOT_FOUND;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};