/**
 * Route List Page
 * 路线列表页面
 */
const { routeApi } = require('../../services/api');
const { formatDistance, formatDuration, showToast, showLoading, hideLoading, confirm } = require('../../utils/util');

Page({
  data: {
    routes: [],
    loading: false,
    action: '',
    placeId: '',
    placeType: ''
  },

  onLoad(options) {
    if (options.action === 'select') {
      this.setData({
        action: 'select',
        placeId: options.placeId,
        placeType: options.placeType
      });
    }
  },

  onShow() {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      this.loadRoutes();
    }
  },

  onPullDownRefresh() {
    this.loadRoutes().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadRoutes() {
    showLoading();
    this.setData({ loading: true });
    
    try {
      const result = await routeApi.getList();
      this.setData({
        routes: result.data.routes.map(route => ({
          ...route,
          formattedDistance: formatDistance(route.totalDistance),
          formattedDuration: formatDuration(route.totalDuration)
        })),
        loading: false
      });
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  onCreateRoute() {
    wx.navigateTo({
      url: '/pages/route/create'
    });
  },

  async onRouteTap(e) {
    const { id } = e.currentTarget.dataset;
    
    if (this.data.action === 'select') {
      // Add waypoint to selected route
      try {
        showLoading('添加中...');
        await routeApi.addWaypoint(id, {
          placeId: this.data.placeId,
          placeType: this.data.placeType
        });
        hideLoading();
        showToast('已添加到路线');
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/route/detail?id=${id}`
          });
        }, 1500);
      } catch (error) {
        hideLoading();
        showToast(error.message || '添加失败');
      }
    } else {
      wx.navigateTo({
        url: `/pages/route/detail?id=${id}`
      });
    }
  },

  async onDeleteRoute(e) {
    const { id } = e.currentTarget.dataset;
    const confirmed = await confirm('确定要删除此路线吗？');
    
    if (confirmed) {
      try {
        showLoading('删除中...');
        await routeApi.delete(id);
        hideLoading();
        showToast('已删除');
        this.loadRoutes();
      } catch (error) {
        hideLoading();
        showToast(error.message || '删除失败');
      }
    }
  }
});
