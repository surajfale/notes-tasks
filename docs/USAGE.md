# Usage Guide

Complete guide for using the Notes & Tasks application.

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [AI Content Enhancement](#ai-content-enhancement)
- [Sharing Notes](#sharing-notes)
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

## AI Content Enhancement

### Overview

The application includes AI-powered content enhancement to help you improve your notes and break down tasks into actionable checklists. This feature uses advanced language models to intelligently format, organize, and enhance your content.

### Enhancing Notes

#### How to Use

1. **Create or Edit a Note**
   - Open a new note or edit an existing one
   - Write your note content in the body field

2. **Select Tone Style**
   - Choose from four tone options:
     - **Concise**: Brief and to the point, removes fluff
     - **Detailed**: Comprehensive with context and examples
     - **Professional**: Formal, business-appropriate language
     - **Casual**: Friendly, conversational with personality (default)

3. **Enhance Content**
   - Click the "✨ Enhance with AI" button
   - Wait 2-5 seconds for processing
   - Review the enhanced content

4. **Review and Save**
   - If satisfied, click "Save" to keep changes
   - If not satisfied, click "↩ Revert" to restore original
   - You can enhance multiple times with different tones

#### What AI Does for Notes

- **Markdown Formatting**: Applies proper headers, lists, bold, italic
- **Grammar Correction**: Fixes spelling and grammar errors
- **Content Organization**: Structures information logically
- **Context Addition**: Adds helpful insights where relevant
- **Clarity Improvement**: Makes content easier to understand
- **First Person**: Writes as if you wrote it yourself

#### Example

**Original Note:**
```
meeting notes
- discuss project timeline
- budget concerns
- need to hire 2 developers
```

**Enhanced (Professional Tone):**
```
# Meeting Notes

## Project Timeline Discussion
- Reviewed current project milestones and deadlines
- Identified potential delays in Q2 deliverables
- Agreed to weekly status updates

## Budget Concerns
- Current spending tracking 15% over budget
- Need to reallocate resources from marketing
- Propose cost-cutting measures for approval

## Hiring Requirements
- Immediate need for 2 senior developers
- Skills required: React, Node.js, MongoDB
- Target start date: Within 30 days
```

### Enhancing Tasks

#### How to Use

1. **Create or Edit a Task**
   - Open a new task or edit an existing one
   - Write your task description

2. **Select Tone Style**
   - Choose the tone that fits your work style
   - Casual works well for personal tasks
   - Professional works well for work tasks

3. **Enhance Content**
   - Click the "✨ Enhance with AI" button
   - Wait 2-5 seconds for processing
   - Review the generated checklist

4. **Review and Save**
   - AI converts your task into actionable checklist items
   - Each item is a specific, actionable step
   - Click "↩ Revert" if you want to start over
   - Click "Save" to keep the checklist

#### What AI Does for Tasks

- **Checklist Generation**: Converts descriptions into actionable items
- **Markdown Checkboxes**: Uses `- [ ]` format for compatibility
- **Organized Sections**: Groups related items with headers
- **Specific Actions**: Breaks down vague tasks into concrete steps
- **Item Limits**: Each item max 255 characters, max 20 items
- **First Person**: Writes as if you wrote it yourself

#### Example

**Original Task:**
```
Plan team building event
```

**Enhanced (Casual Tone):**
```
## Planning Phase
- [ ] Survey team for preferred activities and dates
- [ ] Set budget limit and get approval from manager
- [ ] Research 3-5 venue options within budget

## Booking & Logistics
- [ ] Book venue at least 2 weeks in advance
- [ ] Arrange catering or restaurant reservations
- [ ] Send calendar invites to all team members

## Day-of Preparation
- [ ] Confirm final headcount 48 hours before
- [ ] Prepare name tags and any materials needed
- [ ] Arrive 30 minutes early to set up
```

### Tone Style Guide

#### Concise
- **Best for**: Quick notes, reminders, lists
- **Style**: Brief, no fluff, essential information only
- **Example**: "Buy groceries. Get milk, eggs, bread."

#### Detailed
- **Best for**: Documentation, tutorials, complex topics
- **Style**: Comprehensive, includes context and examples
- **Example**: "Buy groceries for the week. Need to get milk (2% or whole), a dozen eggs (free-range if available), and whole wheat bread. Check pantry first to avoid duplicates."

#### Professional
- **Best for**: Work notes, meeting minutes, reports
- **Style**: Formal, business-appropriate, polished
- **Example**: "Procure weekly groceries. Required items include dairy products (milk), protein sources (eggs), and grain products (bread). Verify inventory prior to purchase."

#### Casual
- **Best for**: Personal notes, creative writing, brainstorming
- **Style**: Friendly, conversational, approachable
- **Example**: "Time to hit the grocery store! Grab some milk, eggs, and bread. Maybe throw in some cookies too 😊"

### Tips for Best Results

#### For Notes
1. **Provide Context**: More content gives AI better understanding
2. **Use Bullet Points**: AI can expand and organize them
3. **Include Keywords**: Mention important topics you want covered
4. **Try Different Tones**: Experiment to find what works best
5. **Iterate**: Enhance multiple times with different approaches

#### For Tasks
1. **Be Specific**: "Plan event" → "Plan team building event for 20 people"
2. **Include Constraints**: Mention budget, timeline, requirements
3. **State the Goal**: What's the desired outcome?
4. **Add Context**: Background information helps AI understand
5. **Review Carefully**: Ensure all steps make sense for your situation

### Limitations

- **Character Limits**: Notes max 2000 characters, task items max 255 characters
- **Processing Time**: Typically 2-5 seconds, max 30 seconds
- **Language**: Optimized for English content
- **Internet Required**: AI enhancement requires active connection
- **Rate Limiting**: Subject to API rate limits (100 requests per 15 minutes)

### Troubleshooting

#### "AI service is not configured"
- AI feature requires backend configuration
- Contact administrator to enable AI features
- Check that OLLAMA_API_KEY is set in backend

#### "Request timed out"
- Try again with shorter content
- Check your internet connection
- Wait a moment and retry

#### "Too many requests"
- You've hit the rate limit (100 requests per 15 minutes)
- Wait a few minutes and try again
- Rate limit resets every 15 minutes

#### "Content cannot be empty"
- Ensure you've written some content before enhancing
- AI needs at least a few words to work with

#### Poor Results
- Try a different tone style
- Provide more context in your content
- Be more specific about what you want
- Enhance again with adjusted content

### Privacy & Security

- **Authentication Required**: Must be logged in to use AI
- **Content Privacy**: Your content is sent to Ollama Cloud API
- **No Storage**: AI doesn't store your content after processing
- **Secure Transmission**: All requests use HTTPS encryption
- **User Isolation**: Your content is never shared with other users

## Sharing Notes

### Overview

Share your notes with others via WhatsApp in two formats: formatted text or beautiful PNG images. All processing happens in your browser - no uploads to external servers.

### How to Share

#### From Note Detail Page

1. **Open a Note**
   - Click on any note to view/edit it
   - Look for the "Share" button next to the "Copy" button

2. **Click Share Button**
   - Opens the share modal with preview and options
   - Shows how your note will appear

3. **Choose Share Format**
   - **Share as Text**: Opens WhatsApp with formatted plain text
   - **Share as Image**: Generates a PNG card and opens share dialog

#### From Note Card

1. **Find Your Note**
   - On the Notes page, locate the note you want to share

2. **Click Share**
   - Click the "Share" button in the note card's action row
   - Share modal opens with preview

3. **Select Format**
   - Choose between text or image sharing

### Share as Text

#### What Happens

- **Markdown Conversion**: Your note's markdown is converted to WhatsApp-friendly format
- **Formatting Preserved**: Uses WhatsApp's native formatting
  - Bold: `*text*` (single asterisk)
  - Italic: `_text_` (underscore)
  - Bullet points: • (bullet character)
  - Headers: Capitalized with spacing
- **Title & Tags**: Includes formatted title and tags
- **Structure**: Proper line breaks and spacing maintained

#### Example

**Original Note (Markdown):**
```markdown
# Meeting Notes

## Action Items
- Review **budget proposal**
- Schedule *follow-up meeting*
- Contact [John](mailto:john@example.com)

Tags: work, important
```

**Shared as Text:**
```
*Meeting Notes*
─────────────

ACTION ITEMS

• Review *budget proposal*
• Schedule _follow-up meeting_
• Contact John (mailto:john@example.com)

🏷️ work, important
```

#### On Mobile

1. Click "Share as Text"
2. Web Share dialog appears
3. Choose WhatsApp or another app
4. Text pre-filled in the app
5. Select recipient and send

#### On Desktop

1. Click "Share as Text"
2. Opens WhatsApp Web in new tab
3. Text pre-filled in message box
4. Select recipient and send

### Share as Image

#### What Happens

- **PNG Generation**: Creates a beautiful image card of your note
- **Professional Layout**: Title, content, tags, and timestamp
- **Theme-Aware**: Respects your current light/dark mode
- **High Quality**: 1200px wide, 2x pixel ratio for sharpness
- **Markdown Rendered**: Full markdown formatting visible

#### Image Features

- **Title**: Bold, large text with decorative underline
- **Content**: Fully rendered markdown (headers, lists, bold, italic, code)
- **Tags**: Color-coded tag badges
- **Timestamp**: Shows when note was last updated
- **Branding**: "Notes & Tasks" app name on image
- **Styling**: Professional borders, shadows, and spacing

#### On Mobile

1. Click "Share as Image"
2. Wait 2-3 seconds for generation
3. Web Share dialog appears
4. Choose WhatsApp or another app
5. Image attached automatically
6. Select recipient and send

#### On Desktop

1. Click "Share as Image"
2. Wait 2-3 seconds for generation
3. Image downloads to your computer
4. Open WhatsApp Web manually
5. Click attachment icon
6. Select the downloaded image
7. Send to recipient

### Share Modal Features

#### Preview Section

- Shows how your note will appear when shared
- Scrollable if note is long
- Matches the exported image layout

#### Text Preview (Collapsible)

- Click "View Text Format" to expand
- Shows exactly what will be sent as text
- Monospace font for accuracy
- Collapsible to save space

#### Help Information

- Tips for mobile vs desktop sharing
- Clear instructions displayed in modal
- Error messages if something goes wrong

### Supported Platforms

#### Mobile

- **Android (Chrome)**: Full Web Share API support
- **iOS (Safari)**: Full Web Share API support
- **Other Browsers**: Falls back to WhatsApp direct link or download

#### Desktop

- **Chrome/Edge**: WhatsApp Web link for text, download for images
- **Firefox**: WhatsApp Web link for text, download for images
- **Safari**: WhatsApp Web link for text, download for images

### Tips for Best Results

#### For Text Sharing

1. **Keep Markdown Simple**: Basic formatting works best in WhatsApp
2. **Avoid Complex Tables**: They don't translate well to text
3. **Short Notes**: Easier to read in chat apps
4. **Use Bullet Points**: More readable than long paragraphs

#### For Image Sharing

1. **Consider Length**: Very long notes may result in large images
2. **Check Theme**: Choose light/dark based on recipient's preference
3. **Test First**: Share to yourself first to see how it looks
4. **Tags Matter**: They appear prominently in the image
5. **Mobile Viewing**: Images are optimized for mobile screens

### Privacy & Security

#### Client-Side Processing

- **No Server Upload**: Images generated entirely in your browser
- **No Tracking**: No analytics on what you share
- **No Storage**: Images not saved on any server
- **Local Only**: All processing uses local browser APIs

#### What Gets Shared

- **Text Format**: Title, body content, and tags only
- **Image Format**: Visual representation of your note
- **Not Included**: User info, timestamps (except in image), metadata

#### Your Control

- **You Choose**: Select recipient and timing
- **Preview First**: See exactly what will be shared
- **Cancel Anytime**: Close modal to cancel
- **No Auto-Send**: You control when to send

### Troubleshooting

#### "Failed to generate image"

- **Try Again**: Click "Share as Image" again
- **Simplify Note**: Very complex notes may fail
- **Check Browser**: Ensure modern browser with Canvas support
- **Clear Cache**: Clear browser cache and retry

#### "Share cancelled"

- **User Action**: You cancelled the share dialog (not an error)
- **Try Again**: Click share button again if desired

#### Image Quality Issues

- **Resolution**: Images generated at 2x resolution for sharpness
- **Theme**: Switch theme in Settings if colors don't look right
- **Browser**: Use Chrome/Edge for best image quality

#### WhatsApp Doesn't Open

- **Check Installation**: Ensure WhatsApp is installed on mobile
- **Desktop**: WhatsApp Web requires logged-in WhatsApp
- **Popup Blocked**: Allow popups for the site
- **Alternative**: Use text sharing instead

#### Text Formatting Lost

- **WhatsApp Limitation**: Some formatting may not display in all versions
- **Basic Formatting**: Bold and italic usually work
- **Try Image**: Use image sharing for guaranteed formatting

### Limitations

#### Technical

- **Browser Support**: Requires modern browser (Chrome 89+, Safari 14+, Firefox 88+)
- **File Size**: Very long notes may produce large images (1-3 MB)
- **Processing Time**: Image generation takes 2-5 seconds
- **Canvas Required**: Image sharing needs HTML5 Canvas support

#### Platform

- **WhatsApp Only**: Currently optimized for WhatsApp sharing
- **Web Share API**: Full features require Web Share API support
- **Desktop Limits**: Desktop browsers have limited Web Share support

#### Content

- **No Videos/Audio**: Cannot embed media in images
- **Static Images**: Images don't support interactivity
- **Text Only**: Only text content is shared (no attachments)

### Alternative Methods

#### If Sharing Fails

1. **Copy Button**: Use the "Copy" button to copy formatted text
2. **Manual Screenshot**: Take a screenshot of the note
3. **Export**: Copy content and paste into any app
4. **Download Image**: Image automatically downloads on desktop

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

1. **Use AI Enhancement**: Let AI improve your notes and break down tasks
2. **Use Lists**: Organize by project or category
3. **Tag Notes**: Add tags for easy filtering
4. **Set Priorities**: Mark important tasks as high priority
5. **Archive Old Notes**: Keep workspace clean
6. **Use Search**: Quickly find content
7. **Try Different Tones**: Experiment with AI tone styles for different content types

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

## Progressive Web App (PWA)

### Installing as an App

#### On Android (Chrome)
1. Open the site in Chrome
2. Tap the menu (⋮) in the top-right
3. Select "Add to Home screen"
4. Tap "Install" or "Add"
5. Find the app icon on your home screen
6. Tap to open - it will look like a native app!

#### On iOS (Safari)
1. Open the site in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. Find the app icon on your home screen

#### On Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click the install icon
3. Click "Install" in the dialog
4. App opens in its own window
5. Find it in Start Menu (Windows) or Applications (Mac)

### PWA Features

#### Native App Experience
- **No Browser UI**: Opens in standalone window
- **Custom Icon**: Your branded icon on home screen
- **Splash Screen**: Shows app icon while loading
- **Status Bar**: Color matches your theme
- **Quick Launch**: Opens instantly like native apps

#### App Shortcuts
Long-press the app icon to access quick actions:
- **New Note**: Jump directly to create a note
- **New Task**: Jump directly to create a task

#### Offline Mode
- **Works Offline**: Access your data without internet
- **Auto Sync**: Changes sync when connection returns
- **Fast Loading**: Cached pages load instantly
- **Background Sync**: Syncs even when app is closed

#### Dynamic Theming
- **Status Bar Color**: Matches your selected theme
- **Light/Dark Mode**: Status bar adapts automatically
- **Accent Colors**: Status bar updates with accent color
- **Smooth Transitions**: Color changes are instant

### PWA Benefits

#### For Mobile Users
- **No App Store**: Install directly from browser
- **Smaller Size**: No large download required
- **Auto Updates**: Always get the latest version
- **Less Storage**: Shared browser cache
- **Privacy**: No app store tracking

#### For All Users
- **Cross-Platform**: Same experience everywhere
- **Always Updated**: No manual updates needed
- **Offline Access**: Work without internet
- **Fast Performance**: Instant loading
- **Native Feel**: Looks and feels like a native app

### Testing PWA Features

#### Check Installation
1. Install the app on your device
2. Verify custom icon appears
3. Open from home screen
4. Confirm no browser UI visible

#### Test Offline Mode
1. Open the app
2. Visit several pages (to cache them)
3. Turn off WiFi/mobile data
4. Navigate between pages - should still work
5. Create/edit notes/tasks - saved locally
6. Turn connection back on - syncs automatically

#### Test Theme Color
1. Open Settings in the app
2. Toggle between light and dark mode
3. Watch status bar color change
4. Try different accent colors
5. Verify status bar updates

#### Test App Shortcuts
1. Long-press the app icon
2. Verify "New Note" and "New Task" appear
3. Tap a shortcut
4. Confirm it opens the correct page

### PWA Troubleshooting

#### Can't Install App
- Ensure you're using HTTPS (required)
- Check that you're on a supported browser
- Clear browser cache and try again
- Verify all icons are loaded

#### Icons Not Showing
- Check internet connection
- Clear browser cache
- Reinstall the app
- Verify icons exist on server

#### Offline Not Working
- Visit pages while online first (to cache)
- Check that service worker is registered
- Wait a few seconds after first visit
- Check browser console for errors

#### Theme Color Not Changing
- Ensure you're using the installed app (not browser)
- Check that theme is saved in Settings
- Try closing and reopening the app
- Clear app cache if needed

### PWA Best Practices

#### For Best Experience
1. **Install the App**: Get full native experience
2. **Visit Pages Online First**: Allows caching for offline use
3. **Keep App Updated**: Refresh occasionally for updates
4. **Use App Shortcuts**: Quick access to common actions
5. **Enable Notifications**: Get task reminders (if implemented)

#### Performance Tips
- Install app for faster loading
- Use offline mode when traveling
- Clear cache if experiencing issues
- Keep browser updated

## Support

For additional help:
- Check documentation in `docs/` folder
- Review `ARCHITECTURE.md` for technical details
- See `DEPLOYMENT.md` for hosting information
- Contact support (if available)

