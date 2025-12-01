/**
 * Index Page (Home)
 * 首页
 */
const { recommendationApi, foodApi } = require('../../services/api');
const { formatDistance, showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    location: null,
    recommendations: [],
    nearbyFood: [],
    categories: [
      { id: 'nature', name: '自然风光', icon: '🏞️' },
      { id: 'history', name: '历史古迹', icon: '🏛️' },
      { id: 'entertainment', name: '休闲娱乐', icon: '🎢' },
      { id: 'culture', name: '文化艺术', icon: '🎨' },
      { id: 'shopping', name: '购物', icon: '🛍️' },
      { id: 'sports', name: '运动户外', icon: '⛷️' }
    ],
    loading: true
  },

  onLoad() {
    this.getLocation();
  },

  onShow() {
    if (this.data.location) {
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  getLocation() {
    const app = getApp();
    if (app.globalData.location) {
      this.setData({ location: app.globalData.location });
      this.loadData();
    } else {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          this.setData({ location });
          app.globalData.location = location;
          this.loadData();
        },
        fail: () => {
          showToast('获取位置失败');
          this.setData({ loading: false });
        }
      });
    }
  },

  async loadData() {
    showLoading();
    try {
      const { longitude, latitude } = this.data.location;
      
      const [recRes, foodRes] = await Promise.all([
        recommendationApi.getRecommendations({ longitude, latitude, limit: 5 }),
        foodApi.discoverNearby({ longitude, latitude, limit: 4 })
      ]);

      this.setData({
        recommendations: recRes.data.recommendations.map(item => ({
          ...item,
          formattedDistance: item.distance ? formatDistance(item.distance) : ''
        })),
        nearbyFood: foodRes.data.restaurants.map(item => ({
          ...item,
          formattedDistance: formatDistance(item.distance)
        })),
        loading: false
      });
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/recommendation/index?category=${id}`
    });
  },

  onRecommendationTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/recommendation/detail?id=${id}`
    });
  },

  onFoodTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/food/detail?id=${id}`
    });
  },

  onSearchTap() {
    wx.navigateTo({
      url: '/pages/recommendation/index?focus=search'
    });
  }
});
