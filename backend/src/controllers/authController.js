const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
      if (userExists.username === username) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Username already exists',
            details: [{ field: 'username', message: 'This username is already taken' }],
          },
        });
      }
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Email already exists',
          details: [{ field: 'email', message: 'This email is already registered' }],
        },
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      displayName: displayName || username,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
        },
      });
    }

    // Hash and update new password
    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    res.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
