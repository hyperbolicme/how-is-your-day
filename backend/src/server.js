// src/server.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configurations
const { config } = require('./config/environment');
const { initializeCacheDirectory } = require('./config/database');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Import utilities
const logger = require('./utils/logger');

const app = express();
const PORT = config.port;

// Security middleware
if (config.nodeEnv === 'production') {
    // Production: Full Helmet security (assumes HTTPS)
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));
} else {
    // Development: Relaxed Helmet (allows HTTP)
    app.use(helmet({
        contentSecurityPolicy: false,
        hsts: false, // Don't force HTTPS in development
        crossOriginEmbedderPolicy: false
    }));
}


// // Rate limiting (only in production)
if (config.nodeEnv === 'production') {
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      }
    });
    app.use('/api/', limiter);
}

// CORS middleware
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build 
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Mount all routes
app.use(routes);

// Handle React routing (only in production)
if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize cache directory
    await initializeCacheDirectory();
    
    app.listen(PORT, () => {
      logger.info(`🌤️ Weather API server running on port ${PORT}`);
      logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🌡️ Weather endpoint: http://localhost:${PORT}/api/getweather?city=<cityname>`);
      logger.info(`🗂️ Environment: ${config.nodeEnv}`);
      
      if (config.nodeEnv === 'production') {
        logger.info(`🌐 Frontend: http://localhost:${PORT}/`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;