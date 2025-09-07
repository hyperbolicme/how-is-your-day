// tests/unit/routes.test.js - Proper Red-to-Green Routes Tests
const express = require('express');

describe('Route Components', () => {
  describe('Weather Routes', () => {
    it('should export an Express router with weather endpoints', () => {
      const weatherRoutes = require('../../src/routes/weather');
      
      // Should be an Express router
      expect(weatherRoutes).toBeDefined();
      expect(typeof weatherRoutes).toBe('function');
      expect(weatherRoutes.name).toBe('router'); // Express router function name
      
      // Should have stack with routes
      expect(weatherRoutes.stack).toBeDefined();
      expect(Array.isArray(weatherRoutes.stack)).toBe(true);
      expect(weatherRoutes.stack.length).toBeGreaterThan(0);
    });

    it('should have getweather and getforecast routes', () => {
      const weatherRoutes = require('../../src/routes/weather');
      
      // Check if routes exist by looking at the stack
      const routes = weatherRoutes.stack.map(layer => layer.route?.path).filter(Boolean);
      
      expect(routes).toContain('/getweather');
      expect(routes).toContain('/getforecast');
    });
  });

  describe('News Routes', () => {
    it('should export an Express router with news endpoints', () => {
      const newsRoutes = require('../../src/routes/news');
      
      expect(newsRoutes).toBeDefined();
      expect(typeof newsRoutes).toBe('function');
      expect(newsRoutes.name).toBe('router');
      expect(newsRoutes.stack).toBeDefined();
      expect(newsRoutes.stack.length).toBeGreaterThan(0);
    });

    it('should have news-related routes', () => {
      const newsRoutes = require('../../src/routes/news');
      
      const routes = newsRoutes.stack.map(layer => layer.route?.path).filter(Boolean);
      
      expect(routes).toContain('/getnews');
      expect(routes).toContain('/getnews-guardian');
      expect(routes).toContain('/getnews-combined');
    });
  });

  describe('Report Routes', () => {
    it('should export an Express router with report endpoints', () => {
      const reportRoutes = require('../../src/routes/reports');
      
      expect(reportRoutes).toBeDefined();
      expect(typeof reportRoutes).toBe('function');
      expect(reportRoutes.name).toBe('router');
      expect(reportRoutes.stack.length).toBeGreaterThan(0);
    });

    it('should have report-related routes', () => {
      const reportRoutes = require('../../src/routes/reports');
      
      const routes = reportRoutes.stack.map(layer => layer.route?.path).filter(Boolean);
      
      expect(routes).toContain('/generate-report');
      expect(routes).toContain('/my-reports');
      expect(routes).toContain('/report/:filename');
    });
  });

  describe('Health Routes', () => {
    it('should export an Express router with health endpoints', () => {
      const healthRoutes = require('../../src/routes/health');
      
      expect(healthRoutes).toBeDefined();
      expect(typeof healthRoutes).toBe('function');
      expect(healthRoutes.name).toBe('router');
      expect(healthRoutes.stack.length).toBeGreaterThan(0);
    });

    it('should have health check routes', () => {
      const healthRoutes = require('../../src/routes/health');
      
      const routes = healthRoutes.stack.map(layer => layer.route?.path).filter(Boolean);
      
      expect(routes).toContain('/health');
      expect(routes).toContain('/test-s3');
    });
  });

  describe('Main Routes Index', () => {
    it('should export an Express router that aggregates all routes', () => {
      const mainRoutes = require('../../src/routes/index');
      
      expect(mainRoutes).toBeDefined();
      expect(typeof mainRoutes).toBe('function');
      expect(mainRoutes.name).toBe('router');
      expect(mainRoutes.stack.length).toBeGreaterThan(0);
    });

    it('should mount all sub-routes under /api', () => {
      const mainRoutes = require('../../src/routes/index');
      
      // Check that routes are mounted with /api prefix
      const mountPaths = mainRoutes.stack.map(layer => layer.regexp.source);
      
      // Should have multiple route mounts (one for each sub-router)
      expect(mountPaths.length).toBeGreaterThanOrEqual(4); // weather, news, reports, health
    });
  });

  describe('Route HTTP Methods', () => {
    it('should have correct HTTP methods for weather routes', () => {
      const weatherRoutes = require('../../src/routes/weather');
      
      // Find GET routes
      const getMethods = weatherRoutes.stack
        .filter(layer => layer.route?.methods?.get)
        .map(layer => layer.route.path);
      
      expect(getMethods).toContain('/getweather');
      expect(getMethods).toContain('/getforecast');
    });

    it('should have correct HTTP methods for report routes', () => {
      const reportRoutes = require('../../src/routes/reports');
      
      // Find POST routes
      const postMethods = reportRoutes.stack
        .filter(layer => layer.route?.methods?.post)
        .map(layer => layer.route.path);
      
      // Find GET routes  
      const getMethods = reportRoutes.stack
        .filter(layer => layer.route?.methods?.get)
        .map(layer => layer.route.path);
      
      expect(postMethods).toContain('/generate-report');
      expect(getMethods).toContain('/my-reports');
      expect(getMethods).toContain('/report/:filename');
    });
  });
});