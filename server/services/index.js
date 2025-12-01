/**
 * Services Index
 * 服务导出
 */
const authService = require('./authService');
const recommendationService = require('./recommendationService');
const routeService = require('./routeService');
const foodService = require('./foodService');
const weatherService = require('./weatherService');
const mapService = require('./mapService');

module.exports = {
  authService,
  recommendationService,
  routeService,
  foodService,
  weatherService,
  mapService
};
