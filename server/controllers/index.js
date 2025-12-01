/**
 * Controllers Index
 * 控制器导出
 */
const userController = require('./userController');
const recommendationController = require('./recommendationController');
const routeController = require('./routeController');
const foodController = require('./foodController');
const adminController = require('./adminController');

module.exports = {
  userController,
  recommendationController,
  routeController,
  foodController,
  adminController
};
