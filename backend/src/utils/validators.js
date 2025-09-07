// src/utils/validators.js
const Joi = require('joi');
const { PATTERNS, ERROR_MESSAGES } = require('./constants');

// Validation schemas
const schemas = {
  city: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': ERROR_MESSAGES.CITY_REQUIRED,
    'any.required': ERROR_MESSAGES.CITY_REQUIRED,
    'string.max': 'City name is too long'
  }),
  
  country: Joi.string().trim().length(2).pattern(PATTERNS.COUNTRY_CODE).required().messages({
    'string.empty': ERROR_MESSAGES.COUNTRY_REQUIRED,
    'any.required': ERROR_MESSAGES.COUNTRY_REQUIRED,
    'string.length': ERROR_MESSAGES.COUNTRY_INVALID,
    'string.pattern.base': ERROR_MESSAGES.COUNTRY_INVALID
  }),
  
  pageSize: Joi.number().integer().min(1).max(50).default(10),
  
  category: Joi.string().valid('business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology').default('general'),
  
  orderBy: Joi.string().valid('relevance', 'newest', 'oldest').default('relevance'),
  
  filename: Joi.string().pattern(PATTERNS.JSON_FILE).required().messages({
    'string.pattern.base': ERROR_MESSAGES.INVALID_FILENAME,
    'any.required': ERROR_MESSAGES.INVALID_FILENAME
  })
};

// Validation functions
const validators = {
  validateCity: (city) => {
    const { error, value } = schemas.city.validate(city);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateCountry: (country) => {
    const { error, value } = schemas.country.validate(country);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateWeatherQuery: (query) => {
    const schema = Joi.object({
      city: schemas.city
    });
    
    const { error, value } = schema.validate(query);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateForecastQuery: (query) => {
    const schema = Joi.object({
      city: schemas.city
    });
    
    const { error, value } = schema.validate(query);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateNewsQuery: (query) => {
    const schema = Joi.object({
      country: schemas.country,
      category: schemas.category,
      pageSize: schemas.pageSize
    });
    
    const { error, value } = schema.validate(query);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateGuardianQuery: (query) => {
    const schema = Joi.object({
      country: schemas.country,
      pageSize: schemas.pageSize,
      orderBy: schemas.orderBy
    });
    
    const { error, value } = schema.validate(query);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateReportGeneration: (body) => {
    const schema = Joi.object({
      city: schemas.city.default('Kochi'),
      country: schemas.country.default('IN')
    });
    
    const { error, value } = schema.validate(body);
    return { isValid: !error, value, error: error?.details[0]?.message };
  },
  
  validateFilename: (filename) => {
    const { error, value } = schemas.filename.validate(filename);
    return { isValid: !error, value, error: error?.details[0]?.message };
  }
};

module.exports = validators;