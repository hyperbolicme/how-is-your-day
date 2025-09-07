// src/utils/logger.js - Updated for test compatibility
const winston = require('winston');
const { config } = require('../config/environment');

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'weather-app' }
});

// Only add file transports in non-test environments
if (config.nodeEnv !== 'test') {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

// In non-production environments, also log to console
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// In test environment, suppress all logging unless explicitly needed
if (config.nodeEnv === 'test') {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

module.exports = logger;