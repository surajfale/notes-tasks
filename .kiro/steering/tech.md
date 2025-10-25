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

- **Framework**: SvelteKit with Static Adapter
- **Language**: TypeScript
- **Styling**: Tailwind CSS with JIT mode
- **HTTP Client**: Fetch API with custom wrappers
- **State Management**: Svelte stores (writable, derived)
- **Offline Storage**: IndexedDB via idb library
- **Build Tool**: Vite 5.0+

### Frontend Structure
```
frontend/src/
├── lib/
│   ├── components/  # Reusable UI components
│   ├── repositories/# API client wrappers
│   ├── stores/      # Svelte stores for state
│   ├── storage/     # IndexedDB and offline sync
│   ├── types/       # TypeScript type definitions
│   └── utils/       # Utility functions
├── routes/          # SvelteKit file-based routing
│   ├── +layout.svelte    # Root layout
│   ├── +page.svelte      # Home page
│   ├── login/            # Login page
│   ├── register/         # Register page
│   ├── notes/            # Notes pages
│   ├── tasks/            # Tasks pages
│   ├── lists/            # Lists page
│   └── settings/         # Settings page
└── app.html         # HTML template
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
npm install                  # Install dependencies
npm run dev                  # Start dev server (Vite, port 5173)
npm run build                # Production build
npm run preview              # Preview production build
npm run check                # Type checking
npm run check:watch          # Type checking in watch mode
```

### Quick Start (Windows)
```powershell
.\start-dev.ps1  # Starts both backend and frontend
```

## Deployment

- **Backend**: Railway (Node.js environment, auto-deploy from GitHub)
- **Frontend**: Netlify (static site hosting, auto-deploy from GitHub)
- **Database**: MongoDB Atlas (cloud-hosted, M0 free tier or higher)

## Build System

- **Backend**: No build step, runs directly with Node.js
- **Frontend**: Vite builds optimized static site with code splitting
- **Optimization**: Automatic tree-shaking, minification, and compression
