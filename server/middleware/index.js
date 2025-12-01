/**
 * Middleware Index
 * 中间件导出
 */
const { authenticate, optionalAuth, authorize, checkOwnership } = require('./auth');
const { handleValidationErrors } = require('./validation');
const { errorHandler, notFoundHandler } = require('./errorHandler');
const { generalLimiter, authLimiter, apiLimiter } = require('./rateLimit');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership,
  handleValidationErrors,
  errorHandler,
  notFoundHandler,
  generalLimiter,
  authLimiter,
  apiLimiter
};
