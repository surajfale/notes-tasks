const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { generateDeepLinkToken } = require('../middleware/deepLinkAuth');

class EmailTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
    this.templateCache = new Map();
    this.deepLinkSecret = process.env.DEEP_LINK_SECRET || process.env.JWT_SECRET;
    this.frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com';
  }

  /**
   * Load and cache email template
   * @param {string} templateName - Name of the template file (without extension)
   * @returns {Promise<string>} Template content
   * @private
   */
  async loadTemplate(templateName) {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      // Cache the template
      this.templateCache.set(templateName, templateContent);
      
      logger.debug(`Loaded email template: ${templateName}`);
      return templateContent;
    } catch (error) {
      logger.error(`Failed to load email template ${templateName}:`, error.message);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Simple template engine - replaces {{variable}} with values
   * Supports basic conditionals: {{#if variable}}content{{/if}}
   * @param {string} template - Template content
   * @param {Object} data - Data to replace in template
   * @returns {string} Rendered template
   * @private
   */
  renderTemplate(template, data) {
    let rendered = template;

    // Handle conditional blocks first: {{#if variable}}content{{/if}}
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    rendered = rendered.replace(conditionalRegex, (match, variable, content) => {
      const value = this.getNestedValue(data, variable);
      return value ? content : '';
    });

    // Handle simple variable replacements: {{variable}}
    const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    rendered = rendered.replace(variableRegex, (match, variable) => {
      const value = this.getNestedValue(data, variable);
      return value !== undefined ? this.escapeHtml(String(value)) : '';
    });

    return rendered;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path (e.g., 'user.name')
   * @returns {*} Value or undefined
   * @private
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Escape HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  escapeHtml(text) {
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  /**
   * Generate secure deep link token for task access
   * Uses the centralized deep link token generation from middleware
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @param {number} expiresInHours - Token expiration in hours (default: 24)
   * @returns {string} JWT token for deep link
   */
  generateDeepLinkTokenForTask(userId, taskId, expiresInHours = 24) {
    return generateDeepLinkToken(userId, taskId, expiresInHours);
  }

  /**
   * Generate deep link URL for task
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {string} Deep link URL
   */
  generateTaskDeepLink(userId, taskId) {
    const token = this.generateDeepLinkTokenForTask(userId, taskId);
    return `${this.frontendBaseUrl}/tasks/link/${token}`;
  }

  /**
   * Generate unsubscribe link for user
   * @param {string} userId - User ID
   * @returns {string} Unsubscribe URL
   */
  generateUnsubscribeLink(userId) {
    const token = this.generateDeepLinkTokenForTask(userId, 'unsubscribe', 168); // 7 days
    return `${this.frontendBaseUrl}/notifications/unsubscribe/${token}`;
  }

  /**
   * Format task priority for display
   * @param {number} priority - Priority level (1-3)
   * @returns {Object} Priority display info
   * @private
   */
  formatPriority(priority) {
    const priorityMap = {
      1: { text: 'Low', level: 'low' },
      2: { text: 'Medium', level: 'medium' },
      3: { text: 'High', level: 'high' }
    };
    
    return priorityMap[priority] || { text: 'Medium', level: 'medium' };
  }

  /**
   * Format date for email display
   * @param {Date|string} date - Date to format
   * @param {string} timezone - User's timezone (optional)
   * @returns {string} Formatted date string
   * @private
   */
  formatDate(date, timezone = 'UTC') {
    try {
      const dateObj = new Date(date);
      
      // Format as readable date
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      };
      
      return dateObj.toLocaleDateString('en-US', options);
    } catch (error) {
      logger.warn('Failed to format date:', error.message);
      return String(date);
    }
  }

  /**
   * Generate task notification email content
   * @param {Object} params - Email generation parameters
   * @param {Object} params.user - User object with name and email
   * @param {Object} params.task - Task object with title, description, dueDate, priority
   * @param {Object} [params.list] - Optional list object with name
   * @param {string} [params.notificationType] - Type of notification (same_day, 1_day_before, etc.)
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async generateTaskNotificationEmail({ user, task, list, notificationType }) {
    try {
      // Load the template
      const template = await this.loadTemplate('taskNotificationEmail');
      
      // Format priority
      const priorityInfo = this.formatPriority(task.priority);
      
      // Format due date
      const formattedDueDate = this.formatDate(task.dueDate, user.timezone);
      
      // Generate links
      const taskLink = this.generateTaskDeepLink(user._id.toString(), task._id.toString());
      const unsubscribeLink = this.generateUnsubscribeLink(user._id.toString());
      const supportLink = `mailto:${this.supportEmail}`;
      
      // Prepare template data
      const templateData = {
        userName: user.displayName || user.name || 'there',
        taskTitle: task.title,
        taskDescription: task.description || '',
        dueDate: formattedDueDate,
        priority: priorityInfo.text,
        priorityLevel: priorityInfo.level,
        listName: list ? list.name : '',
        taskLink,
        unsubscribeLink,
        supportLink
      };
      
      // Render HTML content
      const htmlContent = this.renderTemplate(template, templateData);
      
      // Generate plain text version
      const textContent = this.generatePlainTextVersion(templateData);
      
      // Generate subject line
      const subject = this.generateSubjectLine(task, notificationType);
      
      logger.debug('Generated task notification email', {
        userId: user._id,
        taskId: task._id,
        subject
      });
      
      return {
        subject,
        html: htmlContent,
        text: textContent
      };
      
    } catch (error) {
      logger.error('Failed to generate task notification email:', error.message);
      throw new Error(`Failed to generate email: ${error.message}`);
    }
  }

  /**
   * Generate subject line for task notification
   * @param {Object} task - Task object
   * @param {string} notificationType - Type of notification
   * @returns {string} Email subject
   * @private
   */
  generateSubjectLine(task, notificationType) {
    const typeMap = {
      'same_day': '📋 Task Due Today',
      '1_day_before': '📋 Task Due Tomorrow',
      '2_days_before': '📋 Task Due in 2 Days',
      'overdue': '⚠️ Overdue Task'
    };
    
    const prefix = typeMap[notificationType] || '📋 Task Reminder';
    return `${prefix}: ${task.title}`;
  }

  /**
   * Generate plain text version of email
   * @param {Object} data - Template data
   * @returns {string} Plain text email content
   * @private
   */
  generatePlainTextVersion(data) {
    let text = `Hello ${data.userName},\n\n`;
    text += `This is a friendly reminder about your upcoming task:\n\n`;
    text += `Task: ${data.taskTitle}\n`;
    
    if (data.taskDescription) {
      text += `Description: ${data.taskDescription}\n`;
    }
    
    text += `Due Date: ${data.dueDate}\n`;
    text += `Priority: ${data.priority}\n`;
    
    if (data.listName) {
      text += `List: ${data.listName}\n`;
    }
    
    text += `\nView Task: ${data.taskLink}\n\n`;
    text += `Stay organized and productive!\n\n`;
    text += `---\n`;
    text += `Task Management System\n`;
    text += `Need help? Contact support: ${data.supportLink}\n\n`;
    text += `Don't want to receive these notifications? Update your preferences: ${data.unsubscribeLink}`;
    
    return text;
  }

  /**
   * Verify deep link token
   * @param {string} token - JWT token to verify
   * @returns {Promise<{valid: boolean, payload?: Object, error?: string}>}
   */
  async verifyDeepLinkToken(token) {
    if (!this.deepLinkSecret) {
      return { valid: false, error: 'Deep link secret not configured' };
    }

    try {
      const payload = jwt.verify(token, this.deepLinkSecret, {
        issuer: 'task-management-system',
        audience: 'task-deep-link'
      });
      
      return { valid: true, payload };
    } catch (error) {
      logger.warn('Invalid deep link token:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearTemplateCache() {
    this.templateCache.clear();
    logger.debug('Email template cache cleared');
  }

  /**
   * Generate welcome email for new users
   * @param {Object} data - User data
   * @param {Object} data.user - User object with displayName and email
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async generateWelcomeEmail(data) {
    const { user } = data;
    
    try {
      // Load welcome email template
      const templatePath = path.join(__dirname, '../templates/welcomeEmail.html');
      const template = await fs.readFile(templatePath, 'utf-8');
      
      logger.debug('Loaded email template: welcomeEmail');
      
      // Prepare template data
      const appUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@yourdomain.com';
      
      // Replace template variables
      let html = template
        .replace(/{{displayName}}/g, user.displayName || 'there')
        .replace(/{{appUrl}}/g, appUrl)
        .replace(/{{supportEmail}}/g, supportEmail);
      
      // Generate plain text version
      const text = `
Welcome to Notes & Tasks!

Hi ${user.displayName || 'there'},

Thank you for joining Notes & Tasks! We're excited to help you stay organized and productive.

Your account has been successfully created, and you're all set to start managing your notes and tasks efficiently.

Get started: ${appUrl}

What you can do:

📝 Create Notes - Capture ideas, meeting notes, and important information with rich text formatting
✅ Manage Tasks - Track your to-dos with due dates, priorities, and completion status
📂 Organize with Lists - Group your notes and tasks into colorful, customizable lists
🤖 AI Enhancement - Improve your content with AI-powered suggestions and formatting
📧 Email Reminders - Get notified before tasks are due (configure in Settings)
📱 Works Everywhere - Access from any device - desktop, tablet, or mobile

Quick Tips to Get Started:
• Create your first list to organize your notes and tasks by project or category
• Set up email notifications in Settings to receive task reminders
• Try AI enhancement to improve your note content with one click
• Install as an app on your device for quick access
• Customize your theme in Settings to match your style

If you have any questions or need help getting started, feel free to reach out to our support team at ${supportEmail}.

Happy organizing! 🚀

The Notes & Tasks Team

---
You're receiving this email because you created an account with Notes & Tasks.
If you didn't create this account, please contact us at ${supportEmail}
      `.trim();
      
      const subject = '🎉 Welcome to Notes & Tasks!';
      
      logger.debug('Generated welcome email', {
        email: user.email,
        subject
      });
      
      return {
        subject,
        html,
        text
      };
      
    } catch (error) {
      logger.error('Failed to generate welcome email:', error);
      throw new Error(`Failed to generate email: ${error.message}`);
    }
  }
  /**
   * Generate password reset email
   * @param {Object} data - Data for email
   * @param {string} data.email - User email
   * @param {string} data.displayName - User display name
   * @param {string} data.resetUrl - Reset URL with token
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async generatePasswordResetEmail(data) {
    const { email, displayName, resetUrl } = data;

    try {
      // Load reset password email template
      const templatePath = path.join(__dirname, '../templates/resetPasswordEmail.html');
      const template = await fs.readFile(templatePath, 'utf-8');

      logger.debug('Loaded email template: resetPasswordEmail');

      // Prepare template data
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@yourdomain.com';

      // Replace template variables
      let html = template
        .replace(/{{displayName}}/g, displayName || 'there')
        .replace(/{{resetUrl}}/g, resetUrl)
        .replace(/{{supportEmail}}/g, supportEmail);

      // Generate plain text version
      const text = `
Reset Your Password

Hi ${displayName || 'there'},

You requested a password reset for your Notes & Tasks account.

Click the link below to reset your password. This link is valid for 1 hour.

${resetUrl}

If you didn't request this, you can safely ignore this email. Your password will not change.

Need help? Contact ${supportEmail}

Notes & Tasks. All rights reserved.
      `.trim();

      const subject = 'Reset your Notes & Tasks password';

      logger.debug('Generated password reset email', {
        email,
        subject
      });

      return {
        subject,
        html,
        text
      };

    } catch (error) {
      logger.error('Failed to generate password reset email:', error);
      throw new Error(`Failed to generate email: ${error.message}`);
    }
  }
}
