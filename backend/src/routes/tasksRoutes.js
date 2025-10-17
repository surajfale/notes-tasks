const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, toggleComplete } = require('../controllers/tasksController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.route('/').get(getTasks).post(validate(schemas.createTask), createTask);

router
  .route('/:id')
  .get(getTask)
  .put(validate(schemas.updateTask), updateTask)
  .delete(deleteTask);

router.put('/:id/complete', toggleComplete);

module.exports = router;
