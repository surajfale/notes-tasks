const ollamaService = require('../services/ollamaService');
const logger = require('../utils/logger');

// @desc    Enhance content using AI
// @route   POST /api/ai/enhance
// @access  Private
// @body    { content: string, contentType: 'note'|'task', tone?: 'concise'|'detailed'|'professional'|'casual' }
const enhanceContent = async (req, res, next) => {
  try {
    const { content, contentType, tone = 'casual' } = req.body;
    
    logger.info(`AI enhancement requested by user ${req.user._id} for ${contentType} with tone: ${tone}`);
    
    // Call Ollama service
    const enhancedContent = await ollamaService.enhanceContent(content, contentType, tone);
    
    logger.info(`AI enhancement completed successfully for user ${req.user._id}`);
    
    res.json({
      success: true,
      enhancedContent,
    });
  } catch (error) {
    logger.error('AI enhancement error:', error);
    
    // Handle specific error types
    if (error.message === 'AI enhancement service is not configured') {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: error.message,
        },
      });
    }
    
    if (error.message === 'Content cannot be empty') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
    
    if (error.message === 'AI enhancement request timed out') {
      return res.status(504).json({
        error: {
          code: 'TIMEOUT',
          message: error.message,
        },
      });
    }
    
    if (error.message === 'Invalid API key') {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
      });
    }
    
    if (error.message === 'Rate limit exceeded, please try again later') {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
        },
      });
    }
    
    if (error.message === 'AI service is temporarily unavailable') {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: error.message,
        },
      });
    }
    
    // Generic error
    next(error);
  }
};

module.exports = { enhanceContent };
