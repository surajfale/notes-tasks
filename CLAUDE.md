# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Assistant Rules

### Context7 Integration
**IMPORTANT**: Always use Context7 MCP tools when you need:
- Code generation examples
- Setup or configuration steps
- Library/API documentation
- Framework-specific patterns
- Best practices for libraries

**Automatic Usage**: You should automatically use the Context7 MCP tools (`mcp_Context7_resolve_library_id` and `mcp_Context7_get_library_docs`) without the user having to explicitly ask. This provides up-to-date, accurate documentation for:
- Express.js, Mongoose, JWT, Joi (backend)
- Flutter, Riverpod, Dio, Freezed (frontend)
- MongoDB, Railway, Netlify (deployment)

**Example**: When asked to add a new feature using Riverpod, automatically fetch Riverpod documentation from Context7 before providing code examples.

## Repository Overview

A production-ready full-stack web application for managing notes and tasks with:
- **Backend**: Node.js + Express + MongoDB Atlas (REST API with JWT auth)
- **Frontend**: Flutter Web (Riverpod 3.0+ state management with code generation)
- **Deployment**: Railway (backend) + Netlify (frontend)
- **Features**: User authentication, account management, notes, tasks, theme customization

## Development Commands

### Starting Development Environment

**Quick start** (Windows PowerShell):
```powershell
.\start-dev.ps1  # Starts both backend and frontend in separate windows
```

**Manual start**:
```bash
# Backend (Terminal 1)
cd backend
npm run dev                   # Starts on http://localhost:3000

# Frontend (Terminal 2)  
cd frontend
flutter run -d chrome         # Starts on http://localhost:8080 (default)
flutter run -d chrome --web-port=8080  # Specify port explicitly
```

### Backend Commands

```bash
cd backend

# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Production server

# Testing
npm test                 # Run Jest tests with coverage
npm run test:watch       # Watch mode

# Linting
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix issues

# Database
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✓ MongoDB connected'); process.exit(0); });"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Commands

```bash
cd frontend

# Code Generation (required after model changes)
flutter pub run build_runner build --delete-conflicting-outputs
flutter pub run build_runner watch  # Watch mode for development

# Development
flutter run -d chrome              # Run in browser
flutter pub get                    # Install dependencies

# Build
flutter build web --release        # Production build (outputs to build/web/)

# Testing & Analysis
flutter test                       # Run tests
flutter analyze                    # Static analysis
```

## Architecture

### Backend Architecture

**Pattern**: MVC with middleware chain
**Flow**: Request → Rate Limiter → Auth → Validation → Controller → MongoDB

```
backend/src/
├── config/database.js        # MongoDB connection with pooling
├── controllers/              # Business logic (auth, lists, notes, tasks)
├── middleware/
│   ├── auth.js              # JWT verification, userId extraction
│   ├── validation.js        # Joi schemas for input validation
│   └── errorHandler.js      # Centralized error handling
├── models/                  # Mongoose schemas (User, List, Note, Task)
├── routes/                  # Express route definitions
├── utils/logger.js          # Winston logging
└── server.js               # Express app entry point
```

**Critical Pattern**: All data queries are user-scoped
- JWT middleware extracts `userId` from token and attaches to `req.user`
- All controllers filter by `userId` automatically - never trust client-provided user IDs
- This ensures complete user data isolation

**Security**: 
- Rate limiting: 5 req/15min (auth), 100 req/15min (API)
- JWT tokens: 7-day expiration, HS256 algorithm
- Passwords: bcrypt hashed (10 rounds)
- No passwords ever returned in responses

**Database Indexes**:
- Users: `{username: 1}`, `{email: 1}` (unique)
- Lists: `{userId: 1, updatedAt: -1}`
- Notes: `{userId: 1, listId: 1, updatedAt: -1}`, `{userId: 1, isArchived: 1}`, `{userId: 1, tags: 1}`
- Tasks: `{userId: 1, listId: 1, dueAt: 1}`, `{userId: 1, isCompleted: 1}`, `{userId: 1, priority: -1, dueAt: 1}`

### Frontend Architecture

**Pattern**: Feature-based architecture with Repository pattern
**State Management**: Riverpod 3.0+ (code generation with `@riverpod` annotations)

```
frontend/lib/
├── core/
│   ├── api/dio_provider.dart         # Dio HTTP client with JWT interceptor
│   ├── config/app_config.dart        # API base URL configuration
│   ├── layout/
│   │   ├── app_scaffold.dart         # Main app layout with sidebar
│   │   └── app_layout.dart           # Alternative layout
│   ├── models/                       # Freezed models (User, Note, Task)
│   ├── storage/token_storage.dart    # JWT token persistence (SharedPreferences)
│   └── theme/                        # Material Design 3 theme with customization
├── features/
│   ├── auth/
│   │   ├── data/auth_repository.dart      # Auth API calls (login, register, delete)
│   │   ├── providers/auth_provider.dart   # Riverpod state notifier
│   │   └── presentation/                  # Login/Register screens
│   ├── home/
│   │   └── home_screen.dart               # Main navigation screen
│   ├── notes/
│   │   ├── data/notes_repository.dart     # Notes CRUD API
│   │   ├── providers/notes_provider.dart  # State management
│   │   └── presentation/                  # Notes screens (list, editor)
│   ├── settings/
│   │   └── presentation/
│   │       └── settings_screen.dart       # Settings, theme, account management
│   └── tasks/
│       ├── data/tasks_repository.dart     # Tasks CRUD API
│       ├── providers/tasks_provider.dart  # State management
│       └── presentation/                  # Tasks screens (list, editor)
└── main.dart                               # App entry + routing
```

**Key Patterns**:
- **JWT Injection**: Dio interceptor automatically adds `Authorization: Bearer <token>` to all requests
- **401 Handling**: Interceptor catches 401 responses, clears token, and redirects to login
- **Code Generation**: Models use Freezed for immutability, providers use `@riverpod` annotation
- **After model changes**: Always run `flutter pub run build_runner build --delete-conflicting-outputs`
- **Account Management**: Full support for password change and account deletion with data cleanup

## Data Models

**User**: 
- username (unique, indexed)
- email (unique, indexed)
- passwordHash (bcrypt hashed)
- displayName
- createdAt, updatedAt (automatic)

**List**: 
- userId (indexed, foreign key)
- title
- color (#hex format)
- emoji (optional)
- createdAt, updatedAt (automatic)

**Note**: 
- userId (indexed, foreign key)
- listId (optional, indexed, foreign key)
- title
- body (max 50,000 chars)
- tags[] (max 20 tags, 30 chars each)
- isArchived (boolean, indexed)
- createdAt, updatedAt (automatic)

**Task**: 
- userId (indexed, foreign key)
- listId (optional, indexed, foreign key)
- title
- description (max 5,000 chars)
- dueAt (optional, indexed)
- reminderAt (optional)
- isCompleted (boolean, indexed)
- priority (1=low, 2=normal, 3=high, indexed)
- tags[] (max 20 tags, 30 chars each)
- createdAt, updatedAt (automatic)

All models have automatic `createdAt` and `updatedAt` timestamps managed by Mongoose.

## Environment Setup

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=<64-char-hex-string>
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Frontend (lib/core/config/app_config.dart)

```dart
static const String apiBaseUrl = 'http://localhost:3000/api';  // Local dev
// static const String apiBaseUrl = 'https://your-backend.railway.app/api';  // Production
```

## Deployment

### Production Setup

**Backend (Railway)**:
- Deploy from GitHub with `railway.json` configuration
- Environment variables set in Railway dashboard
- Auto-restart on crashes
- Health check endpoint: `/health`

**Frontend (Netlify)**:
- Automated deployment from GitHub
- Flutter SDK installed automatically during build
- Configuration in `netlify.toml` (root directory)
- Build process: Clone Flutter → Build web → Deploy to CDN
- `API_BASE_URL` injected at build time from Netlify environment variable

**Database (MongoDB Atlas)**:
- Cloud-hosted MongoDB cluster (M0 free tier or higher)
- IP whitelist configured for Railway (0.0.0.0/0 for cloud deployment)
- Connection pooling enabled (min: 5, max: 50)

## Common Development Patterns

### Adding a New Feature

1. **Backend**:
   - Create model in `backend/src/models/`
   - Add controller in `backend/src/controllers/`
   - Add Joi validation in `backend/src/middleware/validation.js`
   - Wire routes in `backend/src/routes/`
   - Ensure all queries filter by `req.user.userId`

2. **Frontend**:
   - Create Freezed model in `lib/core/models/`
   - Create repository in `lib/features/<feature>/data/`
   - Create Riverpod provider in `lib/features/<feature>/providers/`
   - Create UI screens in `lib/features/<feature>/presentation/`
   - Run code generation: `flutter pub run build_runner build --delete-conflicting-outputs`

### Making Database Changes

- Update Mongoose schema in `backend/src/models/`
- Indexes are auto-created by Mongoose on first run
- For data migrations, create a script in `backend/scripts/` (not yet implemented)

### Testing API Endpoints

Use curl or any HTTP client:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123"}'

# Create Note (requires JWT token)
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Note","body":"This is a test"}'
```

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env` (special characters must be URL-encoded)
- Verify MongoDB Atlas IP whitelist includes your IP
- Ensure `JWT_SECRET` is set (generate with command above)
- Check Node.js version: `node --version` (requires 18+)

### Frontend won't run
- Ensure Flutter is installed: `flutter doctor`
- Check backend is running on correct port
- Verify `API_BASE_URL` in `app_config.dart`
- Try `flutter pub get` and restart IDE
- Clear build: `flutter clean && flutter pub get`

### Code generation issues
- Run `flutter pub run build_runner clean` first
- Delete `.dart_tool/build` directory
- Then run `flutter pub run build_runner build --delete-conflicting-outputs`

### CORS errors
- Verify backend `CORS_ORIGINS` includes your frontend URL
- Check browser console for specific origin error
- Ensure backend is running and accessible

### Authentication fails
- Check JWT token format: `Authorization: Bearer <token>`
- Verify token hasn't expired (7-day default)
- Ensure `JWT_SECRET` matches between token creation and verification
- Check browser console for 401 errors

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (authenticated)
- `PUT /api/auth/password` - Change password (authenticated)
- `DELETE /api/auth/account` - Delete account and all data (authenticated)

### Lists
- `GET /api/lists` - Get all user's lists
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get specific list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Notes
- `GET /api/notes` - Get all user's notes (supports query params: listId, isArchived, tags, search)
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PUT /api/notes/:id/archive` - Toggle archive status

### Tasks
- `GET /api/tasks` - Get all user's tasks (supports query params: listId, isCompleted, priority)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Toggle completion status

### Health Check
- `GET /health` - Server health check (no auth required)

## Additional Documentation

All detailed documentation is in the `docs/` folder:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete system architecture, data flow, and security model
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Railway + Netlify deployment guide
- **[docs/FRONTEND_IMPLEMENTATION.md](docs/FRONTEND_IMPLEMENTATION.md)** - Flutter frontend patterns and implementation
- **[docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md)** - Step-by-step MongoDB Atlas setup
- **[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project status and roadmap
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Recent changes and updates
- **[backend/README.md](backend/README.md)** - Complete API documentation with examples

## Quick Reference

### Current Features
✅ User authentication with JWT
✅ Account management (password change, account deletion)
✅ Notes CRUD with tags, search, and archive
✅ Tasks CRUD with due dates, priorities, and completion
✅ Lists for organizing notes and tasks
✅ Theme customization (light/dark mode, accent colors)
✅ Responsive design (desktop and mobile)
✅ Material Design 3 UI
✅ Complete data isolation per user
✅ Rate limiting and security headers

### Technology Stack
- **Backend**: Node.js 18+, Express 4.18+, MongoDB/Mongoose 8.0+
- **Frontend**: Flutter 3.0+, Riverpod 3.0+, Dio 5.4+, Freezed 3.2+
- **Security**: JWT (HS256), bcrypt, helmet, CORS, rate limiting
- **Database**: MongoDB Atlas with compound indexes
- **Deployment**: Railway (backend), Netlify (frontend)

