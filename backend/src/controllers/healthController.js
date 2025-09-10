// src/controllers/healthController.js
const cacheService = require('../services/cacheService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

class HealthController {
  // IMDSv2 helper functions
  getIMDSToken = async () => {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://169.254.169.254/latest/api/token', {
        method: 'PUT',
        headers: {
          'X-aws-ec2-metadata-token-ttl-seconds': '21600'
        },
        timeout: 2000
      });
      
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  getMetadata = async (endpoint) => {
    try {
      const token = await this.getIMDSToken();
      if (!token) return null;

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://169.254.169.254/latest/meta-data/${endpoint}`, {
        headers: {
          'X-aws-ec2-metadata-token': token
        },
        timeout: 2000
      });

      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Basic health check
  healthCheck = async (req, res) => {
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
  testS3 = async (req, res, next) => {
    try {
      logger.info('S3 connectivity test request');
      const result = await s3Service.testConnection();
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Enhanced server info endpoint with IMDSv2
  serverInfo = async (req, res) => {
    const os = require('os');
    
    // Get AWS metadata using IMDSv2
    const instanceId = await this.getMetadata('instance-id');
    const instanceType = await this.getMetadata('instance-type');
    const availabilityZone = await this.getMetadata('placement/availability-zone');
    
    res.json({
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: os.uptime(),
        port: process.env.PORT || 5001,
        node_version: process.version,
        timestamp: new Date().toISOString()
      },
      aws: {
        instance_id: instanceId || 'Not available',
        instance_type: instanceType || 'Not available',
        availability_zone: availabilityZone || 'Not available',
        is_ec2: !!instanceId
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
  externalIP = async (req, res) => {
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

  // AWS EC2 metadata endpoint with IMDSv2 (only works on EC2 server)
  ec2Metadata = async (req, res) => {
    try {
      // Get all metadata using IMDSv2
      const [publicIP, privateIP, instanceId, instanceType, availabilityZone] = await Promise.all([
        this.getMetadata('public-ipv4'),
        this.getMetadata('local-ipv4'),
        this.getMetadata('instance-id'),
        this.getMetadata('instance-type'),
        this.getMetadata('placement/availability-zone')
      ]);
      
      const port = process.env.PORT || 5001;
      
      res.json({
        aws_metadata: {
          public_ip: publicIP || 'N/A',
          private_ip: privateIP || 'N/A',
          instance_id: instanceId || 'N/A',
          instance_type: instanceType || 'N/A',
          availability_zone: availabilityZone || 'N/A',
          port: port,
          frontend_url: publicIP ? `http://${publicIP}:${port}` : null,
          api_base: publicIP ? `http://${publicIP}:${port}/api` : null
        },
        is_ec2: !!instanceId,
        metadata_version: 'IMDSv2',
        checked_at: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get AWS metadata',
        message: error.message,
        note: 'This endpoint uses IMDSv2 and only works on EC2 instances'
      });
    }
  }

  // Enhanced deployment status with IMDSv2
  deploymentStatus = async (req, res) => {
    try {
      const os = require('os');
      const fetch = (await import('node-fetch')).default;
      
      // Get external IP
      let externalIP = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        externalIP = data.ip;
      } catch (err) {
        externalIP = 'Unable to determine';
      }
      
      // Get AWS metadata using IMDSv2
      const [instanceId, publicIP, instanceType, availabilityZone] = await Promise.all([
        this.getMetadata('instance-id'),
        this.getMetadata('public-ipv4'),
        this.getMetadata('instance-type'),
        this.getMetadata('placement/availability-zone')
      ]);
      
      const awsMetadata = {
        is_ec2: !!instanceId,
        instance_id: instanceId || 'N/A',
        public_ip: publicIP || null,
        instance_type: instanceType || 'N/A',
        availability_zone: availabilityZone || 'N/A',
        metadata_version: 'IMDSv2'
      };
      
      const port = process.env.PORT || 5001;
      const deploymentIP = publicIP || externalIP;
      
      res.json({
        deployment: {
          status: 'active',
          platform: awsMetadata.is_ec2 ? 'AWS EC2' : 'Unknown Platform',
          ip_address: deploymentIP,
          port: port,
          frontend_url: deploymentIP !== 'Unable to determine' ? `http://${deploymentIP}:${port}` : 'Unable to determine',
          api_base: deploymentIP !== 'Unable to determine' ? `http://${deploymentIP}:${port}/api` : 'Unable to determine',
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