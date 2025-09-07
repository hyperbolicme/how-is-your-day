// tests/unit/s3Service.test.js - S3 Service Test
// Mock AWS SDK first
const mockS3Client = {
    send: jest.fn()
  };
  
  jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => mockS3Client),
    PutObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    GetObjectCommand: jest.fn()
  }));
  
  // Mock fs for local operations
  jest.mock('fs', () => ({
    promises: {
      access: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn(),
      rmdir: jest.fn()
    },
    existsSync: jest.fn(() => true)
  }));
  
  // Mock the database config
  jest.mock('../../src/config/database', () => ({
    s3Client: mockS3Client
  }));
  
  const s3Service = require('../../src/services/s3Service');
  const fs = require('fs').promises;
  
  describe('S3Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('hasAWSAccess', () => {
      it('should return true when AWS access is available', async () => {
        // Setup
        mockS3Client.send.mockResolvedValue({
          Contents: []
        });
        
        // Execute
        const result = await s3Service.hasAWSAccess();
        
        // Assert
        expect(result).toBe(true);
        expect(mockS3Client.send).toHaveBeenCalled();
      });
  
      it('should return false when AWS access fails', async () => {
        // Setup
        mockS3Client.send.mockRejectedValue(new Error('Access denied'));
        
        // Execute
        const result = await s3Service.hasAWSAccess();
        
        // Assert
        expect(result).toBe(false);
      });
    });
  
    describe('saveReport', () => {
      it('should save report to S3 successfully', async () => {
        // Setup
        const report = {
          metadata: { city: 'TestCity', date: '2025-09-07' },
          weather: { current: { temperature: 25 } }
        };
        const fileName = 'test-report.json';
        
        mockS3Client.send.mockResolvedValue({
          ETag: '"mock-etag-12345"'
        });
        
        // Execute
        const result = await s3Service.saveReport(report, fileName);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.location).toBe('S3');
        expect(result.s3_key).toContain(fileName);
        expect(mockS3Client.send).toHaveBeenCalled();
      });
  
      it('should throw error when S3 save fails', async () => {
        // Setup
        const report = { metadata: { city: 'Test' } };
        const fileName = 'test-report.json';
        mockS3Client.send.mockRejectedValue(new Error('S3 error'));
        
        // Execute & Assert
        await expect(s3Service.saveReport(report, fileName))
          .rejects.toThrow('S3 error');
      });
    });
  
    describe('listReports', () => {
      it('should return list of reports from S3', async () => {
        // Setup
        mockS3Client.send.mockResolvedValue({
          Contents: [
            {
              Key: 'reports/default_user/testcity-2025-09-07-1694087654.json',
              Size: 1024,
              LastModified: new Date('2025-09-07T12:00:00Z')
            },
            {
              Key: 'reports/default_user/mumbai-2025-09-06-1694001254.json',
              Size: 2048,
              LastModified: new Date('2025-09-06T10:30:00Z')
            }
          ]
        });
        
        // Execute
        const result = await s3Service.listReports();
        
        // Assert
        expect(result.reports).toHaveLength(2);
        expect(result.total_count).toBe(2);
        expect(result.storage_location).toBe('S3');
        expect(result.reports[0]).toHaveProperty('filename');
        expect(result.reports[0]).toHaveProperty('s3_key');
        expect(result.reports[0]).toHaveProperty('city');
        expect(result.reports[0]).toHaveProperty('date');
      });
  
      it('should return empty list when no reports found', async () => {
        // Setup
        mockS3Client.send.mockResolvedValue({
          Contents: []
        });
        
        // Execute
        const result = await s3Service.listReports();
        
        // Assert
        expect(result.reports).toHaveLength(0);
        expect(result.total_count).toBe(0);
        expect(result.storage_location).toBe('S3');
      });
  
      it('should parse filename correctly', async () => {
        // Setup
        const mockResponse = {
          Contents: [{
            Key: 'reports/default_user/mumbai-2025-09-07-1694087654.json',
            Size: 1024,
            LastModified: new Date('2025-09-07T12:00:00Z')
          }]
        };
        mockS3Client.send.mockResolvedValue(mockResponse);
        
        // Execute
        const result = await s3Service.listReports();
        
        // Assert
        expect(result.reports[0].city).toBe('mumbai');
        expect(result.reports[0].date).toBe('2025-09-07');
        expect(result.reports[0].filename).toBe('mumbai-2025-09-07-1694087654.json');
      });
    });
  
    describe('getReport', () => {
      it('should retrieve report from S3', async () => {
        // Setup
        const filename = 'test-report.json';
        const reportData = { metadata: { city: 'Test' } };
        
        // Mock the async iterator for S3 Body
        const mockBody = {
          async *[Symbol.asyncIterator]() {
            yield Buffer.from(JSON.stringify(reportData));
          }
        };
        
        mockS3Client.send.mockResolvedValue({
          Body: mockBody,
          ContentLength: 1024,
          LastModified: new Date('2025-09-07T12:00:00Z'),
          ContentType: 'application/json'
        });
        
        // Execute
        const result = await s3Service.getReport(filename);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.filename).toBe(filename);
        expect(result.data.storage_location).toBe('S3');
        expect(result.data.report).toEqual(reportData);
      });
  
      it('should throw error when report not found', async () => {
        // Setup
        const filename = 'nonexistent.json';
        const error = new Error('NoSuchKey');
        error.name = 'NoSuchKey';
        mockS3Client.send.mockRejectedValue(error);
        
        // Execute & Assert
        await expect(s3Service.getReport(filename))
          .rejects.toThrow('NoSuchKey');
      });
    });
  
    describe('Local storage operations', () => {
      describe('saveReportLocally', () => {
        it('should save report to local filesystem', async () => {
          // Setup
          const report = { metadata: { city: 'Test' } };
          const fileName = 'test-report.json';
          fs.access.mockRejectedValue(new Error('Directory not found'));
          fs.mkdir.mockResolvedValue();
          fs.writeFile.mockResolvedValue();
          
          // Execute
          const result = await s3Service.saveReportLocally(report, fileName);
          
          // Assert
          expect(result.success).toBe(true);
          expect(result.location).toBe('Local');
          expect(result.local_path).toContain(fileName);
          expect(fs.mkdir).toHaveBeenCalled();
          expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining(fileName),
            JSON.stringify(report, null, 2)
          );
        });
  
        it('should create directory if it does not exist', async () => {
          // Setup
          fs.access.mockRejectedValue(new Error('ENOENT'));
          fs.mkdir.mockResolvedValue();
          fs.writeFile.mockResolvedValue();
          
          // Execute
          await s3Service.saveReportLocally({ test: 'data' }, 'test.json');
          
          // Assert
          expect(fs.mkdir).toHaveBeenCalledWith(
            expect.stringContaining('local-reports'),
            { recursive: true }
          );
        });
      });
  
      describe('listLocalReports', () => {
        it('should return list of local reports', async () => {
          // Setup
          fs.access.mockResolvedValue();
          fs.readdir.mockResolvedValue(['report1.json', 'report2.json', 'not-json.txt']);
          fs.stat.mockResolvedValue({
            size: 1024,
            mtime: new Date('2025-09-07T12:00:00Z')
          });
          
          // Execute
          const result = await s3Service.listLocalReports();
          
          // Assert
          expect(result).toHaveLength(2); // Only JSON files
          expect(result[0]).toHaveProperty('filename');
          expect(result[0]).toHaveProperty('local_path');
          expect(result[0]).toHaveProperty('storage', 'Local');
        });
  
        it('should return empty array when directory does not exist', async () => {
          // Setup
          fs.access.mockRejectedValue(new Error('ENOENT'));
          
          // Execute
          const result = await s3Service.listLocalReports();
          
          // Assert
          expect(result).toEqual([]);
        });
      });
  
      describe('getLocalReport', () => {
        it('should retrieve report from local storage', async () => {
          // Setup
          const filename = 'test-report.json';
          const reportData = { metadata: { city: 'Test' } };
          fs.access.mockResolvedValue();
          fs.stat.mockResolvedValue({
            size: 1024,
            mtime: new Date('2025-09-07T12:00:00Z')
          });
          fs.readFile.mockResolvedValue(JSON.stringify(reportData));
          
          // Execute
          const result = await s3Service.getLocalReport(filename);
          
          // Assert
          expect(result.success).toBe(true);
          expect(result.data.filename).toBe(filename);
          expect(result.data.storage_location).toBe('Local');
          expect(result.data.report).toEqual(reportData);
        });
  
        it('should throw error when local file not found', async () => {
          // Setup
          const filename = 'nonexistent.json';
          fs.access.mockRejectedValue(new Error('ENOENT'));
          
          // Execute & Assert
          await expect(s3Service.getLocalReport(filename))
            .rejects.toThrow();
        });
      });
    });
  
    describe('testConnection', () => {
      it('should return success when S3 is accessible', async () => {
        // Setup
        mockS3Client.send.mockResolvedValue({
          Contents: [
            { Key: 'test1.json', Size: 100, LastModified: new Date() },
            { Key: 'test2.json', Size: 200, LastModified: new Date() }
          ]
        });
        
        // Execute
        const result = await s3Service.testConnection();
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toContain('S3 connection successful');
        expect(result.bucket).toBe('weather-app-reports-hyperbolicme');
        expect(result.objects_count).toBe(2);
      });
  
      it('should throw error when S3 is not accessible', async () => {
        // Setup
        mockS3Client.send.mockRejectedValue(new Error('Connection failed'));
        
        // Execute & Assert
        await expect(s3Service.testConnection())
          .rejects.toThrow('S3 connection failed: Connection failed');
      });
    });
  
    describe('Filename parsing', () => {
      it('should parse complex city names correctly', async () => {
        // Setup
        const mockResponse = {
          Contents: [
            {
              Key: 'reports/default_user/new-york-city-2025-09-07-1694087654.json',
              Size: 1024,
              LastModified: new Date()
            },
            {
              Key: 'reports/default_user/salt-lake-city-2025-08-15-1693567200.json',
              Size: 2048,
              LastModified: new Date()
            }
          ]
        };
        mockS3Client.send.mockResolvedValue(mockResponse);
        
        // Execute
        const result = await s3Service.listReports();
        
        // Assert
        expect(result.reports[0].city).toBe('new-york-city');
        expect(result.reports[0].date).toBe('2025-09-07');
        expect(result.reports[1].city).toBe('salt-lake-city');
        expect(result.reports[1].date).toBe('2025-08-15');
      });
  
      it('should handle malformed filenames gracefully', async () => {
        // Setup
        const mockResponse = {
          Contents: [
            {
              Key: 'reports/default_user/invalid-filename.json',
              Size: 1024,
              LastModified: new Date()
            }
          ]
        };
        mockS3Client.send.mockResolvedValue(mockResponse);
        
        // Execute
        const result = await s3Service.listReports();
        
        // Assert
        expect(result.reports[0].city).toBe('Unknown');
        expect(result.reports[0].date).toBe('Unknown');
      });
    });
  });