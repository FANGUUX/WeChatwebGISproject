// pages/attractions/attractions.js - 景点列表逻辑
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    attractions: [],
    filteredAttractions: [],
    categories: [],
    currentCategory: '',
    searchKeyword: '',
    sortType: '',
    sortOrder: 'desc',
    userLocation: null
  },

  onLoad() {
    this.initData();
    this.getUserLocation();
  },

  // 初始化数据
  initData() {
    const attractions = app.globalData.attractions;
    
    // 提取所有分类
    const categorySet = new Set();
    attractions.forEach(item => {
      categorySet.add(item.category);
    });
    
    this.setData({
      attractions: attractions,
      filteredAttractions: attractions,
      categories: Array.from(categorySet)
    });
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
        // 计算距离
        this.calculateDistances();
      }
    });
  },

  // 计算所有景点与用户的距离
  calculateDistances() {
    if (!this.data.userLocation) return;
    
    const { latitude, longitude } = this.data.userLocation;
    const attractions = this.data.attractions.map(item => {
      const distance = util.getDistance(
        latitude, longitude,
        item.latitude, item.longitude
      );
      return { ...item, distance };
    });
    
    this.setData({
      attractions,
      filteredAttractions: this.filterAttractions(attractions)
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterAndSort();
  },

  // 执行搜索
  onSearch() {
    this.filterAndSort();
  },

  // 清除搜索
  clearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.filterAndSort();
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category
    });
    this.filterAndSort();
  },

  // 按评分排序
  sortByRating() {
    let order = 'desc';
    if (this.data.sortType === 'rating') {
      order = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    this.setData({
      sortType: 'rating',
      sortOrder: order
    });
    this.filterAndSort();
  },

  // 按距离排序
  sortByDistance() {
    if (!this.data.userLocation) {
      wx.showToast({
        title: '请先获取位置',
        icon: 'none'
      });
      return;
    }
    
    let order = 'asc';
    if (this.data.sortType === 'distance') {
      order = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    this.setData({
      sortType: 'distance',
      sortOrder: order
    });
    this.filterAndSort();
  },

  // 筛选和排序
  filterAndSort() {
    let result = this.filterAttractions(this.data.attractions);
    result = this.sortAttractions(result);
    this.setData({
      filteredAttractions: result
    });
  },

  // 筛选景点
  filterAttractions(attractions) {
    let result = attractions;
    
    // 按分类筛选
    if (this.data.currentCategory) {
      result = result.filter(item => item.category === this.data.currentCategory);
    }
    
    // 按关键词筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(keyword) ||
        item.address.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
    }
    
    return result;
  },

  // 排序景点
  sortAttractions(attractions) {
    if (!this.data.sortType) return attractions;
    
    const sorted = [...attractions];
    const order = this.data.sortOrder === 'desc' ? -1 : 1;
    
    if (this.data.sortType === 'rating') {
      sorted.sort((a, b) => (b.rating - a.rating) * order);
    } else if (this.data.sortType === 'distance' && this.data.userLocation) {
      sorted.sort((a, b) => ((a.distance || 0) - (b.distance || 0)) * order);
    }
    
    return sorted;
  },

  // 跳转到详情页
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

    wx.navigateTo({
      url: `/pages/route/route?id=${id}&name=${encodeURIComponent(attraction.name)}&lat=${attraction.latitude}&lng=${attraction.longitude}`
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '南京景点推荐 - 发现更多精彩景点',
      path: '/pages/attractions/attractions'
    };
  }
});
