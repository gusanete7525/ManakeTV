/**
 * Cast / stream-to-TV helpers.
 * Electron: Chromecast discovery via main-process chromecast-api.
 * Browser: Remote Playback API when the media element supports it.
 * Miracast / Windows “Proyectar” is documented as an OS fallback (not automated).
 */

export type CastDevice = {
  id: string;
  name: string;
  host?: string;
};

export type CastResult = {
  ok: boolean;
  error?: string;
  hint?: string;
};

type FluxTvBridge = {
  listCastDevices: () => Promise<CastDevice[]>;
  castMedia: (opts: {
    deviceId: string;
    mediaUrl: string;
    title?: string;
  }) => Promise<CastResult>;
  stopCast: (deviceId: string) => Promise<CastResult>;
  isElectron: boolean;
};

declare global {
  interface Window {
    fluxtv?: FluxTvBridge;
  }
}

export function isElectronShell(): boolean {
  return Boolean(window.fluxtv?.isElectron);
}

export function miracastHint(): string {
  return (
    "Miracast / Windows “Proyectar a este equipo” or Win+K is an OS-level " +
    "fallback: mirror this desktop to a compatible TV. FluxTV does not " +
    "bypass DRM — only cast media URLs you are allowed to play."
  );
}

export async function listCastDevices(): Promise<CastDevice[]> {
  if (window.fluxtv?.listCastDevices) {
    return window.fluxtv.listCastDevices();
  }
  return [];
}

export function canCastMediaUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("blob:") || url.startsWith("file:")) return false;
  return /^https?:\/\//i.test(url);
}

export async function castToDevice(
  deviceId: string,
  mediaUrl: string,
  title?: string,
): Promise<CastResult> {
  if (!canCastMediaUrl(mediaUrl)) {
    return {
      ok: false,
      error: "Cast needs a network http(s) media URL (not a local blob/file).",
      hint: miracastHint(),
    };
  }
  if (window.fluxtv?.castMedia) {
    return window.fluxtv.castMedia({ deviceId, mediaUrl, title });
  }
  return {
    ok: false,
    error: "Chromecast discovery needs the FluxTV desktop app (Electron).",
    hint: miracastHint(),
  };
}

export async function stopCast(deviceId: string): Promise<CastResult> {
  if (window.fluxtv?.stopCast) {
    return window.fluxtv.stopCast(deviceId);
  }
  return { ok: false, error: "Not in Electron shell" };
}

/** Try browser Remote Playback API on an HTMLMediaElement (Chrome/Edge). */
export async function promptRemotePlayback(
  el: HTMLMediaElement | null,
): Promise<CastResult> {
  if (!el) return { ok: false, error: "No media element" };
  const remote = (
    el as HTMLMediaElement & {
      remote?: {
        prompt: () => Promise<void>;
        state: string;
      };
    }
  ).remote;
  if (!remote || typeof remote.prompt !== "function") {
    return {
      ok: false,
      error: "Remote Playback API not available here.",
      hint: miracastHint(),
    };
  }
  try {
    await remote.prompt();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      hint: miracastHint(),
    };
  }
}
