const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { THEME_PALETTES, DEFAULT_THEME_PALETTE } = require('../config/themes');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    // Color theme (see config/themes.js), synced so it follows the account
    // across devices. Light/dark mode is deliberately not stored here — it
    // stays per device, following each device's system preference.
    themePalette: {
      type: String,
      enum: THEME_PALETTES,
      default: DEFAULT_THEME_PALETTE,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Set whenever the password changes; JWTs issued before it are rejected
    // (middleware/auth.js), so a password change/reset logs out every other
    // session, including a stolen token.
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Statics
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

/**
 * Whether a JWT issued at `iatSeconds` predates the last password change.
 * JWT iat has 1-second resolution, so a token minted in the same second as
 * the change is still accepted (that's the fresh token handed back by the
 * change-password response).
 */
userSchema.methods.tokenIssuedBeforePasswordChange = function (iatSeconds) {
  if (!this.passwordChangedAt) return false;
  return iatSeconds < Math.floor(this.passwordChangedAt.getTime() / 1000);
};

// Transform output (remove sensitive fields)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
