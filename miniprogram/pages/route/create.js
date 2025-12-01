/**
 * Create Route Page
 * 创建路线页面
 */
const { routeApi } = require('../../services/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    name: '',
    transportMode: 'walking',
    transportModes: [
      { id: 'walking', name: '步行', icon: '🚶' },
      { id: 'cycling', name: '骑行', icon: '🚲' },
      { id: 'driving', name: '驾车', icon: '🚗' },
      { id: 'transit', name: '公交', icon: '🚌' }
    ]
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onTransportSelect(e) {
    this.setData({ transportMode: e.currentTarget.dataset.id });
  },

  async onCreate() {
    const { name, transportMode } = this.data;

    if (!name.trim()) {
      showToast('请输入路线名称');
      return;
    }

    showLoading('创建中...');
    try {
      const result = await routeApi.create({
        name,
        transportMode
      });
      hideLoading();
      showToast('创建成功');
      
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/route/detail?id=${result.data._id}`
        });
      }, 1500);
    } catch (error) {
      hideLoading();
      showToast(error.message || '创建失败');
    }
  }
});
