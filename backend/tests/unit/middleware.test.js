// tests/unit/middleware.test.js - Middleware Tests
describe('Middleware Components', () => {
    describe('CORS Middleware', () => {
      it('should import CORS middleware without errors', () => {
        expect(() => {
          require('../../src/middleware/cors');
        }).not.toThrow();
      });
    });
  
    describe('Error Handler Middleware', () => {
      it('should import error handler without errors', () => {
        expect(() => {
          const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
          expect(typeof errorHandler).toBe('function');
          expect(typeof notFoundHandler).toBe('function');
        }).not.toThrow();
      });
    });
  
    describe('Validation Middleware', () => {
      it('should import validation middleware without errors', () => {
        expect(() => {
          const validation = require('../../src/middleware/validation');
          expect(typeof validation.validateWeather).toBe('function');
          expect(typeof validation.validateNews).toBe('function');
          expect(typeof validation.validateReportGeneration).toBe('function');
        }).not.toThrow();
      });
    });
  });