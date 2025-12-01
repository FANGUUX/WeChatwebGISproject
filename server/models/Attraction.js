/**
 * Attraction Model
 * 景点模型 - 支持智能景点推荐
 */
const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['nature', 'history', 'entertainment', 'culture', 'shopping', 'sports'],
    required: true
  },
  tags: [{
    type: String
  }],

  // Location info (GIS data)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String,
    city: String,
    province: String
  },

  // Media
  images: [{
    url: String,
    caption: String
  }],
  coverImage: String,

  // Rating and reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

  // Pricing
  ticketPrice: {
    adult: { type: Number, default: 0 },
    child: { type: Number, default: 0 },
    senior: { type: Number, default: 0 }
  },
  isFree: {
    type: Boolean,
    default: false
  },

  // Operating hours
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },

  // Real-time data for recommendations
  passengerFlow: {
    current: { type: Number, default: 0 },
    capacity: { type: Number, default: 1000 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Weather suitability
  weatherSuitability: {
    sunny: { type: Number, default: 1, min: 0, max: 1 },
    cloudy: { type: Number, default: 1, min: 0, max: 1 },
    rainy: { type: Number, default: 0.5, min: 0, max: 1 },
    snowy: { type: Number, default: 0.3, min: 0, max: 1 }
  },

  // Recommended visit duration (in minutes)
  recommendedDuration: {
    type: Number,
    default: 120
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
attractionSchema.index({ 'location': '2dsphere' });

// Calculate recommendation score
attractionSchema.methods.calculateRecommendationScore = function(weatherCondition, weights) {
  const { rating: ratingWeight, weather: weatherWeight, passengerFlow: flowWeight } = weights;

  // Rating score (0-1)
  const ratingScore = this.rating.average / 5;

  // Weather suitability score (0-1)
  const weatherScore = this.weatherSuitability[weatherCondition] || 0.5;

  // Passenger flow score (inverse - less crowded is better) (0-1)
  const flowRatio = this.passengerFlow.current / this.passengerFlow.capacity;
  const flowScore = 1 - Math.min(flowRatio, 1);

  // Weighted total score
  return (ratingScore * ratingWeight) + (weatherScore * weatherWeight) + (flowScore * flowWeight);
};

// Static method to find nearby attractions
attractionSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'active'
  });
};

module.exports = mongoose.model('Attraction', attractionSchema);
