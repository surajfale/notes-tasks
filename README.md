# Notes & Tasks Web Application

A production-ready web application for managing notes and tasks with offline capabilities.

## Features

- **User Authentication**: Secure JWT-based authentication with account management
- **AI-Powered Content Enhancement**: Intelligent content improvement with customizable tone styles
- **Email Notifications**: Automated task reminders with configurable timing
- **Notes Management**: Rich text notes with tags, search, and archive
- **Tasks Management**: Task tracking with due dates, priorities, and completion status
- **Lists Organization**: Organize notes and tasks into colored lists
- **Progressive Web App**: Install on mobile devices for native app experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Offline Support**: Full offline functionality with automatic sync
- **Theme Customization**: Light/dark mode with customizable accent colors
- **Material Design 3**: Modern, accessible UI

### AI Enhancement Features
- 🤖 **Smart Content Enhancement**: Improve notes and tasks with AI assistance
- 🎨 **Customizable Tone Styles**: Choose from concise, detailed, professional, or casual tones
- 📝 **Note Enhancement**: Automatically format, organize, and improve note content with markdown
- ✅ **Task Breakdown**: Convert task descriptions into actionable checklist items
- 🔄 **Revert Option**: Easily undo AI changes if needed
- 🚀 **Powered by Ollama Cloud**: Uses advanced language models for intelligent suggestions

### Notification Features
- 📧 **Email Notifications**: Automated task reminders sent to your registered email
- 🔔 **Browser Push Notifications**: Receive push notifications even when the app is closed (works best with PWA)
- ⏰ **Custom Notification Time**: Choose what time you want to receive notifications (e.g., 8:00 AM, 2:00 PM)
- 📅 **Configurable Timing**: Choose same day, 1 day before, or 2 days before notifications
- 🌍 **Timezone Support**: Notifications respect your timezone settings
- 🔗 **Deep Links**: Click email links to go directly to tasks
- 🎨 **Professional Emails**: HTML-formatted emails with task details
- 🔒 **Secure & Reliable**: JWT authentication, retry logic, and duplicate prevention
- ⚙️ **Automated Cron Jobs**: Hourly checks ensure notifications arrive at your chosen time
- 📱 **Multi-Channel**: Choose to receive notifications via email, browser push, or both

### PWA Features
- 📱 Install directly from browser (no app store needed)
- 🎨 Native app appearance with custom splash screen
- ⚡ Offline functionality with service worker caching
- 🎯 App shortcuts for quick actions (New Note, New Task)
- 🌈 Dynamic theme color that adapts to your preferences

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- Joi Validation
- Winston Logging
- Ollama Cloud API (AI Enhancement)

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
# Edit .env with:
# - MongoDB connection string
# - JWT secret
# - Ollama Cloud API credentials (optional, for AI features)
# - Resend API credentials (optional, for email notifications)
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

### Type Checking

The project includes comprehensive TypeScript type checking:

```bash
cd frontend
npm run check
```

All TypeScript errors have been fixed. The check passes with 0 errors and only 3 minor accessibility warnings (intentional design choices for modal dialogs).

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

### Getting Started
- **[docs/USAGE.md](docs/USAGE.md)** - Complete user guide with PWA installation instructions
- **[docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md)** - MongoDB Atlas setup guide

### Architecture & Design
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, PWA, email notifications, cron jobs, performance, and responsive design
- **[docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md)** - Deployment architecture explained (what goes where)

### Deployment
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Step-by-step deployment guide (Railway + Netlify)
- **[docs/NETLIFY_DEPLOYMENT.md](docs/NETLIFY_DEPLOYMENT.md)** - Detailed Netlify deployment instructions

### Development
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend development guide
- **[docs/RECENT_IMPROVEMENTS.md](docs/RECENT_IMPROVEMENTS.md)** - Recent code quality improvements

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete account

### AI Enhancement
- `POST /api/ai/enhance` - Enhance note or task content with AI

### Notifications
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences (email, browser, time, timezone)
- `PUT /api/notifications/push-subscription` - Subscribe to browser push notifications
- `DELETE /api/notifications/push-subscription` - Unsubscribe from push notifications
- `GET /api/notifications/vapid-public-key` - Get VAPID public key for Web Push
- `GET /api/tasks/link/:token` - Handle email deep link

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
npm run check      # TypeScript type checking (0 errors)
npm run build      # Production build
npm test           # Run Vitest tests
```

### Code Quality

The project maintains high code quality standards:
- ✅ **TypeScript**: Full type safety with 0 errors
- ✅ **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
- ✅ **Testing**: Comprehensive unit tests for utilities and components
- ✅ **Linting**: ESLint configured for both frontend and backend

## Deployment

- **Backend**: Railway (Node.js environment)
- **Frontend**: Netlify (static site hosting)
- **Database**: MongoDB Atlas (cloud)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Progressive Web App

### Installation

Install the app on your device for a native app experience:

**Android (Chrome)**
1. Visit the site in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Install"

**iOS (Safari)**
1. Visit the site in Safari
2. Tap Share → "Add to Home Screen"

**Desktop (Chrome/Edge)**
1. Click install icon in address bar
2. Click "Install"

### PWA Features

- **Offline Support**: Works without internet connection
- **Native App Feel**: Standalone window, no browser UI
- **Custom Icon**: Branded icon on home screen
- **Splash Screen**: Shows while loading
- **Dynamic Theme**: Status bar color matches your theme
- **App Shortcuts**: Long-press icon for quick actions (New Note, New Task)
- **Fast Loading**: Cached assets load instantly
- **Auto Updates**: Always get the latest version

### Icon Generation

Icons are generated using Sharp:

```bash
cd frontend
npm run create:base-icon    # Create base 512×512 icon
npm run generate:icons      # Generate all 8 PWA icon sizes
```

All icons are stored in `frontend/static/` and total ~53 KB.

## Performance

- Initial load: ~37 KB (gzipped)
- Code splitting and lazy loading
- Preloading on navigation hover
- Debounced search (300ms)
- IndexedDB caching for offline support
- Service worker caching for PWA

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for performance details.

## Common Issues

### Backend
- **MongoDB connection failed**: Check connection string in `.env`
- **JWT errors**: Ensure `JWT_SECRET` is set in `.env`
- **CORS errors**: Add frontend URL to `CORS_ORIGINS` in `.env`
- **AI enhancement not working**: Verify `OLLAMA_API_KEY` and `OLLAMA_API_URL` are set in `.env`

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
