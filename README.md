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
- Flutter Web
- Riverpod (State Management)
- dio (HTTP Client)
- IndexedDB (Offline Storage)

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
flutter run -d chrome
```

(Frontend in development)

## Documentation

- **[WARP.md](WARP.md)** - Development guide for WARP
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - MongoDB Atlas setup guide
- **[backend/README.md](backend/README.md)** - Backend API documentation

## Project Structure

```
.
├── backend/          # Node.js REST API
├── frontend/         # Flutter Web (in development)
├── ARCHITECTURE.md
├── MONGODB_SETUP.md
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
