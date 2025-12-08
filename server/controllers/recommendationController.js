/**
 * Recommendation Controller
 * 推荐控制器 - 处理景点推荐请求
 */
const { query } = require('express-validator');
const recommendationService = require('../services/recommendationService');
const Attraction = require('../models/Attraction');

// Helper function to transform attraction for response
const transformAttractionResponse = (attraction) => ({
  id: attraction._id,
  name: attraction.name,
  category: attraction.category,
  rating: attraction.rating,
  location: attraction.location,
  ticketPrice: attraction.ticketPrice,
  coverImage: attraction.coverImage,
  recommendedDuration: attraction.recommendedDuration
});

// Validation rules
const recommendationValidation = [
  query('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('经度值无效'),
  query('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('纬度值无效'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('数量限制必须在1-50之间')
];

/**
 * Get TOP10 attraction recommendations
 */
const getRecommendations = async (req, res, next) => {
  try {
    const { longitude, latitude, limit } = req.query;
    
    // Get user preferences if authenticated
    const userPreferences = req.user?.preferences || {};

    const recommendations = await recommendationService.getRecommendations({
      longitude: longitude ? parseFloat(longitude) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      userPreferences,
      limit: limit ? parseInt(limit) : 10
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personalized recommendations based on user behavior
 */
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getPersonalizedRecommendations(
      req.userId,
      limit
    );

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attraction details
 */
const getAttractionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: '景点不存在'
      });
    }

    // Record view behavior if user is authenticated
    if (req.user) {
      await req.user.addBehavior('view', { attractionId: id });
    }

    res.json({
      success: true,
      data: attraction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attractions by category
 */
const getAttractionsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { longitude, latitude, limit = 20 } = req.query;

    const query = { 
      category,
      status: 'active'
    };

    let attractions;
    if (longitude && latitude) {
      attractions = await Attraction.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: 50000
          }
        }
      }).limit(parseInt(limit));
    } else {
      attractions = await Attraction.find(query)
        .sort({ 'rating.average': -1 })
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        attractions: attractions.map(transformAttractionResponse),
        total: attractions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search attractions
 */
const searchAttractions = async (req, res, next) => {
  try {
    const { keyword, longitude, latitude, limit = 20 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    // Record search behavior if user is authenticated
    if (req.user) {
      await req.user.addBehavior('search', { keyword });
    }

    const query = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [keyword] } },
        { description: { $regex: keyword, $options: 'i' } }
      ],
      status: 'active'
    };

    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: 100000
        }
      };
    }

    const attractions = await Attraction.find(query).limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        attractions: attractions.map(transformAttractionResponse),
        total: attractions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby attractions
 */
const getNearbyAttractions = async (req, res, next) => {
  try {
    const { longitude, latitude, radius = 5000, limit = 20 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: '请提供位置信息'
      });
    }

    const attractions = await Attraction.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(radius)
    ).limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        attractions: attractions.map(transformAttractionResponse),
        total: attractions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Validations
  recommendationValidation,
  // Handlers
  getRecommendations,
  getPersonalizedRecommendations,
  getAttractionDetails,
  getAttractionsByCategory,
  searchAttractions,
  getNearbyAttractions
};
