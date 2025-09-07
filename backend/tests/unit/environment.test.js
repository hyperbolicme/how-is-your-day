describe('Environment Configuration', () => {
  test('should load environment config', () => {
    const { config } = require('../../src/config/environment');
    
    expect(config).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.nodeEnv).toBe('test');
  });

  test('should have all required config properties', () => {
    const { config } = require('../../src/config/environment');
    
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('aws');
    expect(config).toHaveProperty('cache');
  });
});
