# Architecture Documentation - Notes & Tasks Web App

## Overview

A production-ready web application for managing notes and tasks, built using SvelteKit frontend and Node.js backend with MongoDB Atlas. The application features JWT authentication, complete CRUD operations for lists, notes, and tasks, with a responsive Material Design UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            SvelteKit Application                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │     UI      │  │   Svelte    │  │  IndexedDB   │  │  │
│  │  │ (Components)│◄─┤   Stores    │  │  (Offline)   │  │  │
│  │  └─────────────┘  │  (State)    │  └──────────────┘  │  │
│  │         ▲         └─────────────┘         ▲          │  │
│  │         │                │                 │          │  │
│  │         │                ▼                 │          │  │
│  │         │      ┌─────────────────┐         │          │  │
│  │         └──────┤  Repositories   │─────────┘          │  │
│  │                └─────────────────┘                    │  │
│  │                         │                             │  │
│  │                         ▼                             │  │
│  │                ┌─────────────────┐                    │  │
│  │                │   HTTP Client   │                    │  │
│  │                │ (dio + JWT)     │                    │  │
│  │                └─────────────────┘                    │  │
│  └───────────────────────│───────────────────────────────┘  │
└────────────────────────────│──────────────────────────────┘
                             │ HTTPS/JSON
                             │ (JWT Token in Headers)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Express.js API                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │     Auth     │  │ Validation   │  │    Rate     │ │  │
│  │  │  Middleware  │  │  Middleware  │  │   Limiting  │ │  │
│  │  │  (JWT)       │  │  (Joi)       │  │             │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  │         │                  │                 │        │  │
│  │         └──────────────────┼─────────────────┘        │  │
│  │                            ▼                          │  │
│  │              ┌──────────────────────────┐             │  │
│  │              │   Route Controllers      │             │  │
│  │              │  - Auth                  │             │  │
│  │              │  - Lists                 │             │  │
│  │              │  - Notes                 │             │  │
│  │              │  - Tasks                 │             │  │
│  │              └──────────────────────────┘             │  │
│  │                            │                          │  │
│  │                            ▼                          │  │
│  │              ┌──────────────────────────┐             │  │
│  │              │   Business Logic         │             │  │
│  │              │   (Services Layer)       │             │  │
│  │              └──────────────────────────┘             │  │
│  │                            │                          │  │
│  │                            ▼                          │  │
│  │              ┌──────────────────────────┐             │  │
│  │              │   MongoDB Driver         │             │  │
│  │              │   (Mongoose ODM)         │             │  │
│  │              └──────────────────────────┘             │  │
│  └───────────────────────│───────────────────────────────┘  │
└────────────────────────────│──────────────────────────────┘
                             │ MongoDB Wire Protocol
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas (Cloud)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Cluster                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │  users   │  │  lists   │  │  notes   │  ┌──────┐  │  │
│  │  │  coll.   │  │  coll.   │  │  coll.   │  │tasks │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │           Indexes (userId, listId, etc.)         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (SvelteKit)
- **Framework**: SvelteKit 2.x with Svelte 4.2+
- **Language**: TypeScript 5.x
- **State Management**: Svelte stores (writable, derived)
- **HTTP Client**: Fetch API with custom wrappers
- **Styling**: Tailwind CSS 3.x
- **Local Storage**: IndexedDB via idb library
- **Routing**: go_router 13.2+
- **Code Generation**: freezed, json_serializable
- **UI**: Material Design 3, Google Fonts

### Backend (Node.js)
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.18+
- **Database**: MongoDB Node Driver via Mongoose 8.0+
- **Authentication**: jsonwebtoken + bcryptjs
- **Validation**: Joi
- **Security**: helmet, cors, express-rate-limit
- **Logging**: winston
- **Environment**: dotenv
- **AI Integration**: Ollama Cloud API (axios)

### Database
- **MongoDB Atlas**: M0 (free tier) or higher
- **Collections**: users, lists, notes, tasks
- **Indexes**: Compound indexes on userId + other fields

## Data Flow

### Authentication Flow
```
1. User enters credentials in SvelteKit UI
2. Frontend sends POST /api/auth/login with {username, password}
3. Backend validates credentials against MongoDB
4. Backend generates JWT token with userId payload
5. Backend returns {token, user} to frontend
6. Frontend stores JWT in localStorage
7. All subsequent requests include: Authorization: Bearer <JWT>
```

### CRUD Flow (Example: Create Note)
```
1. User fills note form in SvelteKit UI
2. User clicks Save
3. Svelte store calls repository.createNote(data)
4. Repository stores in IndexedDB with status='pending'
5. Repository sends POST /api/notes with JWT header
6. Backend validates JWT → extracts userId
7. Backend validates input → inserts to MongoDB with userId
8. Backend returns created note with _id
9. Repository updates IndexedDB: status='synced', updates _id
10. Svelte store updates UI state
```

### Offline Flow
```
1. User loses internet connection
2. User creates/edits notes/tasks
3. Repository stores changes in IndexedDB with status='pending'
4. UI shows "offline" indicator
5. User regains connection
6. Repository detects connectivity
7. Repository sends all pending changes to backend (in order)
8. Backend processes and returns results
9. Repository updates IndexedDB to status='synced'
10. UI syncs with latest state
```

## Security Model

### Authentication
- **Password Storage**: bcrypt hashed (10 rounds) in MongoDB
- **JWT**: HS256 algorithm, 7-day expiration
- **Token Storage (Client)**: Memory (primary) + localStorage (persistence)
- **Token Transmission**: Authorization header only (never URL params)

### Authorization
- **Per-Request Check**: JWT middleware validates token and extracts userId
- **Data Scoping**: All queries filtered by `userId` from JWT
- **No Client Trust**: Client never sends userId; backend extracts from token

### Input Validation
- **Backend**: Joi schemas validate all request bodies
- **Frontend**: Form validation before sending requests
- **Sanitization**: MongoDB parameterized queries prevent injection

### Rate Limiting
- **Auth Endpoints**: 5 requests per 15 minutes per IP
- **API Endpoints**: 100 requests per 15 minutes per IP
- **Implementation**: express-rate-limit with memory store

## Data Models

### User
```typescript
{
  _id: ObjectId,
  username: string (unique, indexed),
  email: string (unique, indexed),
  passwordHash: string,
  displayName: string,
  createdAt: Date,
  updatedAt: Date
}
```

### List
```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  title: string,
  color: string (#hex),
  emoji: string (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Note
```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  listId: ObjectId (indexed, optional),
  title: string,
  body: string,
  tags: string[],
  isArchived: boolean (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Task
```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  listId: ObjectId (indexed, optional),
  title: string,
  description: string,
  dueAt: Date (indexed, optional),
  isCompleted: boolean (indexed),
  priority: number (1=low, 2=normal, 3=high),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get JWT
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/password` - Change password (authenticated)
- `DELETE /api/auth/account` - Delete account and all associated data

### Lists
- `GET /api/lists` - Get all user's lists
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get specific list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Notes
- `GET /api/notes` - Get all user's notes (query: listId, isArchived, tags, search)
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PUT /api/notes/:id/archive` - Archive/unarchive note

### Tasks
- `GET /api/tasks` - Get all user's tasks (query: listId, isCompleted, priority)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Toggle completion

### AI Enhancement
- `POST /api/ai/enhance` - Enhance note or task content using AI
  - **Body**: `{ content: string, contentType: 'note'|'task', tone?: 'concise'|'detailed'|'professional'|'casual' }`
  - **Response**: `{ success: true, enhancedContent: string }`
  - **Authentication**: Required (JWT)
  - **Rate Limiting**: Same as API endpoints (100 req/15min)

## Error Handling

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Valid JWT but insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate resource (e.g., username taken)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "email", "message": "Invalid email format"}
    ]
  }
}
```

## Performance Considerations

### Backend
- **Connection Pooling**: MongoDB connection pool (min: 5, max: 50)
- **Indexing**: All query fields indexed
- **Pagination**: Default 50 items, max 100
- **Caching**: Optional Redis layer for frequently accessed data

### Frontend
- **Lazy Loading**: Routes code-split
- **Virtual Scrolling**: For large lists (1000+ items)
- **Debouncing**: Search input debounced (300ms)
- **Optimistic Updates**: UI updates immediately, rollback on error

## Deployment Architecture

### Development
```
Frontend: http://localhost:5173 (npm run dev)
Backend: http://localhost:3000 (npm run dev)
Database: MongoDB Atlas (cloud)
```

### Production
```
Frontend: Netlify
  - Static site hosting
  - SPA routing with redirects
  - Build command: npm run build
  - Environment: API_BASE_URL injected at build time
  
Backend: Railway
  - Automatic deployment from GitHub
  - Configuration in railway.json
  - Environment variables in Railway dashboard
  - Health check endpoint: /health
  
Database: MongoDB Atlas (cloud cluster)
  - M0 free tier or higher
  - IP whitelist configured for Railway and development
  - Connection pooling enabled
```

## Monitoring & Observability

- **Backend Logs**: Winston (JSON format) → stdout
- **Error Tracking**: Sentry (optional)
- **Health Check**: GET /health endpoint
- **Metrics**: Request count, response time, error rate

## Progressive Web App (PWA)

### Overview

The application is a full-featured Progressive Web App that provides a native app-like experience on mobile devices.

### PWA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Device                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Service Worker                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Cache     │  │   Network   │  │    Sync      │  │  │
│  │  │  Strategy   │  │   First     │  │    Queue     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └───────────────────────│───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              SvelteKit Application                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  ThemeColorManager (Dynamic Status Bar)         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### Web App Manifest (`static/manifest.json`)
- **Display Mode**: `standalone` (no browser UI)
- **Orientation**: `portrait-primary` (optimized for mobile)
- **Theme Color**: Dynamic (updates with user preference)
- **Background Color**: White (for splash screen)
- **Start URL**: `/` (opens to home page)
- **Icons**: 8 sizes (72×72 to 512×512)
- **Shortcuts**: Quick actions (New Note, New Task)

#### Service Worker (`static/service-worker.js`)
- **Caching Strategy**: Network-first with cache fallback
- **Runtime Caching**: Caches pages as visited
- **Offline Support**: Serves cached content when offline
- **API Bypass**: API calls handled by app's offline logic
- **Cache Versioning**: Automatic cleanup of old caches

#### Theme Color Manager
- **Dynamic Updates**: Status bar color changes with theme
- **Mode Adaptation**: Darkens color in dark mode
- **Accent Integration**: Responds to accent color changes
- **Real-time**: Updates without page reload

### PWA Features

#### Native App Appearance
- Standalone window (no browser UI)
- Custom splash screen with app icon
- Dynamic status bar color
- Full-screen content
- Portrait orientation lock

#### Installation
- Add to Home Screen on Android/iOS
- Custom app icon on home screen
- App name in app drawer
- Quick launch like native apps
- Desktop installation support

#### Performance
- Offline functionality
- Fast loading from cache
- Background sync when online
- Intelligent caching strategy
- Minimal network requests

#### App Shortcuts
Long-press app icon for quick actions:
- New Note (jumps to `/notes/new`)
- New Task (jumps to `/tasks/new`)

### Browser Support

#### Full PWA Support
- ✅ Chrome/Edge on Android
- ✅ Samsung Internet
- ✅ Firefox on Android
- ✅ Chrome/Edge on Desktop

#### Partial Support
- ⚠️ Safari on iOS (limited features)
- ⚠️ Chrome on iOS (uses Safari engine)

### Icon Specifications

All icons generated using Sharp image processing:

| Size | Purpose | File Size |
|------|---------|-----------|
| 72×72 | Android Small | ~2.7 KB |
| 96×96 | Android Medium | ~3.1 KB |
| 128×128 | Android Large | ~3.6 KB |
| 144×144 | Android XL | ~4.3 KB |
| 152×152 | iOS / Apple Touch | ~4.4 KB |
| 192×192 | Android Standard | ~5.3 KB |
| 384×384 | Android XXL | ~10.2 KB |
| 512×512 | Splash Screen | ~10.2 KB |

**Total**: ~53 KB (excellent for web performance)

### Icon Design
- Purple gradient background (#6366f1 → #8b5cf6)
- White notepad with folded corner
- Checkboxes with checkmark
- Text lines representing notes
- Rounded corners for modern look
- High contrast for visibility

### PWA Metrics

Expected Lighthouse PWA scores:
- **Installable**: 100/100
- **PWA Optimized**: 90+/100
- **Fast and Reliable**: 90+/100
- **Works Offline**: Yes

### Offline Capabilities

#### Storage Strategy
- **IndexedDB**: Local data persistence
- **Sync Queue**: Tracks pending changes
- **Automatic Sync**: Syncs when connection returns
- **Conflict Resolution**: Handles sync conflicts

#### Caching Strategy
- **Network First**: Always tries fresh data
- **Cache Fallback**: Uses cache if offline
- **Runtime Caching**: Caches visited pages
- **Selective Caching**: Only caches app pages, not API

### Installation Flow

#### Android
1. User visits site in Chrome
2. "Add to Home screen" appears in menu
3. User taps to install
4. App icon added to home screen
5. Opens in standalone mode

#### iOS
1. User visits site in Safari
2. Taps Share button
3. Selects "Add to Home Screen"
4. App icon added to home screen
5. Opens with minimal Safari UI

#### Desktop
1. User visits site in Chrome/Edge
2. Install icon appears in address bar
3. User clicks to install
4. App opens in standalone window
5. Added to Start Menu/Applications

### Customization

#### Theme Color
Edit `manifest.json` and `app.html`:
```json
"theme_color": "#6366f1"
```

#### App Name
Edit `manifest.json`:
```json
{
  "name": "Notes & Tasks",
  "short_name": "Notes"
}
```

#### Background Color
Edit `manifest.json`:
```json
"background_color": "#ffffff"
```

### Verification

After deployment:
1. **Lighthouse Audit**: Run PWA audit in DevTools
2. **PWA Builder**: Test at https://www.pwabuilder.com/
3. **Manual Testing**: Install on Android device

### Troubleshooting

**Installation Not Available**
- Ensure HTTPS (required for PWA)
- Check manifest.json is accessible
- Verify all icons exist
- Clear browser cache

**Theme Color Not Updating**
- Check ThemeColorManager is loaded
- Verify theme store is working
- Inspect meta theme-color tag

**Offline Not Working**
- Visit pages while online first
- Check service worker is registered
- Verify IndexedDB is enabled

## AI Content Enhancement

### Overview

The application integrates AI-powered content enhancement using Ollama Cloud API to help users improve their notes and break down tasks into actionable checklists.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MarkdownEditor Component                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Tone Selector (Concise/Detailed/Pro/Casual)    │  │  │
│  │  │  Enhance Button → aiRepository.enhanceContent() │  │  │
│  │  │  Revert Button (undo AI changes)                │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────│───────────────────────────────┘  │
└────────────────────────────│──────────────────────────────┘
                             │ POST /api/ai/enhance
                             │ { content, contentType, tone }
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              AI Controller & Routes                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  JWT Auth → Validation → aiController           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                            │                          │  │
│  │                            ▼                          │  │
│  │              ┌──────────────────────────┐             │  │
│  │              │   Ollama Service         │             │  │
│  │              │  - Build prompt          │             │  │
│  │              │  - Call Ollama API       │             │  │
│  │              │  - Validate response     │             │  │
│  │              └──────────────────────────┘             │  │
│  └───────────────────────│───────────────────────────────┘  │
└────────────────────────────│──────────────────────────────┘
                             │ HTTPS POST
                             │ Authorization: Bearer <API_KEY>
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama Cloud API                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              gpt-oss:120b-cloud Model                 │  │
│  │  - Temperature: 0.7 (balanced creativity)             │  │
│  │  - Top-p: 0.9 (diverse responses)                     │  │
│  │  - System prompt: First-person assistant              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Features

#### Note Enhancement
- **Markdown Formatting**: Applies proper headers, lists, bold, italic, tables
- **Grammar Correction**: Fixes spelling and grammar errors
- **Content Organization**: Structures information logically
- **Context Addition**: Adds helpful insights where relevant
- **Character Limit**: Maximum 2000 characters
- **First Person**: Writes as if the user wrote it themselves

#### Task Enhancement
- **Checklist Generation**: Converts task descriptions into actionable items
- **Markdown Checkboxes**: Uses `- [ ]` format for compatibility
- **Item Limit**: Each item max 255 characters, max 20 items total
- **Organized Sections**: Groups related items with headers
- **Specific Actions**: Breaks down vague tasks into concrete steps
- **First Person**: Writes as if the user wrote it themselves

#### Tone Styles
- **Concise**: Brief and to the point, removes fluff
- **Detailed**: Comprehensive with context and examples
- **Professional**: Formal, business-appropriate language
- **Casual**: Friendly, conversational with personality

### Implementation Details

#### Backend Service (`ollamaService.js`)
```javascript
// Key features:
- Dynamic prompt building based on content type and tone
- 30-second timeout for API requests
- Comprehensive error handling (401, 404, 429, 500+)
- Character limit enforcement
- Response validation
```

#### Frontend Repository (`ai.repository.ts`)
```typescript
// Key features:
- Input validation before API call
- User-friendly error messages
- Network error detection
- Type-safe request/response handling
```

#### UI Components
- **MarkdownEditor**: Integrated AI controls with tone selector
- **Enhance Button**: Triggers AI enhancement
- **Revert Button**: Restores original content
- **Loading State**: Shows "Enhancing..." during processing
- **Error Display**: Shows user-friendly error messages

### Configuration

#### Environment Variables
```bash
# Backend .env
OLLAMA_API_URL=https://ollama.com/api/chat
OLLAMA_API_KEY=your_api_key_here
OLLAMA_MODEL=gpt-oss:120b-cloud
```

#### API Credentials
- Sign up at https://ollama.com
- Generate API key from dashboard
- Add to backend `.env` file
- Restart backend server

### Error Handling

| Error Code | Status | User Message |
|------------|--------|--------------|
| SERVICE_UNAVAILABLE | 503 | AI service is not configured |
| VALIDATION_ERROR | 400 | Content cannot be empty |
| TIMEOUT | 504 | Request timed out |
| AUTHENTICATION_ERROR | 401 | Invalid API key |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| AI_SERVICE_ERROR | 500+ | Service temporarily unavailable |

### Performance

- **Response Time**: Typically 2-5 seconds
- **Timeout**: 30 seconds maximum
- **Rate Limiting**: Shared with API endpoints (100 req/15min)
- **Caching**: No caching (each request is unique)

### Security

- **Authentication**: Requires valid JWT token
- **API Key**: Stored securely in backend environment
- **User Isolation**: Each request tied to authenticated user
- **Input Validation**: Content validated before processing
- **Output Sanitization**: Response validated before returning

### Usage Flow

1. User writes note/task content
2. User selects desired tone style
3. User clicks "Enhance with AI" button
4. Frontend shows loading state
5. Backend builds tone-specific prompt
6. Backend calls Ollama Cloud API
7. AI processes and returns enhanced content
8. Backend validates and enforces limits
9. Frontend displays enhanced content
10. User can revert if not satisfied

### Limitations

- **Character Limits**: Notes max 2000 chars, task items max 255 chars
- **Timeout**: 30 seconds maximum processing time
- **Rate Limiting**: Subject to API endpoint rate limits
- **API Dependency**: Requires valid Ollama Cloud API key
- **Language**: Optimized for English content

### Future Enhancements

1. **Batch Processing**: Enhance multiple notes/tasks at once
2. **Custom Prompts**: User-defined enhancement instructions
3. **Learning**: Remember user preferences for tone
4. **Suggestions**: AI-powered tag and list suggestions
5. **Smart Scheduling**: AI-suggested due dates for tasks
6. **Content Templates**: Pre-built templates for common note types
7. **Multi-language**: Support for non-English content
8. **Offline Mode**: Local AI model for offline enhancement

## Notifications & Automated Tasks

### Overview

The application includes a comprehensive notification system supporting both email and browser push notifications. Task reminders are sent at user-specified times using automated cron jobs.

### Architecture

```
Backend Server (Node.js)
    │
    ├─► Cron Jobs (node-cron)
    │   ├─► Notification Scheduler (Hourly)
    │   └─► Cleanup Job (Weekly)
    │
    ├─► Notification Services
    │   ├─► notificationScheduler.js
    │   ├─► notificationProcessor.js
    │   ├─► emailService.js (Resend API)
    │   └─► pushNotificationService.js (Web Push API)
    │
    └─► Database (MongoDB)
        ├─► NotificationPreference collection
        │   ├─► Email preferences
        │   ├─► Browser notification preferences
        │   ├─► Push subscription data (VAPID)
        │   ├─► Notification time & timezone
        │   └─► Notification timing (same day, 1/2 days before)
        ├─► NotificationLog collection
        └─► Task collection
```

### Notification Channels

#### 1. Email Notifications
- Sends HTML-formatted emails via Resend API
- Includes task details, priority, and deep links
- Customizable notification time per user
- Timezone-aware delivery

#### 2. Browser Push Notifications (Web Push)
- Uses Web Push API with VAPID protocol
- Works even when browser/app is closed
- Best experience when installed as PWA
- Requires user permission grant
- Subscription managed per device/browser

### Cron Jobs

#### 1. Notification Scheduler (Hourly)

**Schedule**: `0 * * * *` (every hour at the top of the hour)

**Purpose**: Sends email and browser push reminders for upcoming tasks at each user's preferred time

**Process**:
1. Runs every hour
2. Queries all users with notification preferences
3. For each user, checks if current time matches their preferred notification time (within 30-minute window)
4. If match, calculates which notifications to send (same day, 1 day before, 2 days before)
5. Sends notifications via configured channels:
   - Email via Resend API (if email notifications enabled)
   - Push notifications via Web Push API (if browser notifications enabled)
6. Logs results and updates task records
7. Prevents duplicate notifications using NotificationLog collection

**Configuration**:
```bash
NOTIFICATION_CRON_SCHEDULE=0 * * * *  # Every hour
NOTIFICATION_TIMEZONE=UTC              # Cron execution timezone
```

#### 2. Cleanup Job (Weekly)

**Schedule**: `0 2 * * 0` (Sunday at 2 AM)

**Purpose**: Removes old notification logs to prevent database bloat

**Process**:
1. Calculates cutoff date (default: 90 days ago)
2. Deletes NotificationLog documents older than cutoff
3. Logs number of deleted records

**Configuration**:
```bash
NOTIFICATION_CLEANUP_CRON_SCHEDULE=0 2 * * 0  # Weekly Sunday 2 AM
NOTIFICATION_LOGS_RETENTION_DAYS=90           # Keep 90 days of logs
```

### User Notification Settings

Users can customize their notification preferences in Settings:

**Available Settings**:
- **Notification Channels**: Email, browser push, or both
- **Notification Time**: Custom time picker in 24-hour format (HH:MM)
- **Timezone**: Automatic detection with manual override option
- **Notification Days**: Same day, 1 day before, 2 days before, or combinations
- **Default time**: 09:00 (9 AM) - displayed as 12-hour format in UI (e.g., "4:00 PM")

**How It Works**:
```
User sets notification preferences:
- Time: 14:00 (2 PM)
- Channels: Email + Browser Push
- Days: 1 day before, Same day
    │
    ▼
Saved in NotificationPreference:
{
  userId: "...",
  notificationTime: "14:00",
  timezone: "America/New_York",
  emailNotificationsEnabled: true,
  browserNotificationsEnabled: true,
  pushSubscription: { endpoint: "...", keys: {...} },
  notificationDays: ["1_day_before", "same_day"]
}
    │
    ▼
Every hour, cron job checks:
- Is it 14:00 in user's timezone? (±30 min window)
- YES → Send via enabled channels (email + push)
- NO → Skip user (check again next hour)
```

**Time Checking Logic**:
- Uses 30-minute window for flexibility (accounts for cron timing)
- Uses Luxon library for accurate timezone handling
- Compares current time with user's preferred time
- Accounts for timezone differences and DST
- Skips users if not their notification time

**UI Time Display**:
- Settings: 24-hour format (16:00)
- Task creation/display: 12-hour format (4:00 PM)
- Automatically syncs across all components using Svelte stores

### Notification Types

**Same Day**: Sent on the task's due date at user's chosen time
- Example: Task due Dec 25 → notification sent Dec 25 at user's time

**1 Day Before**: Sent one day before due date at user's chosen time
- Example: Task due Dec 25 → notification sent Dec 24 at user's time

**2 Days Before**: Sent two days before due date at user's chosen time
- Example: Task due Dec 25 → notification sent Dec 23 at user's time

### Duplicate Prevention

The system prevents sending the same notification twice:

1. **Task tracking**: Each task has `notificationsSent` array
   ```javascript
   {
     _id: "task123",
     notificationsSent: ["2_days_before", "1_day_before"]
   }
   ```

2. **Notification logs**: All sent notifications logged in NotificationLog collection

3. **Pre-send check**: Queries NotificationLog before sending

### Notification Service Integration

#### Email Service (Resend API)

**Configuration**:
```bash
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Notes & Tasks App
FRONTEND_BASE_URL=https://your-app.netlify.app
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY_MS=1000
```

**Features**:
- HTML-formatted emails with task details
- Deep links to tasks (click to open in app)
- Professional templates with responsive design
- Retry logic with exponential backoff
- Circuit breaker pattern for fault tolerance
- Rate limiting compliance

#### Push Notification Service (Web Push API)

**Configuration**:
```bash
# Generate using: node src/scripts/generateVapidKeys.js
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
PUSH_RETRY_ATTEMPTS=3
PUSH_RETRY_DELAY_MS=1000
```

**Features**:
- VAPID protocol for authentication
- Push subscription management per device
- Notification payload with title, body, icon, badge
- Deep link support in notification data
- Works even when browser/app is closed
- Automatic subscription renewal handling
- Circuit breaker pattern for fault tolerance

**VAPID Key Generation**:
```bash
cd backend
node src/scripts/generateVapidKeys.js
```

This generates a public/private key pair for VAPID authentication. The public key is shared with the frontend, while the private key remains secret on the backend.

### Database Schema

#### NotificationPreference
```javascript
{
  userId: ObjectId,                              // Reference to User
  emailNotificationsEnabled: Boolean,            // Enable email notifications
  browserNotificationsEnabled: Boolean,          // Enable browser push notifications
  pushSubscription: {                            // Web Push subscription object
    endpoint: String,                            // Push service endpoint
    expirationTime: Number,                      // Optional expiration
    keys: {
      p256dh: String,                            // Client public key
      auth: String                               // Authentication secret
    }
  },
  notificationDays: [String],                    // ['same_day', '1_day_before', '2_days_before']
  timezone: String,                              // e.g., 'America/New_York'
  notificationTime: String,                      // e.g., '09:00' (HH:MM 24-hour format)
  createdAt: Date,
  updatedAt: Date
}
```

#### NotificationLog
```javascript
{
  userId: ObjectId,
  taskId: ObjectId,
  notificationType: String,      // 'same_day', '1_day_before', '2_days_before'
  sentAt: Date,
  status: String,                // 'sent', 'failed', 'partial' (one channel failed)
  channel: String,               // 'email', 'push', or 'both'
  emailSent: Boolean,            // true if email was sent successfully
  pushSent: Boolean,             // true if push was sent successfully
  emailProvider: String,         // 'resend'
  pushProvider: String,          // 'web-push'
  error: String,                 // Optional error message if failed
  createdAt: Date
}
```

### Performance Considerations

**Hourly Execution**:
- Cron runs 24 times per day (vs 1 time previously)
- Most users skipped each hour (fast time comparison)
- Only processes users at their notification time
- Minimal CPU and memory usage

**Optimization**:
- Early return if not user's notification time
- No database queries for skipped users
- Efficient time comparison (simple arithmetic)
- Batch processing for users at same time

**Scalability**:
- Current approach handles up to 10,000 users
- For larger scale, consider:
  - Database index on `notificationTime`
  - Query only users with matching time
  - Job queue (Bull, BullMQ) for distribution

### Monitoring

**Log Entries**:
```
[INFO] Notification cron job scheduled: 0 * * * * (UTC)
[INFO] Starting scheduled notification processing...
[INFO] Notification scheduler completed { successful: 10, failed: 0 }
[INFO] Cleanup completed { deletedCount: 500 }
```

**Metrics Tracked**:
- Total notifications sent
- Success/failure rates
- Execution duration
- Users processed vs skipped
- Cleanup records deleted

### Error Handling

**Scenarios**:
- Database connection issues → Logged, retried next run
- Email service failures → Logged, marked as failed
- Invalid user data → Skipped, logged as warning
- Network timeouts → Logged, retried next run

**Resilience**:
- Cron continues running even if one execution fails
- Failed notifications don't block other users
- Comprehensive error logging with Winston
- Automatic retry on next cron run

## Code Quality & Type Safety

### TypeScript Implementation

The frontend is fully typed with TypeScript 5.x:
- **0 TypeScript errors**: All type issues resolved
- **Strict mode enabled**: Maximum type safety
- **Type inference**: Leverages Svelte's type inference
- **Interface definitions**: Complete type definitions for all data models

### Recent Improvements (2024)

#### Type Safety Fixes
1. **ApiError type**: Added `statusCode` property alias for backward compatibility
2. **Task type**: Removed non-existent `tags` property references
3. **Component props**: Fixed all prop type mismatches
4. **Test mocks**: Corrected store mock implementations for Vitest

#### Accessibility Improvements
1. **Interactive elements**: Converted clickable divs to proper button elements
2. **Form labels**: Added proper `for` attributes with unique IDs
3. **ARIA roles**: Enhanced modal and calendar components with proper roles
4. **Keyboard navigation**: Full keyboard support for all interactive elements

#### Component Fixes
1. **Card component**: Now uses button element when clickable, supports `class` prop
2. **Tag component**: Converted to button when clickable for better accessibility
3. **DueDatePicker**: Fixed calendar positioning and click handling
4. **Modal**: Proper event handling with stopPropagation

### Testing

- **Unit tests**: Vitest for utility functions and components
- **Type checking**: `npm run check` passes with 0 errors
- **Linting**: ESLint configured for code quality
- **Build verification**: Production builds tested and optimized

## Future Enhancements

1. **Real-time Sync**: WebSocket connections for live updates
2. **Collaboration**: Shared lists with permissions
3. **Rich Text**: Enhanced markdown or WYSIWYG editor for notes
4. **File Attachments**: Image/file uploads to S3/GridFS
5. **Push Notifications**: Task reminders via PWA notifications
6. **Background Sync**: Sync even when app is closed
7. **Share Target**: Share content to app from other apps
8. **Search**: MongoDB Atlas Search for full-text search
9. **Analytics**: Usage tracking and insights
10. **Multi-language**: Internationalization support


## Performance Optimization

### Build Optimizations

#### Code Splitting
- **Vendor chunks**: Third-party dependencies (idb) split into separate chunks
- **Store chunks**: State management stores bundled separately
- **Repository chunks**: API repositories bundled separately
- **Route-based splitting**: SvelteKit automatically splits code by route

#### Minification
- esbuild minification for fast builds
- Console statements removed in production
- Dead code elimination
- Variable name mangling

#### Tree Shaking
- Vite automatically removes unused code
- Only imported functions included in bundle
- Unused exports eliminated

### CSS Optimization

- **Tailwind JIT mode**: Faster builds and smaller CSS
- **Purging**: Unused styles automatically removed
- **Critical CSS**: Inlined for faster first paint
- **Result**: 6.18 KB (gzipped) CSS bundle

### Runtime Optimizations

#### Preloading
- Navigation links use `data-sveltekit-preload-data="hover"`
- Reduces perceived navigation time
- Applied to all main navigation links

#### Debouncing
- Search inputs use 300ms debouncing
- Prevents excessive API calls while typing
- Improves server performance

#### Lazy Loading
- Route components loaded on demand
- Reduces initial bundle size
- Faster time to interactive

### Caching Strategy

#### Browser Caching
- Content-based hashing for long-term caching
- Chunk files: `chunks/[name]-[hash].js`
- Entry files: `entries/[name]-[hash].js`
- Asset files: `assets/[name]-[hash][extname]`

#### IndexedDB Caching
- API responses cached locally
- Reduces network requests
- Enables offline functionality

### Compression

- Gzip compression enabled
- Brotli compression enabled (when supported)
- Reduces transfer size by 60-70%

### Bundle Size Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Initial JS | < 100 KB | ~37 KB | ✅ Excellent |
| Vendor Chunk | < 50 KB | 16.97 KB | ✅ Excellent |
| Route Chunks | < 30 KB | 4-10 KB | ✅ Excellent |
| CSS Bundle | < 20 KB | 6.18 KB | ✅ Excellent |

### Performance Metrics

- **FCP (First Contentful Paint)**: < 1.8s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **TTI (Time to Interactive)**: < 3.8s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

## Responsive Design

### Breakpoints

Using Tailwind's default breakpoints:
- **Mobile**: < 640px (default, no prefix)
- **Tablet**: ≥ 640px (`sm:` prefix)
- **Desktop**: ≥ 1024px (`lg:` prefix)

### Touch-Friendly Design

All interactive elements meet minimum touch target size of 44x44px:
- **Buttons**: `min-h-[44px]` with responsive padding
- **Input Fields**: `min-h-[44px]` with `text-base` sizing
- **Select Dropdowns**: `min-h-[44px]` with adequate padding
- **Checkboxes**: `w-5 h-5` on mobile

### Layout Adaptations

#### Sidebar Navigation
- **Mobile**: Collapsible with hamburger menu, overlay backdrop
- **Desktop**: Persistent sidebar, always visible
- Smooth transitions with transform animations

#### Grid Layouts
- **Mobile**: 1 column
- **Tablet**: 2 columns (`sm:grid-cols-2`)
- **Desktop**: 3 columns (`lg:grid-cols-3`)

#### Page Headers
- **Mobile**: Stacked layout with full-width buttons
- **Desktop**: Horizontal layout with inline buttons
- Responsive text sizing: `text-2xl sm:text-3xl`

### Typography Scaling

- Headings: `text-2xl sm:text-3xl`
- Body text: `text-sm sm:text-base`
- Labels: `text-sm` (consistent)
- Buttons: `text-sm sm:text-base`

### Spacing

Container padding:
- Mobile: `px-4 py-6`
- Tablet: `sm:px-6 sm:py-8`
- Desktop: `lg:px-8`

Gap spacing:
- Mobile: `gap-4`
- Desktop: `sm:gap-6`

### Mobile Optimizations

- Hamburger menu with 44x44px tap target
- Smooth slide-in animations
- Backdrop overlay for focus
- Condensed button labels (e.g., "Create Note" → "+ New")
- Touch-friendly card actions

### Accessibility

- Minimum touch target size: 44x44px
- Proper focus states on all interactive elements
- Keyboard navigation support
- Screen reader friendly markup
- Sufficient color contrast ratios

