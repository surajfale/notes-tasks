---
inclusion: always
---

# Project Structure & Conventions

## Repository Layout

```
.
├── backend/                # Node.js REST API
├── frontend/               # SvelteKit Web application
├── docs/                   # All project documentation
├── .kiro/                  # Kiro AI assistant configuration
├── netlify.toml            # Netlify deployment config
├── start-dev.ps1           # Windows dev startup script
└── README.md               # Main project documentation
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
├── src/
│   ├── lib/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/               # Base UI components (Button, Input, Modal, etc.)
│   │   │   ├── notes/            # Note-specific components
│   │   │   ├── tasks/            # Task-specific components
│   │   │   ├── lists/            # List-specific components
│   │   │   └── sync/             # Sync status indicators
│   │   ├── repositories/         # API client wrappers
│   │   │   ├── auth.repository.ts
│   │   │   ├── notes.repository.ts
│   │   │   ├── tasks.repository.ts
│   │   │   └── lists.repository.ts
│   │   ├── stores/               # Svelte stores for state management
│   │   │   ├── auth.ts           # Authentication state
│   │   │   ├── notes.ts          # Notes state
│   │   │   ├── tasks.ts          # Tasks state
│   │   │   ├── lists.ts          # Lists state
│   │   │   ├── theme.ts          # Theme state
│   │   │   └── syncStatus.ts     # Sync status state
│   │   ├── storage/              # IndexedDB and offline sync
│   │   │   ├── offline.ts        # Offline storage operations
│   │   │   └── sync.ts           # Sync queue management
│   │   ├── types/                # TypeScript type definitions
│   │   │   ├── auth.ts
│   │   │   ├── note.ts
│   │   │   ├── task.ts
│   │   │   ├── list.ts
│   │   │   └── error.ts
│   │   └── utils/                # Utility functions
│   │       ├── validation.ts     # Input validation
│   │       ├── date.ts           # Date formatting
│   │       └── debounce.ts       # Debounce utilities
│   ├── routes/                   # SvelteKit file-based routing
│   │   ├── +layout.svelte        # Root layout with sidebar
│   │   ├── +layout.ts            # Layout load function
│   │   ├── +page.svelte          # Home page
│   │   ├── login/
│   │   │   └── +page.svelte      # Login page
│   │   ├── register/
│   │   │   └── +page.svelte      # Register page
│   │   ├── notes/
│   │   │   ├── +page.svelte      # Notes list
│   │   │   ├── +page.ts          # Notes page load
│   │   │   ├── new/
│   │   │   │   └── +page.svelte  # Create note
│   │   │   └── [id]/
│   │   │       ├── +page.svelte  # Edit note
│   │   │       └── +page.ts      # Note detail load
│   │   ├── tasks/
│   │   │   ├── +page.svelte      # Tasks list
│   │   │   ├── +page.ts          # Tasks page load
│   │   │   ├── new/
│   │   │   │   └── +page.svelte  # Create task
│   │   │   └── [id]/
│   │   │       ├── +page.svelte  # Edit task
│   │   │       └── +page.ts      # Task detail load
│   │   ├── lists/
│   │   │   ├── +page.svelte      # Lists management
│   │   │   └── +page.ts          # Lists page load
│   │   └── settings/
│   │       └── +page.svelte      # Settings page
│   ├── app.css                   # Global styles (Tailwind)
│   ├── app.html                  # HTML template
│   └── hooks.client.ts           # Client-side hooks
├── static/                       # Static assets
├── package.json                  # Dependencies
├── svelte.config.js              # SvelteKit configuration
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── PERFORMANCE.md                # Performance optimization guide
└── RESPONSIVE_DESIGN.md          # Responsive design guide
```

## Documentation Organization

All documentation is centralized in the `docs/` folder:

- **ARCHITECTURE.md** - System architecture, data flow, security model
- **DEPLOYMENT.md** - Railway + Netlify deployment guide
- **MONGODB_SETUP.md** - MongoDB Atlas setup guide

Frontend-specific documentation:
- **frontend/PERFORMANCE.md** - Performance optimization guide
- **frontend/RESPONSIVE_DESIGN.md** - Responsive design patterns
- **frontend/BUNDLE_ANALYSIS.md** - Bundle size analysis

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

- **State Management**: Use Svelte stores (writable, derived, readable)
- **Type Safety**: Use TypeScript for all code
- **Repository Pattern**: All API calls go through repository classes
- **Component Structure**: Keep components small and focused
- **Styling**: Use Tailwind CSS utility classes
- **Reactivity**: Leverage Svelte's reactive declarations ($:)
- **File Naming**: Use kebab-case for files (e.g., `note-card.svelte`, `auth.repository.ts`)
- **Component Naming**: Use PascalCase for component files (e.g., `NoteCard.svelte`)
- **Store Naming**: Use camelCase with 'Store' suffix (e.g., `authStore`, `notesStore`)

## File Naming Conventions

- **Backend**: camelCase for files (e.g., `authController.js`, `userModel.js`)
- **Frontend Components**: PascalCase (e.g., `NoteCard.svelte`, `TaskEditor.svelte`)
- **Frontend Utilities**: kebab-case (e.g., `date-utils.ts`, `validation.ts`)
- **Frontend Stores**: camelCase (e.g., `auth.ts`, `notes.ts`)
- **Frontend Types**: kebab-case (e.g., `note.ts`, `task.ts`)

## Environment Configuration

- **Backend**: `.env` file (never commit, use `.env.example` as template)
- **Frontend**: Environment variables in `.env` (API_BASE_URL)
- **Production**: Environment variables set in Railway/Netlify dashboards

## SvelteKit Routing

- **File-based routing**: Files in `src/routes/` become pages
- **+page.svelte**: Page component
- **+page.ts**: Page load function (runs before page renders)
- **+layout.svelte**: Layout component (wraps pages)
- **+layout.ts**: Layout load function
- **[id]**: Dynamic route parameter
- **Navigation**: Use `goto()` from `$app/navigation`
- **Links**: Use `<a href="/path">` for client-side navigation

## State Management Patterns

### Svelte Stores

```typescript
// Create a writable store
import { writable } from 'svelte/store';
export const myStore = writable(initialValue);

// Subscribe in components
$: value = $myStore;

// Update store
myStore.set(newValue);
myStore.update(current => ({ ...current, field: value }));
```

### Repository Pattern

```typescript
// Repository handles all API calls
export class NotesRepository {
  async getAll(filters?: NoteFilters): Promise<Note[]> {
    // API call logic
  }
  
  async create(note: CreateNoteDto): Promise<Note> {
    // API call logic
  }
}

// Store uses repository
export const notesStore = createNotesStore();
```

## Performance Best Practices

- **Code Splitting**: Automatic with SvelteKit routes
- **Lazy Loading**: Use dynamic imports for large components
- **Debouncing**: Use debounce utility for search inputs (300ms)
- **Caching**: IndexedDB for offline data
- **Optimization**: Vite handles minification and tree-shaking
- **Preloading**: Use `data-sveltekit-preload-data="hover"` on links
