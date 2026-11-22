# Public Spanish TDT / podcast sources

FluxTV only uses **documented public** feeds or user-owned URLs/files.

## RTVE / TVE1

| Kind | Example | Notes |
|------|---------|-------|
| Program audio RSS | `https://www.rtve.es/api/programas/{id}/audios.rss` | Official public RTVE API pattern |
| Temática RSS | `https://www.rtve.es/api/tematicas/10650/noticias.rss` | Public topic feed (Telediario en 4′; old `/rss/…` redirects here) |
| Videos RSS | `…/programas/{id}/videos.rss` | Some programs expose this; not scraped beyond the feed |

Dev proxy: `/proxy/rtve/…` → `https://www.rtve.es/…` (see `vite.config.ts`).

**Not done:** scraping RTVE Play player tokens, DRM streams, or undocumented endpoints.

## Antena 3

- Site news RSS exists (e.g. antena3.com/rss/…).
- **Atresplayer catch-up** is not a free public podcast/catch-up API → **stub in UI**.

## Cuatro / Telecinco / La Sexta

- No documented free public catch-up podcast APIs for full programs suitable for automated replay.
- News/topic RSS may exist; program catch-up sits behind commercial players → **stub**; user pastes URLs they can open.

## Hard refusals

- Pirate indexes (e.g. atomohd.monster)
- Digi TV / Movistar Plus credential login or scraping
- Paywall bypass / unauthorized catalogs
