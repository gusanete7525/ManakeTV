# FluxTV (ManakeTV)

Personal **timed playlist / TV program** builder: at time *T*, play item *X*.

**Legal path only.** No pirate sites, Digi TV / Movistar Plus credential scraping, paywall bypass, or unauthorized catalogs.

## Product plan

Project store: `/cursor/stores/self/docs/fluxtv-plan.md`

## What works (MVP)

- **Day schedule** — place library items at wall-clock times; overlap warnings; remove slots.
- **Media library** — paste URLs; add local **folder** (File System Access API) or files; search title/URL across library + Barrido proposals.
- **TDT / radio sources** — RTVE + Spanish radio public RSS where documented (proxied in `npm run dev`); commercial TV catch-up stubbed (no private API scrape).
- **Barrido** — manual button + scheduled 10:00 / 16:00 / 22:00 **Europe/Madrid** + ~5‑min interval refresh; viability probe; dedupe; skip dead links.
- **On air** — HTML5 player for direct/local media; open-link (+ audio attempt) for page URLs.
- **Audio output** — pick playback device via `setSinkId` / `selectAudioOutput` (Chromium / Electron).
- **Cast to TV** — Chromecast LAN discovery in the desktop app; Miracast / Win+K as OS fallback. See [docs/cast-and-audio.md](docs/cast-and-audio.md).
- **Windows app** — Electron + electron-builder (NSIS + portable). See [docs/windows-desktop.md](docs/windows-desktop.md).

## UI

Podcast-app browsing pattern (dense episode lists, bold condensed program titles, dark Shark surfaces, Chateau-green accent + live red on-air cue) — inspired by public Spanish radio/podcast apps, **without** copying trademarks or logos. Fonts: **Barlow Condensed** + **Manrope**. Figma: [FluxTV UI](https://www.figma.com/design/y2EWN3kBvXYMH6CL3h4xl4).

## Browser limits (local folders)

| Feature | Support |
|---------|---------|
| Folder picker (`showDirectoryPicker`) | Chromium (Chrome/Edge) on **https** or **localhost** |
| After reload | File handles are **not** restored from `localStorage` — re-pick the folder to play local files again |
| Firefox / Safari | Use **Add local files** fallback (no recursive folder walk) |
| Public RSS in production build | Vite `/proxy/*` is **dev-only**; static hosting may hit CORS unless you add the same reverse proxy |
| Audio sink / Chromecast list | Best in Chromium or FluxTV desktop |

## Stack

Vite + React + TypeScript · Electron (optional desktop) · `localStorage` (v2 store) · Europe/Madrid sweeps

## Develop

```bash
npm install
npm run dev
```

Public feeds are fetched via `/proxy/…` (see `vite.config.ts`).

```bash
npm run build
npm run lint
```

### Windows desktop

```bash
# After Vite is serving, or use electron:dev (loads dist/)
FLUXTV_DEV_URL=http://127.0.0.1:5173 npx electron .
npm run pack:win   # on Windows / Prometeo → release/*.exe
```

Prometeo path: `F:\ManakeTV` — see [docs/windows-desktop.md](docs/windows-desktop.md).

## Explicit non-goals

- atomohd.monster or any pirate movie/series index
- Digi / Movistar Plus login or scraping
- Fake catch-up catalogs for commercial TDT without a public feed
- Cloud DRM bypass for casting
