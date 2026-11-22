# FluxTV (ManakeTV)

Personal **timed playlist / TV program** builder: at time *T*, play item *X*.

**Legal path only.** No pirate sites, Digi TV / Movistar Plus credential scraping, paywall bypass, or unauthorized catalogs.

## Product plan

Project store: `/cursor/stores/self/docs/fluxtv-plan.md`

## What works (MVP)

- **Day schedule** — place library items at wall-clock times; overlap warnings; remove slots.
- **Media library** — paste URLs; add local **folder** (File System Access API) or files; search title/URL across library + Barrido proposals.
- **TDT sources** — RTVE public RSS where documented (proxied in `npm run dev`); Antena 3 / Cuatro / Telecinco / La Sexta stubbed (no private API scrape).
- **Barrido** — manual button + scheduled 10:00 / 16:00 / 22:00 **Europe/Madrid**; refresh enabled public feeds; viability probe; dedupe by canonical URL/title; skip dead links; re-check user URLs.
- **On air** — HTML5 player for direct/local media; open-link (+ audio attempt) for page URLs.

## Browser limits (local folders)

| Feature | Support |
|---------|---------|
| Folder picker (`showDirectoryPicker`) | Chromium (Chrome/Edge) on **https** or **localhost** |
| After reload | File handles are **not** restored from `localStorage` — re-pick the folder to play local files again |
| Firefox / Safari | Use **Add local files** fallback (no recursive folder walk) |
| Public RSS in production build | Vite `/proxy/rtve` is **dev-only**; static hosting may hit CORS unless you add the same reverse proxy |

## Stack

Vite + React + TypeScript · `localStorage` (v2 store) · Europe/Madrid sweeps

## Develop

```bash
npm install
npm run dev
```

RTVE public feeds are fetched via `/proxy/rtve/…` (see `vite.config.ts`).

```bash
npm run build
```

## Explicit non-goals

- atomohd.monster or any pirate movie/series index
- Digi / Movistar Plus login or scraping
- Fake catch-up catalogs for commercial TDT without a public feed
