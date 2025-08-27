const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making API request to: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        switch (response.status) {
          case 404:
            throw new Error(data.error || 'Resource not found');
          case 429:
            throw new Error('Too many requests. Please try again in a moment.');
          case 500:
            throw new Error('Service temporarily unavailable');
          case 502:
            throw new Error('External service unavailable');
          default:
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
      }

      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      
      // Network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Weather API calls
  async getWeather(city) {
    const endpoint = `/api/getweather?city=${encodeURIComponent(city)}`;
    return this.makeRequest(endpoint);
  }

  async getForecast(city) {
    const endpoint = `/api/getforecast?city=${encodeURIComponent(city)}`;
    return this.makeRequest(endpoint);
  }

  // News API calls
  async getNews(country, options = {}) {
    const { category = 'general', pageSize = 10 } = options;
    const endpoint = `/api/getnews?country=${encodeURIComponent(country)}&category=${category}&pageSize=${pageSize}`;
    return this.makeRequest(endpoint);
  }

  async getNewsGuardian(country, options = {}) {
    const { pageSize = 10, orderBy = 'relevance' } = options;
    const endpoint = `/api/getnews-guardian?country=${encodeURIComponent(country)}&pageSize=${pageSize}&orderBy=${orderBy}`;
    return this.makeRequest(endpoint);
  }

  async getNewsCombined(country, options = {}) {
    const { pageSize = 10 } = options;
    const endpoint = `/api/getnews-combined?country=${encodeURIComponent(country)}&pageSize=${pageSize}`;
    return this.makeRequest(endpoint);
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/api/health');
  }

  // Utility method to test backend connectivity
  async testConnection() {
    try {
      const response = await this.healthCheck();
      return { success: true, message: 'Backend connected successfully', data: response };
    } catch (error) {
      return { success: false, message: error.message, error };
    }
  }
}

export default new ApiService();