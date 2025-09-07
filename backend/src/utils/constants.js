// src/utils/constants.js

// API Endpoints
const API_ENDPOINTS = {
    OPENWEATHER: {
      CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
      FORECAST: 'https://api.openweathermap.org/data/2.5/forecast'
    },
    NEWS: {
      NEWSAPI: 'https://newsapi.org/v2/top-headlines',
      GUARDIAN: 'https://content.guardianapis.com/search'
    }
  };
  
  // HTTP Status Codes
  const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502
  };
  
  // Cache Keys
  const CACHE_KEYS = {
    WEATHER: 'weather',
    FORECAST: 'forecast',
    NEWS: 'news',
    GUARDIAN: 'guardian',
    COMBINED: 'combined'
  };
  
  // Error Messages
  const ERROR_MESSAGES = {
    CITY_REQUIRED: 'City parameter is required',
    CITY_INVALID: 'City must be a valid non-empty string',
    CITY_NOT_FOUND: 'City not found',
    COUNTRY_REQUIRED: 'Country parameter is required',
    COUNTRY_INVALID: 'Country must be a valid 2-letter country code (e.g., "us", "in", "gb")',
    WEATHER_SERVICE_ERROR: 'Weather service configuration error',
    WEATHER_SERVICE_UNAVAILABLE: 'Weather service temporarily unavailable',
    NEWS_SERVICE_ERROR: 'News service configuration error',
    NEWS_SERVICE_UNAVAILABLE: 'News service temporarily unavailable',
    NEWS_SERVICE_NOT_CONFIGURED: 'News service not configured',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    INVALID_FILENAME: 'Invalid filename. Must be a .json file',
    REPORT_NOT_FOUND: 'Report not found in S3 or local storage',
    MISSING_API_KEYS: 'Missing required API keys. Please check your environment variables.'
  };
  
  // S3 Configuration
  const S3_CONFIG = {
    BUCKET: 'weather-app-reports-hyperbolicme',
    REPORT_PREFIX: 'reports/default_user/',
    MAX_KEYS: 100
  };
  
  // Default Values
  const DEFAULTS = {
    CITY: 'Kochi',
    COUNTRY: 'IN',
    PAGE_SIZE: 10,
    NEWS_CATEGORY: 'general',
    ORDER_BY: 'relevance'
  };
  
  // Validation Patterns
  const PATTERNS = {
    COUNTRY_CODE: /^[a-z]{2}$/i,
    JSON_FILE: /\.json$/
  };
  
  module.exports = {
    API_ENDPOINTS,
    HTTP_STATUS,
    CACHE_KEYS,
    ERROR_MESSAGES,
    S3_CONFIG,
    DEFAULTS,
    PATTERNS
  };