// pages/index/index.js - 首页逻辑
const app = getApp();

Page({
  data: {
    latitude: 32.0603,  // 南京市中心纬度
    longitude: 118.7969, // 南京市中心经度
    scale: 12,
    markers: [],
    attractions: [],
    userLocation: null
  },

  onLoad() {
    this.initAttractions();
    this.getUserLocation();
  },

  onShow() {
    // 每次显示页面时刷新标记
    this.initMarkers();
  },

  // 初始化景点数据
  initAttractions() {
    const attractions = app.globalData.attractions;
    this.setData({
      attractions: attractions
    });
    this.initMarkers();
  },

  // 初始化地图标记
  initMarkers() {
    const attractions = app.globalData.attractions;
    const markers = attractions.map(item => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      title: item.name,
      iconPath: '/images/marker.png',
      width: 40,
      height: 40,
      callout: {
        content: item.name,
        color: '#333',
        fontSize: 14,
        borderRadius: 8,
        bgColor: '#fff',
        padding: 8,
        display: 'BYCLICK',
        textAlign: 'center'
      }
    }));
    this.setData({ markers });
  },

  // 获取用户位置
  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
      },
      fail: (err) => {
        console.log('获取位置失败:', err);
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },

  // 点击地图标记
  onMarkerTap(e) {
    const markerId = e.markerId;
    const attraction = this.data.attractions.find(item => item.id === markerId);
    if (attraction) {
      wx.showActionSheet({
        itemList: ['查看详情', '路线导航'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToDetail({ currentTarget: { dataset: { id: markerId } } });
          } else if (res.tapIndex === 1) {
            this.planRoute({ currentTarget: { dataset: { id: markerId } } });
          }
        }
      });
    }
  },

  // 点击气泡
  onCalloutTap(e) {
    const markerId = e.markerId;
    this.goToDetail({ currentTarget: { dataset: { id: markerId } } });
  },

  // 地图区域变化
  onRegionChange(e) {
    // 可以在这里处理地图缩放或移动后的逻辑
  },

  // 移动到当前位置
  moveToLocation() {
    if (this.data.userLocation) {
      this.setData({
        latitude: this.data.userLocation.latitude,
        longitude: this.data.userLocation.longitude,
        scale: 15
      });
    } else {
      this.getUserLocation();
      wx.showToast({
        title: '正在获取位置',
        icon: 'loading'
      });
    }
  },

  // 重置地图视图
  resetView() {
    this.setData({
      latitude: app.globalData.nanjingCenter.latitude,
      longitude: app.globalData.nanjingCenter.longitude,
      scale: 12
    });
  },

  // 跳转到景点列表页
  goToAttractions() {
    wx.navigateTo({
      url: '/pages/attractions/attractions'
    });
  },

  // 跳转到景点详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 规划路线
  planRoute(e) {
    const id = e.currentTarget.dataset.id;
    const attraction = this.data.attractions.find(item => item.id === id);
    
    if (!attraction) {
      wx.showToast({
        title: '景点信息不存在',
        icon: 'none'
      });
      return;
    }

    // 跳转到路线页面
    wx.navigateTo({
      url: `/pages/route/route?id=${id}&name=${encodeURIComponent(attraction.name)}&lat=${attraction.latitude}&lng=${attraction.longitude}`
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '南京景点推荐 - 发现金陵之美',
      path: '/pages/index/index'
    };
  }
});
