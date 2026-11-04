const Note = require('../models/Note');
const { queryString, escapeRegex } = require('../utils/query');
const { listBelongsToUser, listNotFound } = require('../utils/listOwnership');

// @desc    Get all user's notes
// @route   GET /api/notes?listId=&isArchived=&tags=&search=
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const listId = queryString(req.query.listId);
    const isArchived = queryString(req.query.isArchived);
    const tags = queryString(req.query.tags);
    const search = queryString(req.query.search);
    
    const filter = { userId: req.user._id };
    
    if (listId) filter.listId = listId;
    if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
    if (tags) filter.tags = { $in: tags.split(',') };
    
    if (search) {
      // Literal text search: user input is never interpreted as a regex.
      const pattern = escapeRegex(search.slice(0, 200));
      filter.$or = [
        { title: { $regex: pattern, $options: 'i' } },
        { body: { $regex: pattern, $options: 'i' } },
      ];
    }
    
    const notes = await Note.find(filter).sort({ updatedAt: -1 }).limit(100);
    
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

// @desc    Create note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const { listId, title, body, tags, isArchived } = req.body;

    if (!(await listBelongsToUser(listId, req.user._id))) return listNotFound(res);

    const note = await Note.create({
      userId: req.user._id,
      listId,
      title,
      body,
      tags,
      isArchived,
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    const { listId, title, body, tags, isArchived } = req.body;

    if (listId !== undefined && !(await listBelongsToUser(listId, req.user._id))) return listNotFound(res);

    if (listId !== undefined) note.listId = listId;
    if (title !== undefined) note.title = title;
    if (body !== undefined) note.body = body;
    if (tags !== undefined) note.tags = tags;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();

    res.json(note);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    await note.deleteOne();

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle note archive status
// @route   PUT /api/notes/:id/archive
// @access  Private
const toggleArchive = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    note.isArchived = !note.isArchived;
    await note.save();

    res.json(note);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  toggleArchive,
};
