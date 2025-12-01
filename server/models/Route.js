/**
 * Route Model
 * 路线模型 - 支持智能路线规划
 */
const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  // Route creator
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Route name
  name: {
    type: String,
    default: '我的路线'
  },

  // Waypoints (路径点)
  waypoints: [{
    order: { type: Number, required: true },
    placeId: { type: mongoose.Schema.Types.ObjectId, refPath: 'waypoints.placeType' },
    placeType: { type: String, enum: ['Attraction', 'Food'] },
    name: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },
    arrivalTime: Date,
    departureTime: Date,
    duration: Number, // planned stay duration in minutes
    notes: String
  }],

  // Transportation mode (交通方式)
  transportMode: {
    type: String,
    enum: ['walking', 'driving', 'transit', 'cycling', 'mixed'],
    default: 'walking'
  },

  // Segment details (between waypoints)
  segments: [{
    fromIndex: Number,
    toIndex: Number,
    mode: {
      type: String,
      enum: ['walking', 'driving', 'transit', 'cycling']
    },
    distance: Number, // in meters
    duration: Number, // in minutes
    polyline: String, // encoded polyline for map display
    steps: [{
      instruction: String,
      distance: Number,
      duration: Number
    }]
  }],

  // Route statistics
  totalDistance: {
    type: Number,
    default: 0 // in meters
  },
  totalDuration: {
    type: Number,
    default: 0 // in minutes
  },
  totalCost: {
    type: Number,
    default: 0 // estimated cost
  },

  // Optimization settings
  optimization: {
    avoidHighways: { type: Boolean, default: false },
    avoidTolls: { type: Boolean, default: false },
    preferScenic: { type: Boolean, default: false },
    optimizeOrder: { type: Boolean, default: true } // auto-optimize waypoint order
  },

  // Real-time status
  status: {
    type: String,
    enum: ['draft', 'planned', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  currentWaypointIndex: {
    type: Number,
    default: 0
  },

  // Scheduled start time
  startTime: Date,

  // Sharing settings
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Calculate total distance and duration
routeSchema.methods.calculateTotals = function() {
  this.totalDistance = this.segments.reduce((sum, seg) => sum + (seg.distance || 0), 0);
  this.totalDuration = this.segments.reduce((sum, seg) => sum + (seg.duration || 0), 0);
  // Add waypoint durations
  this.totalDuration += this.waypoints.reduce((sum, wp) => sum + (wp.duration || 0), 0);
  return this.save();
};

// Reorder waypoints for optimization
routeSchema.methods.optimizeOrder = async function(optimizationService) {
  if (this.waypoints.length <= 2) return this;

  const coordinates = this.waypoints.map(wp => wp.location.coordinates);
  const optimizedOrder = await optimizationService.findOptimalOrder(coordinates);

  const reorderedWaypoints = optimizedOrder.map((newIndex, order) => ({
    ...this.waypoints[newIndex].toObject(),
    order
  }));

  this.waypoints = reorderedWaypoints;
  return this.save();
};

// Add a waypoint
routeSchema.methods.addWaypoint = function(waypoint) {
  const maxOrder = Math.max(...this.waypoints.map(w => w.order), -1);
  waypoint.order = maxOrder + 1;
  this.waypoints.push(waypoint);
  return this.save();
};

// Remove a waypoint
routeSchema.methods.removeWaypoint = function(waypointId) {
  this.waypoints = this.waypoints.filter(w => w._id.toString() !== waypointId.toString());
  // Reorder remaining waypoints
  this.waypoints.forEach((w, index) => {
    w.order = index;
  });
  return this.save();
};

module.exports = mongoose.model('Route', routeSchema);
