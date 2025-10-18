# Notes & Tasks Web Application

A production-ready web application for managing notes and tasks with offline capabilities.

## Features

- **User Authentication**: Secure JWT-based authentication
- **Lists Management**: Organize notes and tasks into colored lists
- **Notes**: Rich text notes with tags, search, and archive
- **Tasks**: Task management with due dates, priorities, and completion tracking
- **Offline Support**: Work offline with automatic sync (Flutter web)
- **Responsive Design**: Works on desktop and mobile browsers

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Joi Validation
- Winston Logging

### Frontend
- Flutter Web (Implemented)
- Riverpod (State Management)
- dio (HTTP Client)
- go_router (Navigation)
- Freezed (Code Generation)

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure MongoDB URI and JWT secret
npm run dev
```

See `backend/README.md` for detailed instructions.

### Frontend Setup

```bash
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d chrome
```

## Deployment

- **Backend**: Deployed on Railway (see `DEPLOYMENT.md`)
- **Frontend**: Deployed on Netlify with automated Flutter installation
- **Database**: MongoDB Atlas (cloud)

See `DEPLOYMENT.md` for complete deployment instructions.

## Documentation

- **[WARP.md](WARP.md)** - Development guide for WARP
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide (Railway + Netlify)
- **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - MongoDB Atlas setup guide
- **[backend/README.md](backend/README.md)** - Backend API documentation

## Project Structure

```
.
├── backend/          # Node.js REST API
├── frontend/         # Flutter Web Application
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── FLUTTER_SETUP.md
├── FRONTEND_IMPLEMENTATION.md
├── MONGODB_SETUP.md
├── PROJECT_SUMMARY.md
└── WARP.md
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/lists` - Get user's lists
- `GET /api/notes` - Get user's notes
- `GET /api/tasks` - Get user's tasks

See backend README for complete API documentation.

## License

MIT
