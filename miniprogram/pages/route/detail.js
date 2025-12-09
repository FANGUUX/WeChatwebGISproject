/**
 * Route Detail Page
 * 路线详情页面
 */
const { routeApi } = require('../../services/api');
const { formatDistance, formatDuration, getTransportIcon, getTransportName, showToast, showLoading, hideLoading, confirm } = require('../../utils/util');

Page({
  data: {
    id: '',
    route: null,
    loading: true,
    markers: [],
    polyline: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadRoute();
    }
  },

  async loadRoute() {
    showLoading();
    try {
      const result = await routeApi.getDetails(this.data.id);
      const route = result.data;
      
      // Prepare map markers
      const markers = route.waypoints.map((wp, index) => ({
        id: index,
        latitude: wp.location.coordinates[1],
        longitude: wp.location.coordinates[0],
        title: wp.name,
        callout: {
          content: `${index + 1}. ${wp.name}`,
          display: 'ALWAYS',
          bgColor: '#1aad19',
          color: '#fff',
          padding: 8,
          borderRadius: 4
        }
      }));

      // Prepare polyline
      const polyline = route.segments.length > 0 ? [{
        points: route.waypoints.map(wp => ({
          latitude: wp.location.coordinates[1],
          longitude: wp.location.coordinates[0]
        })),
        color: '#1aad19',
        width: 4
      }] : [];

      this.setData({
        route: {
          ...route,
          formattedDistance: formatDistance(route.totalDistance),
          formattedDuration: formatDuration(route.totalDuration)
        },
        markers,
        polyline,
        loading: false
      });

      wx.setNavigationBarTitle({ title: route.name });
    } catch (error) {
      showToast(error.message || '加载失败');
      this.setData({ loading: false });
    }
    hideLoading();
  },

  onAddPlace() {
    console.log('onAddPlace called, route id:', this.data.id);
    
    if (!this.data.id) {
      showToast('路线ID丢失，请重新进入页面');
      console.error('Route ID is missing');
      return;
    }
    
    wx.showActionSheet({
      itemList: ['添加景点', '添加美食'],
      success: (res) => {
        console.log('Action sheet selected index:', res.tapIndex);
        
        if (res.tapIndex === 0) {
          // Add attraction
          const url = '/pages/recommendation/index?action=addToRoute&routeId=' + this.data.id;
          console.log('Navigating to:', url);
          wx.navigateTo({
            url: url,
            success: () => {
              console.log('Navigation to recommendation succeeded');
            },
            fail: (err) => {
              showToast('页面跳转失败');
              console.error('Navigation failed:', err);
            }
          });
        } else if (res.tapIndex === 1) {
          // Add food
          const url = '/pages/food/index?action=addToRoute&routeId=' + this.data.id;
          console.log('Navigating to:', url);
          wx.navigateTo({
            url: url,
            success: () => {
              console.log('Navigation to food succeeded');
            },
            fail: (err) => {
              showToast('页面跳转失败');
              console.error('Navigation failed:', err);
            }
          });
        }
      },
      fail: (err) => {
        showToast('操作失败');
        console.error('Action sheet failed:', err);
      }
    });
  },

  async onOptimize() {
    const confirmed = await confirm('确定要优化路线顺序吗？');
    if (confirmed) {
      showLoading('优化中...');
      try {
        await routeApi.optimize(this.data.id);
        hideLoading();
        showToast('优化完成');
        this.loadRoute();
      } catch (error) {
        hideLoading();
        showToast(error.message || '优化失败');
      }
    }
  },

  async onRemoveWaypoint(e) {
    const { waypointId } = e.currentTarget.dataset;
    const confirmed = await confirm('确定要删除此地点吗？');
    if (confirmed) {
      showLoading('删除中...');
      try {
        await routeApi.removeWaypoint(this.data.id, waypointId);
        hideLoading();
        showToast('已删除');
        this.loadRoute();
      } catch (error) {
        hideLoading();
        showToast(error.message || '删除失败');
      }
    }
  },

  async onStartNavigation() {
    showLoading('启动导航...');
    try {
      await routeApi.startNavigation(this.data.id);
      hideLoading();
      wx.navigateTo({
        url: `/pages/route/navigation?id=${this.data.id}`
      });
    } catch (error) {
      hideLoading();
      showToast(error.message || '启动失败');
    }
  },

  onWaypointTap(e) {
    const { wp } = e.currentTarget.dataset;
    if (wp.placeType === 'Attraction') {
      wx.navigateTo({
        url: `/pages/recommendation/detail?id=${wp.placeId}`
      });
    } else if (wp.placeType === 'Food') {
      wx.navigateTo({
        url: `/pages/food/detail?id=${wp.placeId}`
      });
    }
  }
});
