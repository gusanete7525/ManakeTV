const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  Uuml: "Ü",
  iquest: "¿",
  iexcl: "¡",
  ordm: "º",
  ordf: "ª",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};

function decodeEntity(_entity: string, body: string): string {
  if (body.startsWith("#x") || body.startsWith("#X")) {
    const code = Number.parseInt(body.slice(2), 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _entity;
  }
  if (body.startsWith("#")) {
    const code = Number.parseInt(body.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _entity;
  }
  return NAMED_ENTITIES[body] ?? _entity;
}

export function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  const withoutTags = value.replace(/<[^>]*>/g, " ");
  const decoded = withoutTags.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity);
  return decoded.replace(/\s+/g, " ").trim();
}
