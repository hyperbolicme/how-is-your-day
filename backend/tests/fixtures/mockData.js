// tests/fixtures/mockData.js

const mockWeatherData = {
    success: {
      name: "Mumbai",
      sys: { country: "IN" },
      main: {
        temp: 28.5,
        feels_like: 32.1,
        humidity: 65,
        pressure: 1013
      },
      weather: [{ description: "clear sky", icon: "01d" }],
      wind: { speed: 5.2 },
      coord: { lat: 19.0759837, lon: 72.8776559 },
      sys: { sunrise: 1725679890, sunset: 1725723456 }
    },
    error404: {
      cod: "404",
      message: "city not found"
    }
  };
  
  const mockForecastData = {
    success: {
      city: { name: "Mumbai", country: "IN" },
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
    }
  };
  
  const mockNewsData = {
    newsApi: {
      status: "ok",
      totalResults: 38,
      articles: [
        {
          title: "Test News Article 1",
          description: "This is a test news article description",
          url: "https://example.com/news/1",
          urlToImage: "https://example.com/image1.jpg",
          publishedAt: "2025-09-07T10:00:00Z",
          source: { name: "Test News Source" },
          author: "Test Author"
        },
        {
          title: "Test News Article 2", 
          description: "Another test news article",
          url: "https://example.com/news/2",
          urlToImage: "https://example.com/image2.jpg", 
          publishedAt: "2025-09-07T09:30:00Z",
          source: { name: "Another News Source" },
          author: "Another Author"
        }
      ]
    },
    guardian: {
      response: {
        status: "ok",
        total: 15,
        results: [
          {
            id: "guardian/test-1",
            webTitle: "Test Guardian Article 1",
            webUrl: "https://theguardian.com/test/1",
            webPublicationDate: "2025-09-07T11:00:00Z",
            sectionName: "World news",
            fields: {
              thumbnail: "https://theguardian.com/thumb1.jpg",
              trailText: "Test Guardian article description"
            }
          }
        ]
      }
    }
  };
  
  const mockReportData = {
    metadata: {
      city: "TestCity",
      date: "2025-09-07",
      generated_at: "2025-09-07T12:00:00.000Z",
      report_version: "1.0",
      environment: "test"
    },
    weather: {
      current: {
        temperature: 25,
        feels_like: 27,
        humidity: 65,
        pressure: 1013,
        description: "clear sky",
        wind_speed: 5
      },
      forecast: [
        {
          datetime: "2025-09-07 12:00:00",
          temperature: 26,
          description: "partly cloudy",
          humidity: 68
        }
      ]
    },
    news: {
      headlines: [
        {
          title: "Test News Headline",
          description: "Test news description",
          source: "Test Source",
          published_at: "2025-09-07T10:00:00Z",
          url: "https://example.com/news"
        }
      ],
      total_articles: 1
    },
    summary: {
      weather_summary: "Current temperature in TestCity is 25°C with clear sky",
      top_news: "Test News Headline"
    }
  };
  
  // Mock functions for external APIs
  const createMockFetch = (responseData, status = 200, shouldFail = false) => {
    return jest.fn(() => {
      if (shouldFail) {
        return Promise.reject(new Error('Network error'));
      }
      
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(responseData)
      });
    });
  };
  
  // Mock S3 client responses
  const mockS3Responses = {
    putObject: {
      success: {
        ETag: '"mock-etag-12345"',
        Location: 'https://test-bucket.s3.amazonaws.com/test-key',
        Key: 'test-key',
        Bucket: 'test-bucket'
      }
    },
    listObjects: {
      success: {
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
        ],
        IsTruncated: false
      },
      empty: {
        Contents: [],
        IsTruncated: false
      }
    },
    getObject: {
      success: {
        Body: {
          async *[Symbol.asyncIterator]() {
            yield Buffer.from(JSON.stringify(mockReportData));
          }
        },
        ContentLength: 1024,
        LastModified: new Date('2025-09-07T12:00:00Z'),
        ContentType: 'application/json'
      }
    }
  };
  
  // Test utilities
  const testHelpers = {
    // Helper to create express app for testing
    createTestApp: () => {
      const express = require('express');
      const app = express();
      app.use(express.json());
      return app;
    },
  
    // Helper to generate test filenames
    generateTestFilename: (city = 'testcity', date = '2025-09-07') => {
      const timestamp = Math.floor(Date.now() / 1000);
      return `${city.toLowerCase()}-${date}-${timestamp}.json`;
    },
  
    // Helper to create mock cache directory
    createMockCacheDir: async () => {
      const fs = require('fs').promises;
      const path = require('path');
      const tempDir = path.join(__dirname, '../temp-cache');
      
      try {
        await fs.mkdir(tempDir, { recursive: true });
        return tempDir;
      } catch (error) {
        console.error('Failed to create mock cache dir:', error);
        throw error;
      }
    },
  
    // Helper to clean up test files
    cleanupTestFiles: async (directory) => {
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const files = await fs.readdir(directory);
        await Promise.all(
          files.map(file => fs.unlink(path.join(directory, file)))
        );
        await fs.rmdir(directory);
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    },
  
    // Helper to wait for async operations
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
    // Helper to create error responses
    createErrorResponse: (status, message) => ({
      ok: false,
      status: status,
      statusText: message,
      json: () => Promise.resolve({ error: message })
    })
  };
  
  module.exports = {
    mockWeatherData,
    mockForecastData,
    mockNewsData,
    mockReportData,
    mockS3Responses,
    createMockFetch,
    testHelpers
  };