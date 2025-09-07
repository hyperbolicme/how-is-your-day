// tests/unit/newsController.test.js - News Controller Test
// Mock the news service
jest.mock('../../src/services/newsService', () => ({
    getNews: jest.fn(),
    getGuardianNews: jest.fn(),
    getCombinedNews: jest.fn()
  }));
  
  const newsController = require('../../src/controllers/newsController');
  const newsService = require('../../src/services/newsService');
  
  describe('NewsController', () => {
    let req, res, next;
  
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock Express req, res, next
      req = {
        validatedQuery: {}
      };
      res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };
      next = jest.fn();
    });
  
    describe('getNews', () => {
      it('should return news data successfully', async () => {
        // Setup
        req.validatedQuery = { 
          country: 'us', 
          category: 'technology', 
          pageSize: 10 
        };
        
        const mockNewsData = {
          success: true,
          data: {
            country: 'US',
            category: 'technology',
            articles: [
              {
                title: 'Tech News 1',
                description: 'Description 1',
                source: 'Tech Source'
              },
              {
                title: 'Tech News 2', 
                description: 'Description 2',
                source: 'Another Source'
              }
            ],
            totalResults: 25
          },
          timestamp: '2025-09-07T12:00:00Z'
        };
        
        newsService.getNews.mockResolvedValue(mockNewsData);
        
        // Execute
        await newsController.getNews(req, res, next);
        
        // Assert
        expect(newsService.getNews).toHaveBeenCalledWith('us', 'technology', 10);
        expect(res.json).toHaveBeenCalledWith(mockNewsData);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle news service errors', async () => {
        // Setup
        req.validatedQuery = { country: 'us', category: 'general', pageSize: 5 };
        const error = new Error('News API rate limit exceeded');
        
        newsService.getNews.mockRejectedValue(error);
        
        // Execute
        await newsController.getNews(req, res, next);
        
        // Assert
        expect(newsService.getNews).toHaveBeenCalledWith('us', 'general', 5);
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
    });
  
    describe('getGuardianNews', () => {
      it('should return Guardian news data successfully', async () => {
        // Setup
        req.validatedQuery = { 
          country: 'GB', 
          pageSize: 15, 
          orderBy: 'newest' 
        };
        
        const mockGuardianData = {
          success: true,
          data: {
            country: 'GB',
            countryName: 'United Kingdom',
            articles: [
              {
                title: 'Guardian Article 1',
                description: 'Guardian description 1',
                source: 'The Guardian',
                section: 'World news'
              }
            ],
            totalResults: 42
          },
          timestamp: '2025-09-07T12:00:00Z'
        };
        
        newsService.getGuardianNews.mockResolvedValue(mockGuardianData);
        
        // Execute
        await newsController.getGuardianNews(req, res, next);
        
        // Assert
        expect(newsService.getGuardianNews).toHaveBeenCalledWith('GB', 15, 'newest');
        expect(res.json).toHaveBeenCalledWith(mockGuardianData);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle Guardian service errors', async () => {
        // Setup
        req.validatedQuery = { country: 'FR', pageSize: 10, orderBy: 'relevance' };
        const error = new Error('Guardian API authentication failed');
        
        newsService.getGuardianNews.mockRejectedValue(error);
        
        // Execute
        await newsController.getGuardianNews(req, res, next);
        
        // Assert
        expect(newsService.getGuardianNews).toHaveBeenCalledWith('FR', 10, 'relevance');
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
    });
  
    describe('getCombinedNews', () => {
      it('should return combined news data successfully', async () => {
        // Setup
        req.validatedQuery = { 
          country: 'in', 
          pageSize: 8 
        };
        
        const mockCombinedData = {
          success: true,
          data: {
            country: 'in',
            source: 'guardian', // Indicates Guardian was used
            articles: [
              {
                title: 'India News 1',
                description: 'News from India',
                source: 'The Guardian'
              }
            ],
            totalResults: 18
          },
          timestamp: '2025-09-07T12:00:00Z'
        };
        
        newsService.getCombinedNews.mockResolvedValue(mockCombinedData);
        
        // Execute
        await newsController.getCombinedNews(req, res, next);
        
        // Assert
        expect(newsService.getCombinedNews).toHaveBeenCalledWith('in', 8);
        expect(res.json).toHaveBeenCalledWith(mockCombinedData);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle combined news service errors', async () => {
        // Setup
        req.validatedQuery = { country: 'ca', pageSize: 12 };
        const error = new Error('All news services are temporarily unavailable');
        
        newsService.getCombinedNews.mockRejectedValue(error);
        
        // Execute
        await newsController.getCombinedNews(req, res, next);
        
        // Assert
        expect(newsService.getCombinedNews).toHaveBeenCalledWith('ca', 12);
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
    });
  
    describe('Parameter handling', () => {
      it('should pass all validated query parameters correctly', async () => {
        // Setup
        req.validatedQuery = { 
          country: 'au', 
          category: 'sports', 
          pageSize: 20 
        };
        
        const mockResponse = { success: true, data: { articles: [] } };
        newsService.getNews.mockResolvedValue(mockResponse);
        
        // Execute
        await newsController.getNews(req, res, next);
        
        // Assert
        expect(newsService.getNews).toHaveBeenCalledWith('au', 'sports', 20);
      });
  
      it('should handle minimal parameters for Guardian news', async () => {
        // Setup
        req.validatedQuery = { country: 'us' }; // Only required param
        
        const mockResponse = { success: true, data: { articles: [] } };
        newsService.getGuardianNews.mockResolvedValue(mockResponse);
        
        // Execute
        await newsController.getGuardianNews(req, res, next);
        
        // Assert
        expect(newsService.getGuardianNews).toHaveBeenCalledWith('us', undefined, undefined);
      });
    });
  });