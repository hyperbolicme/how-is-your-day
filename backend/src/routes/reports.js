// src/routes/reports.js
const express = require('express');
const reportController = require('../controllers/reportController');
const { validateReportGeneration, validateFilename } = require('../middleware/validation');

const router = express.Router();

// Report routes
router.post('/generate-report', validateReportGeneration, reportController.generateReport);
router.get('/my-reports', reportController.listReports);
router.get('/report/:filename', validateFilename, reportController.getReport);
router.post('/generate-report-enhanced', validateReportGeneration, reportController.generateReportEnhanced);
router.get('/stats', reportController.getReportStats);
router.get('/by-city/:city', reportController.getReportsByCity);

module.exports = router;