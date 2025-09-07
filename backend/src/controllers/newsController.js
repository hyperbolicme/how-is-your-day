// src/controllers/newsController.js
const newsService = require('../services/newsService');
const logger = require('../utils/logger');

class NewsController {
  // Get news from NewsAPI
  async getNews(req, res, next) {
    try {
      const { country, category, pageSize } = req.validatedQuery;
      
      logger.info(`News request for country: ${country}`);
      const result = await newsService.getNews(country, category, pageSize);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get news from Guardian API
  async getGuardianNews(req, res, next) {
    try {
      const { country, pageSize, orderBy } = req.validatedQuery;
      
      logger.info(`Guardian news request for country: ${country}`);
      const result = await newsService.getGuardianNews(country, pageSize, orderBy);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get combined news (Guardian + NewsAPI fallback)
  async getCombinedNews(req, res, next) {
    try {
      const { country, pageSize } = req.validatedQuery;
      
      logger.info(`Combined news request for country: ${country}`);
      const result = await newsService.getCombinedNews(country, pageSize);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewsController();