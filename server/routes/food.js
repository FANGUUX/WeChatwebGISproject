/**
 * Food Routes
 * 美食路由 - 周边美食发现
 */
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const foodController = require('../controllers/foodController');

// Get cuisine types
router.get('/cuisines', foodController.getCuisineTypes);

// Discover nearby restaurants
router.get('/nearby',
  optionalAuth,
  foodController.discoverValidation,
  handleValidationErrors,
  foodController.discoverNearby
);

// Get popular restaurants
router.get('/popular', optionalAuth, foodController.getPopularRestaurants);

// Search restaurants
router.get('/search',
  foodController.searchValidation,
  handleValidationErrors,
  foodController.searchRestaurants
);

// Get restaurants by cuisine
router.get('/cuisine/:cuisine', optionalAuth, foodController.getRestaurantsByCuisine);

// Get restaurant details
router.get('/:id', foodController.getRestaurantDetails);

module.exports = router;
