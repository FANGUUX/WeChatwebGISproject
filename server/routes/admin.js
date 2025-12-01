/**
 * Admin Routes
 * 管理路由 - 系统支撑与数据管理
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const adminController = require('../controllers/adminController');

// All routes require admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status',
  adminController.userStatusValidation,
  handleValidationErrors,
  adminController.updateUserStatus
);
router.put('/users/:id/role',
  authorize('admin'), // Only admin can change roles
  adminController.userRoleValidation,
  handleValidationErrors,
  adminController.updateUserRole
);

// Attraction management
router.post('/attractions',
  adminController.attractionValidation,
  handleValidationErrors,
  adminController.createAttraction
);
router.put('/attractions/:id', adminController.updateAttraction);
router.delete('/attractions/:id', adminController.deleteAttraction);
router.put('/attractions/:id/passenger-flow', adminController.updatePassengerFlow);

// Food merchant management
router.post('/food',
  adminController.foodValidation,
  handleValidationErrors,
  adminController.createFood
);
router.put('/food/:id', adminController.updateFood);
router.delete('/food/:id', adminController.deleteFood);

// System statistics
router.get('/statistics', adminController.getStatistics);

module.exports = router;
