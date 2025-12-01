/**
 * WeChat Mini Program App
 * 微信小程序主应用
 */

App({
  globalData: {
    userInfo: null,
    token: null,
    location: null,
    isLoggedIn: false
  },

  onLaunch() {
    // Check login status
    this.checkLoginStatus();
    
    // Get user location
    this.getLocation();
  },

  /**
   * Check if user is logged in
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },

  /**
   * Get user location
   */
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      },
      fail: (err) => {
        console.log('获取位置失败', err);
      }
    });
  },

  /**
   * Set login data
   */
  setLoginData(token, userInfo) {
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  /**
   * Logout
   */
  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
