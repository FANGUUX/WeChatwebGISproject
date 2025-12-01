/**
 * Map Service
 * 地图服务 - 第三方地图API集成
 */
const config = require('../config');
const { calculateDistance } = require('../utils');

class MapService {
  constructor() {
    this.apiKey = config.thirdParty.map.apiKey;
    this.baseUrl = config.thirdParty.map.baseUrl;
  }

  /**
   * Get route between multiple points
   * @param {Array} waypoints - Array of [longitude, latitude] coordinates
   * @param {string} mode - Transport mode
   * @returns {Object} Route data
   */
  async getRoute(waypoints, mode = 'walking') {
    if (waypoints.length < 2) {
      throw new Error('至少需要两个路径点');
    }

    // In production, this would call the actual Map API
    // For now, return calculated data
    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = this.calculateDistance(waypoints[i], waypoints[i + 1]);
      const duration = this.estimateDuration(distance, mode);

      segments.push({
        from: waypoints[i],
        to: waypoints[i + 1],
        distance,
        duration,
        polyline: this.encodePolyline([waypoints[i], waypoints[i + 1]])
      });

      totalDistance += distance;
      totalDuration += duration;
    }

    return {
      segments,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
      mode
    };
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Object} Location data
   */
  async geocode(address) {
    // In production, call Map API
    // Return mock data
    return {
      address,
      location: {
        longitude: 116.397428 + (Math.random() - 0.5) * 0.1,
        latitude: 39.90923 + (Math.random() - 0.5) * 0.1
      },
      formattedAddress: address,
      province: '北京市',
      city: '北京市',
      district: '朝阳区'
    };
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} longitude - Longitude
   * @param {number} latitude - Latitude
   * @returns {Object} Address data
   */
  async reverseGeocode(longitude, latitude) {
    // In production, call Map API
    return {
      location: { longitude, latitude },
      formattedAddress: '北京市朝阳区xxx路xxx号',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      street: 'xxx路',
      streetNumber: 'xxx号'
    };
  }

  /**
   * Search for POIs (Points of Interest)
   * @param {string} keyword - Search keyword
   * @param {Object} options - Search options
   * @returns {Array} POI results
   */
  async searchPOI(keyword, options = {}) {
    const { longitude, latitude, radius = 5000, type } = options;

    // In production, call Map API
    // Return mock data
    return [
      {
        id: 'poi_1',
        name: `${keyword}附近景点1`,
        type: type || 'attraction',
        location: {
          longitude: longitude ? longitude + 0.01 : 116.397428,
          latitude: latitude ? latitude + 0.01 : 39.90923
        },
        address: '北京市朝阳区xxx路',
        distance: Math.floor(Math.random() * radius)
      },
      {
        id: 'poi_2',
        name: `${keyword}附近景点2`,
        type: type || 'attraction',
        location: {
          longitude: longitude ? longitude - 0.01 : 116.387428,
          latitude: latitude ? latitude - 0.01 : 39.89923
        },
        address: '北京市朝阳区yyy路',
        distance: Math.floor(Math.random() * radius)
      }
    ];
  }

  /**
   * Calculate distance between two points
   * Uses the shared utility function
   * @param {Array} coord1 - [longitude, latitude]
   * @param {Array} coord2 - [longitude, latitude]
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    return calculateDistance(coord1, coord2);
  }

  /**
   * Estimate travel duration
   * @param {number} distance - Distance in meters
   * @param {string} mode - Transport mode
   * @returns {number} Duration in minutes
   */
  estimateDuration(distance, mode) {
    const speeds = {
      walking: 5 * 1000 / 60,    // 5 km/h in m/min
      cycling: 15 * 1000 / 60,   // 15 km/h
      driving: 40 * 1000 / 60,   // 40 km/h
      transit: 25 * 1000 / 60    // 25 km/h
    };

    const speed = speeds[mode] || speeds.walking;
    return Math.ceil(distance / speed);
  }

  /**
   * Encode polyline for map display
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @returns {string} Encoded polyline
   */
  encodePolyline(coordinates) {
    // Simplified polyline encoding
    return coordinates.map(c => `${c[0]},${c[1]}`).join('|');
  }
}

module.exports = new MapService();
