/**
 * Recommendation List Page
 * 推荐列表页面
 */
const { recommendationApi } = require('../../services/api');
const { formatDistance, getCategoryName, showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    recommendations: [],
    category: '',
    keyword: '',
    location: null,
    loading: false,
    hasMore: true,
    page: 1,
    focusSearch: false
  },

  onLoad(options) {
    if (options.category) {
      this.setData({ category: options.category });
    }
    if (options.focus === 'search') {
      this.setData({ focusSearch: true });
    }
    this.getLocation();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
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
          this.loadData();
        }
      });
    }
  },

  async loadData() {
    showLoading();
    this.setData({ loading: true });
    
    try {
      const { location, category, keyword, page } = this.data;
      const params = {
        limit: 20,
        page
      };

      if (location) {
        params.longitude = location.longitude;
        params.latitude = location.latitude;
      }

      let result;
      if (keyword) {
        result = await recommendationApi.search(keyword, params);
        this.setData({
          recommendations: result.data.attractions,
          loading: false
        });
      } else if (category) {
        result = await recommendationApi.getByCategory(category, params);
        this.setData({
          recommendations: result.data.attractions,
          loading: false
        });
      } else {
        result = await recommendationApi.getRecommendations(params);
        this.setData({
          recommendations: result.data.recommendations,
          loading: false
        });
      }
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  async loadMore() {
    this.setData({ 
      loading: true,
      page: this.data.page + 1 
    });

    try {
      const { location, category, keyword, page } = this.data;
      const params = {
        limit: 20,
        page
      };

      if (location) {
        params.longitude = location.longitude;
        params.latitude = location.latitude;
      }

      let result;
      if (keyword) {
        result = await recommendationApi.search(keyword, params);
      } else if (category) {
        result = await recommendationApi.getByCategory(category, params);
      } else {
        result = await recommendationApi.getRecommendations(params);
      }

      const newItems = result.data.attractions || result.data.recommendations;
      
      if (newItems.length === 0) {
        this.setData({ hasMore: false });
      } else {
        this.setData({
          recommendations: [...this.data.recommendations, ...newItems]
        });
      }
    } catch (error) {
      showToast(error.message || '加载失败');
    }
    this.setData({ loading: false });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    if (this.data.keyword.trim()) {
      this.setData({ page: 1, hasMore: true });
      this.loadData();
    }
  },

  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/recommendation/detail?id=${id}`
    });
  }
});
