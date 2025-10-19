# Notes & Tasks Web Application

A production-ready web application for managing notes and tasks with offline capabilities.

## Features

- **User Authentication**: Secure JWT-based authentication with account management
- **Account Management**: Change password and delete account functionality
- **Lists Management**: Organize notes and tasks into colored lists
- **Notes**: Rich text notes with tags, search, and archive
- **Tasks**: Task management with due dates, priorities, and completion tracking
- **Responsive Design**: Works on desktop and mobile browsers
- **Material Design 3**: Modern UI with theme customization

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Joi Validation
- Winston Logging

### Frontend
- Flutter Web (Implemented)
- Riverpod 3.0 (State Management with code generation)
- dio 5.4 (HTTP Client)
- Freezed 3.2 (Code Generation)
- flutter_slidable 4.0 (Swipe actions)
- intl 0.20 (Internationalization)

## Quick Start

### Prerequisites
- Node.js 18+ LTS
- Flutter 3.0+
- MongoDB Atlas account (free tier available)

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

Edit `.env` and add:
- MongoDB Atlas connection string
- JWT secret (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

3. **Start development server**:
```bash
npm run dev
```

Backend runs at `http://localhost:3000`

See `backend/README.md` for detailed instructions.

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
flutter pub get
```

2. **Generate code** (for Riverpod and Freezed):
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. **Run the app**:
```bash
flutter run -d chrome
```

Frontend runs at `http://localhost:8080`

### Verify Installation

Test backend health:
```bash
curl http://localhost:3000/health
```

Expected response: `{"status":"OK",...}`

## Deployment

- **Backend**: Deployed on Railway (see `DEPLOYMENT.md`)
- **Frontend**: Deployed on Netlify with automated Flutter installation
- **Database**: MongoDB Atlas (cloud)

See `DEPLOYMENT.md` for complete deployment instructions.

## Documentation

📁 **All documentation has been organized in the [`docs/`](docs/) folder**

### Quick Links
- **[CLAUDE.md](CLAUDE.md)** - Development guide for AI assistants
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide (Railway + Netlify)
- **[docs/FLUTTER_SETUP.md](docs/FLUTTER_SETUP.md)** - Flutter installation guide
- **[docs/FRONTEND_IMPLEMENTATION.md](docs/FRONTEND_IMPLEMENTATION.md)** - Frontend architecture and patterns
- **[docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md)** - MongoDB Atlas setup guide
- **[docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - 2025 dependency migration guide
- **[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)** - Project status and roadmap
- **[backend/README.md](backend/README.md)** - Backend API documentation

## Project Structure

```
.
├── backend/                    # Node.js REST API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Business logic (auth, lists, notes, tasks)
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express routes
│   │   ├── utils/             # Logger and utilities
│   │   └── server.js          # Express app entry
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── README.md              # Backend API documentation
│
├── frontend/                   # Flutter Web Application
│   ├── lib/
│   │   ├── core/              # Config, API, storage, models, theme
│   │   ├── features/          # Auth, home, notes, tasks, settings
│   │   └── main.dart          # App entry point
│   ├── web/                   # Web-specific files
│   ├── pubspec.yaml           # Flutter dependencies
│   └── README.md
│
├── docs/                       # 📁 All documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── FLUTTER_SETUP.md       # Flutter installation
│   ├── FRONTEND_IMPLEMENTATION.md  # Frontend patterns
│   ├── MIGRATION_GUIDE.md     # Dependency migration
│   ├── MONGODB_SETUP.md       # Database setup
│   ├── PROJECT_SUMMARY.md     # Project status
│   └── CHANGELOG.md           # Recent changes
│
├── .gitignore
├── netlify.toml               # Netlify deployment config
├── start-dev.ps1              # Windows dev startup script
├── README.md                  # This file
└── CLAUDE.md                  # AI assistant development guide
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete account and all data

### Resources
- `GET /api/lists` - Get user's lists
- `GET /api/notes` - Get user's notes
- `GET /api/tasks` - Get user's tasks

See backend README for complete API documentation.

## Development Workflow

### Making Changes

1. **Backend changes**:
   - Edit files in `backend/src/`
   - Server auto-reloads with nodemon
   - Test with curl or Postman

2. **Frontend changes**:
   - Edit files in `frontend/lib/`
   - Hot reload with `r` in terminal
   - Full restart with `R` if needed

3. **After model changes**:
   ```bash
   cd frontend
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

### Testing

**Backend**:
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run lint                # Check code quality
```

**Frontend**:
```bash
cd frontend
flutter test                # Run tests
flutter analyze             # Static analysis
```

## Common Issues

### Backend Issues
- **MongoDB connection failed**: Check connection string in `.env`, verify IP whitelist in MongoDB Atlas
- **JWT errors**: Ensure `JWT_SECRET` is set in `.env`
- **CORS errors**: Add frontend URL to `CORS_ORIGINS` in `.env`

### Frontend Issues
- **Code generation errors**: Run `flutter pub run build_runner clean` first
- **Import errors**: Run `flutter pub get` and restart IDE
- **API errors**: Verify backend is running and `API_BASE_URL` is correct in `app_config.dart`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions:
- Check the documentation in `docs/` folder
- Review `backend/README.md` for API details
- See `CLAUDE.md` for development patterns
