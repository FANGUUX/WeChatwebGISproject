/**
 * Recommendation Controller
 * 推荐控制器 - 处理景点推荐请求
 */
const { query } = require('express-validator');
const recommendationService = require('../services/recommendationService');
const Attraction = require('../models/Attraction');

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
    
    // Check for invalid/undefined IDs to prevent 500 error
    if (!id || id === 'undefined' || !require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的景点ID'
      });
    }
    
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
    const { longitude, latitude, limit = 20, page = 1 } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    // Validate parsed integers
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: '页码和数量必须是正整数'
      });
    }
    
    const skip = (parsedPage - 1) * parsedLimit;

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
      })
      .skip(skip)
      .limit(parsedLimit);
    } else {
      attractions = await Attraction.find(query)
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(parsedLimit);
    }

    // Map _id to id to match frontend expectations, remove duplicate _id
    const mappedAttractions = attractions.map(a => {
      const { _id, ...rest } = a.toObject();
      return { ...rest, id: _id };
    });

    res.json({
      success: true,
      data: {
        attractions: mappedAttractions,
        total: mappedAttractions.length,
        page: parsedPage,
        limit: parsedLimit
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
    const { keyword, longitude, latitude, limit = 20, page = 1 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    // Validate parsed integers
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: '页码和数量必须是正整数'
      });
    }
    
    const skip = (parsedPage - 1) * parsedLimit;

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

    const attractions = await Attraction.find(query)
      .skip(skip)
      .limit(parsedLimit);

    res.json({
      success: true,
      data: {
        attractions: attractions.map(a => ({
          id: a._id,
          name: a.name,
          category: a.category,
          rating: a.rating,
          location: a.location,
          coverImage: a.coverImage
        })),
        total: attractions.length,
        page: parsedPage,
        limit: parsedLimit
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
    const { longitude, latitude, radius = 5000, limit = 20, page = 1 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: '请提供位置信息'
      });
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    // Validate parsed integers
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: '页码和数量必须是正整数'
      });
    }
    
    const skip = (parsedPage - 1) * parsedLimit;

    const attractions = await Attraction.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(radius)
    )
    .skip(skip)
    .limit(parsedLimit);

    res.json({
      success: true,
      data: {
        attractions,
        total: attractions.length,
        page: parsedPage,
        limit: parsedLimit
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
