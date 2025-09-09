// src/controllers/healthController.js
const cacheService = require('../services/cacheService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

class HealthController {
  // Basic health check
  async healthCheck(req, res) {
    try {
      const cacheStats = await cacheService.getStats();
      
      res.json({
        success: true,
        message: 'Weather API server is running',
        cacheDir: cacheStats.directory,
        cacheFiles: cacheStats.totalFiles,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Test S3 connectivity
  async testS3(req, res, next) {
    try {
      logger.info('S3 connectivity test request');
      const result = await s3Service.testConnection();
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Basic server info endpoint
  async serverInfo(req, res) {
    const os = require('os');
    
    res.json({
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: os.uptime(),
        port: process.env.PORT || 5001,
        node_version: process.version,
        timestamp: new Date().toISOString()
      },
      network: {
        interfaces: os.networkInterfaces()
      },
      deployment: {
        environment: process.env.NODE_ENV || 'development',
        base_url: process.env.VITE_API_BASE_URL || 'http://localhost:5001'
      }
    });
  }

  // Get external IP address
  async externalIP(req, res) {
    try {
      const fetch = require('node-fetch'); 
      
      // Use multiple services for reliability
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://icanhazip.com',
        'https://ifconfig.me/ip'
      ];
      
      let externalIP = null;
      
      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          if (service.includes('ipify')) {
            const data = await response.json();
            externalIP = data.ip;
          } else {
            externalIP = (await response.text()).trim();
          }
          break; // If successful, break out of loop
        } catch (err) {
          continue; // Try next service
        }
      }
      
      res.json({
        external_ip: externalIP,
        port: process.env.PORT || 5001,
        frontend_url: externalIP ? `http://${externalIP}:${process.env.PORT || 5001}` : null,
        api_base: externalIP ? `http://${externalIP}:${process.env.PORT || 5001}/api` : null,
        checked_at: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get external IP',
        message: error.message
      });
    }
  }

  // AWS EC2 metadata endpoint (only works on EC2 server)
  async ec2Metadata(req, res) {
    try {
      const fetch = require('node-fetch');
      
      // EC2 metadata service endpoint
      const metadataBase = 'http://169.254.169.254/latest/meta-data/';
      
      const [publicIP, privateIP, instanceId, instanceType] = await Promise.all([
        fetch(metadataBase + 'public-ipv4').then(r => r.text()).catch(() => 'N/A'),
        fetch(metadataBase + 'local-ipv4').then(r => r.text()).catch(() => 'N/A'),
        fetch(metadataBase + 'instance-id').then(r => r.text()).catch(() => 'N/A'),
        fetch(metadataBase + 'instance-type').then(r => r.text()).catch(() => 'N/A')
      ]);
      
      res.json({
        aws_metadata: {
          public_ip: publicIP,
          private_ip: privateIP,
          instance_id: instanceId,
          instance_type: instanceType,
          port: process.env.PORT || 5001,
          frontend_url: publicIP !== 'N/A' ? `http://${publicIP}:${process.env.PORT || 5001}` : null,
          api_base: publicIP !== 'N/A' ? `http://${publicIP}:${process.env.PORT || 5001}/api` : null
        },
        is_ec2: publicIP !== 'N/A',
        checked_at: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get AWS metadata',
        message: error.message,
        note: 'This only works on EC2 instances'
      });
    }
  }

  async deploymentStatus(req, res) {
    try {
      const os = require('os');
      const fetch = require('node-fetch');
      
      // Get external IP
      let externalIP = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        externalIP = data.ip;
      } catch (err) {
        // Fallback
        externalIP = 'Unable to determine';
      }
      
      // Get AWS metadata if available
      let awsMetadata = {};
      try {
        const publicIPResponse = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4');
        awsMetadata.public_ip = await publicIPResponse.text();
        awsMetadata.is_ec2 = true;
      } catch {
        awsMetadata.is_ec2 = false;
      }
      
      const port = process.env.PORT || 5001;
      const deploymentIP = awsMetadata.public_ip || externalIP;
      
      res.json({
        deployment: {
          status: 'active',
          platform: awsMetadata.is_ec2 ? 'AWS EC2' : 'Unknown',
          ip_address: deploymentIP,
          port: port,
          frontend_url: `http://${deploymentIP}:${port}`,
          api_base: `http://${deploymentIP}:${port}/api`,
          uptime: os.uptime(),
          node_version: process.version,
          last_checked: new Date().toISOString()
        },
        aws: awsMetadata,
        server: {
          hostname: os.hostname(),
          local_ip: Object.values(os.networkInterfaces())
            .flat()
            .find(i => i.family === 'IPv4' && !i.internal)?.address
        }
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get deployment status',
        message: error.message
      });
    }
  }

}

module.exports = new HealthController();