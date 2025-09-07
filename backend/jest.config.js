// jest.config.js
module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Root directory for tests
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js$',
    
    // Coverage configuration
    collectCoverage: false, // Set to true when you want coverage reports
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/server.js', // Exclude main server file from coverage
      '!src/**/*.test.js',
      '!src/**/__tests__/**'
    ],
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Module paths
    moduleDirectories: ['node_modules', 'src'],
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Timeout for tests (useful for integration tests)
    testTimeout: 10000,
    
    // Test patterns
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/build/'
    ],
    
    // Verbose output
    verbose: true
  };