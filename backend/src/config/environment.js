// src/config/environment.js
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // API Keys
  weatherApiKey: process.env.WEATHER_API_KEY,
  newsApiKey: process.env.NEWS_API_KEY,
  newsGuardianApiKey: process.env.NEWS_GUARDIAN_API_KEY,
  
  // AWS Configuration
  aws: {
    region: 'ap-south-1',
    s3: {
      bucket: 'weather-app-reports-hyperbolicme'
    }
  },
  
  // Cache configuration
  cache: {
    duration: 30 * 60 * 1000, // 30 minutes
    localDir: 'cache',
    ebsDir: '/mnt/data/cache'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = ['WEATHER_API_KEY'];
  const optionalEnvVars = ['NEWS_API_KEY', 'NEWS_GUARDIAN_API_KEY'];
  
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }
  
  if (missingOptional.length > 0 && config.nodeEnv !== 'test') {
    console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
  
  return true;
}

// Only validate in non-test environments or when specifically needed
if (config.nodeEnv !== 'test') {
  validateEnvironment();
}

module.exports = {
  config,
  validateEnvironment
};