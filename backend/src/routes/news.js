// src/routes/news.js
const express = require('express');
const newsController = require('../controllers/newsController');
const { validateNews, validateGuardian } = require('../middleware/validation');

const router = express.Router();

// News routes
router.get('/getnews', validateNews, newsController.getNews);
router.get('/getnews-guardian', validateGuardian, newsController.getGuardianNews);
router.get('/getnews-combined', validateNews, newsController.getCombinedNews);

module.exports = router;