# Usage Guide

Complete guide for using the Notes & Tasks application.

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Managing Notes](#managing-notes)
- [Managing Tasks](#managing-tasks)
- [Organizing with Lists](#organizing-with-lists)
- [Customizing Theme](#customizing-theme)
- [Offline Usage](#offline-usage)
- [Account Management](#account-management)
- [Performance Features](#performance-features)
- [Responsive Design](#responsive-design)

## Getting Started

### First Time Setup

1. **Register an Account**
   - Navigate to the register page
   - Enter username, email, password, and display name
   - Click "Register" to create your account

2. **Login**
   - Enter your username and password
   - Click "Login" to access your dashboard

### Navigation

The application uses a sidebar navigation (collapsible on mobile):
- **Home**: Dashboard with quick stats
- **Notes**: View and manage all notes
- **Tasks**: View and manage all tasks
- **Lists**: Organize notes and tasks into lists
- **Settings**: Customize theme and manage account

## Authentication

### Login
- Use your username and password
- Token is stored securely in browser
- Stays logged in across sessions

### Register
- Username must be unique
- Email must be valid format
- Password requirements enforced
- Display name is optional

### Logout
- Click "Logout" in sidebar
- Clears all local data
- Redirects to login page

## Managing Notes

### Creating a Note

1. Click "Create Note" button
2. Enter title and body content
3. Add tags (comma-separated)
4. Optionally assign to a list
5. Click "Save"

### Viewing Notes

- Notes displayed in responsive grid (1-3 columns based on screen size)
- Shows title, body preview, tags, and metadata
- Click any note to edit

### Editing a Note

1. Click on a note card
2. Modify title, body, tags, or list
3. Click "Save" to update
4. Click "Cancel" to discard changes

### Archiving Notes

- Click "Archive" button when editing
- Archived notes hidden by default
- Toggle "Show Archived" filter to view
- Click "Unarchive" to restore

### Deleting Notes

1. Open note for editing
2. Click "Delete" button
3. Confirm deletion
4. Note permanently removed

### Filtering Notes

**By List**: Select list from dropdown
**By Tags**: Click tags to filter (multi-select)
**By Archive Status**: Toggle "Show Archived"
**By Search**: Type in search box (debounced 300ms)
**Clear All**: Click "Clear Filters" button

### Search

- Search searches both title and body
- Results update as you type (with 300ms delay)
- Case-insensitive search
- Works with other filters

## Managing Tasks

### Creating a Task

1. Click "Create Task" button
2. Enter title and optional description
3. Set due date (optional)
4. Choose priority (1=High, 2=Medium, 3=Low)
5. Optionally assign to a list
6. Click "Save"

### Viewing Tasks

- Tasks displayed in list layout
- Shows title, description, due date, priority
- Visual priority indicators (colors)
- Checkbox for completion status

### Editing a Task

1. Click on a task card
2. Modify any fields
3. Click "Save" to update
4. Click "Cancel" to discard changes

### Completing Tasks

- Click checkbox on task card to mark complete
- Click again to mark incomplete
- Completed tasks shown with strikethrough

### Deleting Tasks

1. Open task for editing
2. Click "Delete" button
3. Confirm deletion
4. Task permanently removed

### Filtering Tasks

**By List**: Select list from dropdown
**By Completion**: Filter completed/incomplete
**By Priority**: Filter by priority level
**Clear All**: Click "Clear Filters" button

## Organizing with Lists

### Creating a List

1. Go to Lists page
2. Click "Create List" button
3. Enter list title
4. Choose a color
5. Optionally add an emoji
6. Click "Save"

### Viewing Lists

- Lists displayed in grid layout
- Shows title, color, emoji
- Displays count of notes and tasks
- Click to edit or delete

### Editing a List

1. Click "Edit" on list card
2. Modify title, color, or emoji
3. Click "Save" to update

### Deleting a List

1. Click "Delete" on list card
2. Confirm deletion
3. List removed (notes/tasks remain, just unassigned)

### Using Lists

- Assign notes/tasks to lists when creating/editing
- Filter notes/tasks by list
- Lists appear in sidebar for quick filtering
- Click list in sidebar to filter content

## Customizing Theme

### Theme Mode

1. Go to Settings page
2. Toggle between Light and Dark mode
3. Theme applies immediately
4. Preference saved automatically

### Accent Color

1. Go to Settings page
2. Choose from predefined accent colors
3. Color applies immediately
4. Preference saved automatically

## Offline Usage

### How It Works

- All data cached in browser (IndexedDB)
- Works without internet connection
- Changes queued for sync
- Automatic sync when online

### Offline Indicator

- Shows when no internet connection
- Appears at top of screen
- Disappears when connection restored

### Sync Status

- **Syncing**: Changes being uploaded
- **Synced**: All changes saved to server
- **Pending**: Changes waiting to sync
- **Error**: Sync failed (will retry)

### Best Practices

- Create/edit content offline
- Changes saved locally immediately
- Sync happens automatically when online
- Check sync status indicator

## Account Management

### Change Password

1. Go to Settings page
2. Enter old password
3. Enter new password
4. Confirm new password
5. Click "Change Password"

### Delete Account

1. Go to Settings page
2. Click "Delete Account" button
3. Read warning carefully
4. Confirm deletion
5. Account and all data permanently deleted
6. Automatically logged out

**Warning**: Account deletion is permanent and cannot be undone!

## Performance Features

### Fast Loading

- Initial load: ~37 KB (gzipped)
- Code splitting for faster page loads
- Precompression enabled
- Optimized bundle sizes

### Instant Navigation

- Hover over links to preload
- Smooth page transitions
- No full page reloads
- Browser back/forward support

### Efficient Search

- 300ms debounce on search inputs
- Reduces server load
- Smooth typing experience
- Instant results

### Caching

- Browser caching with content hashing
- IndexedDB for offline data
- Reduces network requests
- Faster subsequent loads

## Responsive Design

### Mobile (< 640px)

- Collapsible sidebar with hamburger menu
- Single column layouts
- Touch-friendly buttons (44x44px minimum)
- Optimized for one-handed use

### Tablet (640px - 1024px)

- 2-column grids
- Persistent sidebar option
- Optimized spacing
- Landscape support

### Desktop (> 1024px)

- 3-column grids
- Persistent sidebar
- Full feature access
- Keyboard shortcuts

### Touch Targets

- All buttons: 44x44px minimum
- Adequate spacing between elements
- Easy to tap on mobile
- No accidental clicks

## Tips & Tricks

### Productivity

1. **Use Lists**: Organize by project or category
2. **Tag Notes**: Add tags for easy filtering
3. **Set Priorities**: Mark important tasks as high priority
4. **Archive Old Notes**: Keep workspace clean
5. **Use Search**: Quickly find content

### Keyboard Navigation

- Tab: Move between fields
- Enter: Submit forms
- Escape: Close modals
- Arrow keys: Navigate lists

### Mobile Tips

- Swipe to close sidebar
- Tap and hold for context menu
- Use search for quick access
- Enable offline mode for travel

### Performance

- Clear browser cache if issues occur
- Check sync status regularly
- Use latest browser version
- Enable JavaScript

## Troubleshooting

### Can't Login

- Check username and password
- Ensure caps lock is off
- Try password reset (if implemented)
- Check internet connection

### Data Not Syncing

- Check internet connection
- Look at sync status indicator
- Wait for automatic retry
- Refresh page if needed

### Slow Performance

- Clear browser cache
- Close unused tabs
- Check internet speed
- Update browser

### Missing Data

- Check filters (may be hiding data)
- Check archive status
- Verify sync completed
- Check if deleted accidentally

## Support

For additional help:
- Check documentation in `docs/` folder
- Review `ARCHITECTURE.md` for technical details
- See `DEPLOYMENT.md` for hosting information
- Contact support (if available)

