# Cast to TV & audio output

Legal path only: FluxTV casts **media URLs you already have permission to play**. No DRM bypass, Digi/Movistar scraping, or pirate catalogs.

## Audio output

On the **On air** panel:

1. Open **Audio output** and pick a speaker/headset from the list (Chromium / Edge / FluxTV desktop).
2. Or click **Pick device…** when the browser exposes `navigator.mediaDevices.selectAudioOutput` (user gesture).
3. Preference is saved in local settings (`preferredAudioSinkId`) and applied via `HTMLMediaElement.setSinkId`.

**Desktop (Electron):** same Chromium APIs; sink labels usually appear after a one-time mic permission prompt used only to unlock device names.

**Unsupported browsers:** the control stays on “System default”.

## Cast / stream to TV over Wi‑Fi

### Preferred: Chromecast (LAN)

1. Run **FluxTV desktop** (`npm run electron:dev` or a Windows build) so mDNS discovery works.
2. PC and Chromecast/Google TV must be on the **same Wi‑Fi**.
3. In **On air → Cast to TV**, click **Find devices**, select a device, then **Cast on-air**.
4. The current on-air item must be a **direct `http(s)` media URL** (e.g. public podcast enclosure). Local `blob:` / file picks cannot be cast without a network-reachable URL — use Miracast instead for those.

Browser-only: FluxTV tries the **Remote Playback API** (`media.remote.prompt()`). Full LAN Chromecast discovery is Electron-only.

### OS fallback: Miracast / Windows “Proyectar”

FluxTV does **not** automate Miracast. On Windows:

1. `Win + K` (Connect) or **Settings → System → Projecting to this PC** / Cast.
2. Mirror or extend to a Miracast-capable TV/dongle.
3. Play FluxTV on that mirrored display.

This mirrors the whole desktop (or a window, depending on OS UI) — useful for local files the Chromecast path cannot reach.
