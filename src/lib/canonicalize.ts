/** Normalize URL/title for deduplication across feeds. */

export function canonicalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    // Drop common tracking params
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    for (const key of drop) u.searchParams.delete(key);
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname}${path}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function canonicalizeTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function mediaCanonicalKey(opts: {
  url?: string;
  title: string;
}): string {
  if (opts.url) return `url:${canonicalizeUrl(opts.url)}`;
  return `title:${canonicalizeTitle(opts.title)}`;
}
