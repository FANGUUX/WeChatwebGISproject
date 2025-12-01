/**
 * Profile Page
 * 个人资料页面
 */
const { userApi } = require('../../services/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    profile: {
      nickname: '',
      avatar: '',
      gender: 0,
      birthday: '',
      city: '',
      province: ''
    },
    genderOptions: ['未知', '男', '女']
  },

  onLoad() {
    this.loadProfile();
  },

  async loadProfile() {
    showLoading();
    try {
      const result = await userApi.getProfile();
      this.setData({
        profile: result.data
      });
    } catch (error) {
      showToast(error.message || '加载失败');
    }
    hideLoading();
  },

  onNicknameInput(e) {
    this.setData({
      'profile.nickname': e.detail.value
    });
  },

  onGenderChange(e) {
    this.setData({
      'profile.gender': parseInt(e.detail.value)
    });
  },

  onBirthdayChange(e) {
    this.setData({
      'profile.birthday': e.detail.value
    });
  },

  onCityInput(e) {
    this.setData({
      'profile.city': e.detail.value
    });
  },

  onProvinceInput(e) {
    this.setData({
      'profile.province': e.detail.value
    });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // In production, upload to server
        this.setData({
          'profile.avatar': res.tempFilePaths[0]
        });
      }
    });
  },

  async saveProfile() {
    showLoading('保存中...');
    try {
      await userApi.updateProfile(this.data.profile);
      
      // Update global data
      const app = getApp();
      app.globalData.userInfo = {
        ...app.globalData.userInfo,
        nickname: this.data.profile.nickname,
        avatar: this.data.profile.avatar
      };
      wx.setStorageSync('userInfo', app.globalData.userInfo);

      hideLoading();
      showToast('保存成功');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      hideLoading();
      showToast(error.message || '保存失败');
    }
  }
});
