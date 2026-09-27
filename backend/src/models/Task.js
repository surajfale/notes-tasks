const mongoose = require('mongoose');
const {
  FREQUENCIES,
  MAX_INTERVAL,
  MAX_REMINDERS_PER_TASK,
  isValidTimezone,
  computeNextFireAt,
} = require('../services/reminders');

const reminderSchema = new mongoose.Schema({
  // First occurrence, as a UTC instant.
  startAt: { type: Date, required: true },
  // IANA zone the reminder was set in; repeats follow its wall clock.
  timezone: {
    type: String,
    required: true,
    validate: { validator: isValidTimezone, message: 'Invalid timezone' },
  },
  repeat: {
    frequency: { type: String, enum: FREQUENCIES, default: 'none' },
    interval: { type: Number, default: 1, min: 1 },
    // ISO weekdays (1 = Monday ... 7 = Sunday); weekly only.
    weekdays: { type: [{ type: Number, min: 1, max: 7 }], default: [] },
  },
  channels: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
  },
  // Server-owned: recomputed on every save (pre-save hook below) and
  // advanced by the scheduler after each occurrence. null = no more
  // occurrences.
  nextFireAt: { type: Date, default: null },
  lastFiredAt: { type: Date, default: null },
});

// Cross-field rules: the interval cap depends on the frequency, and there
// must be at least one channel to deliver on.
reminderSchema.pre('validate', function (next) {
  const frequency = this.repeat?.frequency || 'none';
  if ((this.repeat?.interval || 1) > MAX_INTERVAL[frequency]) {
    this.invalidate('repeat.interval', `Repeat interval cannot exceed ${MAX_INTERVAL[frequency]} for ${frequency}`);
  }
  if (!this.channels?.email && !this.channels?.push) {
    this.invalidate('channels', 'Choose at least one channel (email or browser)');
  }
  next();
});

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
    // Custom reminders (see services/reminders.js for the recurrence rules
    // and services/reminderScheduler.js for delivery). Replaces the old
    // global "N days before the due date" notifications.
    reminders: {
      type: [reminderSchema],
      default: [],
      validate: {
        validator: (reminders) => reminders.length <= MAX_REMINDERS_PER_TASK,
        message: `Cannot have more than ${MAX_REMINDERS_PER_TASK} reminders`,
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
// The reminder scheduler's per-minute query: due reminders on open tasks.
taskSchema.index({ 'reminders.nextFireAt': 1, isCompleted: 1 });

// Keep each reminder's nextFireAt in step with its rule. Runs on create,
// update and completion toggles alike (they all go through save()), so the
// scheduler never needs to know why a reminder changed.
taskSchema.pre('save', function (next) {
  if (this.isModified('reminders') || this.isModified('isCompleted')) {
    const now = new Date();
    for (const reminder of this.reminders) {
      reminder.nextFireAt = computeNextFireAt(reminder, now);
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
