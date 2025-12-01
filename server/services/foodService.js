/**
 * Food Discovery Service
 * 美食发现服务 - 周边美食发现
 */
const Food = require('../models/Food');

class FoodService {
  /**
   * Discover nearby food merchants
   * @param {Object} options - Discovery options
   * @param {number} options.longitude - User longitude
   * @param {number} options.latitude - User latitude
   * @param {Object} options.preferences - User preferences
   * @param {number} options.radius - Search radius in meters
   * @param {number} options.limit - Number of results
   * @returns {Array} Recommended restaurants
   */
  async discoverNearby(options = {}) {
    const {
      longitude,
      latitude,
      preferences = {},
      radius = 3000,
      limit = 20
    } = options;

    if (!longitude || !latitude) {
      throw new Error('请提供位置信息');
    }

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      },
      status: 'active'
    };

    // Apply cuisine filter
    if (preferences.foodPreferences && preferences.foodPreferences.length > 0) {
      query.cuisine = { $in: preferences.foodPreferences };
    }

    // Apply price filter
    if (preferences.priceRange) {
      query['priceRange.average'] = {
        $gte: preferences.priceRange.min || 0,
        $lte: preferences.priceRange.max || 9999
      };
    }

    const restaurants = await Food.find(query).limit(limit * 2); // Get more for scoring

    // Calculate match scores
    const scoredRestaurants = restaurants.map(restaurant => {
      const matchScore = restaurant.calculateMatchScore(preferences);
      const distance = this.calculateDistance(
        [longitude, latitude],
        restaurant.location.coordinates
      );

      return {
        restaurant,
        matchScore,
        distance
      };
    });

    // Sort by match score
    scoredRestaurants.sort((a, b) => b.matchScore - a.matchScore);

    return scoredRestaurants.slice(0, limit).map(item => ({
      id: item.restaurant._id,
      name: item.restaurant.name,
      cuisine: item.restaurant.cuisine,
      subCategory: item.restaurant.subCategory,
      rating: item.restaurant.rating,
      priceRange: item.restaurant.priceRange,
      priceLevel: item.restaurant.priceLevel,
      location: item.restaurant.location,
      coverImage: item.restaurant.coverImage,
      features: item.restaurant.features,
      distance: Math.round(item.distance),
      matchScore: Math.round(item.matchScore * 100) / 100
    }));
  }

  /**
   * Get restaurant details
   * @param {string} restaurantId - Restaurant ID
   * @returns {Object} Restaurant details
   */
  async getRestaurantDetails(restaurantId) {
    const restaurant = await Food.findById(restaurantId);
    if (!restaurant) {
      throw new Error('餐厅不存在');
    }

    // Increment view count
    restaurant.popularity.viewCount += 1;
    await restaurant.save();

    return restaurant;
  }

  /**
   * Search restaurants by keyword
   * @param {string} keyword - Search keyword
   * @param {Object} options - Search options
   * @returns {Array} Matching restaurants
   */
  async searchRestaurants(keyword, options = {}) {
    const {
      longitude,
      latitude,
      radius = 10000,
      limit = 20
    } = options;

    const query = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [keyword] } },
        { subCategory: { $regex: keyword, $options: 'i' } }
      ],
      status: 'active'
    };

    // Add location filter if provided
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      };
    }

    const restaurants = await Food.find(query).limit(limit);

    return restaurants.map(r => ({
      id: r._id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      priceLevel: r.priceLevel,
      location: r.location,
      coverImage: r.coverImage
    }));
  }

  /**
   * Get restaurants by cuisine type
   * @param {string} cuisine - Cuisine type
   * @param {Object} options - Query options
   * @returns {Array} Restaurants
   */
  async getRestaurantsByCuisine(cuisine, options = {}) {
    const {
      longitude,
      latitude,
      radius = 5000,
      limit = 20
    } = options;

    const query = {
      cuisine,
      status: 'active'
    };

    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      };
    }

    const restaurants = await Food.find(query)
      .sort({ 'rating.average': -1 })
      .limit(limit);

    return restaurants;
  }

  /**
   * Get popular restaurants
   * @param {Object} options - Query options
   * @returns {Array} Popular restaurants
   */
  async getPopularRestaurants(options = {}) {
    const { longitude, latitude, limit = 10 } = options;

    let query = { status: 'active' };

    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 10000
        }
      };
    }

    const restaurants = await Food.find(query)
      .sort({ 'popularity.orderCount': -1, 'rating.average': -1 })
      .limit(limit);

    return restaurants;
  }

  /**
   * Calculate distance between two coordinates
   * @param {Array} coord1 - [lng, lat]
   * @param {Array} coord2 - [lng, lat]
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    const R = 6371000;
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

module.exports = new FoodService();
