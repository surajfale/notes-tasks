# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

A production-ready web application for managing notes and tasks, built with:
- **Backend**: Node.js + Express + MongoDB Atlas
- **Frontend**: Flutter Web (Implemented)
- **Architecture**: REST API with JWT authentication

## Project Structure

```
.
├── backend/               # Node.js REST API
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Route controllers (auth, lists, notes, tasks)
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Mongoose schemas (User, List, Note, Task)
│   │   ├── routes/       # Express routes
│   │   ├── utils/        # Logger and utilities
│   │   └── server.js     # Express app entry point
│   ├── package.json
│   └── README.md         # Backend documentation
├── frontend/             # Flutter Web Application
│   ├── lib/
│   │   ├── core/           # Config, API, storage, models
│   │   ├── features/       # Auth, home, notes, tasks
│   │   └── main.dart
│   ├── web/              # Web-specific files
│   └── pubspec.yaml
├── ARCHITECTURE.md       # System architecture documentation
├── DEPLOYMENT.md         # Deployment guide (Railway + Netlify)
├── FLUTTER_SETUP.md      # Flutter installation guide
├── FRONTEND_IMPLEMENTATION.md  # Frontend architecture guide
├── MONGODB_SETUP.md      # MongoDB Atlas setup guide
├── PROJECT_SUMMARY.md    # Project status and roadmap
└── README.md
```

## Common Commands

### Backend Development

```bash
# Setup
cd backend
npm install
cp .env.example .env  # Then edit .env with your MongoDB URI

# Development
npm run dev           # Start with nodemon (auto-reload)
npm start             # Start production server

# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm test -- --coverage # Run with coverage

# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Development

```bash
# Setup
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Development
flutter run -d chrome          # Run in Chrome
flutter run -d chrome --web-port=8080  # Specific port

# Build
flutter build web --release    # Production build

# Code Generation (after model changes)
flutter pub run build_runner watch  # Watch mode

# Testing
flutter test                   # Run tests
flutter analyze                # Code analysis
```

### Database

```bash
# Test MongoDB connection
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('Connected!'); process.exit(0); });"
```

## Architecture Overview

### Backend API

**Tech Stack**:
- Express.js 4.18+ for REST API
- Mongoose 8.0+ for MongoDB ODM
- JWT for authentication (bcrypt for passwords)
- Joi for input validation
- Winston for logging
- Helmet + CORS for security
- Rate limiting (5 req/15min for auth, 100 req/15min for API)

**Key Patterns**:
- User-scoped data: All queries filtered by `userId` from JWT
- Middleware chain: Rate limit → Auth → Validation → Controller
- Error handling: Centralized error handler with consistent format
- Security: No passwords in responses, JWT in headers only

**API Endpoints**:
- `/api/auth/*` - Registration, login, password management
- `/api/lists/*` - CRUD for lists
- `/api/notes/*` - CRUD for notes with search/filter
- `/api/tasks/*` - CRUD for tasks with completion toggle
- `/health` - Health check endpoint

### Data Models

**User**: username (unique), email (unique), passwordHash, displayName
**List**: userId, title, color (#hex), emoji
**Note**: userId, listId (optional), title, body, tags[], isArchived
**Task**: userId, listId (optional), title, description, dueAt, isCompleted, priority (1-3)

All models have automatic `createdAt` and `updatedAt` timestamps.

### MongoDB Indexes

- Users: `{username: 1}`, `{email: 1}` (unique)
- Lists: `{userId: 1, updatedAt: -1}`
- Notes: `{userId: 1, listId: 1, updatedAt: -1}`, `{userId: 1, isArchived: 1}`, `{userId: 1, tags: 1}`
- Tasks: `{userId: 1, listId: 1, dueAt: 1}`, `{userId: 1, isCompleted: 1}`, `{userId: 1, priority: -1, dueAt: 1}`

## Development Workflow

### Adding New Backend Features

1. **Model**: Create/update Mongoose schema in `backend/src/models/`
2. **Controller**: Add business logic in `backend/src/controllers/`
3. **Validation**: Add Joi schema in `backend/src/middleware/validation.js`
4. **Routes**: Wire up in `backend/src/routes/`
5. **Test**: Create tests (when implemented)

### Making Database Changes

- Update model schema in `backend/src/models/`
- Mongoose will auto-create indexes on first run
- For data migrations, create script in `backend/scripts/` (TBD)

## Environment Setup

### Required Environment Variables (Backend)

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=<64-char-hex-string>
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### MongoDB Atlas Setup

Follow `MONGODB_SETUP.md` for complete setup instructions:
1. Create free M0 cluster
2. Setup database user and network access
3. Get connection string
4. Configure indexes (auto-created by Mongoose)

## Security Notes

- **Never commit** `.env` file or MongoDB credentials
- JWT secret must be strong (64+ random bytes)
- All API routes except `/api/auth/register` and `/api/auth/login` require authentication
- User data is isolated: queries always filter by `userId` from JWT token
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Verify MongoDB Atlas IP whitelist includes your IP
- Ensure `JWT_SECRET` is set
- Check Node.js version (requires 18+)

### Authentication fails
- Verify JWT token format: `Authorization: Bearer <token>`
- Check token hasn't expired (7-day default)
- Ensure `JWT_SECRET` matches between sign and verify

### Database queries fail
- Check user is authenticated (JWT valid)
- Verify ObjectId format for IDs (24-char hex)
- Check indexes are created (logged on startup)

## Testing Strategy

- **Unit tests**: Controllers and middleware (Jest + Supertest)
- **Integration tests**: Full API flows
- **Manual testing**: Use curl or Postman (examples in backend/README.md)

## Deployment

### Current Production Setup

**Backend (Railway)**:
- Deploy from GitHub automatically
- Configuration in `railway.json`
- Environment variables set in Railway dashboard
- See `DEPLOYMENT.md` for setup

**Frontend (Netlify)**:
- Automated deployment from GitHub
- Flutter SDK installed automatically during build
- Configuration in `netlify.toml` (root directory)
- Build process: Clone Flutter → Build web → Deploy
- See `DEPLOYMENT.md` for setup

**Database (MongoDB Atlas)**:
- Cloud-hosted MongoDB cluster
- IP whitelist configured for Railway
- See `MONGODB_SETUP.md` for setup

## Frontend Structure

### Core Layer
- **config/**: API base URL and app configuration
- **api/**: Dio HTTP client with JWT interceptors
- **storage/**: Token storage with SharedPreferences
- **models/**: User, Note, Task models with Freezed

### Features
- **auth/**: Login, register, JWT authentication
- **home/**: Main navigation and dashboard
- **notes/**: Notes CRUD with tags and archive
- **tasks/**: Tasks CRUD with due dates and completion

### State Management
- Using Riverpod for state management
- Repository pattern for data layer
- Provider pattern for business logic

## Additional Documentation

- `ARCHITECTURE.md` - Full system architecture and data flow
- `DEPLOYMENT.md` - Railway + Netlify deployment guide
- `FLUTTER_SETUP.md` - Flutter installation for Windows
- `FRONTEND_IMPLEMENTATION.md` - Frontend architecture and patterns
- `MONGODB_SETUP.md` - Step-by-step MongoDB Atlas setup
- `PROJECT_SUMMARY.md` - Project status and next steps
- `backend/README.md` - Backend API documentation and usage examples
