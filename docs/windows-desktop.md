# FluxTV Windows desktop (Electron)

Wraps the Vite/React app so it runs as a native Windows window with Chromecast LAN discovery.

## Develop (any OS)

```bash
npm install
npm run dev          # browser at http://127.0.0.1:5173
```

Desktop shell against the Vite dev server (from a second terminal after `npm run dev`):

```bash
FLUXTV_DEV_URL=http://127.0.0.1:5173 npx electron .
```

Or build the web assets and load them from `dist/`:

```bash
npm run electron:dev
```

## Package Windows installers (NSIS + portable)

**On Windows (Prometeo recommended):**

```bat
cd /d F:\ManakeTV
git pull
npm install
npm run pack:win
```

Artifacts land in `release\`:

| File | Purpose |
|------|---------|
| `FluxTV-*-portable.exe` | Portable single-file (no install) |
| `FluxTV-*-win-x64.exe` | NSIS installer |

**Cross-compile from Linux/macOS:** `electron-builder --win` may need Wine and Windows code-signing tooling. Prefer building on Prometeo (`F:\ManakeTV`) if CI cannot produce `.exe`.

```bash
npm run pack:win:dir   # unpacked dir only (debug)
```

## CI / cloud note

This repo’s default cloud agent image is Linux. Windows `.exe` packaging is **documented for Prometeo**; CI may skip `pack:win` unless a Windows runner is added. The Electron sources (`electron/`) and `package.json` `build` block are the source of truth for packaging.

## UI

Desktop window defaults to ~1440×960 to match the Figma **FluxTV — Main** frame tokens (gold `#c4a35a`, deep green-black, Instrument Serif + DM Sans).
