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

router.use(protect);

router.route('/')
    .get(getLinks)
    .post(createLink);

router.route('/:id')
    .get(getLink)
    .put(updateLink)
    .delete(deleteLink);

module.exports = router;
