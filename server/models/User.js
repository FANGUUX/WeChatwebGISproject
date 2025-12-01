/**
 * User Model
 * 用户模型 - 处理用户账户与管理
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic info
  openId: {
    type: String,
    unique: true,
    sparse: true
  },
  unionId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    select: false
  },

  // Profile info (个人资料)
  nickname: {
    type: String,
    default: '游客'
  },
  avatar: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    enum: [0, 1, 2], // 0: unknown, 1: male, 2: female
    default: 0
  },
  birthday: Date,
  city: String,
  country: String,
  province: String,

  // Preferences (用户偏好)
  preferences: {
    favoriteCategories: [{
      type: String // e.g., 'nature', 'history', 'entertainment'
    }],
    preferredTransport: {
      type: String,
      enum: ['walking', 'driving', 'transit', 'cycling'],
      default: 'walking'
    },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000 }
    },
    foodPreferences: [{
      type: String // e.g., 'chinese', 'western', 'japanese'
    }],
    avoidCrowds: {
      type: Boolean,
      default: false
    }
  },

  // Behavior tracking (行为采集)
  behaviorData: {
    viewedAttractions: [{
      attractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' },
      viewCount: { type: Number, default: 0 },
      lastViewed: Date
    }],
    searchHistory: [{
      keyword: String,
      timestamp: { type: Date, default: Date.now }
    }],
    visitedPlaces: [{
      placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' },
      visitedAt: Date,
      duration: Number // in minutes
    }]
  },

  // System fields
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update login stats
userSchema.methods.updateLoginStats = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

// Add behavior record
userSchema.methods.addBehavior = function(type, data) {
  switch(type) {
    case 'view':
      const existing = this.behaviorData.viewedAttractions.find(
        v => v.attractionId.toString() === data.attractionId.toString()
      );
      if (existing) {
        existing.viewCount += 1;
        existing.lastViewed = new Date();
      } else {
        this.behaviorData.viewedAttractions.push({
          attractionId: data.attractionId,
          viewCount: 1,
          lastViewed: new Date()
        });
      }
      break;
    case 'search':
      this.behaviorData.searchHistory.push({
        keyword: data.keyword,
        timestamp: new Date()
      });
      // Keep only last 100 searches
      if (this.behaviorData.searchHistory.length > 100) {
        this.behaviorData.searchHistory = this.behaviorData.searchHistory.slice(-100);
      }
      break;
    case 'visit':
      this.behaviorData.visitedPlaces.push({
        placeId: data.placeId,
        visitedAt: new Date(),
        duration: data.duration || 0
      });
      break;
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
