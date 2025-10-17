const Task = require('../models/Task');

// @desc    Get all user's tasks
// @route   GET /api/tasks?listId=&isCompleted=&priority=
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { listId, isCompleted, priority } = req.query;
    
    const filter = { userId: req.user._id };
    
    if (listId) filter.listId = listId;
    if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';
    if (priority) filter.priority = parseInt(priority);
    
    const tasks = await Task.find(filter)
      .sort({ isCompleted: 1, priority: -1, dueAt: 1 })
      .limit(100);
    
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { listId, title, description, dueAt, reminderAt, isCompleted, priority } = req.body;

    const task = await Task.create({
      userId: req.user._id,
      listId,
      title,
      description,
      dueAt,
      reminderAt,
      isCompleted,
      priority,
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    const { listId, title, description, dueAt, reminderAt, isCompleted, priority } = req.body;

    if (listId !== undefined) task.listId = listId;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueAt !== undefined) task.dueAt = dueAt;
    if (reminderAt !== undefined) task.reminderAt = reminderAt;
    if (isCompleted !== undefined) task.isCompleted = isCompleted;
    if (priority !== undefined) task.priority = priority;

    await task.save();

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle task completion
// @route   PUT /api/tasks/:id/complete
// @access  Private
const toggleComplete = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    task.isCompleted = !task.isCompleted;
    await task.save();

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
};
