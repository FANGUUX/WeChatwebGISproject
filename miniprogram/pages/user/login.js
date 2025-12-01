/**
 * Login Page
 * 登录页面
 */
const { userApi } = require('../../services/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    loginType: 'wechat', // 'wechat' or 'phone'
    phone: '',
    password: '',
    isRegister: false
  },

  onLoginTypeChange(e) {
    this.setData({ loginType: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  toggleMode() {
    this.setData({ isRegister: !this.data.isRegister });
  },

  async onWechatLogin() {
    showLoading('登录中...');
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      const result = await userApi.wechatLogin(loginRes.code);
      
      const app = getApp();
      app.setLoginData(result.data.token, result.data.user);
      
      hideLoading();
      showToast('登录成功');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      hideLoading();
      showToast(error.message || '登录失败');
    }
  },

  async onPhoneLogin() {
    const { phone, password, isRegister } = this.data;

    if (!phone || !password) {
      showToast('请输入手机号和密码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入有效的手机号');
      return;
    }

    if (password.length < 6) {
      showToast('密码至少6位');
      return;
    }

    showLoading(isRegister ? '注册中...' : '登录中...');
    try {
      let result;
      if (isRegister) {
        result = await userApi.register(phone, password);
      } else {
        result = await userApi.phoneLogin(phone, password);
      }

      const app = getApp();
      app.setLoginData(result.data.token, result.data.user);

      hideLoading();
      showToast(isRegister ? '注册成功' : '登录成功');

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      hideLoading();
      showToast(error.message || '操作失败');
    }
  }
});
