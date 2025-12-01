/**
 * User Center Page
 * 用户中心页面
 */
const { userApi } = require('../../services/api');
const { showToast, confirm } = require('../../utils/util');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    menuItems: [
      { id: 'profile', name: '个人资料', icon: '👤', url: '/pages/user/profile' },
      { id: 'preferences', name: '偏好设置', icon: '⚙️', url: '/pages/user/preferences' },
      { id: 'history', name: '浏览历史', icon: '📋', url: '/pages/user/history' },
      { id: 'favorites', name: '我的收藏', icon: '❤️', url: '/pages/user/favorites' },
      { id: 'routes', name: '我的路线', icon: '🗺️', url: '/pages/route/index' }
    ]
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const app = getApp();
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    });
  },

  onLoginTap() {
    wx.navigateTo({
      url: '/pages/user/login'
    });
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset;
    if (!this.data.isLoggedIn) {
      showToast('请先登录');
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/user/login' });
      }, 1500);
      return;
    }
    wx.navigateTo({ url });
  },

  async onLogout() {
    const confirmed = await confirm('确定要退出登录吗？');
    if (confirmed) {
      const app = getApp();
      app.logout();
      this.setData({
        isLoggedIn: false,
        userInfo: null
      });
      showToast('已退出登录');
    }
  }
});
