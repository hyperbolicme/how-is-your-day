// tests/setup.js
// Global test setup

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5999'; // Different port for testing
process.env.WEATHER_API_KEY = 'test_weather_key';
process.env.NEWS_API_KEY = 'test_news_key';
process.env.NEWS_GUARDIAN_API_KEY = 'test_guardian_key';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate test data
  generateMockWeatherData: (city = 'TestCity') => ({
    name: city,
    sys: { country: 'TS' },
    main: {
      temp: 25,
      feels_like: 27,
      humidity: 60,
      pressure: 1013
    },
    weather: [{ description: 'clear sky', icon: '01d' }],
    wind: { speed: 5 },
    coord: { lat: 10, lon: 10 },
    sys: { sunrise: 1234567890, sunset: 1234567899 }
  }),
  
  generateMockForecastData: (city = 'TestCity') => ({
    city: { name: city, country: 'TS' },
    list: [
      {
        dt_txt: '2025-09-07 12:00:00',
        main: { temp: 26, humidity: 65 },
        weather: [{ description: 'partly cloudy', icon: '02d' }],
        wind: { speed: 4 }
      }
    ]
  }),
  
  generateMockNewsData: () => ({
    status: 'ok',
    totalResults: 5,
    articles: [
      {
        title: 'Test News Article',
        description: 'Test description',
        url: 'https://test.com/article',
        urlToImage: 'https://test.com/image.jpg',
        publishedAt: '2025-09-07T10:00:00Z',
        source: { name: 'Test Source' },
        author: 'Test Author'
      }
    ]
  })
};

// Global teardown
afterAll(async () => {
  // Clean up any test artifacts
  await new Promise(resolve => setTimeout(resolve, 100));
});