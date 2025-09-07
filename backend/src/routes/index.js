// src/routes/index.js
const express = require('express');
const weatherRoutes = require('./weather');
const newsRoutes = require('./news');
const reportRoutes = require('./reports');
const healthRoutes = require('./health');

const router = express.Router();

// Mount all route modules
router.use('/api', weatherRoutes);
router.use('/api', newsRoutes);
router.use('/api', reportRoutes);
router.use('/api', healthRoutes);

module.exports = router;