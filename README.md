# Notes & Tasks Web Application

A production-ready web application for managing notes and tasks with offline capabilities.

## Features

- **User Authentication**: Secure JWT-based authentication with account management
- **Notes Management**: Rich text notes with tags, search, and archive
- **Tasks Management**: Task tracking with due dates, priorities, and completion status
- **Lists Organization**: Organize notes and tasks into colored lists
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Offline Support**: Full offline functionality with automatic sync
- **Theme Customization**: Light/dark mode with customizable accent colors
- **Material Design 3**: Modern, accessible UI

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Joi Validation
- Winston Logging

### Frontend
- SvelteKit with Static Adapter
- TypeScript
- Tailwind CSS
- IndexedDB (Offline Storage)
- Vite (Build Tool)

## Quick Start

### Prerequisites
- Node.js 18+ LTS
- MongoDB Atlas account (free tier available)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret
npm run dev
```

Backend runs at `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Verify Installation

```bash
curl http://localhost:3000/health
```

Expected response: `{"status":"OK",...}`

## Project Structure

```
.
├── backend/                # Node.js REST API
│   ├── src/               # Source code
│   └── README.md          # Backend documentation
│
├── frontend/              # SvelteKit Web Application
│   ├── src/               # Source code
│   └── README.md          # Frontend documentation
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # System architecture & performance
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── MONGODB_SETUP.md   # Database setup
│   └── USAGE.md           # User guide
│
└── README.md              # This file
```

## Documentation

- **[docs/USAGE.md](docs/USAGE.md)** - Complete user guide
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, performance, and responsive design
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide (Railway + Netlify)
- **[docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md)** - MongoDB Atlas setup
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend development guide

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete account

### Resources
- `GET /api/lists` - Get user's lists
- `GET /api/notes` - Get user's notes (with filtering)
- `GET /api/tasks` - Get user's tasks (with filtering)

See [backend/README.md](backend/README.md) for complete API documentation.

## Development

### Making Changes

**Backend**:
- Edit files in `backend/src/`
- Server auto-reloads with nodemon

**Frontend**:
- Edit files in `frontend/src/`
- Vite hot-reloads automatically

### Testing

**Backend**:
```bash
cd backend
npm test
npm run lint
```

**Frontend**:
```bash
cd frontend
npm run check
npm run build
```

## Deployment

- **Backend**: Railway (Node.js environment)
- **Frontend**: Netlify (static site hosting)
- **Database**: MongoDB Atlas (cloud)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Performance

- Initial load: ~37 KB (gzipped)
- Code splitting and lazy loading
- Preloading on navigation hover
- Debounced search (300ms)
- IndexedDB caching for offline support

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for performance details.

## Common Issues

### Backend
- **MongoDB connection failed**: Check connection string in `.env`
- **JWT errors**: Ensure `JWT_SECRET` is set in `.env`
- **CORS errors**: Add frontend URL to `CORS_ORIGINS` in `.env`

### Frontend
- **Build errors**: Run `npm install` and restart dev server
- **Type errors**: Run `npm run check` to see TypeScript errors
- **API errors**: Verify backend is running at `http://localhost:3000`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For help and documentation:
- [docs/USAGE.md](docs/USAGE.md) - User guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical details
- [backend/README.md](backend/README.md) - API documentation
- [frontend/README.md](frontend/README.md) - Frontend guide
