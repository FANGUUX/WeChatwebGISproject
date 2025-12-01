// pages/route/route.js - 路线规划逻辑
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    startLocation: {
      name: '我的位置',
      latitude: null,
      longitude: null
    },
    endLocation: {
      id: null,
      name: '',
      latitude: null,
      longitude: null
    },
    mapCenter: {
      latitude: 32.0603,
      longitude: 118.7969
    },
    scale: 14,
    markers: [],
    polyline: [],
    currentMode: 'driving',
    routeInfo: {},
    currentRouteDetail: null,
    routeSteps: [],
    isPanelExpanded: false
  },

  onLoad(options) {
    // 解析目的地信息
    if (options.id) {
      this.setData({
        'endLocation.id': parseInt(options.id),
        'endLocation.name': decodeURIComponent(options.name || ''),
        'endLocation.latitude': parseFloat(options.lat),
        'endLocation.longitude': parseFloat(options.lng)
      });
    }

    this.getUserLocation();
  },

  // 获取用户位置
  getUserLocation() {
    wx.showLoading({
      title: '获取位置中...'
    });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'startLocation.latitude': res.latitude,
          'startLocation.longitude': res.longitude
        });
        this.initMap();
        this.calculateRoute();
      },
      fail: (err) => {
        console.log('获取位置失败:', err);
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '无法获取您的位置，请授权位置权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
        // 使用默认位置（南京市中心）
        this.setData({
          'startLocation.latitude': 32.0603,
          'startLocation.longitude': 118.7969,
          'startLocation.name': '南京市中心'
        });
        this.initMap();
        this.calculateRoute();
      }
    });
  },

  // 初始化地图
  initMap() {
    const { startLocation, endLocation } = this.data;
    
    // 设置地图中心为起点和终点的中点
    const centerLat = (startLocation.latitude + endLocation.latitude) / 2;
    const centerLng = (startLocation.longitude + endLocation.longitude) / 2;

    // 设置标记点
    const markers = [
      {
        id: 1,
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        title: startLocation.name,
        iconPath: '/images/start-marker.png',
        width: 40,
        height: 40,
        callout: {
          content: '起点',
          color: '#07c160',
          fontSize: 12,
          borderRadius: 6,
          bgColor: '#fff',
          padding: 6,
          display: 'ALWAYS'
        }
      },
      {
        id: 2,
        latitude: endLocation.latitude,
        longitude: endLocation.longitude,
        title: endLocation.name,
        iconPath: '/images/end-marker.png',
        width: 40,
        height: 40,
        callout: {
          content: endLocation.name,
          color: '#ff4d4f',
          fontSize: 12,
          borderRadius: 6,
          bgColor: '#fff',
          padding: 6,
          display: 'ALWAYS'
        }
      }
    ];

    this.setData({
      mapCenter: {
        latitude: centerLat,
        longitude: centerLng
      },
      markers
    });
  },

  // 计算路线
  calculateRoute() {
    wx.hideLoading();

    const { startLocation, endLocation, currentMode } = this.data;
    
    // 模拟路线数据（实际项目中需调用地图服务API）
    const distance = util.getDistance(
      startLocation.latitude, startLocation.longitude,
      endLocation.latitude, endLocation.longitude
    );

    // 根据出行方式估算时间
    const routeInfo = {
      walking: {
        distance: util.formatDistance(distance),
        duration: util.formatDuration(distance / 80) // 步行速度约80米/分钟
      },
      driving: {
        distance: util.formatDistance(distance * 1.3), // 实际路程约为直线距离的1.3倍
        duration: util.formatDuration(distance * 1.3 / 500), // 驾车速度约500米/分钟
        trafficLights: Math.floor(distance / 1000)
      },
      transit: {
        distance: util.formatDistance(distance * 1.5),
        duration: util.formatDuration(distance * 1.5 / 300) // 公交速度约300米/分钟
      },
      bicycling: {
        distance: util.formatDistance(distance * 1.2),
        duration: util.formatDuration(distance * 1.2 / 200) // 骑行速度约200米/分钟
      }
    };

    // 生成路线点（简化版，实际需调用导航API）
    const polyline = this.generateRouteLine(startLocation, endLocation);
    
    // 生成路线步骤
    const routeSteps = this.generateRouteSteps(currentMode, endLocation.name);

    this.setData({
      routeInfo,
      currentRouteDetail: routeInfo[currentMode],
      polyline,
      routeSteps
    });
  },

  // 生成路线（简化版）
  generateRouteLine(start, end) {
    // 生成一条从起点到终点的折线
    // 实际项目中应调用地图服务API获取真实路线
    const points = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const lat = start.latitude + (end.latitude - start.latitude) * (i / steps);
      const lng = start.longitude + (end.longitude - start.longitude) * (i / steps);
      // 添加一些随机偏移使路线看起来更自然
      const offset = (Math.random() - 0.5) * 0.002;
      points.push({
        latitude: lat + (i > 0 && i < steps ? offset : 0),
        longitude: lng + (i > 0 && i < steps ? offset : 0)
      });
    }

    return [{
      points: points,
      color: '#07c160',
      width: 6,
      dottedLine: false,
      arrowLine: true
    }];
  },

  // 生成路线步骤
  generateRouteSteps(mode, destination) {
    const modeText = {
      walking: '步行',
      driving: '驾车',
      transit: '乘坐公交',
      bicycling: '骑行'
    };

    return [
      { instruction: '从当前位置出发', distance: '' },
      { instruction: '沿道路向前行驶', distance: '500米' },
      { instruction: '在前方路口右转', distance: '200米' },
      { instruction: '继续直行', distance: '1公里' },
      { instruction: '在路口左转进入主干道', distance: '800米' },
      { instruction: `到达目的地：${destination}`, distance: '' }
    ];
  },

  // 选择出行方式
  selectMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const routeSteps = this.generateRouteSteps(mode, this.data.endLocation.name);
    
    this.setData({
      currentMode: mode,
      currentRouteDetail: this.data.routeInfo[mode],
      routeSteps
    });

    // 更新路线颜色
    const colorMap = {
      walking: '#07c160',
      driving: '#1890ff',
      transit: '#ff9800',
      bicycling: '#9c27b0'
    };

    const polyline = this.data.polyline.map(line => ({
      ...line,
      color: colorMap[mode]
    }));

    this.setData({ polyline });
  },

  // 展开/收起面板
  togglePanel() {
    this.setData({
      isPanelExpanded: !this.data.isPanelExpanded
    });
  },

  // 打开导航
  openNavigation() {
    const { endLocation } = this.data;
    wx.openLocation({
      latitude: endLocation.latitude,
      longitude: endLocation.longitude,
      name: endLocation.name,
      scale: 18
    });
  },

  // 分享路线
  shareRoute() {
    // 触发分享
  },

  // 分享功能
  onShareAppMessage() {
    const { endLocation } = this.data;
    return {
      title: `前往${endLocation.name}的路线`,
      path: `/pages/route/route?id=${endLocation.id}&name=${encodeURIComponent(endLocation.name)}&lat=${endLocation.latitude}&lng=${endLocation.longitude}`
    };
  }
});
