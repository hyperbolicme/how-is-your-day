// src/config/database.js
const { S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { config } = require('./environment');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region
});

// Determine cache directory
function getCacheDirectory() {
  let cacheDir;
  
  if (config.nodeEnv === 'production' || fs.existsSync('/mnt/data')) {
    cacheDir = config.cache.ebsDir;
    console.log('Using EBS cache directory:', cacheDir);
  } else {
    cacheDir = path.join(__dirname, '../../', config.cache.localDir);
    console.log('Using local cache directory:', cacheDir);
  }
  
  return cacheDir;
}

// Initialize cache directory
async function initializeCacheDirectory() {
  const cacheDir = getCacheDirectory();
  
  try {
    await fs.promises.access(cacheDir);
    console.log('Cache directory exists:', cacheDir);
  } catch (error) {
    console.log('Creating cache directory:', cacheDir);
    await fs.promises.mkdir(cacheDir, { recursive: true });
  }
  
  return cacheDir;
}

// Database configuration
const dbConfig = {
  host: process.env.RDS_HOST || 'your-rds-endpoint.ap-south-1.rds.amazonaws.com',
  user: process.env.RDS_USER || 'admin',
  password: process.env.RDS_PASSWORD || 'your-password',
  database: process.env.RDS_DATABASE || 'weatherapp',
  port: process.env.RDS_PORT || 3306,
  charset: 'utf8mb4',
  timezone: 'Z',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // AWS RDS uses SSL by default
  }
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    logger.info('Testing RDS connection...');
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();
    
    logger.info('✅ RDS connection successful');
    return { success: true, message: 'Database connected successfully' };
  } catch (error) {
    logger.error('❌ RDS connection failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Initialize database schema
async function initializeDatabase() {
  try {
    logger.info('Initializing database schema...');
    
    // Create database if it doesn't exist
    const connection = await pool.getConnection();
    
    // Create weather_reports table for S3 report metadata
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS weather_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        city VARCHAR(100) NOT NULL,
        report_date DATE NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        file_size INT,
        temperature DECIMAL(5,2),
        weather_condition VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_city (city),
        INDEX idx_date (report_date),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Create city_searches table for popular cities tracking
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS city_searches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        city VARCHAR(100) NOT NULL,
        search_count INT DEFAULT 1,
        last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_city (city)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Create app_config table for application settings
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_config (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value TEXT,
        config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Insert default configuration
    await connection.execute(`
      INSERT IGNORE INTO app_config (config_key, config_value, config_type, description) 
      VALUES 
      ('default_city', 'Kochi', 'string', 'Default city for new users'),
      ('reports_retention_days', '365', 'number', 'Number of days to keep weather reports'),
      ('enable_analytics', 'true', 'boolean', 'Enable usage analytics tracking')
    `);
    
    connection.release();
    logger.info('✅ Database schema initialized successfully');
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Database service class
class DatabaseService {
  constructor() {
    this.pool = pool;
  }
  
  async getConnection() {
    return await this.pool.getConnection();
  }
  
  async executeQuery(query, params = []) {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.execute(query, params);
      return results;
    } finally {
      connection.release();
    }
  }
  
  async executeTransaction(queries) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  async close() {
    await this.pool.end();
  }
}

// Export database service instance
const dbService = new DatabaseService();

module.exports = {
  s3Client,
  getCacheDirectory,
  initializeCacheDirectory,
  pool,
  dbService,
  testConnection,
  initializeDatabase,
  dbConfig
};