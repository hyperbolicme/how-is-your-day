// tests/unit/weatherService.test.js - Final fixed version
// Mock the cache service BEFORE importing anything
jest.mock('../../src/services/cacheService', () => ({
    generateKey: jest.fn((type, params) => `${type}_mock_key.json`),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }));
  
  // Mock global fetch
  global.fetch = jest.fn();
  
  const weatherService = require('../../src/services/weatherService');
  const cacheService = require('../../src/services/cacheService');
  
  describe('WeatherService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset cache service mocks
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue();
    });
  
    describe('getCurrentWeather', () => {
      it('should return weather data for valid city', async () => {
        // Setup
        const city = 'Mumbai';
        const mockWeatherData = {
          name: 'Mumbai',
          sys: { country: 'IN' }, // Fixed: sys object structure
          main: {
            temp: 28.5,
            feels_like: 32.1,
            humidity: 65
          },
          weather: [{ description: 'clear sky', icon: '01d' }],
          wind: { speed: 5.2 },
          coord: { lat: 19.0759837, lon: 72.8776559 },
          sys: { sunrise: 1725679890, sunset: 1725723456, country: 'IN' } // Fixed: country in sys
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockWeatherData)
        });
        
        // Execute
        const result = await weatherService.getCurrentWeather(city);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.city).toBe('Mumbai');
        expect(result.data.temperature).toBe(29); // Math.round(28.5)
        expect(result.data.country).toBe('IN');
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`q=${encodeURIComponent(city)}`)
        );
        expect(cacheService.set).toHaveBeenCalled();
      });
  
      it('should return cached data when available', async () => {
        // Setup
        const city = 'Mumbai';
        const cachedData = { 
          success: true, 
          data: { city: 'Mumbai', temperature: 25 } 
        };
        cacheService.get.mockResolvedValue(cachedData);
        
        // Execute
        const result = await weatherService.getCurrentWeather(city);
        
        // Assert
        expect(result).toEqual(cachedData);
        expect(fetch).not.toHaveBeenCalled();
        expect(cacheService.set).not.toHaveBeenCalled();
      });
  
      it('should throw error for invalid city (404)', async () => {
        // Setup
        const city = 'InvalidCity';
        global.fetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
        
        // Execute & Assert
        await expect(weatherService.getCurrentWeather(city))
          .rejects.toThrow();
      });
  
      it('should throw error for API key issues (401)', async () => {
        // Setup
        const city = 'Mumbai';
        global.fetch.mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        });
        
        // Execute & Assert
        await expect(weatherService.getCurrentWeather(city))
          .rejects.toThrow();
      });
  
      it('should handle network errors', async () => {
        // Setup
        const city = 'Mumbai';
        global.fetch.mockRejectedValue(new Error('Network error'));
        
        // Execute & Assert
        await expect(weatherService.getCurrentWeather(city))
          .rejects.toThrow('Network error');
      });
    });
  
    describe('getForecast', () => {
      it('should return forecast data for valid city', async () => {
        // Setup
        const city = 'Mumbai';
        const mockForecastData = {
          city: { name: 'Mumbai', country: 'IN' },
          list: [
            {
              dt_txt: "2025-09-07 12:00:00",
              main: { temp: 29.2, humidity: 68 },
              weather: [{ description: "partly cloudy", icon: "02d" }],
              wind: { speed: 4.8 }
            },
            {
              dt_txt: "2025-09-08 12:00:00", 
              main: { temp: 30.1, humidity: 70 },
              weather: [{ description: "cloudy", icon: "04d" }],
              wind: { speed: 6.2 }
            }
          ]
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockForecastData)
        });
        
        // Execute
        const result = await weatherService.getForecast(city);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.city).toBe('Mumbai');
        expect(result.data.forecasts).toHaveLength(2);
        expect(result.data.forecasts[0].temperature).toBe(29); // Math.round(29.2)
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('forecast')
        );
        expect(cacheService.set).toHaveBeenCalled();
      });
  
      it('should filter forecasts to 12:00 PM entries only', async () => {
        // Setup
        const city = 'Mumbai';
        const forecastWithMixedTimes = {
          city: { name: 'Mumbai', country: 'IN' },
          list: [
            { dt_txt: "2025-09-07 09:00:00", main: { temp: 25 }, weather: [{}], wind: {} },
            { dt_txt: "2025-09-07 12:00:00", main: { temp: 28 }, weather: [{}], wind: {} },
            { dt_txt: "2025-09-07 15:00:00", main: { temp: 30 }, weather: [{}], wind: {} },
            { dt_txt: "2025-09-08 12:00:00", main: { temp: 27 }, weather: [{}], wind: {} }
          ]
        };
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(forecastWithMixedTimes)
        });
        
        // Execute
        const result = await weatherService.getForecast(city);
        
        // Assert
        expect(result.data.forecasts).toHaveLength(2); // Only 12:00 PM entries
        result.data.forecasts.forEach(forecast => {
          expect(forecast.date).toContain('12:00:00');
        });
      });
  
      it('should return cached forecast when available', async () => {
        // Setup
        const city = 'Mumbai';
        const cachedData = { 
          success: true, 
          data: { forecasts: [] } 
        };
        cacheService.get.mockResolvedValue(cachedData);
        
        // Execute
        const result = await weatherService.getForecast(city);
        
        // Assert
        expect(result).toEqual(cachedData);
        expect(fetch).not.toHaveBeenCalled();
      });
    });
  
    describe('Cache integration', () => {
      it('should generate correct cache keys', async () => {
        // Setup
        const city = 'Mumbai';
        const mockWeatherData = {
          name: 'Mumbai',
          sys: { country: 'IN' },
          main: { temp: 25, feels_like: 27, humidity: 65 },
          weather: [{ description: 'clear sky', icon: '01d' }],
          wind: { speed: 5 },
          coord: { lat: 10, lon: 10 },
          sys: { sunrise: 123, sunset: 456, country: 'IN' }
        };
        
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockWeatherData)
        });
        
        // Execute
        await weatherService.getCurrentWeather(city);
        
        // Assert
        expect(cacheService.generateKey).toHaveBeenCalledWith(
          'weather',
          { city: city }
        );
        expect(cacheService.get).toHaveBeenCalledWith('weather_mock_key.json');
        expect(cacheService.set).toHaveBeenCalledWith(
          'weather_mock_key.json',
          expect.any(Object)
        );
      }); 
    });
  });