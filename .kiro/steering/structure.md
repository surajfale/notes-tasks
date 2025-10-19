---
inclusion: always
---

# Project Structure & Conventions

## Repository Layout

```
.
├── backend/                # Node.js REST API
├── frontend/               # Flutter Web application
├── docs/                   # All project documentation
├── .kiro/                  # Kiro AI assistant configuration
├── netlify.toml            # Netlify deployment config
├── start-dev.ps1           # Windows dev startup script
├── README.md               # Main project documentation
└── CLAUDE.md               # AI assistant development guide
```

## Backend Organization

**Pattern**: MVC with middleware chain

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection with pooling
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # Auth: register, login, password, delete
│   │   ├── listsController.js    # Lists CRUD
│   │   ├── notesController.js    # Notes CRUD + archive
│   │   └── tasksController.js    # Tasks CRUD + complete
│   ├── middleware/
│   │   ├── auth.js               # JWT verification, userId extraction
│   │   ├── validation.js         # Joi schemas for input validation
│   │   └── errorHandler.js       # Centralized error handling
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js               # User model with password hashing
│   │   ├── List.js               # List model
│   │   ├── Note.js               # Note model with tags
│   │   └── Task.js               # Task model with priority
│   ├── routes/                   # Express route definitions
│   │   ├── authRoutes.js
│   │   ├── listsRoutes.js
│   │   ├── notesRoutes.js
│   │   └── tasksRoutes.js
│   ├── utils/
│   │   └── logger.js             # Winston logger configuration
│   └── server.js                 # Express app entry point
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── package.json
├── Procfile                      # Railway deployment config
└── railway.json                  # Railway configuration
```

## Frontend Organization

**Pattern**: Feature-based architecture with Repository pattern

```
frontend/
├── lib/
│   ├── core/                     # Shared core functionality
│   │   ├── api/
│   │   │   └── dio_provider.dart # Dio HTTP client with JWT interceptor
│   │   ├── config/
│   │   │   └── app_config.dart   # API base URL configuration
│   │   ├── layout/
│   │   │   ├── app_scaffold.dart # Main app layout with sidebar
│   │   │   └── app_layout.dart   # Alternative layout
│   │   ├── models/               # Freezed models (shared across features)
│   │   │   ├── user.dart
│   │   │   ├── list.dart
│   │   │   ├── note.dart
│   │   │   └── task.dart
│   │   ├── storage/
│   │   │   └── token_storage.dart # JWT token persistence
│   │   └── theme/                # Material Design 3 theme
│   │       ├── app_theme.dart
│   │       └── theme_provider.dart
│   ├── features/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart    # Auth API calls
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart      # Riverpod state notifier
│   │   │   └── presentation/
│   │   │       ├── login_screen.dart
│   │   │       └── register_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart            # Main navigation
│   │   ├── notes/
│   │   │   ├── data/
│   │   │   │   └── notes_repository.dart   # Notes CRUD API
│   │   │   ├── providers/
│   │   │   │   └── notes_provider.dart     # State management
│   │   │   └── presentation/
│   │   │       ├── notes_screen.dart
│   │   │       └── note_editor_screen.dart
│   │   ├── settings/
│   │   │   └── presentation/
│   │   │       └── settings_screen.dart    # Theme, account management
│   │   └── tasks/
│   │       ├── data/
│   │       │   └── tasks_repository.dart   # Tasks CRUD API
│   │       ├── providers/
│   │       │   └── tasks_provider.dart     # State management
│   │       └── presentation/
│   │           ├── tasks_screen.dart
│   │           └── task_editor_screen.dart
│   └── main.dart                           # App entry + routing
├── web/                          # Web-specific files
├── pubspec.yaml                  # Flutter dependencies
└── analysis_options.yaml         # Dart linter configuration
```

## Documentation Organization

All documentation is centralized in the `docs/` folder:

- **ARCHITECTURE.md** - System architecture, data flow, security model
- **DEPLOYMENT.md** - Railway + Netlify deployment guide
- **FLUTTER_SETUP.md** - Flutter installation guide
- **FRONTEND_IMPLEMENTATION.md** - Frontend patterns and implementation
- **MONGODB_SETUP.md** - MongoDB Atlas setup guide
- **CHANGELOG.md** - Recent changes and updates

## Code Conventions

### Backend Conventions

- **User Data Isolation**: All queries MUST filter by `req.user.userId` (extracted from JWT)
- **Never trust client**: Never accept `userId` from request body/params
- **Error Handling**: Use centralized error handler middleware
- **Validation**: All inputs validated with Joi schemas before reaching controllers
- **Logging**: Use Winston logger, never `console.log` in production code
- **Async/Await**: Use async/await, not callbacks or raw promises
- **Database Indexes**: All user-scoped queries have compound indexes starting with `userId`

### Frontend Conventions

- **State Management**: Use Riverpod 3.0+ with `@riverpod` code generation annotations
- **Models**: Use Freezed for immutable data models with `@freezed` annotation
- **Repository Pattern**: All API calls go through repository classes in `data/` folders
- **Code Generation**: Run `flutter pub run build_runner build --delete-conflicting-outputs` after model/provider changes
- **JWT Handling**: Dio interceptor automatically adds JWT to requests and handles 401 responses
- **Feature Structure**: Each feature has `data/`, `providers/`, and `presentation/` folders
- **Naming**: Use snake_case for file names, PascalCase for class names

## File Naming Conventions

- **Backend**: camelCase for files (e.g., `authController.js`, `userModel.js`)
- **Frontend**: snake_case for files (e.g., `auth_provider.dart`, `notes_screen.dart`)
- **Generated files**: End with `.g.dart` (e.g., `user.g.dart`, `auth_provider.g.dart`)
- **Freezed files**: End with `.freezed.dart` (e.g., `user.freezed.dart`)

## Environment Configuration

- **Backend**: `.env` file (never commit, use `.env.example` as template)
- **Frontend**: `lib/core/config/app_config.dart` (API base URL)
- **Production**: Environment variables set in Railway/Netlify dashboards
