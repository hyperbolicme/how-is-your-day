describe('Phase 1 Setup Tests', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('Test environment variables are set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.WEATHER_API_KEY).toBe('test_weather_key');
  });

  test('Global test utilities are available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.generateMockWeatherData).toBeInstanceOf(Function);
  });
});
