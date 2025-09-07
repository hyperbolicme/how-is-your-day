// src/services/weatherService.js
const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const { config } = require('../config/environment');
const { API_ENDPOINTS, HTTP_STATUS, CACHE_KEYS, ERROR_MESSAGES } = require('../utils/constants');

class WeatherService {
  constructor() {
    this.apiKey = config.weatherApiKey;
  }

  // Get current weather data
  async getCurrentWeather(city) {
    try {
      // Check cache first
      const cacheKey = cacheService.generateKey(CACHE_KEYS.WEATHER, { city });
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Weather cache hit for: ${city}`);
        return cachedData;
      }

      // Make API call
      const url = `${API_ENDPOINTS.OPENWEATHER.CURRENT}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
      
      logger.debug(`Fetching weather for: ${city}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleWeatherApiError(response);
      }

      const weatherData = await response.json();

      // Transform response
      const responseData = {
        success: true,
        data: {
          city: weatherData.name,
          country: weatherData.sys.country,
          temperature: Math.round(weatherData.main.temp),
          feelsLike: Math.round(weatherData.main.feels_like),
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          sunrise: weatherData.sys.sunrise,
          sunset: weatherData.sys.sunset,
          coords: {
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
          },
          raw: weatherData
        },
        timestamp: new Date().toISOString()
      };

      // Cache the response
      await cacheService.set(cacheKey, responseData);

      return responseData;

    } catch (error) {
      logger.error('Weather API Error:', error);
      throw error;
    }
  }

  // Get weather forecast
  async getForecast(city) {
    try {
      // Check cache first
      const cacheKey = cacheService.generateKey(CACHE_KEYS.FORECAST, { city });
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Forecast cache hit for: ${city}`);
        return cachedData;
      }

      // Make API call
      const url = `${API_ENDPOINTS.OPENWEATHER.FORECAST}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
      
      logger.debug(`Fetching forecast for: ${city}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleWeatherApiError(response);
      }

      const forecastData = await response.json();

      // Filter to get daily forecasts (12:00 PM entries)
      const dailyForecasts = forecastData.list.filter(item => 
        item.dt_txt.includes('12:00:00')
      );

      const responseData = {
        success: true,
        data: {
          city: forecastData.city.name,
          country: forecastData.city.country,
          forecasts: dailyForecasts.map(day => ({
            date: day.dt_txt,
            temperature: Math.round(day.main.temp),
            humidity: day.main.humidity,
            windSpeed: day.wind.speed,
            description: day.weather[0].description,
            icon: day.weather[0].icon
          })),
          raw: forecastData
        },
        timestamp: new Date().toISOString()
      };

      // Cache the response
      await cacheService.set(cacheKey, responseData);

      return responseData;

    } catch (error) {
      logger.error('Forecast API Error:', error);
      throw error;
    }
  }

  // Handle weather API errors
  handleWeatherApiError(response) {
    const error = new Error();
    
    switch (response.status) {
      case HTTP_STATUS.NOT_FOUND:
        error.status = HTTP_STATUS.NOT_FOUND;
        error.message = ERROR_MESSAGES.CITY_NOT_FOUND;
        break;
      case HTTP_STATUS.UNAUTHORIZED:
        error.status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        error.message = ERROR_MESSAGES.WEATHER_SERVICE_ERROR;
        break;
      default:
        error.status = HTTP_STATUS.BAD_GATEWAY;
        error.message = ERROR_MESSAGES.WEATHER_SERVICE_UNAVAILABLE;
        break;
    }
    
    return error;
  }
}

module.exports = new WeatherService();