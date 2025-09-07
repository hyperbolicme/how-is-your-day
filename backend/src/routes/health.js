// src/routes/health.js
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Health check routes
router.get('/health', healthController.healthCheck);
router.get('/test-s3', healthController.testS3);

module.exports = router;