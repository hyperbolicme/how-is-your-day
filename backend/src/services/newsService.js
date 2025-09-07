// src/services/newsService.js
const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const { config } = require('../config/environment');
const { API_ENDPOINTS, HTTP_STATUS, CACHE_KEYS, ERROR_MESSAGES } = require('../utils/constants');

class NewsService {
  constructor() {
    this.newsApiKey = config.newsApiKey;
    this.guardianApiKey = config.newsGuardianApiKey;
  }

  // Get news from NewsAPI.org
  async getNews(country, category = 'general', pageSize = 10) {
    try {
      if (!this.newsApiKey) {
        throw new Error(ERROR_MESSAGES.NEWS_SERVICE_NOT_CONFIGURED);
      }

      // Check cache first
      const cacheKey = cacheService.generateKey(CACHE_KEYS.NEWS, { country, category, pageSize });
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`News cache hit for: ${country}`);
        return cachedData;
      }

      const url = `${API_ENDPOINTS.NEWS.NEWSAPI}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${this.newsApiKey}`;

      logger.debug(`Fetching news for country: ${country}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleNewsApiError(response);
      }

      const newsData = await response.json();

      if (newsData.status !== 'ok') {
        throw new Error(ERROR_MESSAGES.NEWS_SERVICE_UNAVAILABLE);
      }

      // Transform and filter articles
      const articles = newsData.articles
        .filter(article => article.title && article.title !== '[Removed]')
        .map((article, index) => ({
          id: `newsapi_${index}_${Date.now()}`,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source.name,
          author: article.author
        }));

      const responseData = {
        success: true,
        data: {
          country: country.toUpperCase(),
          category,
          totalResults: newsData.totalResults,
          articles,
          raw: newsData
        },
        timestamp: new Date().toISOString()
      };

      // Cache the response
      await cacheService.set(cacheKey, responseData);

      return responseData;

    } catch (error) {
      logger.error('News API Error:', error);
      throw error;
    }
  }

  // Get news from Guardian API
  async getGuardianNews(country, pageSize = 10, orderBy = 'relevance') {
    try {
      if (!this.guardianApiKey) {
        throw new Error(ERROR_MESSAGES.NEWS_SERVICE_NOT_CONFIGURED);
      }

      // Check cache first
      const cacheKey = cacheService.generateKey(CACHE_KEYS.GUARDIAN, { country, pageSize, orderBy });
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Guardian news cache hit for: ${country}`);
        return cachedData;
      }

      // Convert country code to country name for Guardian API
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      let countryName;
      
      try {
        countryName = regionNames.of(country);
      } catch (error) {
        throw new Error(ERROR_MESSAGES.COUNTRY_INVALID);
      }

      const url = `${API_ENDPOINTS.NEWS.GUARDIAN}?q=${encodeURIComponent(countryName)}&api-key=${this.guardianApiKey}&show-fields=thumbnail,trailText&order-by=${orderBy}&page-size=${pageSize}`;

      logger.debug(`Fetching Guardian news for: ${countryName} (${country})`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleGuardianApiError(response);
      }

      const guardianData = await response.json();

      if (guardianData.response.status !== 'ok') {
        throw new Error(ERROR_MESSAGES.NEWS_SERVICE_UNAVAILABLE);
      }

      // Transform Guardian articles
      const articles = guardianData.response.results.map((article) => ({
        id: article.id,
        title: article.webTitle,
        description: article.fields?.trailText || null,
        url: article.webUrl,
        imageUrl: article.fields?.thumbnail || null,
        publishedAt: article.webPublicationDate,
        source: 'The Guardian',
        section: article.sectionName
      }));

      const responseData = {
        success: true,
        data: {
          country: country,
          countryName,
          totalResults: guardianData.response.total,
          articles,
          raw: guardianData
        },
        timestamp: new Date().toISOString()
      };

      // Cache the response
      await cacheService.set(cacheKey, responseData);

      return responseData;

    } catch (error) {
      logger.error('Guardian News API Error:', error);
      throw error;
    }
  }

  // Get combined news (tries Guardian first, falls back to NewsAPI)
  async getCombinedNews(country, pageSize = 10) {
    try {
      // Check cache first for combined endpoint
      const cacheKey = cacheService.generateKey(CACHE_KEYS.COMBINED, { country, pageSize });
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Combined news cache hit for: ${country}`);
        return cachedData;
      }

      // Try Guardian API first
      try {
        const guardianData = await this.getGuardianNews(country, pageSize);
        if (guardianData.success && guardianData.data.articles.length > 0) {
          // Add source indicator
          guardianData.data.source = 'guardian';
          // Cache the combined result
          await cacheService.set(cacheKey, guardianData);
          return guardianData;
        }
      } catch (guardianError) {
        logger.debug('Guardian API failed, trying NewsAPI...', guardianError.message);
      }

      // Fallback to NewsAPI
      try {
        const newsApiData = await this.getNews(country, 'general', pageSize);
        if (newsApiData.success) {
          // Add source indicator
          newsApiData.data.source = 'newsapi';
          // Cache the combined result
          await cacheService.set(cacheKey, newsApiData);
          return newsApiData;
        }
      } catch (newsApiError) {
        logger.debug('NewsAPI also failed:', newsApiError.message);
      }

      // Both failed
      throw new Error('All news services are temporarily unavailable');

    } catch (error) {
      logger.error('Combined News API Error:', error);
      throw error;
    }
  }

  // Handle news API errors
  handleNewsApiError(response) {
    const error = new Error();
    
    switch (response.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        error.status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        error.message = ERROR_MESSAGES.NEWS_SERVICE_ERROR;
        break;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        error.status = HTTP_STATUS.TOO_MANY_REQUESTS;
        error.message = ERROR_MESSAGES.TOO_MANY_REQUESTS;
        break;
      default:
        error.status = HTTP_STATUS.BAD_GATEWAY;
        error.message = ERROR_MESSAGES.NEWS_SERVICE_UNAVAILABLE;
        break;
    }
    
    return error;
  }

  // Handle Guardian API errors
  handleGuardianApiError(response) {
    const error = new Error();
    
    switch (response.status) {
      case HTTP_STATUS.UNAUTHORIZED:
      case HTTP_STATUS.FORBIDDEN:
        error.status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        error.message = ERROR_MESSAGES.NEWS_SERVICE_ERROR;
        break;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        error.status = HTTP_STATUS.TOO_MANY_REQUESTS;
        error.message = ERROR_MESSAGES.TOO_MANY_REQUESTS;
        break;
      default:
        error.status = HTTP_STATUS.BAD_GATEWAY;
        error.message = ERROR_MESSAGES.NEWS_SERVICE_UNAVAILABLE;
        break;
    }
    
    return error;
  }
}

module.exports = new NewsService();