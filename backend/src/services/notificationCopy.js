/**
 * Copy for task notifications (email + push), shared by
 * emailTemplateService and notificationProcessor so both channels word
 * reminders the same way.
 */

const TYPE_LABEL = {
  same_day: 'Due Today',
  '1_day_before': 'Due Tomorrow',
  '2_days_before': 'Due in 2 Days',
  overdue: 'Overdue',
};

function typeLabel(notificationType) {
  return TYPE_LABEL[notificationType] || 'Task Reminder';
}

function emailSubject(task, notificationType) {
  return `📋 ${typeLabel(notificationType)}: ${task.title}`;
}

function emailGreeting(name) {
  return `Hello ${name},`;
}

function emailIntro() {
  return 'This is a reminder about your upcoming task:';
}

function emailClosing() {
  return 'Click the button above to view and manage this task.';
}

function plainTextIntro() {
  return 'This is a reminder about your upcoming task:';
}

function plainTextSignoff() {
  return 'Stay organized.';
}

function pushTitle(notificationType) {
  return typeLabel(notificationType);
}

module.exports = {
  typeLabel,
  emailSubject,
  emailGreeting,
  emailIntro,
  emailClosing,
  plainTextIntro,
  plainTextSignoff,
  pushTitle,
};
