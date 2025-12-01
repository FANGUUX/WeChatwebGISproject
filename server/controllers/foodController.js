/**
 * Food Controller
 * 美食控制器 - 处理周边美食发现请求
 */
const { query, param } = require('express-validator');
const foodService = require('../services/foodService');

// Validation rules
const discoverValidation = [
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('经度值无效'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('纬度值无效'),
  query('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('搜索半径必须在100-50000米之间'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('数量限制必须在1-50之间')
];

const searchValidation = [
  query('keyword').notEmpty().withMessage('请输入搜索关键词')
];

/**
 * Discover nearby food merchants
 */
const discoverNearby = async (req, res, next) => {
  try {
    const { longitude, latitude, radius, limit } = req.query;
    
    // Get user preferences if authenticated
    const preferences = req.user?.preferences || {};

    const restaurants = await foodService.discoverNearby({
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      preferences,
      radius: radius ? parseInt(radius) : 3000,
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: {
        restaurants,
        total: restaurants.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant details
 */
const getRestaurantDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const restaurant = await foodService.getRestaurantDetails(id);

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search restaurants
 */
const searchRestaurants = async (req, res, next) => {
  try {
    const { keyword, longitude, latitude, radius, limit } = req.query;

    const restaurants = await foodService.searchRestaurants(keyword, {
      longitude: longitude ? parseFloat(longitude) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      radius: radius ? parseInt(radius) : 10000,
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: {
        restaurants,
        total: restaurants.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurants by cuisine
 */
const getRestaurantsByCuisine = async (req, res, next) => {
  try {
    const { cuisine } = req.params;
    const { longitude, latitude, radius, limit } = req.query;

    const restaurants = await foodService.getRestaurantsByCuisine(cuisine, {
      longitude: longitude ? parseFloat(longitude) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      radius: radius ? parseInt(radius) : 5000,
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: {
        restaurants,
        total: restaurants.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular restaurants
 */
const getPopularRestaurants = async (req, res, next) => {
  try {
    const { longitude, latitude, limit } = req.query;

    const restaurants = await foodService.getPopularRestaurants({
      longitude: longitude ? parseFloat(longitude) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      limit: limit ? parseInt(limit) : 10
    });

    res.json({
      success: true,
      data: {
        restaurants,
        total: restaurants.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available cuisines
 */
const getCuisineTypes = async (req, res) => {
  const cuisines = [
    { id: 'chinese', name: '中餐', icon: '🥢' },
    { id: 'western', name: '西餐', icon: '🍽️' },
    { id: 'japanese', name: '日料', icon: '🍣' },
    { id: 'korean', name: '韩餐', icon: '🍲' },
    { id: 'thai', name: '泰餐', icon: '🍛' },
    { id: 'indian', name: '印度菜', icon: '🍛' },
    { id: 'italian', name: '意餐', icon: '🍕' },
    { id: 'french', name: '法餐', icon: '🥐' },
    { id: 'mexican', name: '墨西哥菜', icon: '🌮' },
    { id: 'other', name: '其他', icon: '🍴' }
  ];

  res.json({
    success: true,
    data: cuisines
  });
};

module.exports = {
  // Validations
  discoverValidation,
  searchValidation,
  // Handlers
  discoverNearby,
  getRestaurantDetails,
  searchRestaurants,
  getRestaurantsByCuisine,
  getPopularRestaurants,
  getCuisineTypes
};
