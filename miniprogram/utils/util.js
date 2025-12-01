/**
 * Utility Functions for Mini Program
 * 工具函数
 */

/**
 * Format distance
 */
const formatDistance = (meters) => {
  if (!meters) return '';
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
};

/**
 * Format duration
 */
const formatDuration = (minutes) => {
  if (!minutes) return '';
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

/**
 * Format date
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Format time
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Get transport mode icon
 */
const getTransportIcon = (mode) => {
  const icons = {
    walking: '🚶',
    driving: '🚗',
    transit: '🚌',
    cycling: '🚲'
  };
  return icons[mode] || '🚶';
};

/**
 * Get transport mode name
 */
const getTransportName = (mode) => {
  const names = {
    walking: '步行',
    driving: '驾车',
    transit: '公交',
    cycling: '骑行'
  };
  return names[mode] || '步行';
};

/**
 * Get crowd level color
 */
const getCrowdLevelColor = (level) => {
  const colors = {
    '空闲': '#52c41a',
    '适中': '#1890ff',
    '较多': '#faad14',
    '拥挤': '#f5222d'
  };
  return colors[level] || '#1890ff';
};

/**
 * Get category name
 */
const getCategoryName = (category) => {
  const names = {
    nature: '自然风光',
    history: '历史古迹',
    entertainment: '休闲娱乐',
    culture: '文化艺术',
    shopping: '购物',
    sports: '运动户外'
  };
  return names[category] || category;
};

/**
 * Get cuisine name
 */
const getCuisineName = (cuisine) => {
  const names = {
    chinese: '中餐',
    western: '西餐',
    japanese: '日料',
    korean: '韩餐',
    thai: '泰餐',
    indian: '印度菜',
    italian: '意餐',
    french: '法餐',
    mexican: '墨西哥菜',
    other: '其他'
  };
  return names[cuisine] || cuisine;
};

/**
 * Show toast message
 */
const showToast = (title, icon = 'none') => {
  wx.showToast({ title, icon, duration: 2000 });
};

/**
 * Show loading
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

/**
 * Hide loading
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * Confirm dialog
 */
const confirm = (content, title = '提示') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

module.exports = {
  formatDistance,
  formatDuration,
  formatDate,
  formatTime,
  getTransportIcon,
  getTransportName,
  getCrowdLevelColor,
  getCategoryName,
  getCuisineName,
  showToast,
  showLoading,
  hideLoading,
  confirm
};
