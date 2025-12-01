// pages/detail/detail.js - 景点详情逻辑
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    attractionId: null,
    attraction: {},
    markers: [],
    isFavorite: false,
    recommendedAttractions: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        attractionId: parseInt(options.id)
      });
      this.loadAttractionDetail();
    }
  },

  // 加载景点详情
  loadAttractionDetail() {
    const attractions = app.globalData.attractions;
    const attraction = attractions.find(item => item.id === this.data.attractionId);
    
    if (!attraction) {
      wx.showToast({
        title: '景点不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 设置地图标记
    const markers = [{
      id: attraction.id,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      title: attraction.name,
      iconPath: '/images/marker.png',
      width: 40,
      height: 40
    }];

    // 获取推荐景点（排除当前景点，按距离排序取前5个）
    const recommended = this.getRecommendedAttractions(attraction, attractions);

    // 检查是否已收藏
    const favorites = wx.getStorageSync('favorites') || [];
    const isFavorite = favorites.includes(attraction.id);

    this.setData({
      attraction,
      markers,
      isFavorite,
      recommendedAttractions: recommended
    });
  },

  // 获取推荐景点
  getRecommendedAttractions(currentAttraction, allAttractions) {
    return allAttractions
      .filter(item => item.id !== currentAttraction.id)
      .map(item => {
        const distance = util.getDistance(
          currentAttraction.latitude, currentAttraction.longitude,
          item.latitude, item.longitude
        );
        return { ...item, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 切换收藏状态
  toggleFavorite() {
    let favorites = wx.getStorageSync('favorites') || [];
    const id = this.data.attraction.id;
    
    if (this.data.isFavorite) {
      favorites = favorites.filter(fid => fid !== id);
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    } else {
      favorites.push(id);
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      });
    }
    
    wx.setStorageSync('favorites', favorites);
    this.setData({
      isFavorite: !this.data.isFavorite
    });
  },

  // 分享景点
  shareAttraction() {
    // 触发分享
  },

  // 路线规划
  planRoute() {
    const attraction = this.data.attraction;
    wx.navigateTo({
      url: `/pages/route/route?id=${attraction.id}&name=${encodeURIComponent(attraction.name)}&lat=${attraction.latitude}&lng=${attraction.longitude}`
    });
  },

  // 打开导航
  openNavigation() {
    const attraction = this.data.attraction;
    wx.openLocation({
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      name: attraction.name,
      address: attraction.address,
      scale: 18
    });
  },

  // 跳转到其他景点详情
  goToOtherDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 分享功能
  onShareAppMessage() {
    const attraction = this.data.attraction;
    return {
      title: `${attraction.name} - 南京景点推荐`,
      path: `/pages/detail/detail?id=${attraction.id}`,
      imageUrl: attraction.image
    };
  }
});
