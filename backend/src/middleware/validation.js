const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details,
        },
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    displayName: Joi.string().max(50).optional(),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),

  createList: Joi.object({
    title: Joi.string().max(100).required(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    emoji: Joi.string().max(10).optional(),
  }),

  updateList: Joi.object({
    title: Joi.string().max(100).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    emoji: Joi.string().max(10).optional(),
  }).min(1),

  createNote: Joi.object({
    listId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    title: Joi.string().max(200).required(),
    body: Joi.string().max(2000).allow('').optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(20).optional(),
    isArchived: Joi.boolean().optional(),
  }),

  updateNote: Joi.object({
    listId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional(),
    title: Joi.string().max(200).optional(),
    body: Joi.string().max(2000).allow('').optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(20).optional(),
    isArchived: Joi.boolean().optional(),
  }).min(1),

  createTask: Joi.object({
    listId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    title: Joi.string().max(200).required(),
    description: Joi.string().max(5000).allow('').optional(),
    dueAt: Joi.date().iso().optional(),
    reminderAt: Joi.date().iso().optional(),
    isCompleted: Joi.boolean().optional(),
    priority: Joi.number().integer().min(1).max(3).optional(),
  }),

  updateTask: Joi.object({
    listId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(5000).allow('').optional(),
    dueAt: Joi.date().iso().allow(null).optional(),
    reminderAt: Joi.date().iso().allow(null).optional(),
    isCompleted: Joi.boolean().optional(),
    priority: Joi.number().integer().min(1).max(3).optional(),
  }).min(1),

  enhanceContent: Joi.object({
    content: Joi.string().required().min(1).max(10000),
    contentType: Joi.string().valid('note', 'task').required(),
    tone: Joi.string().valid('concise', 'detailed', 'professional', 'casual').optional().default('casual'),
  }),
};

module.exports = { validate, schemas };
