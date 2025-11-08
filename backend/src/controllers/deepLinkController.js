const logger = require('../utils/logger');

/**
 * Handle deep link access to tasks from email notifications
 * @route GET /api/tasks/link/:token
 */
const handleTaskDeepLink = async (req, res) => {
  try {
    // User and task are already validated by authenticateDeepLink middleware
    const { user, task, deepLinkToken } = req;
    
    // Log the deep link access for analytics
    logger.info('Deep link accessed', {
      userId: user._id,
      taskId: task._id,
      timestamp: new Date().toISOString()
    });

    // Return task details and redirect information
    // The frontend will handle the actual navigation
    res.json({
      success: true,
      data: {
        task: {
          _id: task._id,
          title: task.title,
          description: task.description,
          dueAt: task.dueAt,
          priority: task.priority,
          isCompleted: task.isCompleted,
          listId: task.listId
        },
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName
        },
        redirectUrl: `/tasks/${task._id}`,
        message: 'Task accessed successfully via deep link'
      }
    });
  } catch (error) {
    logger.error('Error handling task deep link:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing task deep link'
      }
    });
  }
};

/**
 * Handle deep link with authentication check
 * Returns different responses based on authentication status
 * @route GET /api/tasks/link/:token/check
 */
const checkTaskDeepLink = async (req, res) => {
  try {
    const { user, task, isAuthenticated } = req;
    
    if (!isAuthenticated) {
      // User needs to login first
      return res.json({
        success: true,
        requiresAuth: true,
        data: {
          taskId: task._id,
          taskTitle: task.title,
          redirectUrl: `/login?redirect=/tasks/${task._id}`,
          message: 'Please login to access this task'
        }
      });
    }

    // User is authenticated, return task details
    res.json({
      success: true,
      requiresAuth: false,
      data: {
        task: {
          _id: task._id,
          title: task.title,
          description: task.description,
          dueAt: task.dueAt,
          priority: task.priority,
          isCompleted: task.isCompleted,
          listId: task.listId
        },
        redirectUrl: `/tasks/${task._id}`,
        message: 'Task accessed successfully'
      }
    });
  } catch (error) {
    logger.error('Error checking task deep link:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error checking task deep link'
      }
    });
  }
};

module.exports = {
  handleTaskDeepLink,
  checkTaskDeepLink
};