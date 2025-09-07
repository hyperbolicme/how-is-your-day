// src/services/cacheService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { getCacheDirectory } = require('../config/database');
const { config } = require('../config/environment');

class CacheService {
  constructor() {
    this.cacheDir = null;
    this.cacheDuration = config.cache.duration;
  }

  async initialize() {
    try {
      this.cacheDir = getCacheDirectory();
      await fs.access(this.cacheDir);
      logger.info('Cache directory exists:', this.cacheDir);
    } catch (error) {
      logger.info('Creating cache directory:', this.cacheDir);
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  // Generate cache key
  generateKey(type, params) {
    const paramString = JSON.stringify(params);
    const hash = crypto.createHash('md5').update(paramString).digest('hex');
    return `${type}_${hash}.json`;
  }

  // Read from cache
  async get(key) {
    try {
      if (!this.cacheDir) {
        await this.initialize();
      }

      const filePath = path.join(this.cacheDir, key);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Check if cache is expired
      if (Date.now() > parsed.expiresAt) {
        logger.debug(`Cache expired for key: ${key}`);
        await this.delete(key);
        return null;
      }
      
      logger.debug(`Cache hit for key: ${key}`);
      return parsed.data;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Cache read error:', error);
      }
      return null;
    }
  }

  // Write to cache
  async set(key, data) {
    try {
      if (!this.cacheDir) {
        await this.initialize();
      }

      const cacheData = {
        data,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.cacheDuration
      };
      
      const filePath = path.join(this.cacheDir, key);
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
      logger.debug(`Cache written for key: ${key} (30 min TTL)`);
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  // Delete cache entry
  async delete(key) {
    try {
      if (!this.cacheDir) {
        await this.initialize();
      }

      const filePath = path.join(this.cacheDir, key);
      await fs.unlink(filePath);
      logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Cache delete error:', error);
      }
    }
  }

  // Clear all cache
  async clear() {
    try {
      if (!this.cacheDir) {
        await this.initialize();
      }

      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      await Promise.all(
        jsonFiles.map(file => this.delete(file))
      );
      
      logger.info(`Cleared ${jsonFiles.length} cache entries`);
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.cacheDir) {
        await this.initialize();
      }

      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const stats = {
        totalFiles: jsonFiles.length,
        directory: this.cacheDir,
        cacheDuration: this.cacheDuration
      };

      return stats;
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        totalFiles: 0,
        directory: this.cacheDir,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new CacheService();