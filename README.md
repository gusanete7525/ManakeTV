# FluxTV (ManakeTV)

Personal **timed playlist / TV program** builder: at time *T*, play item *X*.

## Product plan

Full thesis, MVP scope, legal source model, scheduling UX, data model, stack, and roadmap:

**Project store:** `/cursor/stores/self/docs/fluxtv-plan.md` (FluxTV Project docs)

Hard rule: **no scrapers, pirate aggregators, or unauthorized access**. Sources are user-pasted URLs, local files you own, or (later) official public/legal APIs only (e.g. RTVE Play if documented).

## Stack

- Vite + React + TypeScript
- Browser `localStorage` for MVP persistence
- Day timeline + media library as the core UI (not a generic dashboard)

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
```

## This scaffold (Phase 0)

- Day timeline chrome with “now” marker
- Media library form (`url` / local file name)
- Place slot by start time + duration
- Persistence to `localStorage`

Not included: fake catalogs, official platform adapters, drag-resize timeline (see plan Phases 1–3).
