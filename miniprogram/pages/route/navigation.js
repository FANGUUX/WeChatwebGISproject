/**
 * Route Navigation Page
 * 路线导航页面
 */
const { routeApi } = require('../../services/api');
const { formatDistance, formatDuration, showToast, showLoading, hideLoading, confirm } = require('../../utils/util');

Page({
  data: {
    id: '',
    route: null,
    currentLocation: null,
    currentWaypointIndex: 0,
    markers: [],
    polyline: [],
    scale: 16,
    isNavigating: true
  },

  locationWatcher: null,

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadRoute();
      this.startLocationWatch();
    }
  },

  onUnload() {
    this.stopLocationWatch();
  },

  async loadRoute() {
    try {
      const result = await routeApi.getDetails(this.data.id);
      const route = result.data;

      this.updateMapData(route);
      this.setData({
        route,
        currentWaypointIndex: route.currentWaypointIndex || 0
      });
    } catch (error) {
      showToast(error.message || '加载失败');
    }
  },

  updateMapData(route) {
    const markers = route.waypoints.map((wp, index) => {
      const isCurrent = index === this.data.currentWaypointIndex;
      const isPast = index < this.data.currentWaypointIndex;

      return {
        id: index,
        latitude: wp.location.coordinates[1],
        longitude: wp.location.coordinates[0],
        title: wp.name,
        iconPath: isCurrent ? '/assets/marker-current.png' : isPast ? '/assets/marker-done.png' : '/assets/marker.png',
        width: 30,
        height: 40,
        callout: {
          content: `${index + 1}. ${wp.name}`,
          display: isCurrent ? 'ALWAYS' : 'BYCLICK',
          bgColor: isCurrent ? '#1aad19' : '#fff',
          color: isCurrent ? '#fff' : '#333',
          padding: 8,
          borderRadius: 4
        }
      };
    });

    // Add current location marker
    if (this.data.currentLocation) {
      markers.push({
        id: 999,
        latitude: this.data.currentLocation.latitude,
        longitude: this.data.currentLocation.longitude,
        iconPath: '/assets/location.png',
        width: 24,
        height: 24
      });
    }

    const polyline = [{
      points: route.waypoints.map(wp => ({
        latitude: wp.location.coordinates[1],
        longitude: wp.location.coordinates[0]
      })),
      color: '#1aad19',
      width: 6,
      dottedLine: false
    }];

    this.setData({ markers, polyline });
  },

  startLocationWatch() {
    this.locationWatcher = wx.watchLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        this.checkArrival(res.latitude, res.longitude);
      },
      fail: (err) => {
        console.error('Watch location failed:', err);
      }
    });
  },

  stopLocationWatch() {
    if (this.locationWatcher) {
      wx.stopLocationUpdate();
    }
  },

  checkArrival(lat, lng) {
    const { route, currentWaypointIndex } = this.data;
    if (!route || !route.waypoints[currentWaypointIndex]) return;

    const wp = route.waypoints[currentWaypointIndex];
    const distance = this.calculateDistance(
      lng, lat,
      wp.location.coordinates[0], wp.location.coordinates[1]
    );

    // If within 100 meters, consider arrived
    if (distance < 100) {
      showToast(`已到达: ${wp.name}`);
      
      if (currentWaypointIndex < route.waypoints.length - 1) {
        this.setData({
          currentWaypointIndex: currentWaypointIndex + 1
        });
        this.updateMapData(route);
        this.updateRealtimeRoute();
      } else {
        this.onComplete();
      }
    }
  },

  calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  async updateRealtimeRoute() {
    if (!this.data.currentLocation) return;

    try {
      await routeApi.updateRealtime(this.data.id, this.data.currentLocation);
    } catch {
      // Silent fail
    }
  },

  onNavigateToWaypoint() {
    const { route, currentWaypointIndex } = this.data;
    const wp = route.waypoints[currentWaypointIndex];

    if (wp) {
      wx.openLocation({
        latitude: wp.location.coordinates[1],
        longitude: wp.location.coordinates[0],
        name: wp.name,
        address: wp.location.address || ''
      });
    }
  },

  async onComplete() {
    showLoading('完成导航...');
    try {
      await routeApi.endNavigation(this.data.id);
      hideLoading();
      this.setData({ isNavigating: false });
      
      wx.showModal({
        title: '导航完成',
        content: '恭喜您完成了本次行程！',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    } catch (error) {
      hideLoading();
      showToast(error.message || '操作失败');
    }
  },

  async onExit() {
    const confirmed = await confirm('确定要退出导航吗？');
    if (confirmed) {
      this.stopLocationWatch();
      wx.navigateBack();
    }
  }
});
