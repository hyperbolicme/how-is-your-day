// tests/unit/cacheService.test.js - Fixed version
// Mock fs module BEFORE importing anything that uses it
jest.mock('fs', () => ({
    promises: {
      access: jest.fn(),
      mkdir: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      unlink: jest.fn(),
      readdir: jest.fn()
    },
    existsSync: jest.fn(() => true) // Add this for winston compatibility
  }));
  
  // Mock the config to avoid file system operations
  jest.mock('../../src/config/database', () => ({
    getCacheDirectory: jest.fn(() => '/test/cache')
  }));
  
  const cacheService = require('../../src/services/cacheService');
  const fs = require('fs').promises;
  
  describe('CacheService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset cache directory
      cacheService.cacheDir = null;
    });
  
    describe('initialize', () => {
      it('should create cache directory if it does not exist', async () => {
        // Setup
        fs.access.mockRejectedValue(new Error('ENOENT'));
        fs.mkdir.mockResolvedValue();
        
        // Execute
        await cacheService.initialize();
        
        // Assert
        expect(fs.mkdir).toHaveBeenCalledWith(
          expect.any(String),
          { recursive: true }
        );
      });
  
      it('should not create directory if it already exists', async () => {
        // Setup
        fs.access.mockResolvedValue();
        
        // Execute
        await cacheService.initialize();
        
        // Assert
        expect(fs.mkdir).not.toHaveBeenCalled();
      });
    });
  
    describe('generateKey', () => {
      it('should generate consistent keys for same input', () => {
        // Execute
        const key1 = cacheService.generateKey('weather', { city: 'Mumbai' });
        const key2 = cacheService.generateKey('weather', { city: 'Mumbai' });
        
        // Assert
        expect(key1).toBe(key2);
        expect(key1).toMatch(/weather_.*\.json/);
      });
  
      it('should generate different keys for different input', () => {
        // Execute
        const key1 = cacheService.generateKey('weather', { city: 'Mumbai' });
        const key2 = cacheService.generateKey('weather', { city: 'Delhi' });
        
        // Assert
        expect(key1).not.toBe(key2);
      });
    });
  
    describe('get', () => {
      it('should return cached data when not expired', async () => {
        // Setup
        const testData = { message: 'test data' };
        const cacheContent = {
          data: testData,
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes from now
        };
        
        fs.readFile.mockResolvedValue(JSON.stringify(cacheContent));
        
        // Execute
        const result = await cacheService.get('test_key.json');
        
        // Assert
        expect(result).toEqual(testData);
        expect(fs.readFile).toHaveBeenCalled();
      });
  
      it('should return null when cache is expired', async () => {
        // Setup
        const cacheContent = {
          data: { message: 'test data' },
          createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
          expiresAt: Date.now() - 30 * 60 * 1000  // 30 minutes ago (expired)
        };
        
        fs.readFile.mockResolvedValue(JSON.stringify(cacheContent));
        fs.unlink.mockResolvedValue();
        
        // Execute
        const result = await cacheService.get('test_key.json');
        
        // Assert
        expect(result).toBeNull();
        expect(fs.unlink).toHaveBeenCalled(); // Should delete expired cache
      });
  
      it('should return null when cache file does not exist', async () => {
        // Setup
        const error = new Error('File not found');
        error.code = 'ENOENT';
        fs.readFile.mockRejectedValue(error);
        
        // Execute
        const result = await cacheService.get('nonexistent_key.json');
        
        // Assert
        expect(result).toBeNull();
      });
    });
  
    describe('set', () => {
      it('should write cache data with expiration', async () => {
        // Setup
        const testData = { message: 'test data' };
        const testKey = 'test_key.json';
        
        fs.writeFile.mockResolvedValue();
        
        // Execute
        await cacheService.set(testKey, testData);
        
        // Assert
        expect(fs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining(testKey),
          expect.stringContaining('"data"')
        );
        
        const writeCall = fs.writeFile.mock.calls[0];
        const writtenData = JSON.parse(writeCall[1]);
        expect(writtenData.data).toEqual(testData);
        expect(writtenData.expiresAt).toBeGreaterThan(Date.now());
      });
    });
  
    describe('delete', () => {
      it('should delete cache file', async () => {
        // Setup
        fs.unlink.mockResolvedValue();
        
        // Execute
        await cacheService.delete('test_key.json');
        
        // Assert
        expect(fs.unlink).toHaveBeenCalledWith(
          expect.stringContaining('test_key.json')
        );
      });
  
      it('should handle file not found gracefully', async () => {
        // Setup
        const error = new Error('File not found');
        error.code = 'ENOENT';
        fs.unlink.mockRejectedValue(error);
        
        // Execute & Assert (should not throw)
        await expect(cacheService.delete('nonexistent.json')).resolves.toBeUndefined();
      });
    });
  
    describe('getStats', () => {
      it('should return cache statistics', async () => {
        // Setup
        fs.readdir.mockResolvedValue(['cache1.json', 'cache2.json', 'other.txt']);
        
        // Execute
        const stats = await cacheService.getStats();
        
        // Assert
        expect(stats).toHaveProperty('totalFiles', 2); // Only JSON files
        expect(stats).toHaveProperty('directory');
        expect(stats).toHaveProperty('cacheDuration');
      });
    });
  });