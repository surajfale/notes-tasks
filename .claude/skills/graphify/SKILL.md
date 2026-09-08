---
name: graphify
description: "Regenerate the notes-tasks codebase dependency graph (docs/CODEBASE_GRAPH.md) by statically scanning imports/requires under backend/src and frontend/src. Use when the module structure has changed materially (new layer, new cross-layer dependency, big refactor) or when a future Claude session needs a fast, accurate map of which layers depend on which and which files are load-bearing. Not a visual/creative diagramming tool — for that use artifact-diagramming instead."
license: MIT
---

# graphify

Keeps `docs/CODEBASE_GRAPH.md` — a machine-generated map of this repo's internal module graph — in sync with the actual code, so a Claude session can orient itself by reading one file instead of re-deriving the dependency structure from scratch.

## What it produces

Running the generator writes `docs/CODEBASE_GRAPH.md` with, for `backend` and `frontend` separately:
- A Mermaid `flowchart` of **layer-to-layer** edges (e.g. `routes -> middleware -> controllers -> models`), derived by resolving every `require()`/`import ... from`/`export ... from`/dynamic `import()` specifier to a real file and bucketing files by their top-level directory under `src/`.
- A **most-depended-on files** list (highest fan-in) per app — the files that touch the most other modules, and therefore the ones worth reading first or being most careful editing.

It does NOT invent an edge between frontend and backend — those two are separate npm projects that only talk over HTTP (`frontend/src/lib/api/client.ts` → `backend/src/routes/`), which is not something a static import scan can see.

## When to run it

- After adding/removing/renaming files in `backend/src/*` or `frontend/src/lib/*` (or `frontend/src/routes/*`) in a way that changes what depends on what.
- When asked to "map the codebase," "build/update the graph," "graphify this project," or similar.
- As a periodic refresh — it's cheap (no dependencies, pure Node, runs in well under a second) and safe to re-run any time; it fully overwrites `docs/CODEBASE_GRAPH.md`.

Do NOT run it for every trivial change (a one-line bugfix, a copy tweak) — it's for structural drift, not a pre-commit hook.

## How to run it

```bash
node .claude/skills/graphify/scripts/generate-graph.js
```

Optionally redirect elsewhere with `--out <path>` (relative to repo root) — but keep the default (`docs/CODEBASE_GRAPH.md`) unless the user asks otherwise, since that's the path referenced from `CLAUDE.md`/`docs/`.

After running, skim the diff (`git diff docs/CODEBASE_GRAPH.md`) before presenting it — a layer edge that newly appears (e.g. `models -> controllers`, which would be backwards for this codebase's MVC convention) is a signal worth calling out to the user, not just silently regenerating over it.

## Extending the generator

The script (`scripts/generate-graph.js`) is a single, dependency-free Node file — no build step. If a new top-level source directory is added (e.g. `backend/src/jobs/`), it's picked up automatically as a new layer with no script changes needed. If a new **app** is added to the repo (a third service beyond backend/frontend), add an entry to the `SCAN_TARGETS` array at the top of the script rather than duplicating the logic.
