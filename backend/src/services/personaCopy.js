/**
 * Persona-aware copy for task notifications (email + push).
 *
 * Mirrors the three frontend uiPersona values (User.uiPersona) so a
 * notification's tone matches how the user has styled their app:
 * focus (plain/quiet), vivid (friendly/enthusiastic), terminal (terse/log-style).
 */

const PERSONAS = ['focus', 'vivid', 'terminal'];
const DEFAULT_PERSONA = 'focus';

const TYPE_LABEL = {
  same_day: 'Due Today',
  '1_day_before': 'Due Tomorrow',
  '2_days_before': 'Due in 2 Days',
  overdue: 'Overdue',
};

function normalize(persona) {
  return PERSONAS.includes(persona) ? persona : DEFAULT_PERSONA;
}

function typeLabel(notificationType) {
  return TYPE_LABEL[notificationType] || 'Task Reminder';
}

function emailSubject(persona, task, notificationType) {
  const label = typeLabel(notificationType);
  switch (normalize(persona)) {
    case 'vivid':
      return `✨ ${label}: "${task.title}"`;
    case 'terminal':
      return `[${notificationType || 'reminder'}] ${task.title}`;
    default:
      return `📋 ${label}: ${task.title}`;
  }
}

function emailGreeting(persona, name) {
  switch (normalize(persona)) {
    case 'vivid':
      return `Hey ${name}! 👋`;
    case 'terminal':
      return `user: ${name}`;
    default:
      return `Hello ${name},`;
  }
}

function emailIntro(persona) {
  switch (normalize(persona)) {
    case 'vivid':
      return "Just a friendly nudge about something on your list! 🎉";
    case 'terminal':
      return '# reminder dispatched — task requires attention';
    default:
      return 'This is a reminder about your upcoming task:';
  }
}

function emailClosing(persona) {
  switch (normalize(persona)) {
    case 'vivid':
      return "Tap the button above and let's get it done! You've got this. 💪";
    case 'terminal':
      return '$ open task --link above';
    default:
      return 'Click the button above to view and manage this task.';
  }
}

function plainTextIntro(persona) {
  switch (normalize(persona)) {
    case 'vivid':
      return "Hey there! Just a friendly nudge about something on your list:";
    case 'terminal':
      return 'reminder: task requires attention';
    default:
      return 'This is a reminder about your upcoming task:';
  }
}

function plainTextSignoff(persona) {
  switch (normalize(persona)) {
    case 'vivid':
      return "You've got this! 💪";
    case 'terminal':
      return 'EOF';
    default:
      return 'Stay organized.';
  }
}

function pushTitle(persona, notificationType) {
  const label = typeLabel(notificationType);
  switch (normalize(persona)) {
    case 'vivid':
      return `✨ ${label}!`;
    case 'terminal':
      return `[${notificationType || 'reminder'}]`;
    default:
      return label;
  }
}

module.exports = {
  PERSONAS,
  DEFAULT_PERSONA,
  normalize,
  typeLabel,
  emailSubject,
  emailGreeting,
  emailIntro,
  emailClosing,
  plainTextIntro,
  plainTextSignoff,
  pushTitle,
};
