/**
 * Recommendation Service
 * 推荐服务 - 智能景点推荐
 */
const config = require('../config');
const Attraction = require('../models/Attraction');
const WeatherService = require('./weatherService');

class RecommendationService {
  constructor() {
    this.weights = config.recommendation.weights;
    this.defaultLimit = config.recommendation.defaultLimit;
  }

  /**
   * Get TOP10 attraction recommendations
   * @param {Object} options - Recommendation options
   * @param {number} options.longitude - User longitude
   * @param {number} options.latitude - User latitude
   * @param {Object} options.userPreferences - User preferences
   * @param {number} options.limit - Number of recommendations
   * @returns {Array} Recommended attractions
   */
  async getRecommendations(options = {}) {
    const {
      longitude,
      latitude,
      userPreferences = {},
      limit = this.defaultLimit
    } = options;

    // Get current weather condition
    let weatherCondition = 'sunny';
    try {
      const weather = await WeatherService.getCurrentWeather(latitude, longitude);
      weatherCondition = this.mapWeatherCondition(weather);
    } catch {
      // Use default weather if API fails
      console.log('Weather API unavailable, using default condition');
    }

    // Build query
    const query = { status: 'active' };

    // Category filter based on user preferences
    if (userPreferences.favoriteCategories && userPreferences.favoriteCategories.length > 0) {
      query.category = { $in: userPreferences.favoriteCategories };
    }

    // Price filter
    if (userPreferences.priceRange) {
      query['ticketPrice.adult'] = {
        $gte: userPreferences.priceRange.min || 0,
        $lte: userPreferences.priceRange.max || 9999
      };
    }

    // Location-based query if coordinates provided
    let attractions;
    if (longitude && latitude) {
      attractions = await Attraction.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 50000 // 50km radius
          }
        }
      });
    } else {
      attractions = await Attraction.find(query);
    }

    // Calculate recommendation scores
    const scoredAttractions = attractions.map(attraction => {
      const score = attraction.calculateRecommendationScore(weatherCondition, this.weights);
      
      // Boost score based on user category preferences
      let preferenceBoost = 0;
      if (userPreferences.favoriteCategories?.includes(attraction.category)) {
        preferenceBoost = 0.1;
      }

      // Reduce score if user avoids crowds and place is crowded
      let crowdPenalty = 0;
      if (userPreferences.avoidCrowds) {
        const flowRatio = attraction.passengerFlow.current / attraction.passengerFlow.capacity;
        if (flowRatio > 0.7) {
          crowdPenalty = 0.2;
        }
      }

      return {
        attraction,
        score: score + preferenceBoost - crowdPenalty,
        weatherCondition,
        crowdLevel: this.getCrowdLevel(attraction.passengerFlow)
      };
    });

    // Sort by score and return top results
    scoredAttractions.sort((a, b) => b.score - a.score);

    return scoredAttractions.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      id: item.attraction._id,
      name: item.attraction.name,
      category: item.attraction.category,
      rating: item.attraction.rating,
      location: item.attraction.location,
      ticketPrice: item.attraction.ticketPrice,
      coverImage: item.attraction.coverImage,
      recommendedDuration: item.attraction.recommendedDuration,
      score: Math.round(item.score * 100) / 100,
      weatherCondition: item.weatherCondition,
      crowdLevel: item.crowdLevel
    }));
  }

  /**
   * Map weather API response to our weather categories
   * @param {Object} weather - Weather data
   * @returns {string} Weather condition
   */
  mapWeatherCondition(weather) {
    if (!weather || !weather.condition) return 'sunny';

    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain') || condition.includes('shower')) return 'rainy';
    if (condition.includes('snow')) return 'snowy';
    if (condition.includes('cloud') || condition.includes('overcast')) return 'cloudy';
    return 'sunny';
  }

  /**
   * Get crowd level description
   * @param {Object} passengerFlow - Passenger flow data
   * @returns {string} Crowd level
   */
  getCrowdLevel(passengerFlow) {
    const ratio = passengerFlow.current / passengerFlow.capacity;
    if (ratio < 0.3) return '空闲';
    if (ratio < 0.6) return '适中';
    if (ratio < 0.8) return '较多';
    return '拥挤';
  }

  /**
   * Get personalized recommendations based on user behavior
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @returns {Array} Recommended attractions
   */
  async getPersonalizedRecommendations(userId, limit = 10) {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // Analyze user behavior
    const viewedCategories = {};
    const viewedAttractions = user.behaviorData?.viewedAttractions || [];

    // Get categories of viewed attractions
    for (const viewed of viewedAttractions.slice(-20)) {
      try {
        const attraction = await Attraction.findById(viewed.attractionId);
        if (attraction) {
          viewedCategories[attraction.category] = (viewedCategories[attraction.category] || 0) + viewed.viewCount;
        }
      } catch {
        continue;
      }
    }

    // Build preference from behavior
    const inferredPreferences = {
      ...user.preferences,
      favoriteCategories: Object.entries(viewedCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category)
    };

    // Exclude already visited places
    const visitedIds = user.behaviorData?.visitedPlaces?.map(v => v.placeId) || [];

    const recommendations = await this.getRecommendations({
      userPreferences: inferredPreferences,
      limit: limit + visitedIds.length
    });

    // Filter out visited places
    return recommendations
      .filter(rec => !visitedIds.some(id => id.toString() === rec.id.toString()))
      .slice(0, limit);
  }
}

module.exports = new RecommendationService();
