/**
 * Food Discovery Page
 * 美食发现页面
 */
const { foodApi, routeApi } = require('../../services/api');
const { formatDistance, getCuisineName, showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    cuisines: [],
    restaurants: [],
    selectedCuisine: '',
    keyword: '',
    location: null,
    loading: false,
    // Add to route mode
    action: '',
    routeId: ''
  },

  onLoad(options) {
    this.loadCuisines();
    this.getLocation();
    
    // Handle add to route mode from URL params (non-tabBar navigation)
    if (options.action === 'addToRoute' && options.routeId) {
      this.setData({
        action: 'addToRoute',
        routeId: options.routeId
      });
      wx.setNavigationBarTitle({ title: '选择要添加的美食' });
    }
  },

  onShow() {
    // Check for addToRoute context from global data (for tabBar navigation)
    const app = getApp();
    if (app.globalData.addToRouteContext && 
        app.globalData.addToRouteContext.placeType === 'Food') {
      console.log('Found addToRoute context from global data:', app.globalData.addToRouteContext);
      
      this.setData({
        action: 'addToRoute',
        routeId: app.globalData.addToRouteContext.routeId
      });
      wx.setNavigationBarTitle({ title: '选择要添加的美食' });
      
      // Clear the context after using it
      delete app.globalData.addToRouteContext;
    }
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
    
    // Prevent navigation to detail view when in add-to-route mode; add button handles the action
    if (this.data.action === 'addToRoute') {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/food/detail?id=${id}`
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
        placeType: 'Food'
      });
      console.log('Waypoint added successfully:', result);
      hideLoading();
      showToast('已添加到路线');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('Add waypoint error:', error);
      hideLoading();
      showToast(error.message || '添加失败');
    }
  }
});
