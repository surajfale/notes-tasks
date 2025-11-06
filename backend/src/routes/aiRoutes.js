const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { enhanceContent } = require('../controllers/aiController');

// @route   POST /api/ai/enhance
// @desc    Enhance note or task content using AI
// @access  Private
router.post('/enhance', protect, validate(schemas.enhanceContent), enhanceContent);

module.exports = router;
