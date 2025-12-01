/**
 * Admin Controller
 * 管理控制器 - 数据管理与系统支撑
 */
const { body, param, query } = require('express-validator');
const User = require('../models/User');
const Attraction = require('../models/Attraction');
const Food = require('../models/Food');

// Validation rules
const userStatusValidation = [
  body('status').isIn(['active', 'inactive', 'banned']).withMessage('状态值无效')
];

const userRoleValidation = [
  body('role').isIn(['user', 'admin', 'manager']).withMessage('角色值无效')
];

const attractionValidation = [
  body('name').notEmpty().withMessage('景点名称不能为空'),
  body('category').isIn(['nature', 'history', 'entertainment', 'culture', 'shopping', 'sports']).withMessage('分类无效'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('坐标格式无效')
];

const foodValidation = [
  body('name').notEmpty().withMessage('商家名称不能为空'),
  body('cuisine').isIn(['chinese', 'western', 'japanese', 'korean', 'thai', 'indian', 'italian', 'french', 'mexican', 'other']).withMessage('菜系无效'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('坐标格式无效')
];

/**
 * Get all users (admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, role, keyword } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (keyword) {
      query.$or = [
        { nickname: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -behaviorData')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户状态已更新',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户角色已更新',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create attraction
 */
const createAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.create(req.body);

    res.status(201).json({
      success: true,
      message: '景点已创建',
      data: attraction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update attraction
 */
const updateAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attraction = await Attraction.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: '景点不存在'
      });
    }

    res.json({
      success: true,
      message: '景点已更新',
      data: attraction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete attraction
 */
const deleteAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attraction = await Attraction.findByIdAndDelete(id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: '景点不存在'
      });
    }

    res.json({
      success: true,
      message: '景点已删除'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update passenger flow data
 */
const updatePassengerFlow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { current, capacity } = req.body;

    const attraction = await Attraction.findByIdAndUpdate(
      id,
      {
        passengerFlow: {
          current,
          capacity,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: '景点不存在'
      });
    }

    res.json({
      success: true,
      message: '客流数据已更新',
      data: attraction.passengerFlow
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create food merchant
 */
const createFood = async (req, res, next) => {
  try {
    const food = await Food.create(req.body);

    res.status(201).json({
      success: true,
      message: '商家已创建',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update food merchant
 */
const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;

    const food = await Food.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }

    res.json({
      success: true,
      message: '商家信息已更新',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete food merchant
 */
const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;

    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }

    res.json({
      success: true,
      message: '商家已删除'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAttractions,
      totalRestaurants
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Attraction.countDocuments({ status: 'active' }),
      Food.countDocuments({ status: 'active' })
    ]);

    // Get user registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        attractions: {
          total: totalAttractions
        },
        restaurants: {
          total: totalRestaurants
        },
        registrationTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Validations
  userStatusValidation,
  userRoleValidation,
  attractionValidation,
  foodValidation,
  // Handlers
  getUsers,
  updateUserStatus,
  updateUserRole,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  updatePassengerFlow,
  createFood,
  updateFood,
  deleteFood,
  getStatistics
};
