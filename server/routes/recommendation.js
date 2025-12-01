/**
 * Recommendation Routes
 * 推荐路由 - 智能景点推荐
 */
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const recommendationController = require('../controllers/recommendationController');

// Public routes with optional auth (for personalization)

// Get TOP10 recommendations
router.get('/',
  optionalAuth,
  recommendationController.recommendationValidation,
  handleValidationErrors,
  recommendationController.getRecommendations
);

// Get nearby attractions
router.get('/nearby',
  optionalAuth,
  recommendationController.getNearbyAttractions
);

// Search attractions
router.get('/search',
  optionalAuth,
  recommendationController.searchAttractions
);

// Get attractions by category
router.get('/category/:category',
  optionalAuth,
  recommendationController.getAttractionsByCategory
);

// Get attraction details
router.get('/attractions/:id',
  optionalAuth,
  recommendationController.getAttractionDetails
);

// Protected routes

// Get personalized recommendations
router.get('/personalized',
  authenticate,
  recommendationController.getPersonalizedRecommendations
);

module.exports = router;
