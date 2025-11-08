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
const notificationAdminRoutes = require('./routes/notificationAdminRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize notification cron jobs
if (process.env.NODE_ENV !== 'test') {
  const cron = require('node-cron');
  const { startNotificationScheduler } = require('./services/notificationScheduler');
  const { cleanupOldNotificationLogs } = require('./services/notificationCleanupJob');
  
  // Start notification cron job
  // Run every hour to check each user's preferred notification time
  const cronSchedule = process.env.NOTIFICATION_CRON_SCHEDULE || '0 * * * *'; // Default: Every hour
  const timezone = process.env.NOTIFICATION_TIMEZONE || 'UTC';
  
  cron.schedule(cronSchedule, async () => {
    logger.info('Starting scheduled notification processing...');
    try {
      await startNotificationScheduler();
      logger.info('Scheduled notification processing completed successfully');
    } catch (error) {
      logger.error('Error in scheduled notification processing:', error);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });
  
  logger.info(`Notification cron job scheduled: ${cronSchedule} (${timezone}) - checks hourly for user-specific times`);
  
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

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/admin/notifications', notificationAdminRoutes);

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
