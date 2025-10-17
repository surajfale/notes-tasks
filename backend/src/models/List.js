const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      maxlength: [100, 'List title cannot exceed 100 characters'],
    },
    color: {
      type: String,
      default: '#2196F3',
      match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code'],
    },
    emoji: {
      type: String,
      maxlength: [10, 'Emoji field cannot exceed 10 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
listSchema.index({ userId: 1, updatedAt: -1 });

// Transform output
listSchema.methods.toJSON = function () {
  const list = this.toObject();
  delete list.__v;
  return list;
};

const List = mongoose.model('List', listSchema);

module.exports = List;
