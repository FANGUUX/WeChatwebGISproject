/**
 * User Controller
 * 用户控制器 - 处理用户账户相关请求
 */
const { body } = require('express-validator');
const authService = require('../services/authService');
const User = require('../models/User');

// Validation rules
const registerValidation = [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
];

const loginValidation = [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').notEmpty().withMessage('请输入密码')
];

const profileValidation = [
  body('nickname').optional().isLength({ max: 20 }).withMessage('昵称最长20个字符'),
  body('gender').optional().isIn([0, 1, 2]).withMessage('性别值无效')
];

const preferencesValidation = [
  body('favoriteCategories').optional().isArray().withMessage('分类偏好必须是数组'),
  body('preferredTransport').optional().isIn(['walking', 'driving', 'transit', 'cycling']).withMessage('交通方式无效')
];

/**
 * WeChat login
 */
const wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '请提供微信授权码'
      });
    }

    const { user, token } = await authService.wechatLogin(code);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phone register
 */
const register = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const { user, token } = await authService.phoneLogin(phone, password, true);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phone login
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const { user, token } = await authService.phoneLogin(phone, password, false);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        phone: user.phone,
        birthday: user.birthday,
        city: user.city,
        province: user.province,
        preferences: user.preferences,
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.userId, req.body);

    res.json({
      success: true,
      message: '个人资料已更新',
      data: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        city: user.city,
        province: user.province
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await authService.updatePreferences(req.userId, req.body);

    res.json({
      success: true,
      message: '偏好设置已更新',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record user behavior
 */
const recordBehavior = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    
    if (!['view', 'search', 'visit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的行为类型'
      });
    }

    const user = await User.findById(req.userId);
    await user.addBehavior(type, data);

    res.json({
      success: true,
      message: '行为已记录'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user behavior statistics
 */
const getBehaviorStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        viewedCount: user.behaviorData?.viewedAttractions?.length || 0,
        searchCount: user.behaviorData?.searchHistory?.length || 0,
        visitedCount: user.behaviorData?.visitedPlaces?.length || 0,
        recentSearches: user.behaviorData?.searchHistory?.slice(-10) || []
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Validations
  registerValidation,
  loginValidation,
  profileValidation,
  preferencesValidation,
  // Handlers
  wechatLogin,
  register,
  login,
  getProfile,
  updateProfile,
  updatePreferences,
  getPreferences,
  recordBehavior,
  getBehaviorStats
};
