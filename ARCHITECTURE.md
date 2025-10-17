# Architecture Documentation - Notes & Tasks Web App

## Overview

A production-ready web application for managing notes and tasks with offline capabilities, built using Flutter Web frontend and Node.js backend with MongoDB Atlas.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Flutter Web Application                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │     UI      │  │   Riverpod  │  │  IndexedDB   │  │  │
│  │  │  (Widgets)  │◄─┤   State     │  │  (Offline)   │  │  │
│  │  └─────────────┘  │  Management │  └──────────────┘  │  │
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

### Frontend (Flutter Web)
- **Framework**: Flutter 3.16+ (Web target)
- **State Management**: Riverpod 2.5+
- **HTTP Client**: dio 5.4+ (with interceptors for JWT)
- **Local Storage**: idb_shim (IndexedDB wrapper) for offline caching
- **Routing**: go_router 13.0+
- **UI**: Material Design 3

### Backend (Node.js)
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.18+
- **Database**: MongoDB Node Driver via Mongoose 8.0+
- **Authentication**: jsonwebtoken + bcryptjs
- **Validation**: Joi
- **Security**: helmet, cors, express-rate-limit
- **Logging**: winston
- **Environment**: dotenv

### Database
- **MongoDB Atlas**: M0 (free tier) or higher
- **Collections**: users, lists, notes, tasks
- **Indexes**: Compound indexes on userId + other fields

## Data Flow

### Authentication Flow
```
1. User enters credentials in Flutter UI
2. Flutter sends POST /api/auth/login with {username, password}
3. Backend validates credentials against MongoDB
4. Backend generates JWT token with userId payload
5. Backend returns {token, user} to Flutter
6. Flutter stores JWT in memory + localStorage
7. All subsequent requests include: Authorization: Bearer <JWT>
```

### CRUD Flow (Example: Create Note)
```
1. User fills note form in Flutter UI
2. User clicks Save
3. Riverpod notifier calls repository.createNote(data)
4. Repository stores in IndexedDB with status='pending'
5. Repository sends POST /api/notes with JWT header
6. Backend validates JWT → extracts userId
7. Backend validates input → inserts to MongoDB with userId
8. Backend returns created note with _id
9. Repository updates IndexedDB: status='synced', updates _id
10. Riverpod notifier updates UI state
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
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Invalidate token (client-side)
- `PUT /api/auth/password` - Change password (authenticated)

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
Frontend: localhost:8080 (flutter run -d chrome)
Backend: localhost:3000 (node server.js)
Database: MongoDB Atlas (cloud)
```

### Production
```
Frontend: Netlify
  - Automated Flutter installation during build
  - Static hosting with SPA routing
  - Build command: Flutter SDK installed + flutter build web
  
Backend: Railway
  - Automatic deployment from GitHub
  - Environment variables managed in Railway dashboard
  - Health check endpoint: /health
  
Database: MongoDB Atlas (production cluster)
  - M0 free tier or higher
  - IP whitelist configured for Railway
```

## Monitoring & Observability

- **Backend Logs**: Winston (JSON format) → stdout
- **Error Tracking**: Sentry (optional)
- **Health Check**: GET /health endpoint
- **Metrics**: Request count, response time, error rate

## Future Enhancements

1. **Real-time Sync**: WebSocket connections for live updates
2. **Collaboration**: Shared lists with permissions
3. **Rich Text**: Markdown or WYSIWYG editor for notes
4. **File Attachments**: Image/file uploads to S3/GridFS
5. **Email Reminders**: Scheduled jobs for task reminders
6. **Mobile Apps**: Flutter mobile (iOS/Android) with same backend
7. **Search**: MongoDB Atlas Search for full-text search
8. **Analytics**: Usage tracking and insights
