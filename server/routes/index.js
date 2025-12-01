/**
 * Routes Index
 * 路由汇总
 */
const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const recommendationRoutes = require('./recommendation');
const routeRoutes = require('./route');
const foodRoutes = require('./food');
const adminRoutes = require('./admin');

// API version prefix
router.use('/user', userRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/routes', routeRoutes);
router.use('/food', foodRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
