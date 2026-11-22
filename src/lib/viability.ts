export type ViabilityResult = {
  ok: boolean;
  status?: number;
  reason: string;
};

/**
 * Probe a user-added or feed media URL.
 * Uses HEAD, then Range GET fallback. Cross-origin may fail (CORS) —
 * we treat opaque/network CORS failures as "unknown" (not dead) so
 * user URLs are not falsely rejected; feed proposals require clearer signal.
 */
export async function probeUrl(
  url: string,
  opts: { strictCors?: boolean } = {},
): Promise<ViabilityResult> {
  const { strictCors = false } = opts;

  try {
    const head = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      redirect: "follow",
    });
    if (head.ok || head.status === 206) {
      return { ok: true, status: head.status, reason: "HEAD ok" };
    }
    // Some CDNs reject HEAD
    if (head.status === 405 || head.status === 501) {
      return probeRange(url, strictCors);
    }
    if (head.status === 404 || head.status === 410) {
      return { ok: false, status: head.status, reason: `Dead (${head.status})` };
    }
    return probeRange(url, strictCors);
  } catch {
    return probeRange(url, strictCors);
  }
}

async function probeRange(
  url: string,
  strictCors: boolean,
): Promise<ViabilityResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      mode: "cors",
      redirect: "follow",
    });
    if (res.ok || res.status === 206) {
      return { ok: true, status: res.status, reason: "Range GET ok" };
    }
    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: res.status, reason: `Dead (${res.status})` };
    }
    // 401/403: link exists but restricted — not "dead"
    if (res.status === 401 || res.status === 403) {
      return {
        ok: !strictCors,
        status: res.status,
        reason: `Restricted (${res.status})`,
      };
    }
    return {
      ok: false,
      status: res.status,
      reason: `Unreachable (${res.status})`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "network error";
    if (strictCors) {
      return { ok: false, reason: `CORS/network: ${msg}` };
    }
    // User URLs: keep as viable-unknown so CORS doesn't wipe the library
    return { ok: true, reason: `Unverified (CORS/network): ${msg}` };
  }
}

export function looksLikeDirectMedia(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mp3|m4a|wav|m3u8)(\?|$)/.test(path);
  } catch {
    return false;
  }
}
