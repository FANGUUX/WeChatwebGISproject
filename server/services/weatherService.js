/**
 * Weather Service
 * 天气服务 - 第三方服务集成
 */
const config = require('../config');

class WeatherService {
  constructor() {
    this.apiKey = config.thirdParty.weather.apiKey;
    this.baseUrl = config.thirdParty.weather.baseUrl;
  }

  /**
   * Get current weather for a location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Object} Weather data
   */
  async getCurrentWeather(latitude, longitude) {
    // In production, this would call the actual weather API
    // For now, return mock data
    if (!this.apiKey) {
      return this.getMockWeather();
    }

    try {
      // Simulated API call structure
      // const response = await fetch(`${this.baseUrl}/current.json?key=${this.apiKey}&q=${latitude},${longitude}`);
      // const data = await response.json();
      
      // Return mock data for development
      return this.getMockWeather();
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getMockWeather();
    }
  }

  /**
   * Get weather forecast
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} days - Number of forecast days
   * @returns {Object} Forecast data
   */
  async getForecast(latitude, longitude, days = 3) {
    // In production, this would call the actual weather API
    return {
      location: {
        lat: latitude,
        lon: longitude
      },
      forecast: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
        temperature: {
          max: 25 + Math.floor(Math.random() * 10),
          min: 15 + Math.floor(Math.random() * 5)
        },
        humidity: 50 + Math.floor(Math.random() * 30)
      }))
    };
  }

  /**
   * Get mock weather data for development
   * @returns {Object} Mock weather data
   */
  getMockWeather() {
    const conditions = ['sunny', 'cloudy', 'rainy'];
    return {
      condition: conditions[Math.floor(Math.random() * 3)],
      temperature: {
        current: 22 + Math.floor(Math.random() * 8),
        feelsLike: 21 + Math.floor(Math.random() * 8)
      },
      humidity: 55 + Math.floor(Math.random() * 20),
      wind: {
        speed: 5 + Math.floor(Math.random() * 15),
        direction: 'NE'
      },
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = new WeatherService();
