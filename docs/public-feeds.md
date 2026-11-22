# Public Spanish TDT / podcast sources

FluxTV only uses **documented public** feeds or user-owned URLs/files.

Barrido refreshes **enabled** `public_rss` feeds about every **5 minutes** while the app is open, and still runs the thrice-daily 10:00 / 16:00 / 22:00 Europe/Madrid sweeps. Each sweep reads the newest ~25 items per feed (feeds often list hundreds of episodes).

**Not done / refused:** Digi TV or Movistar Plus login, download-quota workarounds, scrapers, pirate catalogs.

## RTVE / TVE1 / RNE

| Kind | Example | Notes |
|------|---------|-------|
| Program audio RSS | `https://www.rtve.es/api/programas/{id}/audios.rss` | Official public RTVE API pattern |
| Temática RSS | `https://www.rtve.es/api/tematicas/10650/noticias.rss` | Public topic feed (Telediario en 4′; old `/rss/…` redirects here) |
| Videos RSS | `…/programas/{id}/videos.rss` | Some programs expose this; not scraped beyond the feed |

Configured RNE examples: Las mañanas de RNE (`119312`), 24 horas (`1871`), Documentos RNE (`1938`), No es un día cualquiera (`2054`), Radiogaceta (`2071`). Apple Podcasts `feedUrl` often points at the same RTVE audios.rss (or `api.rtve.es` adapter equivalent).

Dev proxy: `/proxy/rtve/…` → `https://www.rtve.es/…` (see `vite.config.ts`).

**Not done:** scraping RTVE Play player tokens, DRM streams, or undocumented endpoints.

## Onda Cero (Atresmedia Radio)

Onda Cero publishes **official public podcast RSS** per program on `ondacero.es`. The same URLs are listed as `feedUrl` in Apple Podcasts (e.g. Más de uno id `983656582`). Pattern:

`https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_{PROGRAM}_AOD_P/origin/fastly`

| Program | Feed |
|---------|------|
| Más de uno | `…/ATRESMEDIA_MAS_DE_UNO_AOD_P/origin/fastly` |
| La Brújula | `…/ATRESMEDIA_LA_BRUJULA_AOD_P/origin/fastly` |
| Julia en la onda | `…/ATRESMEDIA_JULIA_EN_LA_ONDA_AOD_P/origin/fastly` |
| Las noticias en Onda Cero | `…/ATRESMEDIA_LAS_NOTICIAS_EN_ONDA_CERO_AOD_P/origin/fastly` |
| Por fin | `…/ATRESMEDIA_POR_FIN_AOD_P/origin/fastly` |
| Noticias mediodía | `…/ATRESMEDIA_NOTICIAS_MEDIODIA_AOD_P/origin/fastly` |

Dev proxy: `/proxy/ondacero/…` → `https://www.ondacero.es/…`.

## Cadena SER (Prisa PlaySER)

Official public podcast RSS (also used as Apple Podcasts `feedUrl` family):

`https://fapi-top.prisasd.com/podcast/playser/{slug}/itunestfp/podcast.xml`

| Program | Slug |
|---------|------|
| Hoy por Hoy | `hoy_por_hoy` |
| Hora 14 | `hora_14` |
| Hora 25 | `hora_25` |
| Las noticias de la SER | `boletines` |

Dev proxy: `/proxy/ser/…` → `https://fapi-top.prisasd.com/…`. Alternate v2 Apple-style URLs (`/api/v2/feed-rss/playser/…`) also work; FluxTV uses the `podcast.xml` mounts above.

## COPE

Documented on [cope.es/rss-cope.html](https://www.cope.es/rss-cope.html):

`https://www.cope.es/api/es/programas/{slug}/audios/rss.xml`

| Program | Slug |
|---------|------|
| Herrera en COPE | `herrera-en-cope` |
| Mediodía COPE | `mediodia-cope` |
| La Linterna | `la-linterna` |
| Poniendo las Calles | `poniendo-las-calles` |

Dev proxy: `/proxy/cope/…` → `https://www.cope.es/…`.

## Europa FM / Melodía FM (Atresmedia Radio)

| Station | Program | Public feed |
|---------|---------|-------------|
| Europa FM | Cuerpos especiales | `https://www.europafm.com/rss/podcast/triton/mount/ATRESMEDIA_CUERPOS_ESPECIALES_AOD_P/origin/fastly` |
| Europa FM | Me pones | `https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_ME_PONES_AOD_P/origin/fastly` (Apple feedUrl; Triton host) |
| Melodía FM | Parece Mentira | `https://www.melodia-fm.com/rss/podcast/5087510/podcast.xml` |

Dev proxies: `/proxy/europafm/…`, `/proxy/melodiafm/…` (Me pones uses `/proxy/ondacero/…`).

Note: generic Europa FM site RSS such as `europafm.com/rss/234881.xml` is **news/topic**, not program audio enclosures — not used as a podcast catalog.

## Antena 3

- Site news RSS exists (e.g. antena3.com/rss/…).
- **Atresplayer catch-up** is not a free public podcast/catch-up API → **stub in UI**.
- **Onda Cero / Europa FM / Melodía FM** radio podcasts (same media group) are separate — public RSS above, not TV catch-up.

## Cuatro / Telecinco / La Sexta

- No documented free public catch-up podcast APIs for full programs suitable for automated replay.
- News/topic RSS may exist; program catch-up sits behind commercial players → **stub**; user pastes URLs they can open.

## Hard refusals

- Pirate indexes (e.g. atomohd.monster)
- Digi TV / Movistar Plus credential login or scraping (including Digi “Descarga automática” / storage-quota toasts — those are Digi’s app limits, not FluxTV)
- Paywall bypass / unauthorized catalogs
