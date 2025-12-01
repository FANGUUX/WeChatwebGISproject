/**
 * Route Controller
 * 路线控制器 - 处理路线规划请求
 */
const { body, param, query } = require('express-validator');
const routeService = require('../services/routeService');
const Route = require('../models/Route');

// Validation rules
const createRouteValidation = [
  body('name').optional().isString().isLength({ max: 50 }).withMessage('路线名称最长50个字符'),
  body('transportMode').optional().isIn(['walking', 'driving', 'transit', 'cycling', 'mixed']).withMessage('交通方式无效')
];

const addWaypointValidation = [
  body('placeId').notEmpty().withMessage('请提供地点ID'),
  body('placeType').isIn(['Attraction', 'Food']).withMessage('地点类型无效'),
  body('duration').optional().isInt({ min: 0 }).withMessage('停留时间必须为正整数')
];

const multiModalValidation = [
  body('segmentModes').isArray({ min: 1 }).withMessage('请提供各段交通方式')
];

/**
 * Create a new route
 */
const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.userId, req.body);

    res.status(201).json({
      success: true,
      message: '路线已创建',
      data: route
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's routes
 */
const getUserRoutes = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    const routes = await routeService.getUserRoutes(req.userId, {
      status,
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: {
        routes,
        total: routes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get route details
 */
const getRouteDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const route = await Route.findById(id)
      .populate('waypoints.placeId')
      .populate('userId', 'nickname avatar');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    // Check access permission
    if (route.userId._id.toString() !== req.userId.toString() && 
        !route.isPublic && 
        !route.sharedWith.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: '无权访问此路线'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add waypoint to route
 */
const addWaypoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此路线'
      });
    }

    const updatedRoute = await routeService.addWaypoint(id, req.body);

    res.json({
      success: true,
      message: '路径点已添加',
      data: updatedRoute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove waypoint from route
 */
const removeWaypoint = async (req, res, next) => {
  try {
    const { id, waypointId } = req.params;
    
    // Verify ownership
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此路线'
      });
    }

    const updatedRoute = await routeService.removeWaypoint(id, waypointId);

    res.json({
      success: true,
      message: '路径点已删除',
      data: updatedRoute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Optimize route order
 */
const optimizeRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此路线'
      });
    }

    const optimizedRoute = await routeService.optimizeRoute(id);

    res.json({
      success: true,
      message: '路线已优化',
      data: optimizedRoute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set multi-modal transportation
 */
const setMultiModal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { segmentModes } = req.body;
    
    // Verify ownership
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此路线'
      });
    }

    const updatedRoute = await routeService.setMultiModalRoute(id, segmentModes);

    res.json({
      success: true,
      message: '多模态交通已设置',
      data: updatedRoute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update route in real-time
 */
const updateRealtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: '请提供当前位置'
      });
    }

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此路线'
      });
    }

    const updatedRoute = await routeService.updateRouteRealtime(id, {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    });

    res.json({
      success: true,
      data: {
        currentWaypointIndex: updatedRoute.currentWaypointIndex,
        remainingWaypoints: updatedRoute.waypoints.length - updatedRoute.currentWaypointIndex,
        segments: updatedRoute.segments.slice(updatedRoute.currentWaypointIndex - 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start route navigation
 */
const startNavigation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此路线'
      });
    }

    route.status = 'active';
    route.currentWaypointIndex = 0;
    await route.save();

    res.json({
      success: true,
      message: '导航已开始',
      data: route
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End route navigation
 */
const endNavigation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此路线'
      });
    }

    route.status = 'completed';
    await route.save();

    res.json({
      success: true,
      message: '导航已结束',
      data: route
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete route
 */
const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: '路线不存在'
      });
    }

    if (route.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权删除此路线'
      });
    }

    await Route.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '路线已删除'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Validations
  createRouteValidation,
  addWaypointValidation,
  multiModalValidation,
  // Handlers
  createRoute,
  getUserRoutes,
  getRouteDetails,
  addWaypoint,
  removeWaypoint,
  optimizeRoute,
  setMultiModal,
  updateRealtime,
  startNavigation,
  endNavigation,
  deleteRoute
};
