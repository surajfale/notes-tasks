const Joi = require('joi');
const { THEME_PALETTES } = require('../config/themes');
const { FREQUENCIES, MAX_INTERVAL, MAX_REMINDERS_PER_TASK, isValidTimezone } = require('../services/reminders');

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

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// One custom reminder (see services/reminders.js). nextFireAt/lastFiredAt are
// server-owned; clients echo them back from the task they loaded, so they're
// accepted here and ignored (mergeReminders never reads them).
const reminder = Joi.object({
  _id: objectId.optional(),
  startAt: Joi.date().iso().required(),
  timezone: Joi.string()
    .max(64)
    .required()
    .custom((value, helpers) => (isValidTimezone(value) ? value : helpers.error('any.invalid'))),
  repeat: Joi.object({
    frequency: Joi.string().valid(...FREQUENCIES).default('none'),
    interval: Joi.number().integer().min(1).default(1),
    weekdays: Joi.array().items(Joi.number().integer().min(1).max(7)).max(7).unique().default([]),
  }).default({ frequency: 'none' }).custom((value, helpers) => {
    const max = MAX_INTERVAL[value.frequency];
    return value.interval > max
      ? helpers.message(`repeat.interval cannot exceed ${max} for ${value.frequency}`)
      : value;
  }),
  channels: Joi.object({
    email: Joi.boolean().default(false),
    push: Joi.boolean().default(false),
  }).required().custom((value, helpers) => (
    value.email || value.push ? value : helpers.message('Choose at least one channel (email or browser)')
  )),
  nextFireAt: Joi.any().strip(),
  lastFiredAt: Joi.any().strip(),
});

const reminders = Joi.array().items(reminder).max(MAX_REMINDERS_PER_TASK);

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

  updateTheme: Joi.object({
    themePalette: Joi.string().valid(...THEME_PALETTES).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
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
    listId: objectId.optional(),
    title: Joi.string().max(200).required(),
    description: Joi.string().max(5000).allow('').optional(),
    dueAt: Joi.date().iso().optional(),
    reminderAt: Joi.date().iso().optional(),
    isCompleted: Joi.boolean().optional(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    reminders: reminders.optional(),
  }),

  updateTask: Joi.object({
    listId: objectId.allow(null).optional(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(5000).allow('').optional(),
    dueAt: Joi.date().iso().allow(null).optional(),
    reminderAt: Joi.date().iso().allow(null).optional(),
    isCompleted: Joi.boolean().optional(),
    priority: Joi.number().integer().min(1).max(3).optional(),
    reminders: reminders.optional(),
  }).min(1),

  enhanceContent: Joi.object({
    content: Joi.string().required().min(1).max(10000),
    contentType: Joi.string().valid('note', 'task').required(),
    tone: Joi.string().valid('concise', 'detailed', 'professional', 'casual').optional().default('casual'),
  }),

  updateNotificationPreferences: Joi.object({
    emailNotificationsEnabled: Joi.boolean().optional(),
    timezone: Joi.string().max(50).optional(),
  }).min(1),
};

module.exports = { validate, schemas };
