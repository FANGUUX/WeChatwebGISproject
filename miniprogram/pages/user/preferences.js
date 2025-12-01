/**
 * Preferences Page
 * 偏好设置页面
 */
const { userApi } = require('../../services/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    preferences: {
      favoriteCategories: [],
      preferredTransport: 'walking',
      priceRange: { min: 0, max: 500 },
      foodPreferences: [],
      avoidCrowds: false
    },
    categories: [
      { id: 'nature', name: '自然风光' },
      { id: 'history', name: '历史古迹' },
      { id: 'entertainment', name: '休闲娱乐' },
      { id: 'culture', name: '文化艺术' },
      { id: 'shopping', name: '购物' },
      { id: 'sports', name: '运动户外' }
    ],
    transportModes: [
      { id: 'walking', name: '步行' },
      { id: 'cycling', name: '骑行' },
      { id: 'driving', name: '驾车' },
      { id: 'transit', name: '公交' }
    ],
    cuisines: [
      { id: 'chinese', name: '中餐' },
      { id: 'western', name: '西餐' },
      { id: 'japanese', name: '日料' },
      { id: 'korean', name: '韩餐' },
      { id: 'thai', name: '泰餐' },
      { id: 'italian', name: '意餐' }
    ]
  },

  onLoad() {
    this.loadPreferences();
  },

  async loadPreferences() {
    showLoading();
    try {
      const result = await userApi.getPreferences();
      if (result.data.preferences) {
        this.setData({
          preferences: {
            ...this.data.preferences,
            ...result.data.preferences
          }
        });
      }
    } catch (error) {
      showToast(error.message || '加载失败');
    }
    hideLoading();
  },

  onCategoryToggle(e) {
    const { id } = e.currentTarget.dataset;
    const categories = [...this.data.preferences.favoriteCategories];
    const index = categories.indexOf(id);
    
    if (index === -1) {
      categories.push(id);
    } else {
      categories.splice(index, 1);
    }

    this.setData({
      'preferences.favoriteCategories': categories
    });
  },

  onTransportChange(e) {
    this.setData({
      'preferences.preferredTransport': e.currentTarget.dataset.id
    });
  },

  onPriceMinChange(e) {
    this.setData({
      'preferences.priceRange.min': parseInt(e.detail.value) || 0
    });
  },

  onPriceMaxChange(e) {
    this.setData({
      'preferences.priceRange.max': parseInt(e.detail.value) || 1000
    });
  },

  onCuisineToggle(e) {
    const { id } = e.currentTarget.dataset;
    const cuisines = [...this.data.preferences.foodPreferences];
    const index = cuisines.indexOf(id);
    
    if (index === -1) {
      cuisines.push(id);
    } else {
      cuisines.splice(index, 1);
    }

    this.setData({
      'preferences.foodPreferences': cuisines
    });
  },

  onAvoidCrowdsChange(e) {
    this.setData({
      'preferences.avoidCrowds': e.detail.value
    });
  },

  async savePreferences() {
    showLoading('保存中...');
    try {
      await userApi.updatePreferences(this.data.preferences);
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
