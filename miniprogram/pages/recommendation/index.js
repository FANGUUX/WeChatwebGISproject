/**
 * Recommendation List Page
 * 推荐列表页面
 */
const { recommendationApi, routeApi } = require('../../services/api');
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
    focusSearch: false,
    // Add to route mode
    action: '',
    routeId: ''
  },

  onLoad(options) {
    if (options.category) {
      this.setData({ category: options.category });
    }
    if (options.focus === 'search') {
      this.setData({ focusSearch: true });
    }
    // Handle add to route mode from URL params (non-tabBar navigation)
    if (options.action === 'addToRoute' && options.routeId) {
      this.setData({
        action: 'addToRoute',
        routeId: options.routeId
      });
      wx.setNavigationBarTitle({ title: '选择要添加的景点' });
    }
    this.getLocation();
  },

  onShow() {
    // Check for addToRoute context from global data (for tabBar navigation)
    const app = getApp();
    if (app.globalData.addToRouteContext && 
        app.globalData.addToRouteContext.placeType === 'Attraction') {
      console.log('Found addToRoute context from global data:', app.globalData.addToRouteContext);
      
      this.setData({
        action: 'addToRoute',
        routeId: app.globalData.addToRouteContext.routeId
      });
      wx.setNavigationBarTitle({ title: '选择要添加的景点' });
      
      // Clear the context after using it
      delete app.globalData.addToRouteContext;
    }
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
    
    // Prevent navigation to detail view when in add-to-route mode; add button handles the action
    if (this.data.action === 'addToRoute') {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/recommendation/detail?id=${id}`
    });
  },

  async onAddToRoute(e) {
    const { id } = e.currentTarget.dataset;
    
    console.log('onAddToRoute called, id:', id, 'routeId:', this.data.routeId);
    
    if (!this.data.routeId) {
      showToast('路线信息丢失');
      return;
    }
    
    if (!id) {
      showToast('地点信息丢失');
      return;
    }

    try {
      showLoading('添加中...');
      const result = await routeApi.addWaypoint(this.data.routeId, {
        placeId: id,
        placeType: 'Attraction'
      });
      console.log('Waypoint added successfully:', result);
      hideLoading();
      showToast('已添加到路线');
      
      // Navigate back to route detail page
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/route/detail?id=${this.data.routeId}`,
          fail: (err) => {
            console.error('Navigate to route detail failed:', err);
            // If navigation fails, try switching to route tab
            wx.switchTab({ url: '/pages/route/index' });
          }
        });
      }, 1500);
    } catch (error) {
      console.error('Add waypoint error:', error);
      hideLoading();
      showToast(error.message || '添加失败');
    }
  }
});
