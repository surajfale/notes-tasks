const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Task description cannot exceed 5000 characters'],
    },
    dueAt: {
      type: Date,
      index: true,
    },
    reminderAt: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: Number,
      default: 2,
      min: [1, 'Priority must be between 1 and 3'],
      max: [3, 'Priority must be between 1 and 3'],
      enum: [1, 2, 3], // 1=low, 2=normal, 3=high
    },
    tags: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (tags) {
            return tags.length <= 20;
          },
          message: 'Cannot have more than 20 tags',
        },
        {
          validator: function (tags) {
            return tags.every((tag) => tag.length <= 30);
          },
          message: 'Each tag cannot exceed 30 characters',
        },
      ],
    },
    checklistItems: {
      type: [
        {
          text: {
            type: String,
            required: true,
            maxlength: [255, 'Checklist item cannot exceed 255 characters'],
          },
          isCompleted: {
            type: Boolean,
            default: false,
          },
          order: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
      validate: {
        validator: function (items) {
          return items.length <= 50;
        },
        message: 'Cannot have more than 50 checklist items',
      },
    },
    // Notification preference fields
    notificationEnabled: {
      type: Boolean,
      default: false,
    },
    notificationTimings: {
      type: [String],
      default: [],
      enum: ['same_day', '1_day_before', '2_days_before'],
      validate: {
        validator: function (timings) {
          return timings.length <= 3;
        },
        message: 'Cannot have more than 3 notification timings',
      },
    },
    // Notification tracking fields
    lastNotificationSent: {
      type: Date,
      index: true,
    },
    notificationsSent: {
      type: [String],
      default: [],
      enum: ['same_day', '1_day_before', '2_days_before'],
      validate: {
        validator: function (notifications) {
          return notifications.length <= 3;
        },
        message: 'Cannot have more than 3 notification types',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ userId: 1, listId: 1, dueAt: 1 });
taskSchema.index({ userId: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, priority: -1, dueAt: 1 });
taskSchema.index({ userId: 1, tags: 1 });
taskSchema.index({ userId: 1, dueAt: 1, lastNotificationSent: 1 });

// Middleware to reset notification tracking when due date changes
taskSchema.pre('save', function (next) {
  if (this.isModified('dueAt')) {
    // Reset notification tracking when due date changes
    this.lastNotificationSent = undefined;
    this.notificationsSent = [];
    
    // If due date is removed, disable notifications
    if (!this.dueAt) {
      this.notificationEnabled = false;
      this.notificationTimings = [];
    }
  }
  next();
});

// Transform output
taskSchema.methods.toJSON = function () {
  const task = this.toObject();
  delete task.__v;
  return task;
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
