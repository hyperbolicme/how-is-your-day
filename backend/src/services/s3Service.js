// src/services/s3Service.js
const {
    PutObjectCommand,
    ListObjectsV2Command,
    GetObjectCommand,
  } = require("@aws-sdk/client-s3");
  const fs = require('fs').promises;
  const path = require('path');
  const logger = require('../utils/logger');
  const { s3Client } = require('../config/database');
  const { S3_CONFIG } = require('../utils/constants');
  
  class S3Service {
    constructor() {
      this.s3Client = s3Client;
      this.bucket = S3_CONFIG.BUCKET;
      this.reportPrefix = S3_CONFIG.REPORT_PREFIX;
    }
  
    // Check if AWS access is available
    async hasAWSAccess() {
      try {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 1
        });
        
        await this.s3Client.send(command);
        return true;
      } catch (error) {
        logger.debug('⚠️ AWS credentials not available, will save locally');
        logger.debug('AWS Error:', error.message);
        return false;
      }
    }
  
    // Save report to S3
    async saveReport(report, fileName) {
      try {
        logger.debug('☁️ Saving to S3 with AWS SDK v3...');
        const s3Key = `${this.reportPrefix}${fileName}`;
        
        const putCommand = new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
          Body: JSON.stringify(report, null, 2),
          ContentType: 'application/json',
          Metadata: {
            'generated-by': 'weather-app',
            'city': report.metadata?.city || 'unknown',
            'date': report.metadata?.date || 'unknown'
          }
        });
        
        await this.s3Client.send(putCommand);
        logger.info('✅ Report saved to S3 successfully!');
        
        return {
          success: true,
          location: 'S3',
          s3_key: s3Key,
          bucket: this.bucket
        };
        
      } catch (error) {
        logger.error('❌ S3 save failed:', error.message);
        throw error;
      }
    }
  
    // List all reports from S3
    async listReports() {
      try {
        logger.debug('☁️ Listing reports from S3...');
        
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.reportPrefix,
          MaxKeys: S3_CONFIG.MAX_KEYS
        });
        
        const result = await this.s3Client.send(command);
        
        if (!result.Contents || result.Contents.length === 0) {
          return {
            reports: [],
            total_count: 0,
            storage_location: 'S3'
          };
        }
        
        // Transform S3 objects to report list
        const reports = result.Contents
          .filter(obj => obj.Key.endsWith('.json') && obj.Key !== this.reportPrefix)
          .map(obj => {
            const filename = obj.Key.split('/').pop();
            
            // Parse filename to extract info: cityname-YYYY-MM-DD-timestamp.json
            const parts = filename.replace('.json', '').split('-');
            let city = 'Unknown';
            let date = 'Unknown';
            
            if (parts.length >= 4) {
              const day = parts[parts.length - 2];
              const month = parts[parts.length - 3];
              const year = parts[parts.length - 4];
              city = parts.slice(0, parts.length - 4).join('-');
              date = `${year}-${month}-${day}`;
            }
            
            return {
              filename: filename,
              s3_key: obj.Key,
              city: city,
              date: date,
              size: obj.Size,
              created_at: obj.LastModified.toISOString(),
              storage: 'S3'
            };
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        logger.info(`✅ Found ${reports.length} reports in S3`);
        
        return {
          reports: reports,
          total_count: reports.length,
          storage_location: 'S3'
        };
        
      } catch (error) {
        logger.error('❌ S3 list failed:', error.message);
        throw error;
      }
    }
  
    // Get specific report from S3
    async getReport(filename) {
      try {
        logger.debug('☁️ Fetching report from S3...');
        
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: `${this.reportPrefix}${filename}`
        });
        
        const result = await this.s3Client.send(command);
        
        // Convert stream to string
        const chunks = [];
        for await (const chunk of result.Body) {
          chunks.push(chunk);
        }
        const reportData = Buffer.concat(chunks).toString('utf-8');
        const report = JSON.parse(reportData);
        
        logger.info('✅ Report fetched from S3');
        
        return {
          success: true,
          data: {
            filename: filename,
            storage_location: 'S3',
            s3_key: `${this.reportPrefix}${filename}`,
            size: result.ContentLength,
            last_modified: result.LastModified?.toISOString(),
            content_type: result.ContentType,
            report: report
          }
        };
        
      } catch (error) {
        logger.error('❌ S3 fetch failed:', error.message);
        throw error;
      }
    }
  
    // Save report locally when AWS isn't available
    async saveReportLocally(report, fileName) {
      try {
        const reportsDir = path.join(__dirname, '../../local-reports');
        
        // Create directory if it doesn't exist
        try {
          await fs.access(reportsDir);
        } catch {
          await fs.mkdir(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        
        logger.info('✅ Report saved locally');
        
        return {
          success: true,
          location: 'Local',
          local_path: filePath,
          note: 'AWS credentials not available - saved to local filesystem'
        };
      } catch (error) {
        throw new Error(`Failed to save report locally: ${error.message}`);
      }
    }
  
    // List local reports
    async listLocalReports() {
      try {
        const reportsDir = path.join(__dirname, '../../local-reports');
        
        // Check if directory exists
        try {
          await fs.access(reportsDir);
        } catch {
          return []; // Directory doesn't exist, no reports
        }
        
        const files = await fs.readdir(reportsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const reports = await Promise.all(
          jsonFiles.map(async (filename) => {
            try {
              const filePath = path.join(reportsDir, filename);
              const stats = await fs.stat(filePath);
              
              // Parse filename to extract info
              const parts = filename.replace('.json', '').split('-');
              let city = 'Unknown';
              let date = 'Unknown';
              
              if (parts.length >= 4) {
                const day = parts[parts.length - 2];
                const month = parts[parts.length - 3];
                const year = parts[parts.length - 4];
                city = parts.slice(0, parts.length - 3).join('-');
                date = `${year}-${month}-${day}`;
              }
              
              return {
                filename: filename,
                local_path: filePath,
                city: city,
                date: date,
                size: stats.size,
                created_at: stats.mtime.toISOString(),
                storage: 'Local'
              };
            } catch (fileError) {
              logger.error(`Error processing file ${filename}:`, fileError);
              return null;
            }
          })
        );
        
        return reports
          .filter(report => report !== null) // Remove failed files
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first
        
      } catch (error) {
        logger.error('Error getting local reports:', error);
        return [];
      }
    }
  
    // Get local report
    async getLocalReport(filename) {
      try {
        logger.debug('💾 Trying to fetch from local storage...');
        
        const localPath = path.join(__dirname, '../../local-reports', filename);
        
        // Check if file exists
        await fs.access(localPath);
        
        // Get file stats
        const stats = await fs.stat(localPath);
        
        // Read file content
        const reportData = await fs.readFile(localPath, 'utf8');
        const report = JSON.parse(reportData);
        
        logger.info('✅ Report fetched from local storage');
        
        return {
          success: true,
          data: {
            filename: filename,
            storage_location: 'Local',
            local_path: localPath,
            size: stats.size,
            last_modified: stats.mtime.toISOString(),
            report: report
          }
        };
        
      } catch (error) {
        logger.error('❌ Local storage fetch failed:', error.message);
        throw error;
      }
    }
  
    // Test S3 connectivity
    async testConnection() {
      try {
        logger.debug('🧪 Testing S3 connectivity with AWS SDK v3...');
        
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 10
        });
        
        const result = await this.s3Client.send(command);
        
        return {
          success: true,
          message: 'S3 connection successful with AWS SDK v3!',
          bucket: this.bucket,
          objects_count: result.Contents?.length || 0,
          objects: result.Contents?.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            last_modified: obj.LastModified
          })) || []
        };
        
      } catch (error) {
        logger.error('❌ S3 connectivity test failed:', error);
        throw new Error(`S3 connection failed: ${error.message}`);
      }
    }
  }
  
  module.exports = new S3Service();