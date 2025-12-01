/**
 * Route Planning Service
 * 路线规划服务 - 智能路线规划
 */
const Route = require('../models/Route');
const Attraction = require('../models/Attraction');
const Food = require('../models/Food');
const { calculateDistance } = require('../utils');

class RouteService {
  /**
   * Create a new route
   * @param {string} userId - User ID
   * @param {Object} routeData - Route data
   * @returns {Object} Created route
   */
  async createRoute(userId, routeData) {
    const route = await Route.create({
      userId,
      name: routeData.name || '我的路线',
      waypoints: routeData.waypoints || [],
      transportMode: routeData.transportMode || 'walking',
      optimization: routeData.optimization || {},
      startTime: routeData.startTime
    });

    return route;
  }

  /**
   * Add waypoint to route
   * @param {string} routeId - Route ID
   * @param {Object} waypointData - Waypoint data
   * @returns {Object} Updated route
   */
  async addWaypoint(routeId, waypointData) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('路线不存在');
    }

    // Get place details
    let place;
    if (waypointData.placeType === 'Attraction') {
      place = await Attraction.findById(waypointData.placeId);
    } else if (waypointData.placeType === 'Food') {
      place = await Food.findById(waypointData.placeId);
    }

    if (!place) {
      throw new Error('地点不存在');
    }

    const waypoint = {
      order: route.waypoints.length,
      placeId: place._id,
      placeType: waypointData.placeType,
      name: place.name,
      location: place.location,
      duration: waypointData.duration || (waypointData.placeType === 'Food' ? 60 : 120),
      notes: waypointData.notes
    };

    await route.addWaypoint(waypoint);

    // Recalculate segments if more than one waypoint
    if (route.waypoints.length > 1) {
      await this.calculateSegments(route);
    }

    return route;
  }

  /**
   * Remove waypoint from route
   * @param {string} routeId - Route ID
   * @param {string} waypointId - Waypoint ID
   * @returns {Object} Updated route
   */
  async removeWaypoint(routeId, waypointId) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('路线不存在');
    }

    await route.removeWaypoint(waypointId);

    // Recalculate segments
    if (route.waypoints.length > 1) {
      await this.calculateSegments(route);
    } else {
      route.segments = [];
      route.totalDistance = 0;
      route.totalDuration = 0;
      await route.save();
    }

    return route;
  }

  /**
   * Calculate route segments between waypoints
   * @param {Object} route - Route object
   * @returns {Object} Updated route with segments
   */
  async calculateSegments(route) {
    const segments = [];
    const waypoints = route.waypoints.sort((a, b) => a.order - b.order);

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      // Calculate segment (in production, call Map API)
      const segment = await this.calculateSingleSegment(
        from.location.coordinates,
        to.location.coordinates,
        route.transportMode
      );

      segments.push({
        fromIndex: i,
        toIndex: i + 1,
        mode: route.transportMode,
        ...segment
      });
    }

    route.segments = segments;
    await route.calculateTotals();

    return route;
  }

  /**
   * Calculate single segment between two points
   * @param {Array} fromCoords - Start coordinates [lng, lat]
   * @param {Array} toCoords - End coordinates [lng, lat]
   * @param {string} mode - Transport mode
   * @returns {Object} Segment details
   */
  async calculateSingleSegment(fromCoords, toCoords, mode) {
    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(fromCoords, toCoords);

    // Estimate duration based on mode
    const speeds = {
      walking: 5,    // km/h
      cycling: 15,   // km/h
      driving: 40,   // km/h
      transit: 25    // km/h (average)
    };

    const speed = speeds[mode] || speeds.walking;
    const duration = Math.round((distance / 1000 / speed) * 60); // minutes

    return {
      distance: Math.round(distance),
      duration,
      polyline: '', // Would be filled by Map API
      steps: [{
        instruction: `${mode === 'walking' ? '步行' : mode === 'cycling' ? '骑行' : mode === 'driving' ? '驾车' : '乘车'}前往下一站`,
        distance: Math.round(distance),
        duration
      }]
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Uses the shared utility function
   * @param {Array} coord1 - [lng, lat]
   * @param {Array} coord2 - [lng, lat]
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    return calculateDistance(coord1, coord2);
  }

  /**
   * Optimize route waypoint order using nearest neighbor algorithm
   * @param {string} routeId - Route ID
   * @returns {Object} Optimized route
   */
  async optimizeRoute(routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('路线不存在');
    }

    if (route.waypoints.length <= 2) {
      return route; // No optimization needed
    }

    const waypoints = route.waypoints.sort((a, b) => a.order - b.order);
    const optimizedOrder = this.findOptimalOrder(
      waypoints.map(w => w.location.coordinates)
    );

    // Reorder waypoints
    const reorderedWaypoints = optimizedOrder.map((originalIndex, newOrder) => ({
      ...waypoints[originalIndex].toObject(),
      order: newOrder
    }));

    route.waypoints = reorderedWaypoints;
    await route.save();

    // Recalculate segments
    await this.calculateSegments(route);

    return route;
  }

  /**
   * Find optimal order using nearest neighbor algorithm
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @returns {Array} Optimized order indices
   */
  findOptimalOrder(coordinates) {
    const n = coordinates.length;
    if (n <= 2) return coordinates.map((_, i) => i);

    const visited = new Array(n).fill(false);
    const order = [0]; // Start from first point
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      const currentIndex = order[order.length - 1];

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const distance = this.calculateDistance(
            coordinates[currentIndex],
            coordinates[j]
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = j;
          }
        }
      }

      if (nearestIndex !== -1) {
        order.push(nearestIndex);
        visited[nearestIndex] = true;
      }
    }

    return order;
  }

  /**
   * Get multi-modal route (mixed transportation)
   * @param {string} routeId - Route ID
   * @param {Array} segmentModes - Array of transport modes for each segment
   * @returns {Object} Updated route
   */
  async setMultiModalRoute(routeId, segmentModes) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('路线不存在');
    }

    route.transportMode = 'mixed';
    const waypoints = route.waypoints.sort((a, b) => a.order - b.order);
    const segments = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const mode = segmentModes[i] || 'walking';
      const segment = await this.calculateSingleSegment(
        waypoints[i].location.coordinates,
        waypoints[i + 1].location.coordinates,
        mode
      );

      segments.push({
        fromIndex: i,
        toIndex: i + 1,
        mode,
        ...segment
      });
    }

    route.segments = segments;
    await route.calculateTotals();

    return route;
  }

  /**
   * Update route in real-time based on current conditions
   * @param {string} routeId - Route ID
   * @param {Object} currentLocation - Current user location
   * @returns {Object} Updated route
   */
  async updateRouteRealtime(routeId, currentLocation) {
    const route = await Route.findById(routeId);
    if (!route) {
      throw new Error('路线不存在');
    }

    // Find nearest waypoint
    const waypoints = route.waypoints.sort((a, b) => a.order - b.order);
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = route.currentWaypointIndex; i < waypoints.length; i++) {
      const distance = this.calculateDistance(
        [currentLocation.longitude, currentLocation.latitude],
        waypoints[i].location.coordinates
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // If very close to current waypoint (within 100m), move to next
    if (nearestDistance < 100 && nearestIndex === route.currentWaypointIndex) {
      route.currentWaypointIndex = nearestIndex + 1;
    }

    // Recalculate remaining segments from current position
    if (route.currentWaypointIndex > 0) {
      // Update first remaining segment to start from current location
      const remainingWaypoints = waypoints.slice(route.currentWaypointIndex);
      if (remainingWaypoints.length > 0) {
        const firstSegment = await this.calculateSingleSegment(
          [currentLocation.longitude, currentLocation.latitude],
          remainingWaypoints[0].location.coordinates,
          route.transportMode
        );

        // Update estimated arrival times
        route.segments = route.segments.map((seg, i) => {
          if (i >= route.currentWaypointIndex - 1) {
            return { ...seg, ...firstSegment };
          }
          return seg;
        });
      }
    }

    await route.save();
    return route;
  }

  /**
   * Get user's routes
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} User's routes
   */
  async getUserRoutes(userId, options = {}) {
    const query = { userId };
    if (options.status) {
      query.status = options.status;
    }

    const routes = await Route.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 20);

    return routes;
  }
}

module.exports = new RouteService();
