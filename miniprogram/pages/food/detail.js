/**
 * Food Detail Page
 * 美食详情页面
 */
const { foodApi, routeApi, userApi } = require('../../services/api');
const { showToast, showLoading, hideLoading, confirm } = require('../../utils/util');

Page({
  data: {
    id: '',
    restaurant: null,
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
      const result = await foodApi.getDetails(this.data.id);
      this.setData({
        restaurant: result.data,
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
   * Record user view behavior for personalized food recommendations
   */
  recordViewBehavior(restaurant) {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      userApi.recordBehavior('view', {
        restaurantId: restaurant._id || restaurant.id,
        cuisine: restaurant.cuisine,
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.warn('Failed to record behavior:', err);
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.restaurant?.name || '推荐美食',
      path: `/pages/food/detail?id=${this.data.id}`
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
          try {
            showLoading('创建中...');
            const route = await routeApi.create({
              name: `${this.data.restaurant.name}美食之旅`
            });
            await routeApi.addWaypoint(route.data._id, {
              placeId: this.data.id,
              placeType: 'Food'
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
          wx.navigateTo({
            url: `/pages/route/index?action=select&placeId=${this.data.id}&placeType=Food`
          });
        }
      }
    });
  },

  onNavigate() {
    const { restaurant } = this.data;
    if (restaurant && restaurant.location) {
      wx.openLocation({
        latitude: restaurant.location.coordinates[1],
        longitude: restaurant.location.coordinates[0],
        name: restaurant.name,
        address: restaurant.location.address
      });
    }
  },

  onCall() {
    const { restaurant } = this.data;
    if (restaurant && restaurant.phone) {
      wx.makePhoneCall({
        phoneNumber: restaurant.phone
      });
    } else {
      showToast('暂无联系电话');
    }
  }
});
