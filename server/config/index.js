/**
 * Server Configuration
 * 服务器配置
 */
require('dotenv').config();

module.exports = {
  // Server settings
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database settings
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wechat_webgis'
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // WeChat Mini Program settings
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || ''
  },

  // Third-party API settings
  thirdParty: {
    // Weather API
    weather: {
      apiKey: process.env.WEATHER_API_KEY || '',
      baseUrl: process.env.WEATHER_API_URL || 'https://api.weatherapi.com/v1'
    },
    // Map API (e.g., Amap/Gaode)
    map: {
      apiKey: process.env.MAP_API_KEY || '',
      baseUrl: process.env.MAP_API_URL || 'https://restapi.amap.com/v3'
    }
  },

  // Recommendation settings
  recommendation: {
    defaultLimit: 10,
    weights: {
      rating: 0.4,
      weather: 0.3,
      passengerFlow: 0.3
    }
  }
};
