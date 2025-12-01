/**
 * User Routes
 * 用户路由 - 用户账户与管理
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');
const userController = require('../controllers/userController');

// Public routes - 公开路由

// WeChat login
router.post('/login/wechat', authLimiter, userController.wechatLogin);

// Phone register
router.post('/register',
  authLimiter,
  userController.registerValidation,
  handleValidationErrors,
  userController.register
);

// Phone login
router.post('/login',
  authLimiter,
  userController.loginValidation,
  handleValidationErrors,
  userController.login
);

// Protected routes - 需要登录

// Get profile
router.get('/profile', authenticate, userController.getProfile);

// Update profile
router.put('/profile',
  authenticate,
  userController.profileValidation,
  handleValidationErrors,
  userController.updateProfile
);

// Get preferences
router.get('/preferences', authenticate, userController.getPreferences);

// Update preferences
router.put('/preferences',
  authenticate,
  userController.preferencesValidation,
  handleValidationErrors,
  userController.updatePreferences
);

// Record behavior
router.post('/behavior', authenticate, userController.recordBehavior);

// Get behavior stats
router.get('/behavior/stats', authenticate, userController.getBehaviorStats);

module.exports = router;
