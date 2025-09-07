// src/config/database.js
const { S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { config } = require('./environment');

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

module.exports = {
  s3Client,
  getCacheDirectory,
  initializeCacheDirectory
};