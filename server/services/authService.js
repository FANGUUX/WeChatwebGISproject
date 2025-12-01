/**
 * Authentication Service
 * 认证服务 - 处理用户注册登录
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

class AuthService {
  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        role: user.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }

  /**
   * WeChat login
   * @param {string} code - WeChat auth code
   * @returns {Object} User and token
   */
  async wechatLogin(code) {
    // In production, exchange code for session with WeChat API
    // This is a simplified implementation
    const mockOpenId = `wx_${code}_${Date.now()}`;

    let user = await User.findOne({ openId: mockOpenId });

    if (!user) {
      // Create new user for first-time login
      user = await User.create({
        openId: mockOpenId,
        nickname: '微信用户',
        role: 'user',
        status: 'active'
      });
    }

    await user.updateLoginStats();
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Phone login/register
   * @param {string} phone - Phone number
   * @param {string} password - Password
   * @param {boolean} isRegister - Is registration
   * @returns {Object} User and token
   */
  async phoneLogin(phone, password, isRegister = false) {
    if (isRegister) {
      // Check if phone already exists
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw new Error('该手机号已注册');
      }

      // Create new user
      const user = await User.create({
        phone,
        password,
        nickname: `用户${phone.slice(-4)}`,
        role: 'user',
        status: 'active'
      });

      const token = this.generateToken(user);
      return { user, token };
    }

    // Login
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      throw new Error('用户不存在');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    await user.updateLoginStats();
    const token = this.generateToken(user);

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Object} Updated user
   */
  async updateProfile(userId, profileData) {
    const allowedFields = ['nickname', 'avatar', 'gender', 'birthday', 'city', 'country', 'province'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    return user;
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Object} Updated user
   */
  async updatePreferences(userId, preferences) {
    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true, runValidators: true }
    );

    return user;
  }
}

module.exports = new AuthService();
