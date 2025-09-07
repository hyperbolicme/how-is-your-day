// tests/unit/healthController.test.js - Complete Health Controller Test
// Mock the services
jest.mock('../../src/services/cacheService', () => ({
    getStats: jest.fn()
  }));
  
  jest.mock('../../src/services/s3Service', () => ({
    testConnection: jest.fn()
  }));
  
  const healthController = require('../../src/controllers/healthController');
  const cacheService = require('../../src/services/cacheService');
  const s3Service = require('../../src/services/s3Service');
  
  describe('HealthController', () => {
    let req, res, next;
  
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock Express req, res, next
      req = {};
      res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };
      next = jest.fn();
    });
  
    describe('healthCheck', () => {
      it('should return health status successfully', async () => {
        // Setup
        const mockCacheStats = {
          totalFiles: 5,
          directory: '/test/cache',
          cacheDuration: 1800000
        };
        
        cacheService.getStats.mockResolvedValue(mockCacheStats);
        
        // Mock process.uptime
        const originalUptime = process.uptime;
        process.uptime = jest.fn(() => 3600); // 1 hour uptime
        
        // Execute
        await healthController.healthCheck(req, res);
        
        // Assert
        expect(cacheService.getStats).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Weather API server is running',
          cacheDir: '/test/cache',
          cacheFiles: 5,
          timestamp: expect.any(String),
          environment: 'test',
          uptime: 3600
        });
        expect(res.status).not.toHaveBeenCalled(); // Should be 200 by default
        
        // Restore original uptime
        process.uptime = originalUptime;
      });
  
      it('should handle cache stats errors gracefully', async () => {
        // Setup
        const cacheError = new Error('Cache directory not accessible');
        cacheService.getStats.mockRejectedValue(cacheError);
        
        // Execute
        await healthController.healthCheck(req, res);
        
        // Assert
        expect(cacheService.getStats).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Health check failed',
          error: 'Cache directory not accessible',
          timestamp: expect.any(String)
        });
      });
  
      it('should include correct environment and timestamp', async () => {
        // Setup
        const mockCacheStats = {
          totalFiles: 0,
          directory: '/empty/cache',
          cacheDuration: 1800000
        };
        
        cacheService.getStats.mockResolvedValue(mockCacheStats);
        
        // Execute
        await healthController.healthCheck(req, res);
        
        // Assert
        const response = res.json.mock.calls[0][0];
        expect(response.environment).toBe('test');
        expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
        expect(typeof response.uptime).toBe('number');
      });
    });
  
    describe('testS3', () => {
      it('should return S3 connection test results successfully', async () => {
        // Setup
        const mockS3Response = {
          success: true,
          message: 'S3 connection successful with AWS SDK v3!',
          bucket: 'weather-app-reports-hyperbolicme',
          objects_count: 3,
          objects: [
            {
              key: 'reports/default_user/test1.json',
              size: 1024,
              last_modified: '2025-09-07T10:00:00Z'
            },
            {
              key: 'reports/default_user/test2.json',
              size: 2048,
              last_modified: '2025-09-07T11:00:00Z'
            },
            {
              key: 'reports/default_user/test3.json',
              size: 1536,
              last_modified: '2025-09-07T12:00:00Z'
            }
          ]
        };
        
        s3Service.testConnection.mockResolvedValue(mockS3Response);
        
        // Execute
        await healthController.testS3(req, res, next);
        
        // Assert
        expect(s3Service.testConnection).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockS3Response);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle S3 connection errors', async () => {
        // Setup
        const s3Error = new Error('S3 connection failed: Access denied');
        
        s3Service.testConnection.mockRejectedValue(s3Error);
        
        // Execute
        await healthController.testS3(req, res, next);
        
        // Assert
        expect(s3Service.testConnection).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(s3Error);
      });
  
      it('should handle S3 service unavailable', async () => {
        // Setup
        const mockFailureResponse = {
          success: false,
          message: 'S3 connection failed',
          error: 'Network timeout'
        };
        
        s3Service.testConnection.mockResolvedValue(mockFailureResponse);
        
        // Execute
        await healthController.testS3(req, res, next);
        
        // Assert
        expect(s3Service.testConnection).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockFailureResponse);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should pass through S3 test results with object details', async () => {
        // Setup
        const mockDetailedResponse = {
          success: true,
          message: 'S3 connection successful with AWS SDK v3!',
          bucket: 'weather-app-reports-hyperbolicme',
          objects_count: 1,
          objects: [
            {
              key: 'reports/default_user/sample-report.json',
              size: 2048,
              last_modified: '2025-09-07T12:00:00Z'
            }
          ]
        };
        
        s3Service.testConnection.mockResolvedValue(mockDetailedResponse);
        
        // Execute
        await healthController.testS3(req, res, next);
        
        // Assert
        const response = res.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.bucket).toBe('weather-app-reports-hyperbolicme');
        expect(response.objects_count).toBe(1);
        expect(response.objects).toHaveLength(1);
        expect(response.objects[0].key).toContain('sample-report.json');
      });
    });
  
    describe('Error handling', () => {
      it('should not call next for health check errors (handles them directly)', async () => {
        // Setup
        cacheService.getStats.mockRejectedValue(new Error('Serious cache error'));
        
        // Execute
        await healthController.healthCheck(req, res);
        
        // Assert
        expect(next).not.toHaveBeenCalled(); // Health check handles its own errors
        expect(res.status).toHaveBeenCalledWith(500);
      });
  
      it('should call next for S3 test errors (delegates to error handler)', async () => {
        // Setup
        const s3Error = new Error('Catastrophic S3 failure');
        s3Service.testConnection.mockRejectedValue(s3Error);
        
        // Execute
        await healthController.testS3(req, res, next);
        
        // Assert
        expect(next).toHaveBeenCalledWith(s3Error); // S3 test delegates errors
        expect(res.json).not.toHaveBeenCalled();
      });
    });
  });