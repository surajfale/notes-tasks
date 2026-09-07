# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Notes & Tasks is a two-service web app: a SvelteKit frontend and an Express/MongoDB backend, deployed separately (Netlify + Railway). It is offline-first — every mutation goes through IndexedDB before (and independently of) the network — and includes AI content enhancement (Ollama Cloud) and a dual-channel (email + Web Push) task-reminder system driven by cron.

There is no root-level build; `backend/` and `frontend/` are independent npm projects with no shared workspace tooling. Always `cd` into the relevant one first.

## Commands

### Backend (`cd backend`)
```bash
npm install
npm run dev            # nodemon, auto-reload, port 3000
npm start               # production
npm test                 # jest --coverage (no test files currently exist in this package)
npm run lint             # eslint src/**/*.js
npm run lint:fix
node src/scripts/generateVapidKeys.js   # regenerate VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY for Web Push
```

### Frontend (`cd frontend`)
```bash
npm install
npm run dev              # vite dev, port 5173
npm run build            # production static build (adapter-static)
npm run check             # svelte-kit sync && svelte-check — must be 0 errors before shipping
npm test                  # vitest --run
npm run test:watch
npx vitest run src/lib/utils/date.test.ts   # run a single test file
npx vitest run -t "debounce"                # run tests matching a name
```

Tests are colocated with source (`Foo.svelte` + `Foo.test.ts` in the same directory), not in a separate `tests/` tree.

### Full local dev
`.\start-dev.ps1` (Windows) starts both servers. Otherwise run `npm run dev` in both `backend/` and `frontend/` in separate shells. Verify the backend with `curl http://localhost:3000/health`.

### Codebase graph
`docs/CODEBASE_GRAPH.md` is a generated map of internal module dependencies (layer-to-layer Mermaid graph + highest-fan-in files per app). Regenerate it after a structural refactor with `node .claude/skills/graphify/scripts/generate-graph.js` (see the `graphify` skill) — it's not auto-updated.

## Architecture

### User data isolation (the one rule that matters most)
Every collection (`List`, `Note`, `Task`, `NotificationPreference`, ...) is scoped by `userId`. The JWT middleware (`backend/src/middleware/auth.js`) extracts `userId` from the token and attaches it to `req.user`; controllers must filter every query by `req.user.userId` and must never accept `userId` from the request body/params/query. Compound indexes are keyed `userId` + field for this reason. Any new endpoint or query that skips this is a security bug, not a style nit.

### Backend: MVC + service layer (`backend/src/`)
`routes/` → `middleware/` (auth → Joi validation → rate limiter) → `controllers/` (business logic) → `models/` (Mongoose schemas) → longer-lived work lives in `services/`. Two things route outside the normal request path:
- **`server.js`** registers two `node-cron` jobs directly at startup (skipped when `NODE_ENV=test`): an hourly notification scheduler and a weekly notification-log cleanup. Schedules/timezone come from `NOTIFICATION_CRON_SCHEDULE` / `NOTIFICATION_TIMEZONE` env vars.
- **`utils/circuitBreaker.js`** wraps the email (`emailService.js`, via Resend) and push (`pushNotificationService.js`, via `web-push`/VAPID) services so a failing third-party provider degrades instead of cascading.

The notification flow: `notificationScheduler` runs every hour, and for each user with preferences compares the current time (via Luxon, timezone-aware, ±30 min window) against their configured `notificationTime`; matches are handed to `notificationProcessor`, which sends via the enabled channels and records a `NotificationLog` entry to prevent duplicate sends (also tracked on the `Task` document itself via `notificationsSent`).

AI enhancement (`aiController.js` → `ollamaService.js`) is a stateless passthrough to Ollama Cloud (`OLLAMA_API_URL`/`OLLAMA_API_KEY`/`OLLAMA_MODEL`) with a 30s timeout, tone-specific prompt building, and enforced output limits (2000 chars for notes, 20 items × 255 chars for task checklists). It does not persist anything itself — the frontend applies/reverts the result client-side.

### Frontend: repository + store pattern, offline-first (`frontend/src/lib/`)
Data flows one way through layers: **components** → **stores** (`stores/*.ts`, Svelte writables/derived) → **repositories** (`repositories/*.repository.ts`) → **API client** (`api/client.ts`, attaches JWT). Components never call `fetch`/repositories directly bypassing the store layer, and repositories never touch the DOM.

Offline is not a fallback bolted on top — it's the primary write path:
1. A mutation (create/update/delete note/task/list) is written to IndexedDB (`storage/offline.ts`) first, marked `pending`.
2. `storage/sync.ts` (`syncService`) listens for `online`/`offline` browser events and also polls every 30s while online. When online and idle, it drains the pending queue, syncing **lists before notes/tasks** (notes/tasks can reference a `listId`), with per-item exponential backoff + jitter on failure (`RETRY_CONFIG`, max 5 retries).
3. On success each item flips to `synced`; `stores/syncStatus.ts` and the pending-count derived stores drive the UI's offline/pending indicators.

Routing is SvelteKit file-based (`routes/`), built with `adapter-static` — meaning the frontend ships as a static site (Netlify) with all state/auth handled client-side; there is no SvelteKit server runtime in production. The service worker (`static/service-worker.js`) does network-first page caching for PWA/offline shell purposes only — it does not intercept `/api/*` calls, which are handled entirely by the offline-sync layer described above.

### Cross-cutting
- Frontend talks to the backend only via `VITE_`-style env-configured `API_BASE_URL`; CORS on the backend is origin-allowlisted via `CORS_ORIGINS` (dev mode auto-allows any `localhost`/`127.0.0.1` origin).
- Rate limiting is per-concern, not global: separate limiters/env vars exist for general API, auth, AI, deep-link, and public endpoints (see `backend/.env.example`) — when adding a new sensitive endpoint, check `middleware/rateLimiters.js` for the right bucket rather than reusing the general one.
- Deep links (`deepLinkController.js`/`deepLinkAuth.js`) let a notification email link directly into a task without a full login, using a signed token (`DEEP_LINK_SECRET`) rather than the normal JWT — don't conflate the two auth mechanisms.
