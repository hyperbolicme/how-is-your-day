// tests/unit/reportService.test.js - Report Service Test
// Mock all the services that reportService depends on
jest.mock('../../src/services/weatherService', () => ({
    getCurrentWeather: jest.fn(),
    getForecast: jest.fn()
  }));
  
  jest.mock('../../src/services/newsService', () => ({
    getNews: jest.fn()
  }));
  
  jest.mock('../../src/services/s3Service', () => ({
    hasAWSAccess: jest.fn(),
    saveReport: jest.fn(),
    saveReportLocally: jest.fn(),
    listReports: jest.fn(),
    listLocalReports: jest.fn(),
    getReport: jest.fn(),
    getLocalReport: jest.fn()
  }));
  
  const reportService = require('../../src/services/reportService');
  const weatherService = require('../../src/services/weatherService');
  const newsService = require('../../src/services/newsService');
  const s3Service = require('../../src/services/s3Service');
  
  describe('ReportService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('generateReport', () => {
      it('should generate comprehensive report successfully', async () => {
        // Setup
        const city = 'Mumbai';
        const country = 'IN';
        
        // Mock weather service responses
        weatherService.getCurrentWeather.mockResolvedValue({
          data: {
            temperature: 28,
            feelsLike: 30,
            humidity: 65,
            description: 'clear sky',
            windSpeed: 5.2,
            raw: { main: { pressure: 1013 } }
          }
        });
        
        weatherService.getForecast.mockResolvedValue({
          data: {
            forecasts: [
              {
                date: '2025-09-07 12:00:00',
                temperature: 29,
                description: 'partly cloudy',
                humidity: 68
              },
              {
                date: '2025-09-08 12:00:00',
                temperature: 30,
                description: 'sunny',
                humidity: 70
              }
            ]
          }
        });
        
        // Mock news service response
        newsService.getNews.mockResolvedValue({
          data: {
            articles: [
              {
                title: 'Test News Headline 1',
                description: 'Test news description 1',
                source: 'Test Source 1',
                publishedAt: '2025-09-07T10:00:00Z',
                url: 'https://test.com/news1'
              },
              {
                title: 'Test News Headline 2',
                description: 'Test news description 2',
                source: 'Test Source 2',
                publishedAt: '2025-09-07T09:30:00Z',
                url: 'https://test.com/news2'
              }
            ],
            totalResults: 25
          }
        });
        
        // Mock S3 service
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.saveReport.mockResolvedValue({
          success: true,
          location: 'S3',
          s3_key: 'reports/default_user/mumbai-2025-09-07-1694087654.json',
          bucket: 'weather-app-reports-hyperbolicme'
        });
        
        // Execute
        const result = await reportService.generateReport(city, country);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toContain('Daily report generated and stored successfully');
        expect(result.report.city).toBe(city);
        expect(result.report.filename).toContain('mumbai');
        expect(result.report.storage.location).toBe('S3');
        
        // Verify service calls
        expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(city);
        expect(weatherService.getForecast).toHaveBeenCalledWith(city);
        expect(newsService.getNews).toHaveBeenCalledWith(country, 'general', 5);
        expect(s3Service.saveReport).toHaveBeenCalled();
        
        // Verify report structure
        expect(result.preview).toHaveProperty('current_temp');
        expect(result.preview).toHaveProperty('weather_desc');
        expect(result.preview).toHaveProperty('top_headline');
      });
  
      it('should fallback to local storage when S3 fails', async () => {
        // Setup
        const city = 'Delhi';
        const country = 'IN';
        
        // Mock weather services
        weatherService.getCurrentWeather.mockResolvedValue({
          data: {
            temperature: 32,
            feelsLike: 35,
            humidity: 60,
            description: 'hot',
            windSpeed: 3.5,
            raw: { main: { pressure: 1010 } }
          }
        });
        
        weatherService.getForecast.mockResolvedValue({
          data: {
            forecasts: [
              {
                date: '2025-09-07 12:00:00',
                temperature: 33,
                description: 'very hot',
                humidity: 55
              }
            ]
          }
        });
        
        // Mock news service
        newsService.getNews.mockResolvedValue({
          data: {
            articles: [
              {
                title: 'Local News',
                description: 'Local description',
                source: 'Local Source',
                publishedAt: '2025-09-07T10:00:00Z',
                url: 'https://local.com'
              }
            ],
            totalResults: 10
          }
        });
        
        // Mock S3 failure, local success
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.saveReport.mockRejectedValue(new Error('S3 connection failed'));
        s3Service.saveReportLocally.mockResolvedValue({
          success: true,
          location: 'Local',
          local_path: '/local/reports/delhi-2025-09-07-1694087654.json'
        });
        
        // Execute
        const result = await reportService.generateReport(city, country);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.report.storage.location).toBe('Local');
        expect(s3Service.saveReport).toHaveBeenCalled();
        expect(s3Service.saveReportLocally).toHaveBeenCalled();
      });
  
      it('should use local storage when AWS access is not available', async () => {
        // Setup
        const city = 'Bangalore';
        const country = 'IN';
        
        // Mock weather services
        weatherService.getCurrentWeather.mockResolvedValue({
          data: {
            temperature: 25,
            feelsLike: 27,
            humidity: 70,
            description: 'pleasant',
            windSpeed: 4.0,
            raw: { main: { pressure: 1015 } }
          }
        });
        
        weatherService.getForecast.mockResolvedValue({
          data: {
            forecasts: []
          }
        });
        
        // Mock news service
        newsService.getNews.mockResolvedValue({
          data: {
            articles: [],
            totalResults: 0
          }
        });
        
        // Mock no AWS access
        s3Service.hasAWSAccess.mockResolvedValue(false);
        s3Service.saveReportLocally.mockResolvedValue({
          success: true,
          location: 'Local',
          local_path: '/local/reports/bangalore-2025-09-07-1694087654.json',
          note: 'AWS credentials not available - saved to local filesystem'
        });
        
        // Execute
        const result = await reportService.generateReport(city, country);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.report.storage.location).toBe('Local');
        expect(s3Service.saveReport).not.toHaveBeenCalled();
        expect(s3Service.saveReportLocally).toHaveBeenCalled();
      });
  
      it('should handle weather service errors', async () => {
        // Setup
        weatherService.getCurrentWeather.mockRejectedValue(new Error('Weather API failed'));
        
        // Execute & Assert
        await expect(reportService.generateReport('TestCity', 'US'))
          .rejects.toThrow('Failed to fetch weather data: Weather API failed');
      });
  
      it('should handle news service errors', async () => {
        // Setup
        weatherService.getCurrentWeather.mockResolvedValue({
          data: { temperature: 25, feelsLike: 27, humidity: 65, description: 'clear', windSpeed: 5, raw: {} }
        });
        
        weatherService.getForecast.mockResolvedValue({
          data: { forecasts: [] }
        });
        
        newsService.getNews.mockRejectedValue(new Error('News API failed'));
        
        // Execute & Assert
        await expect(reportService.generateReport('TestCity', 'US'))
          .rejects.toThrow('Failed to fetch news data: News API failed');
      });
    });
  
    describe('listReports', () => {
      it('should return reports from S3 when available', async () => {
        // Setup
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.listReports.mockResolvedValue({
          reports: [
            {
              filename: 'mumbai-2025-09-07-1694087654.json',
              city: 'mumbai',
              date: '2025-09-07',
              storage: 'S3'
            }
          ],
          total_count: 1,
          storage_location: 'S3'
        });
        
        // Execute
        const result = await reportService.listReports();
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.reports).toHaveLength(1);
        expect(result.data.storage_location).toBe('S3');
        expect(s3Service.listReports).toHaveBeenCalled();
      });
  
      it('should fallback to local reports when S3 fails', async () => {
        // Setup
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.listReports.mockRejectedValue(new Error('S3 list failed'));
        s3Service.listLocalReports.mockResolvedValue([
          {
            filename: 'local-report.json',
            city: 'test',
            date: '2025-09-07',
            storage: 'Local'
          }
        ]);
        
        // Execute
        const result = await reportService.listReports();
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.storage_location).toBe('Local (S3 failed)');
        expect(s3Service.listLocalReports).toHaveBeenCalled();
      });
  
      it('should use local storage when AWS access is not available', async () => {
        // Setup
        s3Service.hasAWSAccess.mockResolvedValue(false);
        s3Service.listLocalReports.mockResolvedValue([]);
        
        // Execute
        const result = await reportService.listReports();
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.storage_location).toBe('Local');
        expect(s3Service.listReports).not.toHaveBeenCalled();
      });
    });
  
    describe('getReport', () => {
      it('should retrieve report from S3 when available', async () => {
        // Setup
        const filename = 'test-report.json';
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.getReport.mockResolvedValue({
          success: true,
          data: {
            filename: filename,
            storage_location: 'S3',
            report: { metadata: { city: 'Test' } }
          }
        });
        
        // Execute
        const result = await reportService.getReport(filename);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.storage_location).toBe('S3');
        expect(s3Service.getReport).toHaveBeenCalledWith(filename);
      });
  
      it('should fallback to local storage when S3 fails', async () => {
        // Setup
        const filename = 'test-report.json';
        s3Service.hasAWSAccess.mockResolvedValue(true);
        s3Service.getReport.mockRejectedValue(new Error('S3 get failed'));
        s3Service.getLocalReport.mockResolvedValue({
          success: true,
          data: {
            filename: filename,
            storage_location: 'Local',
            report: { metadata: { city: 'Test' } }
          }
        });
        
        // Execute
        const result = await reportService.getReport(filename);
        
        // Assert
        expect(result.success).toBe(true);
        expect(result.data.storage_location).toBe('Local');
        expect(s3Service.getLocalReport).toHaveBeenCalledWith(filename);
      });
  
      it('should handle report not found error', async () => {
        // Setup
        const filename = 'nonexistent.json';
        s3Service.hasAWSAccess.mockResolvedValue(true);
        
        const s3Error = new Error('NoSuchKey');
        s3Error.name = 'NoSuchKey';
        s3Service.getReport.mockRejectedValue(s3Error);
        
        const localError = new Error('ENOENT');
        localError.code = 'ENOENT';
        s3Service.getLocalReport.mockRejectedValue(localError);
        
        // Execute & Assert
        await expect(reportService.getReport(filename))
          .rejects.toThrow();
      });
    });
  
    describe('Error handling', () => {
      it('should handle missing API keys error', async () => {
        // Setup - mock config to simulate missing keys
        jest.doMock('../../src/config/environment', () => ({
          config: {
            weatherApiKey: null,
            newsApiKey: 'test_key'
          }
        }));
        
        // Execute & Assert
        await expect(reportService.generateReport('Test', 'US'))
          .rejects.toThrow();
      });
    });
  });