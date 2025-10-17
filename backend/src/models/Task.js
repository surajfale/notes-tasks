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
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ userId: 1, listId: 1, dueAt: 1 });
taskSchema.index({ userId: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, priority: -1, dueAt: 1 });

// Transform output
taskSchema.methods.toJSON = function () {
  const task = this.toObject();
  delete task.__v;
  return task;
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
