/**
 * Authentication Middleware
 * 认证中间件 - 用户权限控制
 */
const authService = require('../services/authService');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }
    return res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
};

/**
 * Optional authentication - attaches user if token present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch {
    // Continue without user
    next();
  }
};

/**
 * Role-based authorization
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '无权限执行此操作'
      });
    }

    next();
  };
};

/**
 * Resource ownership check
 * @param {string} resourceField - Field name in request that contains resource owner
 */
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceOwnerId = req.body[resourceField] || req.params[resourceField];
    
    if (resourceOwnerId && resourceOwnerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权访问此资源'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership
};
