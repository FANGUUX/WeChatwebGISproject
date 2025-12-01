/**
 * Food (Restaurant) Model
 * 美食商家模型 - 支持周边美食发现
 */
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
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
  cuisine: {
    type: String,
    enum: ['chinese', 'western', 'japanese', 'korean', 'thai', 'indian', 'italian', 'french', 'mexican', 'other'],
    required: true
  },
  subCategory: String, // e.g., 'sichuan', 'cantonese', 'seafood'
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

  // Contact info
  phone: String,

  // Media
  images: [{
    url: String,
    caption: String
  }],
  coverImage: String,

  // Rating and reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    taste: { type: Number, default: 0, min: 0, max: 5 },
    environment: { type: Number, default: 0, min: 0, max: 5 },
    service: { type: Number, default: 0, min: 0, max: 5 }
  },

  // Pricing
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    average: { type: Number, default: 50 }
  },
  priceLevel: {
    type: Number,
    enum: [1, 2, 3, 4, 5], // 1: cheap, 5: expensive
    default: 3
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

  // Features
  features: {
    hasParking: { type: Boolean, default: false },
    hasPrivateRoom: { type: Boolean, default: false },
    acceptsReservation: { type: Boolean, default: true },
    hasWifi: { type: Boolean, default: false },
    isVegetarianFriendly: { type: Boolean, default: false },
    isHalalCertified: { type: Boolean, default: false }
  },

  // Popularity metrics
  popularity: {
    viewCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
foodSchema.index({ 'location': '2dsphere' });

// Calculate match score based on user preferences
foodSchema.methods.calculateMatchScore = function(userPreferences) {
  let score = 0;
  let factors = 0;

  // Cuisine preference match
  if (userPreferences.foodPreferences && userPreferences.foodPreferences.length > 0) {
    if (userPreferences.foodPreferences.includes(this.cuisine)) {
      score += 1;
    }
    factors += 1;
  }

  // Price range match
  if (userPreferences.priceRange) {
    const avgPrice = this.priceRange.average;
    if (avgPrice >= userPreferences.priceRange.min && avgPrice <= userPreferences.priceRange.max) {
      score += 1;
    }
    factors += 1;
  }

  // Rating bonus
  score += (this.rating.average / 5) * 0.5;
  factors += 0.5;

  return factors > 0 ? score / factors : 0.5;
};

// Static method to find nearby restaurants
foodSchema.statics.findNearby = function(longitude, latitude, maxDistance = 3000, options = {}) {
  const query = {
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
  };

  if (options.cuisine) {
    query.cuisine = options.cuisine;
  }

  if (options.priceLevel) {
    query.priceLevel = { $lte: options.priceLevel };
  }

  return this.find(query);
};

module.exports = mongoose.model('Food', foodSchema);
