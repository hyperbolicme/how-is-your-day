// src/routes/reports.js
const express = require('express');
const reportController = require('../controllers/reportController');
const { validateReportGeneration, validateFilename } = require('../middleware/validation');

const router = express.Router();

// Report routes
router.post('/generate-report', validateReportGeneration, reportController.generateReport);
router.get('/my-reports', reportController.listReports);
router.get('/report/:filename', validateFilename, reportController.getReport);

module.exports = router;