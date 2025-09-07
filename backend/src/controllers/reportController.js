// src/controllers/reportController.js
const reportService = require('../services/reportService');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

class ReportController {
  // Generate new report
  async generateReport(req, res, next) {
    try {
      const { city, country } = req.validatedBody;
      
      logger.info(`Report generation request for: ${city}, ${country}`);
      const result = await reportService.generateReport(city, country);
      
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
}

module.exports = new ReportController();