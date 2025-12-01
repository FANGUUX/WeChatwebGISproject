/**
 * API Service
 * API请求服务
 */

const BASE_URL = 'https://your-api-domain.com/api/v1';

/**
 * Request wrapper
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const token = app.globalData.token;

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // Token expired, redirect to login
          app.logout();
          wx.navigateTo({ url: '/pages/user/login' });
          reject(new Error('请先登录'));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data || { message: '请求失败' });
        }
      },
      fail: (err) => {
        reject({ message: '网络错误' });
      }
    });
  });
};

// User APIs
const userApi = {
  wechatLogin: (code) => request({
    url: '/user/login/wechat',
    method: 'POST',
    data: { code }
  }),

  phoneLogin: (phone, password) => request({
    url: '/user/login',
    method: 'POST',
    data: { phone, password }
  }),

  register: (phone, password) => request({
    url: '/user/register',
    method: 'POST',
    data: { phone, password }
  }),

  getProfile: () => request({ url: '/user/profile' }),

  updateProfile: (data) => request({
    url: '/user/profile',
    method: 'PUT',
    data
  }),

  getPreferences: () => request({ url: '/user/preferences' }),

  updatePreferences: (data) => request({
    url: '/user/preferences',
    method: 'PUT',
    data
  }),

  recordBehavior: (type, data) => request({
    url: '/user/behavior',
    method: 'POST',
    data: { type, data }
  })
};

// Recommendation APIs
const recommendationApi = {
  getRecommendations: (params) => request({
    url: '/recommendations',
    data: params
  }),

  getPersonalized: () => request({ url: '/recommendations/personalized' }),

  getNearby: (params) => request({
    url: '/recommendations/nearby',
    data: params
  }),

  search: (keyword, params) => request({
    url: '/recommendations/search',
    data: { keyword, ...params }
  }),

  getByCategory: (category, params) => request({
    url: `/recommendations/category/${category}`,
    data: params
  }),

  getAttractionDetails: (id) => request({
    url: `/recommendations/attractions/${id}`
  })
};

// Route APIs
const routeApi = {
  create: (data) => request({
    url: '/routes',
    method: 'POST',
    data
  }),

  getList: (params) => request({
    url: '/routes',
    data: params
  }),

  getDetails: (id) => request({ url: `/routes/${id}` }),

  addWaypoint: (routeId, data) => request({
    url: `/routes/${routeId}/waypoints`,
    method: 'POST',
    data
  }),

  removeWaypoint: (routeId, waypointId) => request({
    url: `/routes/${routeId}/waypoints/${waypointId}`,
    method: 'DELETE'
  }),

  optimize: (routeId) => request({
    url: `/routes/${routeId}/optimize`,
    method: 'POST'
  }),

  setMultiModal: (routeId, segmentModes) => request({
    url: `/routes/${routeId}/multimodal`,
    method: 'POST',
    data: { segmentModes }
  }),

  updateRealtime: (routeId, location) => request({
    url: `/routes/${routeId}/realtime`,
    method: 'PUT',
    data: location
  }),

  startNavigation: (routeId) => request({
    url: `/routes/${routeId}/start`,
    method: 'POST'
  }),

  endNavigation: (routeId) => request({
    url: `/routes/${routeId}/end`,
    method: 'POST'
  }),

  delete: (routeId) => request({
    url: `/routes/${routeId}`,
    method: 'DELETE'
  })
};

// Food APIs
const foodApi = {
  getCuisines: () => request({ url: '/food/cuisines' }),

  discoverNearby: (params) => request({
    url: '/food/nearby',
    data: params
  }),

  getPopular: (params) => request({
    url: '/food/popular',
    data: params
  }),

  search: (keyword, params) => request({
    url: '/food/search',
    data: { keyword, ...params }
  }),

  getByCuisine: (cuisine, params) => request({
    url: `/food/cuisine/${cuisine}`,
    data: params
  }),

  getDetails: (id) => request({ url: `/food/${id}` })
};

module.exports = {
  request,
  userApi,
  recommendationApi,
  routeApi,
  foodApi
};
