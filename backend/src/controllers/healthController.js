// src/controllers/healthController.js
const cacheService = require('../services/cacheService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

class HealthController {
  // Basic health check
  async healthCheck(req, res) {
    try {
      const cacheStats = await cacheService.getStats();
      
      res.json({
        success: true,
        message: 'Weather API server is running',
        cacheDir: cacheStats.directory,
        cacheFiles: cacheStats.totalFiles,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Test S3 connectivity
  async testS3(req, res, next) {
    try {
      logger.info('S3 connectivity test request');
      const result = await s3Service.testConnection();
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HealthController();