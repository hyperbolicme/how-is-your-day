// tests/unit/reportController.test.js - Report Controller Test
// Mock the report service
jest.mock('../../src/services/reportService', () => ({
    generateReport: jest.fn(),
    listReports: jest.fn(),
    getReport: jest.fn()
  }));
  
  const reportController = require('../../src/controllers/reportController');
  const reportService = require('../../src/services/reportService');
  const { HTTP_STATUS } = require('../../src/utils/constants');
  
  describe('ReportController', () => {
    let req, res, next;
  
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock Express req, res, next
      req = {
        validatedBody: {},
        params: {}
      };
      res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };
      next = jest.fn();
    });
  
    describe('generateReport', () => {
      it('should generate report successfully', async () => {
        // Setup
        req.validatedBody = { city: 'Mumbai', country: 'IN' };
        
        const mockReportResponse = {
          success: true,
          message: 'Daily report generated and stored successfully!',
          report: {
            filename: 'mumbai-2025-09-07-1694087654.json',
            city: 'Mumbai',
            date: '2025-09-07',
            generated_at: '2025-09-07T12:00:00.000Z',
            size_bytes: 2048,
            storage: {
              location: 'S3',
              s3_key: 'reports/default_user/mumbai-2025-09-07-1694087654.json'
            }
          },
          preview: {
            current_temp: '28°C',
            weather_desc: 'clear sky',
            top_headline: 'Breaking: Local news update',
            forecast_items: 5,
            news_items: 3
          }
        };
        
        reportService.generateReport.mockResolvedValue(mockReportResponse);
        
        // Execute
        await reportController.generateReport(req, res, next);
        
        // Assert
        expect(reportService.generateReport).toHaveBeenCalledWith('Mumbai', 'IN');
        expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
        expect(res.json).toHaveBeenCalledWith(mockReportResponse);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle report generation errors', async () => {
        // Setup
        req.validatedBody = { city: 'InvalidCity', country: 'XX' };
        const error = new Error('Failed to fetch weather data: City not found');
        
        reportService.generateReport.mockRejectedValue(error);
        
        // Execute
        await reportController.generateReport(req, res, next);
        
        // Assert
        expect(reportService.generateReport).toHaveBeenCalledWith('InvalidCity', 'XX');
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
  
      it('should use default values when not provided', async () => {
        // Setup
        req.validatedBody = {}; // Empty body, should use defaults
        
        const mockResponse = { success: true, report: {} };
        reportService.generateReport.mockResolvedValue(mockResponse);
        
        // Execute
        await reportController.generateReport(req, res, next);
        
        // Assert
        expect(reportService.generateReport).toHaveBeenCalledWith(undefined, undefined);
      });
    });
  
    describe('listReports', () => {
      it('should return list of reports successfully', async () => {
        // Setup
        const mockReportsResponse = {
          success: true,
          message: 'Found 3 reports',
          data: {
            reports: [
              {
                filename: 'mumbai-2025-09-07-1694087654.json',
                city: 'mumbai',
                date: '2025-09-07',
                size: 2048,
                storage: 'S3'
              },
              {
                filename: 'delhi-2025-09-06-1694001254.json',
                city: 'delhi',
                date: '2025-09-06',
                size: 1536,
                storage: 'S3'
              },
              {
                filename: 'bangalore-2025-09-05-1693914854.json',
                city: 'bangalore',
                date: '2025-09-05',
                size: 1792,
                storage: 'Local'
              }
            ],
            total_count: 3,
            storage_location: 'S3'
          }
        };
        
        reportService.listReports.mockResolvedValue(mockReportsResponse);
        
        // Execute
        await reportController.listReports(req, res, next);
        
        // Assert
        expect(reportService.listReports).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockReportsResponse);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle empty reports list', async () => {
        // Setup
        const mockEmptyResponse = {
          success: true,
          message: 'Found 0 local reports',
          data: {
            reports: [],
            total_count: 0,
            storage_location: 'Local'
          }
        };
        
        reportService.listReports.mockResolvedValue(mockEmptyResponse);
        
        // Execute
        await reportController.listReports(req, res, next);
        
        // Assert
        expect(reportService.listReports).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockEmptyResponse);
      });
  
      it('should handle list reports errors', async () => {
        // Setup
        const error = new Error('Failed to access storage');
        
        reportService.listReports.mockRejectedValue(error);
        
        // Execute
        await reportController.listReports(req, res, next);
        
        // Assert
        expect(reportService.listReports).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
    });
  
    describe('getReport', () => {
      it('should return specific report successfully', async () => {
        // Setup
        req.params = { filename: 'mumbai-2025-09-07-1694087654.json' };
        
        const mockReportResponse = {
          success: true,
          message: 'Report retrieved successfully',
          data: {
            filename: 'mumbai-2025-09-07-1694087654.json',
            storage_location: 'S3',
            s3_key: 'reports/default_user/mumbai-2025-09-07-1694087654.json',
            size: 2048,
            last_modified: '2025-09-07T12:00:00.000Z',
            content_type: 'application/json',
            report: {
              metadata: {
                city: 'Mumbai',
                date: '2025-09-07',
                generated_at: '2025-09-07T12:00:00.000Z'
              },
              weather: {
                current: {
                  temperature: 28,
                  description: 'clear sky'
                }
              },
              news: {
                headlines: [
                  {
                    title: 'Local News Update',
                    description: 'Important local update'
                  }
                ]
              }
            }
          }
        };
        
        reportService.getReport.mockResolvedValue(mockReportResponse);
        
        // Execute
        await reportController.getReport(req, res, next);
        
        // Assert
        expect(reportService.getReport).toHaveBeenCalledWith('mumbai-2025-09-07-1694087654.json');
        expect(res.json).toHaveBeenCalledWith(mockReportResponse);
        expect(next).not.toHaveBeenCalled();
      });
  
      it('should handle report not found errors', async () => {
        // Setup
        req.params = { filename: 'nonexistent-report.json' };
        const error = new Error('Report not found in S3 or local storage');
        error.status = 404;
        
        reportService.getReport.mockRejectedValue(error);
        
        // Execute
        await reportController.getReport(req, res, next);
        
        // Assert
        expect(reportService.getReport).toHaveBeenCalledWith('nonexistent-report.json');
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
      });
  
      it('should handle invalid filename parameter', async () => {
        // Setup
        req.params = {}; // Missing filename
        
        const mockResponse = { success: true, data: {} };
        reportService.getReport.mockResolvedValue(mockResponse);
        
        // Execute
        await reportController.getReport(req, res, next);
        
        // Assert
        expect(reportService.getReport).toHaveBeenCalledWith(undefined);
      });
    });
  });