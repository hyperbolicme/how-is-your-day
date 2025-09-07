// src/controllers/weatherController.js
const weatherService = require('../services/weatherService');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

class WeatherController {
  // Get current weather
  async getCurrentWeather(req, res, next) {
    try {
      const { city } = req.validatedQuery;
      
      logger.info(`Weather request for: ${city}`);
      const result = await weatherService.getCurrentWeather(city);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get weather forecast
  async getForecast(req, res, next) {
    try {
      const { city } = req.validatedQuery;
      
      logger.info(`Forecast request for: ${city}`);
      const result = await weatherService.getForecast(city);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WeatherController();