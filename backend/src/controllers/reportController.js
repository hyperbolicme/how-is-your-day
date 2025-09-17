// src/controllers/reportController.js
const reportService = require('../services/reportService');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

class ReportController {
  // Generate new report
  async generateReport(req, res, next) {
    try {
      const { city, country } = req.validatedBody;
      
      logger.info(`Enhanced report generation request for: ${city}, ${country}`);
      // Use the enhanced version with database integration
      const result = await reportService.generateReportWithDB(city, country);
      
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  // List all reports
  async listReports(req, res, next) {
    try {
      logger.info('List reports request');
      const result = await reportService.listReports();
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get specific report
  async getReport(req, res, next) {
    try {
      const { filename } = req.params;
      
      logger.info(`Get report request for: ${filename}`);
      const result = await reportService.getReport(filename);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Enhanced report generation endpoint
  async generateReportEnhanced(req, res, next) {
    try {
      const { city, country } = req.body;
      const result = await reportService.generateReportWithDB(city, country);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Report statistics endpoint  
  async getReportStats(req, res, next) {
    try {
      const stats = await reportService.getReportStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Reports by city endpoint
  async getReportsByCity(req, res, next) {
    try {
      const { city } = req.params;
      const limit = req.query.limit || 10;
      const reports = await reportService.getReportsByCity(city, limit);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();