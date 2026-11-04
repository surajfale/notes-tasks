require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const listsRoutes = require('./routes/listsRoutes');
const notesRoutes = require('./routes/notesRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const deepLinkRoutes = require('./routes/deepLinkRoutes');
const linksRoutes = require('./routes/linksRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize notification cron jobs
if (process.env.NODE_ENV !== 'test') {
  const cron = require('node-cron');
  const { runDueReminders } = require('./services/reminderScheduler');
  const { cleanupOldNotificationLogs } = require('./services/notificationCleanupJob');

  // Reminder delivery: every minute, send reminders whose time has come.
  // Each reminder carries its own timezone, so the cron's timezone only
  // matters for the cleanup job below.
  const reminderSchedule = process.env.REMINDER_CRON_SCHEDULE || '* * * * *';
  const timezone = process.env.NOTIFICATION_TIMEZONE || 'UTC';

  cron.schedule(reminderSchedule, async () => {
    try {
      await runDueReminders();
    } catch (error) {
      logger.error('Error in reminder scheduler tick:', error);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });

  logger.info(`Reminder scheduler running: ${reminderSchedule}`);

  // Start cleanup cron job (weekly on Sunday at 2 AM)
  const cleanupSchedule = process.env.NOTIFICATION_CLEANUP_CRON_SCHEDULE || '0 2 * * 0';
  const cleanupDaysToKeep = parseInt(process.env.NOTIFICATION_LOGS_RETENTION_DAYS) || 90;

  cron.schedule(cleanupSchedule, async () => {
    logger.info('Starting scheduled notification logs cleanup...');
    try {
      await cleanupOldNotificationLogs(cleanupDaysToKeep);
      logger.info('Scheduled notification logs cleanup completed successfully');
    } catch (error) {
      logger.error('Error in scheduled notification logs cleanup:', error);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });

  logger.info(`Notification cleanup job scheduled: ${cleanupSchedule} (${timezone}), keeping ${cleanupDaysToKeep} days`);
}

// Behind a reverse proxy (Railway, etc.) req.ip is the proxy's address
// unless Express is told how many hops to trust; without it every client
// shares one rate-limit bucket. Set TRUST_PROXY to the hop count (usually 1)
// ONLY when actually behind a proxy, or clients can spoof X-Forwarded-For.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}

// Plain key=value query strings only: no ?a[$ne]=x objects reaching filters.
app.set('query parser', 'simple');

if (process.env.NODE_ENV === 'production' && !process.env.DEEP_LINK_SECRET) {
  logger.warn('DEEP_LINK_SECRET is not set; email deep/unsubscribe links are signed with JWT_SECRET. Set a separate secret.');
}

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // In development, allow any port on localhost (exact hostname match:
    // a prefix check would also allow http://localhost.evil.com)
    if (process.env.NODE_ENV === 'development') {
      try {
        const { protocol, hostname } = new URL(origin);
        if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
          return callback(null, true);
        }
      } catch {
        // Malformed Origin: fall through to the allowlist (and rejection)
      }
    }

    // In production, check allowed origins
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
// Largest legitimate body is an AI enhance request (10k chars) or a task
// with 50 checklist items; 1mb leaves lots of headroom.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tasks', deepLinkRoutes);
app.use('/api/links', linksRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Notes & Tasks API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      lists: '/api/lists',
      notes: '/api/notes',
      tasks: '/api/tasks',
      ai: '/api/ai',
      notifications: '/api/notifications',
      deepLinks: '/api/tasks/link/:token',
      links: '/api/links',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
