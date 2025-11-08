# Design Document

## Overview

This design adds notification preference controls to the task creation and editing UI. The backend notification system is already fully implemented with email delivery, cron scheduling, circuit breaker protection, and comprehensive logging. This frontend enhancement allows users to configure when they want to receive email reminders for their tasks through an intuitive interface integrated into the task editor.

The design focuses on:
- Adding notification preference UI components to the existing task editor
- Implementing date picker functionality for due date selection
- Validating notification preferences based on due date constraints
- Updating the task API integration to include notification preferences
- Providing clear visual feedback about notification settings

## Architecture

### Component Structure

```
TaskEditor (existing, modified)
├── TaskForm
│   ├── TitleInput
│   ├── DescriptionInput
│   ├── DueDatePicker (new)
│   │   └── Calendar component
│   ├── NotificationPreferences (new)
│   │   ├── NotificationToggle
│   │   ├── NotificationTimingOptions
│   │   └── NotificationSummary
│   ├── PrioritySelector
│   └── ListSelector
└── FormActions
```

### Data Flow

1. **Task Creation Flow**:
   - User fills task form including due date
   - User enables notifications and selects timing preferences
   - Form validates notification preferences against due date
   - Task data (including notification preferences) sent to backend API
   - Backend stores task with notification settings

2. **Task Editing Flow**:
   - Task data loaded from backend (including existing notification preferences)
   - Form populated with current values
   - User modifies notification preferences
   - Form validates changes
   - Updated task data sent to backend API

3. **Due Date Change Flow**:
   - User changes due date
   - System recalculates available notification options
   - System validates currently selected options against new date
   - System auto-deselects invalid options
   - UI updates to show available options

## Components and Interfaces

### 1. DueDatePicker Component

**Purpose**: Provides calendar-based date selection for task due dates

**Props**:
```typescript
interface DueDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  disabled?: boolean;
  error?: string;
}
```

**Features**:
- Calendar popup with month/year navigation
- Highlights current date and selected date
- Supports manual text input with validation
- Clear button to remove due date
- Keyboard navigation support
- Accessible ARIA labels

**Implementation Notes**:
- Use a lightweight date picker library (e.g., flatpickr or native HTML5 date input with fallback)
- Format dates consistently across the application
- Handle timezone considerations
- Validate date input (no past dates for new tasks)

### 2. NotificationPreferences Component

**Purpose**: Manages notification timing preferences for tasks

**Props**:
```typescript
interface NotificationPreferencesProps {
  dueDate: Date | null;
  enabled: boolean;
  selectedTimings: NotificationTiming[];
  onEnabledChange: (enabled: boolean) => void;
  onTimingsChange: (timings: NotificationTiming[]) => void;
  error?: string;
}

type NotificationTiming = 'same_day' | '1_day_before' | '2_days_before';
```

**State Management**:
```typescript
interface NotificationState {
  enabled: boolean;
  selectedTimings: NotificationTiming[];
  availableTimings: NotificationTiming[];
}
```

**Features**:
- Toggle switch to enable/disable notifications
- Checkbox group for timing options (when enabled)
- Dynamic option availability based on due date
- Visual summary of selected preferences
- Validation error display
- Tooltips explaining each option

**Business Logic**:
```typescript
function getAvailableTimings(dueDate: Date | null): NotificationTiming[] {
  if (!dueDate) return [];
  
  const now = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return []; // Past date
  if (daysUntilDue === 0) return ['same_day'];
  if (daysUntilDue === 1) return ['same_day', '1_day_before'];
  return ['same_day', '1_day_before', '2_days_before'];
}

function validateNotificationPreferences(
  enabled: boolean,
  selectedTimings: NotificationTiming[],
  dueDate: Date | null
): string | null {
  if (!enabled) return null;
  
  if (!dueDate) {
    return 'Due date is required for notifications';
  }
  
  if (selectedTimings.length === 0) {
    return 'Please select at least one notification timing';
  }
  
  const available = getAvailableTimings(dueDate);
  const invalidTimings = selectedTimings.filter(t => !available.includes(t));
  
  if (invalidTimings.length > 0) {
    return 'Some selected notification timings are not available for this due date';
  }
  
  return null;
}
```

### 3. NotificationSummary Component

**Purpose**: Displays a human-readable summary of notification settings

**Props**:
```typescript
interface NotificationSummaryProps {
  enabled: boolean;
  selectedTimings: NotificationTiming[];
  dueDate: Date | null;
}
```

**Display Logic**:
- If disabled: "No notifications"
- If enabled with no due date: "Set a due date to enable notifications"
- If enabled with timings: "You will receive email reminders: [list of timings]"

**Example Output**:
- "You will receive email reminders: Same day at 9 AM, 1 day before at 9 AM"
- "You will receive an email reminder on the same day at 9 AM"

### 4. Modified TaskEditor Component

**Updated State**:
```typescript
interface TaskFormState {
  // Existing fields
  title: string;
  description: string;
  priority: number;
  listId: string | null;
  
  // New/modified fields
  dueAt: Date | null;
  notificationEnabled: boolean;
  notificationTimings: NotificationTiming[];
  
  // Validation
  errors: {
    title?: string;
    dueAt?: string;
    notifications?: string;
  };
}
```

**Form Validation**:
```typescript
function validateTaskForm(formState: TaskFormState): ValidationErrors {
  const errors: ValidationErrors = {};
  
  // Existing validations
  if (!formState.title.trim()) {
    errors.title = 'Title is required';
  }
  
  // New notification validation
  if (formState.notificationEnabled) {
    const notificationError = validateNotificationPreferences(
      formState.notificationEnabled,
      formState.notificationTimings,
      formState.dueAt
    );
    if (notificationError) {
      errors.notifications = notificationError;
    }
  }
  
  return errors;
}
```

## Data Models

### Frontend Task Model (Updated)

```typescript
interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  dueAt?: Date;
  priority: number;
  completed: boolean;
  listId?: string;
  
  // New notification fields
  notificationEnabled: boolean;
  notificationTimings: NotificationTiming[];
  notificationsSent?: string[]; // Read-only, managed by backend
  
  createdAt: Date;
  updatedAt: Date;
}
```

### API Request/Response

**Create Task Request**:
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  dueAt?: string; // ISO 8601 format
  priority: number;
  listId?: string;
  notificationEnabled: boolean;
  notificationTimings: NotificationTiming[];
}
```

**Update Task Request**:
```typescript
interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueAt?: string | null;
  priority?: number;
  listId?: string | null;
  notificationEnabled?: boolean;
  notificationTimings?: NotificationTiming[];
}
```

**Task Response**:
```typescript
interface TaskResponse {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  dueAt?: string;
  priority: number;
  completed: boolean;
  listId?: string;
  notificationEnabled: boolean;
  notificationTimings: string[];
  notificationsSent?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Backend Integration

### Task Model Schema Updates

The backend Task model needs to be updated to include notification fields:

```javascript
// backend/src/models/Task.js
const taskSchema = new mongoose.Schema({
  // Existing fields...
  
  // New notification fields
  notificationEnabled: {
    type: Boolean,
    default: false
  },
  notificationTimings: [{
    type: String,
    enum: ['same_day', '1_day_before', '2_days_before']
  }],
  notificationsSent: [{
    type: String,
    enum: ['same_day', '1_day_before', '2_days_before']
  }],
  
  // Existing timestamps...
});
```

### API Endpoint Updates

**Existing endpoints to modify**:
- `POST /api/tasks` - Accept notification fields
- `PUT /api/tasks/:id` - Accept notification fields
- `GET /api/tasks/:id` - Return notification fields
- `GET /api/tasks` - Return notification fields in list

**Validation Updates**:
```javascript
// backend/src/middleware/validation.js
const createTaskSchema = Joi.object({
  // Existing validations...
  
  notificationEnabled: Joi.boolean().default(false),
  notificationTimings: Joi.array()
    .items(Joi.string().valid('same_day', '1_day_before', '2_days_before'))
    .when('notificationEnabled', {
      is: true,
      then: Joi.required().min(1),
      otherwise: Joi.optional()
    }),
  dueAt: Joi.date().iso()
    .when('notificationEnabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});
```

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Task Editor                              │
├─────────────────────────────────────────┤
│ Title: [________________]                │
│                                          │
│ Description:                             │
│ [_____________________________]          │
│ [_____________________________]          │
│                                          │
│ Due Date: [📅 MM/DD/YYYY] [Clear]       │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ 🔔 Email Notifications        [⚪]  │ │
│ │                                     │ │
│ │ When enabled:                       │ │
│ │ ☐ Same day (9:00 AM)               │ │
│ │ ☐ 1 day before (9:00 AM)           │ │
│ │ ☐ 2 days before (9:00 AM)          │ │
│ │                                     │ │
│ │ ℹ️ You will receive email reminders │ │
│ │    at the selected times            │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Priority: ⚪ Low ⚫ Medium ⚪ High       │
│                                          │
│ List: [Select a list ▼]                 │
│                                          │
│ [Cancel]                    [Save Task] │
└─────────────────────────────────────────┘
```

### Visual States

**1. Notifications Disabled (Default)**:
- Toggle switch in OFF position
- Timing options hidden or grayed out
- Summary text: "Enable notifications to receive email reminders"

**2. Notifications Enabled, No Due Date**:
- Toggle switch in ON position
- Warning message: "⚠️ Please set a due date to configure notifications"
- Timing options disabled

**3. Notifications Enabled, Due Date Set**:
- Toggle switch in ON position
- Available timing options shown as checkboxes
- Unavailable options hidden or disabled with explanation
- Summary updates as user selects options

**4. Validation Error**:
- Red border around notification section
- Error message displayed below section
- Specific guidance on how to fix the error

### Responsive Design

**Desktop (>768px)**:
- Full layout as shown above
- Calendar picker opens as dropdown
- Notification section inline with other fields

**Mobile (<768px)**:
- Stacked layout
- Calendar picker opens as modal
- Notification section expands to full width
- Touch-friendly toggle and checkboxes

## Error Handling

### Client-Side Validation Errors

1. **No due date with notifications enabled**:
   - Error: "Due date is required when notifications are enabled"
   - Action: Highlight due date field and notification section

2. **No timing selected with notifications enabled**:
   - Error: "Please select at least one notification timing"
   - Action: Highlight timing options

3. **Invalid date format**:
   - Error: "Please enter a valid date"
   - Action: Highlight due date field

4. **Past due date for new task**:
   - Warning: "This task is already overdue"
   - Action: Allow but show warning

### Server-Side Error Handling

1. **API validation failure**:
   - Display server error message
   - Highlight relevant fields
   - Allow user to correct and resubmit

2. **Network error**:
   - Show retry option
   - Preserve form data
   - Display user-friendly error message

3. **Notification system unavailable**:
   - Allow task creation without notifications
   - Show warning that notifications may not be sent
   - Suggest checking notification settings later

## Testing Strategy

### Unit Tests

1. **NotificationPreferences Component**:
   - Test available timings calculation for various due dates
   - Test validation logic
   - Test enable/disable toggle behavior
   - Test timing selection/deselection

2. **DueDatePicker Component**:
   - Test date selection
   - Test manual input validation
   - Test clear functionality
   - Test keyboard navigation

3. **Validation Functions**:
   - Test all validation scenarios
   - Test edge cases (today, tomorrow, far future)
   - Test timezone handling

### Integration Tests

1. **Task Creation with Notifications**:
   - Create task with notifications enabled
   - Verify API request includes notification fields
   - Verify task saved with correct preferences

2. **Task Editing with Notifications**:
   - Load existing task with notifications
   - Modify notification preferences
   - Verify updates saved correctly

3. **Due Date Changes**:
   - Change due date and verify available options update
   - Verify invalid selections are cleared
   - Verify form validation updates

### E2E Tests

1. **Complete Task Creation Flow**:
   - Fill all task fields including notifications
   - Submit form
   - Verify task appears in task list
   - Verify notification preferences displayed correctly

2. **Notification Preference Modification**:
   - Open existing task
   - Change notification settings
   - Save changes
   - Verify changes persisted

3. **Error Scenarios**:
   - Attempt to enable notifications without due date
   - Attempt to save without selecting timings
   - Verify error messages displayed
   - Verify form cannot be submitted with errors

## Accessibility

### ARIA Labels and Roles

- Date picker: `role="dialog"`, `aria-label="Select due date"`
- Notification toggle: `role="switch"`, `aria-checked="true|false"`
- Timing checkboxes: `role="checkbox"`, `aria-checked="true|false"`
- Error messages: `role="alert"`, `aria-live="polite"`

### Keyboard Navigation

- Tab order: Title → Description → Due Date → Notification Toggle → Timings → Priority → List → Actions
- Space/Enter to toggle notification switch
- Space to check/uncheck timing options
- Escape to close date picker
- Arrow keys to navigate calendar

### Screen Reader Support

- Announce when notification section becomes enabled/disabled
- Announce available timing options when due date changes
- Announce validation errors clearly
- Provide descriptive labels for all interactive elements

## Performance Considerations

1. **Debounce due date changes**: Wait 300ms before recalculating available timings
2. **Memoize validation functions**: Cache validation results for same inputs
3. **Lazy load date picker**: Only load calendar component when needed
4. **Optimize re-renders**: Use React.memo or Svelte reactive statements efficiently

## Migration Strategy

Since this is a new feature being added to existing tasks:

1. **Existing tasks without notification fields**:
   - Default `notificationEnabled` to `false`
   - Default `notificationTimings` to empty array
   - No migration script needed (handled by schema defaults)

2. **Backward compatibility**:
   - API accepts tasks without notification fields
   - Frontend handles missing notification fields gracefully
   - Notification system ignores tasks with `notificationEnabled: false`

## Future Enhancements

Potential improvements for future iterations:

1. **Custom notification times**: Allow users to set specific times instead of fixed 9 AM
2. **Multiple notification channels**: SMS, push notifications, in-app notifications
3. **Recurring task notifications**: Special handling for recurring tasks
4. **Notification history**: Show users which notifications were sent
5. **Bulk notification settings**: Apply notification preferences to multiple tasks
6. **Smart suggestions**: Suggest notification timings based on task priority or user patterns