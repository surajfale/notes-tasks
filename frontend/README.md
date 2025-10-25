# Frontend - Notes & Tasks

SvelteKit web application for managing notes and tasks.

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 4.2+
- **Language**: TypeScript 5.x
- **State Management**: Svelte stores (writable, derived)
- **HTTP Client**: Native fetch API with custom wrapper
- **Styling**: Tailwind CSS 3.x with Material Design 3
- **Offline Storage**: IndexedDB via idb library
- **Build Tool**: Vite (built into SvelteKit)
- **Adapter**: @sveltejs/adapter-static for Netlify

## Getting Started

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL
```

### Run Development Server

```bash
npm run dev
```

Runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base components (Button, Input, Modal, etc.)
│   │   ├── notes/        # Note-specific components
│   │   ├── tasks/        # Task-specific components
│   │   ├── lists/        # List-specific components
│   │   └── sync/         # Offline sync components
│   ├── repositories/     # API communication layer
│   ├── stores/           # Svelte stores for state management
│   ├── storage/          # IndexedDB and offline storage
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
└── routes/               # SvelteKit file-based routing
    ├── +layout.svelte    # Root layout with sidebar
    ├── +page.svelte      # Home page
    ├── login/            # Login page
    ├── register/         # Registration page
    ├── notes/            # Notes pages
    ├── tasks/            # Tasks pages
    ├── lists/            # Lists management
    └── settings/         # Settings page
```

## Key Features

- ✅ JWT Authentication with secure token storage
- ✅ Notes with tags, search, and archive
- ✅ Tasks with priorities, due dates, and completion tracking
- ✅ Lists for organizing notes and tasks
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Light/dark mode with customizable accent colors
- ✅ Offline support with IndexedDB
- ✅ Automatic sync when connection restored
- ✅ Material Design 3 UI components

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run check:watch` - Run type checking in watch mode

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

For production, set `VITE_API_BASE_URL` in Netlify dashboard.

## State Management

Uses Svelte stores for reactive state management:

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

## Repository Pattern

All API calls go through repository classes:

```typescript
interface Repository<T> {
  getAll(filters?: any): Promise<T[]>
  getById(id: string): Promise<T>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}
```

## Offline Support

- All data cached in IndexedDB
- Operations queued when offline
- Automatic sync when connection restored
- Conflict resolution: server wins

## Performance

- Initial load: ~37 KB (gzipped)
- Code splitting by route
- Preloading on navigation hover
- Debounced search (300ms)
- Optimized bundle sizes

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for detailed performance information.

## Responsive Design

- Mobile: < 640px (collapsible sidebar, 1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (persistent sidebar, 3 columns)
- Touch-friendly: 44x44px minimum touch targets

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for responsive design details.

## Deployment

The application is configured for deployment to Netlify with optimized settings for performance and security.

### Quick Deploy

1. Connect repository to Netlify
2. Configure environment variables:
   - `VITE_API_BASE_URL` - Your backend API URL
3. Deploy - Netlify will automatically build and deploy

### Detailed Guide

For comprehensive deployment instructions, configuration details, troubleshooting, and optimization tips, see:
**[../docs/NETLIFY_DEPLOYMENT.md](../docs/NETLIFY_DEPLOYMENT.md)**

### Configuration Features

The `netlify.toml` configuration includes:
- Automatic build and deployment
- Precompression (gzip/brotli)
- Security headers (CSP, X-Frame-Options, etc.)
- Optimized caching strategy
- SPA routing support
- Performance optimizations

## Development Tips

- Use `npm run check` for type checking
- Svelte stores are reactive - use `$` prefix to subscribe
- Components auto-reload on save
- Check browser console for errors
- Use Chrome DevTools for debugging

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Svelte Documentation](https://svelte.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Project Architecture](../docs/ARCHITECTURE.md)
- [User Guide](../docs/USAGE.md)
