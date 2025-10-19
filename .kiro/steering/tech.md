---
inclusion: always
---

# Technology Stack

## Backend

- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.18+
- **Database**: MongoDB Atlas with Mongoose 8.0+ ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt password hashing
- **Validation**: Joi schemas for all input validation
- **Security**: helmet, cors, express-rate-limit
- **Logging**: Winston with JSON format

### Backend Structure
```
backend/src/
├── config/         # Database connection
├── controllers/    # Business logic (auth, lists, notes, tasks)
├── middleware/     # Auth, validation, error handling
├── models/         # Mongoose schemas
├── routes/         # Express route definitions
├── utils/          # Logger utilities
└── server.js       # Express app entry point
```

## Frontend

- **Framework**: Flutter 3.0+ (Web target)
- **State Management**: Riverpod 3.0+ with code generation (`@riverpod` annotations)
- **HTTP Client**: dio 5.4+ with JWT interceptor
- **Code Generation**: Freezed 3.2+ (immutable models), json_serializable
- **UI Components**: flutter_slidable 4.0, google_fonts 6.2+
- **Local Storage**: shared_preferences, idb_shim
- **Routing**: Built-in Flutter navigation

### Frontend Structure
```
frontend/lib/
├── core/
│   ├── api/        # Dio HTTP client with JWT interceptor
│   ├── config/     # API base URL configuration
│   ├── layout/     # App scaffold and layout
│   ├── models/     # Freezed models (User, Note, Task, List)
│   ├── storage/    # JWT token persistence
│   └── theme/      # Material Design 3 theme
├── features/
│   ├── auth/       # Login, register, account management
│   ├── home/       # Main navigation
│   ├── notes/      # Notes CRUD with repository pattern
│   ├── settings/   # Theme, account settings
│   └── tasks/      # Tasks CRUD with repository pattern
└── main.dart       # App entry + routing
```

## Common Commands

### Backend Development
```bash
cd backend
npm install                  # Install dependencies
npm run dev                  # Start dev server (nodemon, auto-reload)
npm start                    # Production server
npm test                     # Run Jest tests with coverage
npm run lint                 # Check code quality
npm run lint:fix             # Auto-fix linting issues

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Development
```bash
cd frontend
flutter pub get              # Install dependencies
flutter run -d chrome        # Run in browser (default port 8080)
flutter test                 # Run tests
flutter analyze              # Static analysis
flutter build web --release  # Production build

# Code generation (REQUIRED after model/provider changes)
flutter pub run build_runner build --delete-conflicting-outputs
flutter pub run build_runner watch  # Watch mode for development
flutter pub run build_runner clean  # Clean generated files
```

### Quick Start (Windows)
```powershell
.\start-dev.ps1  # Starts both backend and frontend
```

## Deployment

- **Backend**: Railway (Node.js environment, auto-deploy from GitHub)
- **Frontend**: Netlify (automated Flutter installation, static hosting)
- **Database**: MongoDB Atlas (cloud-hosted, M0 free tier or higher)

## Build System

- **Backend**: No build step, runs directly with Node.js
- **Frontend**: Flutter web compiler generates optimized JavaScript bundle
- **Code Generation**: Freezed and Riverpod use build_runner for code generation
