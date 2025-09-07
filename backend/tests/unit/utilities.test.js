const validators = require('../../src/utils/validators');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../src/utils/constants');

describe('Utilities', () => {
  describe('Validators', () => {
    test('should validate city correctly', () => {
      const validResult = validators.validateCity('Mumbai');
      expect(validResult.isValid).toBe(true);
      expect(validResult.value).toBe('Mumbai');

      const invalidResult = validators.validateCity('');
      expect(invalidResult.isValid).toBe(false);
    });

    test('should validate country code correctly', () => {
      const validResult = validators.validateCountry('IN');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validators.validateCountry('INVALID');
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Constants', () => {
    test('should have required constants', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(ERROR_MESSAGES.CITY_REQUIRED).toBeDefined();
    });
  });
});
