// tests/unit/newsService.test.js - Fixed version
// Mock the cache service BEFORE importing anything
jest.mock('../../src/services/cacheService', () => ({
    generateKey: jest.fn((type, params) => `${type}_mock_key.json`),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }));
  
  // Mock global fetch
  global.fetch = jest.fn();
  
  const newsService = require('../../src/services/newsService');
  const cacheService = require('../../src/services/cacheService');
  
  describe('NewsService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue();
    });
  
    describe('getNews (NewsAPI)', () => {
      it('should return news data for valid country', async () => {
        // Setup
        const country = 'us';
        const mockNewsData = {
          status: 'ok',
          totalResults: 38,
          articles: [
            {
              title: 'Test News Article 1',
              description: 'This is a test news article description',
              url: 'https://example.com/news/1',
              urlToImage: 'https://example.com/image1.jpg',
              publishedAt: '2025-09-07T10:00:00Z',
              source: { name: 'Test News Source' },
              author: 'Test Author'
            },
            {
              title: 'Test News Article 2',
              description: 'Another test news article',
              url: 'https://example.com/news/2',
              urlToImage: 'https://example.com/image2.jpg',
              publishedAt: '2025-09-07T09:30:00Z',
              source: { name: 'Another News Source' },
              author: 'Another Author'
            }
          ]
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockNewsData)
        });
        
        // Execute
        const result = await newsService.getNews(country);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.country).toBe('US');
        expect(result.data.articles).toHaveLength(2);
        expect(result.data.articles[0].title).toBe('Test News Article 1');
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`country=${country}`)
        );
        expect(cacheService.set).toHaveBeenCalled();
      });
  
      it('should filter out removed articles', async () => {
        // Setup
        const newsDataWithRemoved = {
          status: 'ok',
          totalResults: 3,
          articles: [
            { title: 'Valid Article', source: { name: 'Test' }, description: 'Valid' },
            { title: '[Removed]', source: { name: 'Test' }, description: 'Removed' },
            { title: null, source: { name: 'Test' }, description: 'Null title' }
          ]
        };
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(newsDataWithRemoved)
        });
        
        // Execute
        const result = await newsService.getNews('us');
        
        // Assert
        expect(result.data.articles).toHaveLength(1);
        expect(result.data.articles[0].title).toBe('Valid Article');
      });
  
      it('should handle API rate limiting (429)', async () => {
        // Setup
        global.fetch.mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        });
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow();
      });
  
      it('should throw error when API key is missing', async () => {
        // Setup - temporarily remove API key
        const originalApiKey = newsService.newsApiKey;
        newsService.newsApiKey = null;
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow('News service not configured');
        
        // Cleanup
        newsService.newsApiKey = originalApiKey;
      });
  
      it('should return cached data when available', async () => {
        // Setup
        const cachedData = { 
          success: true, 
          data: { articles: [{ title: 'Cached Article' }] } 
        };
        cacheService.get.mockResolvedValue(cachedData);
        
        // Execute
        const result = await newsService.getNews('us');
        
        // Assert
        expect(result).toEqual(cachedData);
        expect(fetch).not.toHaveBeenCalled();
      });
    });
  
    describe('getGuardianNews', () => {
      it('should return Guardian news data', async () => {
        // Setup
        const country = 'US';
        const mockGuardianData = {
          response: {
            status: 'ok',
            total: 15,
            results: [
              {
                id: 'guardian/test-1',
                webTitle: 'Test Guardian Article 1',
                webUrl: 'https://theguardian.com/test/1',
                webPublicationDate: '2025-09-07T11:00:00Z',
                sectionName: 'World news',
                fields: {
                  thumbnail: 'https://theguardian.com/thumb1.jpg',
                  trailText: 'Test Guardian article description'
                }
              }
            ]
          }
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockGuardianData)
        });
        
        // Execute
        const result = await newsService.getGuardianNews(country);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.country).toBe('US');
        expect(result.data.countryName).toBe('United States');
        expect(result.data.articles).toHaveLength(1);
        expect(result.data.articles[0].source).toBe('The Guardian');
      });
  
      it('should handle invalid country codes', async () => {
        // Setup
        const invalidCountry = 'INVALID'; // Changed to longer invalid code
        
        // Execute & Assert
        await expect(newsService.getGuardianNews(invalidCountry))
          .rejects.toThrow();
      });
  
      it('should transform Guardian articles correctly', async () => {
        // Setup
        const mockGuardianData = {
          response: {
            status: 'ok',
            total: 1,
            results: [
              {
                id: 'test-id',
                webTitle: 'Test Title',
                webUrl: 'https://test.com',
                webPublicationDate: '2025-09-07T12:00:00Z',
                sectionName: 'Test Section',
                fields: {
                  thumbnail: 'https://test.com/thumb.jpg',
                  trailText: 'Test description'
                }
              }
            ]
          }
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockGuardianData)
        });
        
        // Execute
        const result = await newsService.getGuardianNews('US');
        
        // Assert
        const article = result.data.articles[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('description');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('imageUrl');
        expect(article).toHaveProperty('publishedAt');
        expect(article).toHaveProperty('source');
        expect(article).toHaveProperty('section');
      });
    });
  
    describe('getCombinedNews', () => {
      it('should return Guardian news when available', async () => {
        // Setup
        jest.spyOn(newsService, 'getGuardianNews').mockResolvedValue({
          success: true,
          data: { articles: [{ title: 'Guardian Article' }] }
        });
        
        // Execute
        const result = await newsService.getCombinedNews('US');
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.source).toBe('guardian');
      });
  
      it('should fallback to NewsAPI when Guardian fails', async () => {
        // Setup
        jest.spyOn(newsService, 'getGuardianNews').mockRejectedValue(new Error('Guardian failed'));
        jest.spyOn(newsService, 'getNews').mockResolvedValue({
          success: true,
          data: { articles: [{ title: 'NewsAPI Article' }] }
        });
        
        // Execute
        const result = await newsService.getCombinedNews('US');
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.source).toBe('newsapi');
      });
  
      it('should throw error when both services fail', async () => {
        // Setup
        jest.spyOn(newsService, 'getGuardianNews').mockRejectedValue(new Error('Guardian failed'));
        jest.spyOn(newsService, 'getNews').mockRejectedValue(new Error('NewsAPI failed'));
        
        // Execute & Assert
        await expect(newsService.getCombinedNews('US'))
          .rejects.toThrow('All news services are temporarily unavailable');
      });
    });
  
    describe('Error handling', () => {
      it('should handle unauthorized access (401)', async () => {
        // Setup
        global.fetch.mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        });
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow();
      });
  
      it('should handle rate limiting (429)', async () => {
        // Setup
        global.fetch.mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        });
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow();
      });
  
      it('should handle server errors (500)', async () => {
        // Setup
        global.fetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow();
      });
  
      it('should handle network errors', async () => {
        // Setup
        global.fetch.mockRejectedValue(new Error('Network error'));
        
        // Execute & Assert
        await expect(newsService.getNews('us'))
          .rejects.toThrow('Network error');
      });
    });
  
    describe('Cache integration', () => {
      it('should cache successful responses', async () => {
        // Setup
        const mockNewsData = {
          status: 'ok',
          totalResults: 1,
          articles: [{ title: 'Test Article', source: { name: 'Test' } }]
        };
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockNewsData)
        });
        
        // Execute
        await newsService.getNews('us');
        
        // Assert
        expect(cacheService.set).toHaveBeenCalledWith(
          expect.stringMatching(/news_.*\.json/),
          expect.any(Object)
        );
      });
    });
  });