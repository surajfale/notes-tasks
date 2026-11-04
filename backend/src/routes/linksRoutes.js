const express = require('express');
const router = express.Router();
const {
    getLinks,
    getLink,
    createLink,
    updateLink,
    deleteLink,
} = require('../controllers/linksController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(protect);

router.route('/')
    .get(getLinks)
    .post(validate(schemas.createLink), createLink);

router.route('/:id')
    .get(getLink)
    .put(validate(schemas.updateLink), updateLink)
    .delete(deleteLink);

module.exports = router;
