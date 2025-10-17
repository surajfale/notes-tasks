const express = require('express');
const router = express.Router();
const { getNotes, getNote, createNote, updateNote, deleteNote, toggleArchive } = require('../controllers/notesController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.route('/').get(getNotes).post(validate(schemas.createNote), createNote);

router
  .route('/:id')
  .get(getNote)
  .put(validate(schemas.updateNote), updateNote)
  .delete(deleteNote);

router.put('/:id/archive', toggleArchive);

module.exports = router;
