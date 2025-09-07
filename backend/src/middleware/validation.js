// src/middleware/validation.js
const validators = require('../utils/validators');
const { HTTP_STATUS } = require('../utils/constants');

// Generic validation middleware factory
const validateRequest = (validationType, source = 'query') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : req.query;
    
    let validation;
    
    switch (validationType) {
      case 'weather':
        validation = validators.validateWeatherQuery(data);
        break;
      case 'forecast':
        validation = validators.validateForecastQuery(data);
        break;
      case 'news':
        validation = validators.validateNewsQuery(data);
        break;
      case 'guardian':
        validation = validators.validateGuardianQuery(data);
        break;
      case 'reportGeneration':
        validation = validators.validateReportGeneration(data);
        break;
      case 'filename':
        const filename = req.params.filename;
        validation = validators.validateFilename(filename);
        break;
      default:
        return next(new Error(`Unknown validation type: ${validationType}`));
    }
    
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: validation.error,
        timestamp: new Date().toISOString()
      });
    }
    
    // Add validated data to request object
    if (source === 'body') {
      req.validatedBody = validation.value;
    } else {
      req.validatedQuery = validation.value;
    }
    
    next();
  };
};

// Specific validation middleware
const validateWeather = validateRequest('weather', 'query');
const validateForecast = validateRequest('forecast', 'query');
const validateNews = validateRequest('news', 'query');
const validateGuardian = validateRequest('guardian', 'query');
const validateReportGeneration = validateRequest('reportGeneration', 'body');
const validateFilename = validateRequest('filename', 'params');

module.exports = {
  validateRequest,
  validateWeather,
  validateForecast,
  validateNews,
  validateGuardian,
  validateReportGeneration,
  validateFilename
};