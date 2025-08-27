
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          //...options.headers,
        },
        //...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
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

  // News API calls (for future implementation)
  async getNews(country) {
    const endpoint = `/api/getnews?country=${encodeURIComponent(country)}`;
    return this.makeRequest(endpoint);
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/api/health');
  }
}

export default new ApiService();