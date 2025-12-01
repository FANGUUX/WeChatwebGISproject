/**
 * Route Planning Routes
 * 路线规划路由 - 智能路线规划
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const routeController = require('../controllers/routeController');

// All routes require authentication

// Create route
router.post('/',
  authenticate,
  routeController.createRouteValidation,
  handleValidationErrors,
  routeController.createRoute
);

// Get user's routes
router.get('/', authenticate, routeController.getUserRoutes);

// Get route details
router.get('/:id', authenticate, routeController.getRouteDetails);

// Add waypoint
router.post('/:id/waypoints',
  authenticate,
  routeController.addWaypointValidation,
  handleValidationErrors,
  routeController.addWaypoint
);

// Remove waypoint
router.delete('/:id/waypoints/:waypointId',
  authenticate,
  routeController.removeWaypoint
);

// Optimize route
router.post('/:id/optimize', authenticate, routeController.optimizeRoute);

// Set multi-modal transportation
router.post('/:id/multimodal',
  authenticate,
  routeController.multiModalValidation,
  handleValidationErrors,
  routeController.setMultiModal
);

// Update real-time
router.put('/:id/realtime', authenticate, routeController.updateRealtime);

// Start navigation
router.post('/:id/start', authenticate, routeController.startNavigation);

// End navigation
router.post('/:id/end', authenticate, routeController.endNavigation);

// Delete route
router.delete('/:id', authenticate, routeController.deleteRoute);

module.exports = router;
