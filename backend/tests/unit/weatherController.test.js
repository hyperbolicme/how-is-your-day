// tests/unit/weatherController.test.js - Weather Controller Test
// Mock the weather service
jest.mock('../../src/services/weatherService', () => ({
    getCurrentWeather: jest.fn(),
    getForecast: jest.fn()
  }));
  
  const weatherController = require('../../src/controllers/weatherController');
  const weatherService = require('../../src/services/weatherService');
  
  describe('WeatherController', () => {
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
  
    describe('getCurrentWeather', () => {
      it('should return weather data successfully', async () => {
        // Setup
        req.validatedQuery = { city: 'Mumbai' };
        const mockWeatherData = {
          success: true,
          data: {
            city: 'Mumbai',
            temperature: 28,
            humidity: 65,
            description: 'clear sky'
          },
          timestamp: '2025-09-07T12:00:00Z'
        };
        
        weatherService.getCurrentWeather.mockResolvedValue(mockWeatherData);
        
        // Execute
        await weatherController.getCurrentWeather(req, res, next);
        
        // Assert
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith('Mumbai');
        expect(res.json).toHaveBeenCalledWith(mockWeatherData);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle service errors by calling next', async () => {
        // Setup
        req.validatedQuery = { city: 'InvalidCity' };
        const error = new Error('City not found');
        
        weatherService.getCurrentWeather.mockRejectedValue(error);
        
        // Execute
        await weatherController.getCurrentWeather(req, res, next);
        
        // Assert
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith('InvalidCity');
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
  
      it('should extract city from validated query', async () => {
        // Setup
        req.validatedQuery = { city: 'Delhi' };
        const mockResponse = { success: true, data: {} };
        
        weatherService.getCurrentWeather.mockResolvedValue(mockResponse);
        
        // Execute
        await weatherController.getCurrentWeather(req, res, next);
        
        // Assert
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith('Delhi');
      });
    });
  
    describe('getForecast', () => {
      it('should return forecast data successfully', async () => {
        // Setup
        req.validatedQuery = { city: 'Bangalore' };
        const mockForecastData = {
          success: true,
          data: {
            city: 'Bangalore',
            forecasts: [
              {
                date: '2025-09-07 12:00:00',
                temperature: 26,
                description: 'partly cloudy'
              },
              {
                date: '2025-09-08 12:00:00',
                temperature: 27,
                description: 'sunny'
              }
            ]
          },
          timestamp: '2025-09-07T12:00:00Z'
        };
        
        weatherService.getForecast.mockResolvedValue(mockForecastData);
        
        // Execute
        await weatherController.getForecast(req, res, next);
        
        // Assert
        expect(weatherService.getForecast).toHaveBeenCalledWith('Bangalore');
        expect(res.json).toHaveBeenCalledWith(mockForecastData);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle forecast service errors', async () => {
        // Setup
        req.validatedQuery = { city: 'TestCity' };
        const error = new Error('Forecast service unavailable');
        
        weatherService.getForecast.mockRejectedValue(error);
        
        // Execute
        await weatherController.getForecast(req, res, next);
        
        // Assert
        expect(weatherService.getForecast).toHaveBeenCalledWith('TestCity');
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
  
      it('should work with different city names', async () => {
        // Setup
        req.validatedQuery = { city: 'New York' };
        const mockResponse = { success: true, data: { forecasts: [] } };
        
        weatherService.getForecast.mockResolvedValue(mockResponse);
        
        // Execute
        await weatherController.getForecast(req, res, next);
        
        // Assert
        expect(weatherService.getForecast).toHaveBeenCalledWith('New York');
        expect(res.json).toHaveBeenCalledWith(mockResponse);
      });
    });
  
    describe('Error handling patterns', () => {
      it('should always call next with errors instead of handling them directly', async () => {
        // Setup
        req.validatedQuery = { city: 'Test' };
        const networkError = new Error('Network timeout');
        
        weatherService.getCurrentWeather.mockRejectedValue(networkError);
        
        // Execute
        await weatherController.getCurrentWeather(req, res, next);
        
        // Assert
        expect(next).toHaveBeenCalledWith(networkError);
        expect(res.json).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });