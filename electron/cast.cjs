/**
 * Chromecast discovery + load media URL (legal/public URLs only).
 * Uses chromecast-api when available; degrades gracefully if missing.
 */

/** @typedef {{ id: string, name: string, host?: string }} CastDevice */

/** @type {Map<string, object>} */
const devices = new Map();

/** @type {import('chromecast-api') | null} */
let client = null;
let initError = null;

function ensureClient() {
  if (client || initError) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ChromecastAPI = require("chromecast-api");
    client = new ChromecastAPI();
    client.on("device", (device) => {
      const id = device.host || device.name || String(Math.random());
      devices.set(id, device);
    });
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
  }
}

/**
 * @returns {Promise<CastDevice[]>}
 */
function listDevices() {
  ensureClient();
  if (initError) {
    return Promise.resolve([]);
  }
  // Give mDNS a moment on first call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        [...devices.entries()].map(([id, d]) => ({
          id,
          name: d.friendlyName || d.name || id,
          host: d.host,
        })),
      );
    }, 400);
  });
}

/**
 * @param {{ deviceId: string, mediaUrl: string, title?: string }} opts
 */
function castMedia(opts) {
  ensureClient();
  if (initError) {
    return Promise.resolve({
      ok: false,
      error: `Chromecast library unavailable: ${initError}`,
    });
  }
  const device = devices.get(opts.deviceId);
  if (!device) {
    return Promise.resolve({ ok: false, error: "Device not found — refresh list." });
  }
  return new Promise((resolve) => {
    try {
      device.play(
        opts.mediaUrl,
        { title: opts.title || "FluxTV" },
        (err) => {
          if (err) {
            resolve({
              ok: false,
              error: err.message || String(err),
            });
            return;
          }
          resolve({ ok: true });
        },
      );
    } catch (err) {
      resolve({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

/**
 * @param {string} deviceId
 */
function stopCast(deviceId) {
  const device = devices.get(deviceId);
  if (!device) {
    return Promise.resolve({ ok: false, error: "Device not found" });
  }
  return new Promise((resolve) => {
    try {
      device.stop((err) => {
        if (err) {
          resolve({ ok: false, error: err.message || String(err) });
          return;
        }
        resolve({ ok: true });
      });
    } catch (err) {
      resolve({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

module.exports = { listDevices, castMedia, stopCast };
