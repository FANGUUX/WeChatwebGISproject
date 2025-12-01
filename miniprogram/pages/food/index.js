/**
 * Food Discovery Page
 * 美食发现页面
 */
const { foodApi } = require('../../services/api');
const { formatDistance, getCuisineName, showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    cuisines: [],
    restaurants: [],
    selectedCuisine: '',
    keyword: '',
    location: null,
    loading: false
  },

  onLoad() {
    this.loadCuisines();
    this.getLocation();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadCuisines() {
    try {
      const result = await foodApi.getCuisines();
      this.setData({ cuisines: result.data });
    } catch {
      // Use default cuisines
      this.setData({
        cuisines: [
          { id: '', name: '全部', icon: '🍽️' },
          { id: 'chinese', name: '中餐', icon: '🥢' },
          { id: 'western', name: '西餐', icon: '🍽️' },
          { id: 'japanese', name: '日料', icon: '🍣' },
          { id: 'korean', name: '韩餐', icon: '🍲' }
        ]
      });
    }
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
          this.setData({
            location: {
              latitude: res.latitude,
              longitude: res.longitude
            }
          });
          this.loadData();
        },
        fail: () => {
          showToast('获取位置失败');
        }
      });
    }
  },

  async loadData() {
    if (!this.data.location) return;

    showLoading();
    this.setData({ loading: true });

    try {
      const { location, selectedCuisine, keyword } = this.data;
      const params = {
        longitude: location.longitude,
        latitude: location.latitude,
        limit: 30
      };

      let result;
      if (keyword) {
        result = await foodApi.search(keyword, params);
      } else if (selectedCuisine) {
        result = await foodApi.getByCuisine(selectedCuisine, params);
      } else {
        result = await foodApi.discoverNearby(params);
      }

      this.setData({
        restaurants: result.data.restaurants.map(r => ({
          ...r,
          formattedDistance: formatDistance(r.distance)
        })),
        loading: false
      });
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  onCuisineSelect(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ selectedCuisine: id, keyword: '' });
    this.loadData();
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    if (this.data.keyword.trim()) {
      this.loadData();
    }
  },

  onRestaurantTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/food/detail?id=${id}`
    });
  }
});
