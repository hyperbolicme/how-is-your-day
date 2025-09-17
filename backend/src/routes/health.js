// src/routes/health.js
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Health check routes
router.get('/health', healthController.healthCheck);
router.get('/test-s3', healthController.testS3);
router.get('/database-health', healthController.databaseHealth);

// Server info routes
router.get('/server-info', healthController.serverInfo);
router.get('/external-ip', healthController.externalIP);
router.get('/aws-metadata', healthController.ec2Metadata);
router.get('/deployment-status', healthController.deploymentStatus);

module.exports = router;