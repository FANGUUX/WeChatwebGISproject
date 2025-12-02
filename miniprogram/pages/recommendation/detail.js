/**
 * Attraction Detail Page
 * 景点详情页面
 */
const { recommendationApi, routeApi, userApi } = require('../../services/api');
const { formatDuration, showToast, showLoading, hideLoading, confirm } = require('../../utils/util');

Page({
  data: {
    id: '',
    attraction: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadData();
    }
  },

  async loadData() {
    showLoading();
    try {
      const result = await recommendationApi.getAttractionDetails(this.data.id);
      this.setData({
        attraction: result.data,
        loading: false
      });
      
      wx.setNavigationBarTitle({
        title: result.data.name
      });

      // Record view behavior for personalized recommendations
      this.recordViewBehavior(result.data);
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  /**
   * Record user view behavior for personalized recommendations
   */
  recordViewBehavior(attraction) {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      userApi.recordBehavior('view', {
        attractionId: attraction._id || attraction.id,
        category: attraction.category,
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.warn('Failed to record behavior:', err);
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.attraction?.name || '推荐景点',
      path: `/pages/recommendation/detail?id=${this.data.id}`
    };
  },

  async onAddToRoute() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      const confirmed = await confirm('需要登录后才能添加到路线，是否前往登录？');
      if (confirmed) {
        wx.navigateTo({ url: '/pages/user/login' });
      }
      return;
    }

    wx.showActionSheet({
      itemList: ['创建新路线', '添加到已有路线'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          // Create new route
          try {
            showLoading('创建中...');
            const route = await routeApi.create({
              name: `${this.data.attraction.name}之旅`
            });
            await routeApi.addWaypoint(route.data._id, {
              placeId: this.data.id,
              placeType: 'Attraction'
            });
            hideLoading();
            showToast('路线已创建');
            wx.navigateTo({
              url: `/pages/route/detail?id=${route.data._id}`
            });
          } catch (error) {
            hideLoading();
            showToast(error.message || '操作失败');
          }
        } else {
          // Add to existing route
          wx.navigateTo({
            url: `/pages/route/index?action=select&placeId=${this.data.id}&placeType=Attraction`
          });
        }
      }
    });
  },

  onNavigate() {
    const { attraction } = this.data;
    if (attraction && attraction.location) {
      wx.openLocation({
        latitude: attraction.location.coordinates[1],
        longitude: attraction.location.coordinates[0],
        name: attraction.name,
        address: attraction.location.address
      });
    }
  },

  onCall() {
    // In production, would have actual phone number
    showToast('暂无联系电话');
  }
});
