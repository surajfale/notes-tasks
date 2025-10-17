const express = require('express');
const router = express.Router();
const { getLists, getList, createList, updateList, deleteList } = require('../controllers/listsController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.route('/').get(getLists).post(validate(schemas.createList), createList);

router
  .route('/:id')
  .get(getList)
  .put(validate(schemas.updateList), updateList)
  .delete(deleteList);

module.exports = router;
