# Design Document: Flutter to SvelteKit Migration

## Overview

This document outlines the technical design for migrating the Notes & Tasks web application from Flutter Web to SvelteKit. The migration maintains full feature parity while improving web performance, developer experience, and leveraging web-native capabilities.

### Goals
- Maintain 100% feature parity with existing Flutter application
- Improve initial load time and overall performance
- Enhance developer experience with modern web tooling
- Leverage SvelteKit's SSG capabilities for better SEO potential
- Maintain compatibility with existing backend API (no changes required)

### Non-Goals
- Backend API modifications
- Database schema changes
- New features beyond existing functionality
- Mobile native applications

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            SvelteKit Application                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │     UI      │  │   Svelte    │  │  IndexedDB   │  │  │
│  │  │ (Components)│◄─┤   Stores    │  │  (Offline)   │  │  │
│  │  └─────────────┘  │  (State)    │  └──────────────┘  │  │
│  │         ▲         └─────────────┘         ▲          │  │
│  │         │                │                 │          │  │
│  │         │                ▼                 │          │  │
│  │         │      ┌─────────────────┐         │          │  │
│  │         └──────┤  Repositories   │─────────┘          │  │
│  │                └─────────────────┘                    │  │
│  │                         │                             │  │
│  │                         ▼                             │  │
│  │                ┌─────────────────┐                    │  │
│  │                │   Fetch API     │                    │  │
│  │                │  (JWT Headers)  │                    │  │
│  │                └─────────────────┘                    │  │
│  └───────────────────────┬───────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     REST API                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │  Routes  │─▶│Controllers│─▶│   Middleware     │   │  │
│  │  └──────────┘  └──────────┘  │ (Auth, Validate) │   │  │
│  │                               └──────────────────┘   │  │
│  └───────────────────────┬───────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  MongoDB Atlas  │
                    │   (Database)    │
                    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: SvelteKit 2.x with Svelte 4.2+
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x with JIT mode
- **State Management**: Svelte stores (writable, derived, readable)
- **HTTP Client**: Native Fetch API with custom wrapper
- **Offline Storage**: IndexedDB via idb library (8.0+)
- **Build Tool**: Vite 5.0+ (integrated with SvelteKit)
- **Adapter**: @sveltejs/adapter-static for Netlify deployment

#### Backend (Unchanged)
- Node.js 18+ with Express.js
- MongoDB Atlas with Mongoose
- JWT authentication

## Components and Interfaces

### Directory Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/              # Base UI components
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── LoadingOverlay.svelte
│   │   │   │   ├── ErrorMessage.svelte
│   │   │   │   └── index.ts
│   │   │   ├── notes/           # Note-specific components
│   │   │   │   ├── NoteCard.svelte
│   │   │   │   └── NoteEditor.svelte
│   │   │   ├── tasks/           # Task-specific components
│   │   │   │   ├── TaskCard.svelte
│   │   │   │   ├── TaskEditor.svelte
│   │   │   │   └── TaskList.svelte
│   │   │   ├── lists/           # List-specific components
│   │   │   │   ├── ListCard.svelte
│   │   │   │   ├── ListSelector.svelte
│   │   │   │   └── ListCreationModal.svelte
│   │   │   └── sync/            # Sync status components
│   │   │       ├── OfflineIndicator.svelte
│   │   │       └── SyncStatusIndicator.svelte
│   │   ├── repositories/        # API communication layer
│   │   │   ├── auth.repository.ts
│   │   │   ├── notes.repository.ts
│   │   │   ├── tasks.repository.ts
│   │   │   └── lists.repository.ts
│   │   ├── stores/              # Svelte stores
│   │   │   ├── auth.ts
│   │   │   ├── notes.ts
│   │   │   ├── tasks.ts
│   │   │   ├── lists.ts
│   │   │   ├── theme.ts
│   │   │   └── syncStatus.ts
│   │   ├── storage/             # Offline storage
│   │   │   ├── offline.ts       # IndexedDB operations
│   │   │   └── sync.ts          # Sync queue management
│   │   ├── types/               # TypeScript types
│   │   │   ├── auth.ts
│   │   │   ├── note.ts
│   │   │   ├── task.ts
│   │   │   ├── list.ts
│   │   │   └── error.ts
│   │   └── utils/               # Utility functions
│   │       ├── validation.ts
│   │       ├── date.ts
│   │       └── debounce.ts
│   ├── routes/                  # SvelteKit routes
│   │   ├── +layout.svelte       # Root layout with sidebar
│   │   ├── +layout.ts           # Layout load function
│   │   ├── +page.svelte         # Home page
│   │   ├── login/
│   │   │   └── +page.svelte
│   │   ├── register/
│   │   │   └── +page.svelte
│   │   ├── notes/
│   │   │   ├── +page.svelte     # Notes list
│   │   │   ├── +page.ts         # Notes page load
│   │   │   ├── new/
│   │   │   │   └── +page.svelte
│   │   │   └── [id]/
│   │   │       ├── +page.svelte
│   │   │       └── +page.ts
│   │   ├── tasks/
│   │   │   ├── +page.svelte     # Tasks list
│   │   │   ├── +page.ts
│   │   │   ├── new/
│   │   │   │   └── +page.svelte
│   │   │   └── [id]/
│   │   │       ├── +page.svelte
│   │   │       └── +page.ts
│   │   ├── lists/
│   │   │   ├── +page.svelte
│   │   │   └── +page.ts
│   │   └── settings/
│   │       └── +page.svelte
│   ├── app.css                  # Global styles (Tailwind)
│   ├── app.html                 # HTML template
│   └── hooks.client.ts          # Client-side hooks
├── static/                      # Static assets
├── svelte.config.js             # SvelteKit config
├── vite.config.ts               # Vite config
├── tailwind.config.js           # Tailwind config
└── tsconfig.json                # TypeScript config
```

### Core Components

#### 1. Authentication System

**Auth Store** (`lib/stores/auth.ts`)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Store methods
- login(username, password)
- register(userData)
- logout()
- checkAuth()
- updateUser(userData)
```

**Auth Repository** (`lib/repositories/auth.repository.ts`)
```typescript
class AuthRepository {
  async login(username: string, password: string): Promise<AuthResponse>
  async register(data: RegisterData): Promise<AuthResponse>
  async getCurrentUser(): Promise<User>
  async changePassword(oldPassword: string, newPassword: string): Promise<void>
  async deleteAccount(): Promise<void>
}
```

#### 2. State Management Pattern

**Store Structure**
```typescript
// Writable store with loading and error states
interface StoreState<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
}

// Store methods
- loadAll(filters?)
- create(item)
- update(id, item)
- delete(id)
- reset()
```

#### 3. Repository Pattern

**Base Repository Interface**
```typescript
interface Repository<T> {
  getAll(filters?: any): Promise<T[]>
  getById(id: string): Promise<T>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}
```

**HTTP Client Wrapper**
```typescript
// Automatic JWT token injection
// Error handling and transformation
// Request/response interceptors
```

#### 4. Offline Storage System

**IndexedDB Schema**
```typescript
// Database: notes-tasks-db
// Stores:
- notes: { id, data, status, timestamp }
- tasks: { id, data, status, timestamp }
- lists: { id, data, status, timestamp }
- syncQueue: { id, operation, entity, data, timestamp }

// Status: 'synced' | 'pending' | 'error'
```

**Sync Strategy**
1. All operations write to IndexedDB first
2. Operations queued for sync
3. Background sync when online
4. Conflict resolution: server wins
5. Retry failed operations with exponential backoff

## Data Models

### TypeScript Interfaces

```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface Note {
  _id: string;
  userId: string;
  title: string;
  body: string;
  tags: string[];
  listId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 1 | 2 | 3;
  isCompleted: boolean;
  listId?: string;
  createdAt: string;
  updatedAt: string;
}

interface List {
  _id: string;
  userId: string;
  title: string;
  color: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
}

interface Theme {
  mode: 'light' | 'dark';
  accentColor: string;
}
```

## Error Handling

### Error Types

```typescript
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

interface ValidationError {
  field: string;
  message: string;
}
```

### Error Handling Strategy

1. **Network Errors**: Display offline indicator, queue operations
2. **Authentication Errors**: Redirect to login, clear token
3. **Validation Errors**: Display field-specific messages
4. **Server Errors**: Display user-friendly message with retry option
5. **Client Errors**: Log to console, display generic error message

### Error Boundaries

- Global error boundary in root layout
- Component-level error handling for critical sections
- Graceful degradation for non-critical features

## Testing Strategy

### Unit Tests
- Utility functions (validation, date formatting, debounce)
- Store logic (state updates, side effects)
- Repository methods (API calls, error handling)

### Component Tests
- UI component rendering
- User interactions
- Props and events
- Accessibility

### Integration Tests
- Authentication flow
- CRUD operations
- Offline sync
- Navigation

### E2E Tests (Optional)
- Complete user workflows
- Cross-browser testing
- Performance benchmarks

## Performance Optimizations

### Code Splitting
- Route-based splitting (automatic with SvelteKit)
- Dynamic imports for large components
- Lazy loading for non-critical features

### Bundle Optimization
- Tree-shaking unused code
- Minification with esbuild
- Compression (gzip/brotli)
- Content-based hashing for caching

### Runtime Optimization
- Debounced search inputs (300ms)
- Virtual scrolling for large lists (if needed)
- Memoization of expensive computations
- Preloading navigation links on hover

### Asset Optimization
- Tailwind CSS purging
- SVG optimization
- Font subsetting (if custom fonts used)

## Security Considerations

### Authentication
- JWT tokens stored in localStorage
- Tokens included in Authorization header
- Automatic token refresh (if implemented)
- Secure logout (clear all local data)

### Data Protection
- HTTPS only in production
- CORS properly configured
- No sensitive data in URLs
- Input validation on client and server

### XSS Prevention
- Svelte's automatic escaping
- Sanitize user-generated content
- Content Security Policy headers

## Deployment Strategy

### Build Process
1. Run TypeScript type checking
2. Build with Vite (via SvelteKit)
3. Generate static files
4. Precompress assets (gzip/brotli)

### Netlify Configuration
```toml
[build]
  base = "frontend"
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- Set in Netlify dashboard for production
- Set in `.env` for local development

## Migration Approach

### Phase 1: Setup and Infrastructure
1. Initialize SvelteKit project
2. Configure TypeScript, Tailwind, and tooling
3. Set up project structure
4. Create base UI components

### Phase 2: Core Features
1. Authentication system
2. State management stores
3. Repository layer
4. API integration

### Phase 3: Feature Implementation
1. Notes CRUD
2. Tasks CRUD
3. Lists management
4. Settings page

### Phase 4: Advanced Features
1. Offline support with IndexedDB
2. Sync queue implementation
3. Theme customization
4. Responsive design refinements

### Phase 5: Optimization and Testing
1. Performance optimization
2. Bundle size optimization
3. Testing
4. Documentation

### Phase 6: Deployment
1. Configure Netlify
2. Set environment variables
3. Deploy and verify
4. Monitor performance

## Rollback Plan

If critical issues arise:
1. Revert Netlify deployment to previous Flutter build
2. Investigate and fix issues
3. Redeploy when resolved

## Success Metrics

- Initial load time < 1.8s (FCP)
- Time to Interactive < 3.8s (TTI)
- Bundle size < 100KB (gzipped, initial)
- Lighthouse score > 90
- Zero regression in functionality
- Improved developer experience (faster builds, better DX)
