const List = require('../models/List');

// @desc    Get all user's lists
// @route   GET /api/lists
// @access  Private
const getLists = async (req, res, next) => {
  try {
    const lists = await List.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ lists });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single list
// @route   GET /api/lists/:id
// @access  Private
const getList = async (req, res, next) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'List not found',
        },
      });
    }

    res.json({ list });
  } catch (error) {
    next(error);
  }
};

// @desc    Create list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res, next) => {
  try {
    const { title, color, emoji } = req.body;

    const list = await List.create({
      userId: req.user._id,
      title,
      color,
      emoji,
    });

    res.status(201).json({ list });
  } catch (error) {
    next(error);
  }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res, next) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'List not found',
        },
      });
    }

    const { title, color, emoji } = req.body;

    if (title !== undefined) list.title = title;
    if (color !== undefined) list.color = color;
    if (emoji !== undefined) list.emoji = emoji;

    await list.save();

    res.json({ list });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res, next) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'List not found',
        },
      });
    }

    await list.deleteOne();

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLists,
  getList,
  createList,
  updateList,
  deleteList,
};
