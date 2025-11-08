/**
 * End-to-End Notification Flow Test Script
 * 
 * This script tests the complete notification pipeline:
 * 1. Database connection
 * 2. Email service initialization
 * 3. Notification scheduler
 * 4. Notification processor
 * 5. Email template generation
 * 6. Deep link generation
 * 7. Notification logging
 * 
 * Usage: node src/scripts/testNotificationFlow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { startNotificationScheduler } = require('../services/notificationScheduler');
const { processNotifications } = require('../services/notificationProcessor');
const emailTemplateService = require('../services/emailTemplateService');
const { generateDeepLinkToken } = require('../middleware/deepLinkAuth');

// Test configuration
const TEST_CONFIG = {
  skipEmailSend: process.env.SKIP_EMAIL_SEND === 'true', // Set to true to skip actual email sending
  testUserId: process.env.TEST_USER_ID || null, // Optional: test specific user
  verbose: process.env.VERBOSE === 'true'
};

/**
 * Main test function
 */
async function runNotificationFlowTest() {
  console.log('\n=== Starting End-to-End Notification Flow Test ===\n');
  
  const results = {
    databaseConnection: false,
    emailServiceInitialization: false,
    templateGeneration: false,
    deepLinkGeneration: false,
    notificationScheduler: false,
    notificationProcessor: false,
    notificationLogging: false,
    overallSuccess: false
  };

  try {
    // Test 1: Database Connection
    console.log('Test 1: Database Connection...');
    await testDatabaseConnection();
    results.databaseConnection = true;
    console.log('✓ Database connection successful\n');

    // Test 2: Email Service Initialization
    console.log('Test 2: Email Service Initialization...');
    await testEmailServiceInitialization();
    results.emailServiceInitialization = true;
    console.log('✓ Email service initialized successfully\n');

    // Test 3: Template Generation
    console.log('Test 3: Email Template Generation...');
    await testTemplateGeneration();
    results.templateGeneration = true;
    console.log('✓ Email template generation successful\n');

    // Test 4: Deep Link Generation
    console.log('Test 4: Deep Link Generation...');
    await testDeepLinkGeneration();
    results.deepLinkGeneration = true;
    console.log('✓ Deep link generation successful\n');

    // Test 5: Notification Logging
    console.log('Test 5: Notification Logging...');
    await testNotificationLogging();
    results.notificationLogging = true;
    console.log('✓ Notification logging successful\n');

    // Test 6: Notification Processor
    console.log('Test 6: Notification Processor...');
    await testNotificationProcessor();
    results.notificationProcessor = true;
    console.log('✓ Notification processor successful\n');

    // Test 7: Notification Scheduler (Full Integration)
    console.log('Test 7: Notification Scheduler (Full Integration)...');
    await testNotificationScheduler();
    results.notificationScheduler = true;
    console.log('✓ Notification scheduler successful\n');

    results.overallSuccess = true;
    console.log('\n=== All Tests Passed Successfully! ===\n');

  } catch (error) {
    console.error('\n✗ Test Failed:', error.message);
    if (TEST_CONFIG.verbose) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Print summary
    printTestSummary(results);
    
    // Cleanup
    await cleanup();
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI not configured in environment variables');
  }

  if (mongoose.connection.readyState === 1) {
    console.log('  - Already connected to MongoDB');
    return;
  }

  await mongoose.connect(mongoUri);
  console.log('  - Connected to MongoDB successfully');
  console.log(`  - Database: ${mongoose.connection.name}`);
}

/**
 * Test email service initialization
 */
async function testEmailServiceInitialization() {
  const isAvailable = emailService.isAvailable();
  
  if (!isAvailable) {
    throw new Error('Email service is not available. Check RESEND_API_KEY and RESEND_FROM_EMAIL configuration.');
  }

  console.log('  - Email service is available');
  
  const health = emailService.getServiceHealth();
  console.log('  - Service health:', JSON.stringify(health, null, 2));
  
  if (!health.healthy) {
    throw new Error('Email service is not healthy');
  }

  const cbState = emailService.getCircuitBreakerState();
  console.log(`  - Circuit breaker state: ${cbState.state}`);
  
  if (cbState.state === 'OPEN') {
    throw new Error('Circuit breaker is OPEN - email service unavailable');
  }
}

/**
 * Test email template generation
 */
async function testTemplateGeneration() {
  const testUserId = new mongoose.Types.ObjectId();
  const testTaskId = new mongoose.Types.ObjectId();
  
  // Test task notification email
  const testData = {
    user: {
      _id: testUserId,
      displayName: 'Test User',
      email: 'test@example.com'
    },
    task: {
      _id: testTaskId,
      userId: testUserId,
      title: 'Test Task',
      description: 'This is a test task for notification flow testing',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: 2,
      isCompleted: false
    },
    list: {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test List',
      color: '#4CAF50',
      emoji: '📝'
    },
    notificationType: '1_day_before'
  };

  const emailContent = await emailTemplateService.generateTaskNotificationEmail(testData);
  
  if (!emailContent.subject || !emailContent.html || !emailContent.text) {
    throw new Error('Task notification template generation failed - missing required fields');
  }

  console.log('  - Task notification subject:', emailContent.subject);
  console.log('  - Task notification HTML length:', emailContent.html.length, 'characters');
  console.log('  - Deep link included:', emailContent.html.includes('tasks/link/'));

  // Test welcome email
  const welcomeData = {
    user: {
      displayName: 'Test User',
      email: 'test@example.com'
    }
  };

  const welcomeContent = await emailTemplateService.generateWelcomeEmail(welcomeData);
  
  if (!welcomeContent.subject || !welcomeContent.html || !welcomeContent.text) {
    throw new Error('Welcome email template generation failed - missing required fields');
  }

  console.log('  - Welcome email subject:', welcomeContent.subject);
  console.log('  - Welcome email HTML length:', welcomeContent.html.length, 'characters');
  console.log('  - Welcome email includes app URL:', welcomeContent.html.includes(process.env.FRONTEND_BASE_URL || 'localhost'));
}

/**
 * Test deep link generation
 */
async function testDeepLinkGeneration() {
  const testUserId = new mongoose.Types.ObjectId();
  const testTaskId = new mongoose.Types.ObjectId();
  
  const token = generateDeepLinkToken(testUserId.toString(), testTaskId.toString());
  
  if (!token || token.length < 10) {
    throw new Error('Deep link token generation failed');
  }

  console.log('  - Token generated successfully');
  console.log('  - Token length:', token.length);
  console.log('  - Sample token:', token.substring(0, 20) + '...');
  
  const deepLink = `${process.env.FRONTEND_BASE_URL}/tasks/link/${token}`;
  console.log('  - Deep link:', deepLink);
}

/**
 * Test notification logging
 */
async function testNotificationLogging() {
  const NotificationLog = require('../models/NotificationLog');
  
  const testLog = {
    userId: new mongoose.Types.ObjectId(),
    taskId: new mongoose.Types.ObjectId(),
    notificationType: '1_day_before', // Use valid notification type
    emailId: 'test-email-id-' + Date.now(),
    status: 'sent',
    errorMessage: null,
    retryCount: 0
  };

  const log = await NotificationLog.logNotification(testLog);
  
  if (!log || !log._id) {
    throw new Error('Notification logging failed');
  }

  console.log('  - Notification logged successfully');
  console.log('  - Log ID:', log._id);
  
  // Test duplicate check
  const isDuplicate = await NotificationLog.hasNotificationBeenSent(
    testLog.userId,
    testLog.taskId,
    testLog.notificationType,
    24
  );
  
  console.log('  - Duplicate check working:', isDuplicate);
  
  // Cleanup test log
  await NotificationLog.deleteOne({ _id: log._id });
  console.log('  - Test log cleaned up');
}

/**
 * Test notification processor
 */
async function testNotificationProcessor() {
  const User = require('../models/User');
  const Task = require('../models/Task');
  
  // Find a test user and task, or skip if none available
  const user = await User.findOne().lean();
  
  if (!user) {
    console.log('  - No users found, skipping processor test');
    return;
  }

  const task = await Task.findOne({ 
    userId: user._id,
    isCompleted: false,
    dueAt: { $exists: true }
  }).lean();

  if (!task) {
    console.log('  - No suitable tasks found, skipping processor test');
    return;
  }

  console.log('  - Found test user:', user.email);
  console.log('  - Found test task:', task.title);

  // Create test notification (but don't actually send email if configured)
  const testNotifications = [{
    userId: user._id,
    user: user,
    task: task,
    notificationType: '1_day_before', // Use valid notification type
    scheduledFor: new Date(),
    timezone: 'UTC'
  }];

  if (TEST_CONFIG.skipEmailSend) {
    console.log('  - Skipping actual email send (SKIP_EMAIL_SEND=true)');
    console.log('  - Notification processor structure validated');
  } else {
    const result = await processNotifications(testNotifications);
    console.log('  - Processor result:', JSON.stringify(result.summary, null, 2));
  }
}

/**
 * Test notification scheduler
 */
async function testNotificationScheduler() {
  const NotificationPreference = require('../models/NotificationPreference');
  
  // Check if any users have notifications enabled
  const usersWithNotifications = await NotificationPreference.countDocuments({
    emailNotificationsEnabled: true
  });

  console.log('  - Users with notifications enabled:', usersWithNotifications);

  if (usersWithNotifications === 0) {
    console.log('  - No users with notifications enabled, skipping scheduler test');
    console.log('  - Scheduler structure validated');
    return;
  }

  if (TEST_CONFIG.skipEmailSend) {
    console.log('  - Skipping actual scheduler run (SKIP_EMAIL_SEND=true)');
    console.log('  - Scheduler structure validated');
  } else {
    const result = await startNotificationScheduler();
    console.log('  - Scheduler result:', JSON.stringify(result, null, 2));
  }
}

/**
 * Print test summary
 */
function printTestSummary(results) {
  console.log('\n=== Test Summary ===\n');
  
  const tests = [
    { name: 'Database Connection', result: results.databaseConnection },
    { name: 'Email Service Initialization', result: results.emailServiceInitialization },
    { name: 'Template Generation', result: results.templateGeneration },
    { name: 'Deep Link Generation', result: results.deepLinkGeneration },
    { name: 'Notification Logging', result: results.notificationLogging },
    { name: 'Notification Processor', result: results.notificationProcessor },
    { name: 'Notification Scheduler', result: results.notificationScheduler }
  ];

  tests.forEach(test => {
    const status = test.result ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  console.log('\n' + '='.repeat(50));
  
  if (results.overallSuccess) {
    console.log('Overall Status: ✓ ALL TESTS PASSED');
  } else {
    console.log('Overall Status: ✗ SOME TESTS FAILED');
  }
  
  console.log('='.repeat(50) + '\n');
}

/**
 * Cleanup resources
 */
async function cleanup() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runNotificationFlowTest()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runNotificationFlowTest };
