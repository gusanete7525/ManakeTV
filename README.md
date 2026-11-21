# ManakeTV

Canal personal en modo playlist. Eliges una pieza del replay de la TDT de RTVE o del cine en castellano de RTVE Play y de la Filmoteca, le pones una hora, y la antena la emite cuando el reloj llega a ese punto.

La playlist vive en el navegador. Los vídeos siguen en los servidores de RTVE: esta aplicación no los aloja.

## Qué puedes programar

- Replay de La 1, La 2, Clan, Canal 24 Horas y Teledeporte.
- Películas y archivo de las estanterías Cine y Filmoteca de RTVE Play.
- Búsqueda de programas, episodios y películas.
- Un enlace directo propio, si ya tienes un `.mp4` o un `.m3u8`.

Cada pieza puede repetirse ciertos días de la semana o emitirse en una sola fecha. Si una película empieza a las 23:30 y dura dos horas, sigue en antena después de medianoche, en el minuto que corresponda.

## Arranque

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`. La API escucha en el puerto 8787 y Vite la reenvía bajo `/api`.

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` sirve la web ya construida y la API en el mismo puerto.

## Notas

La carta sale de la API pública de RTVE Play. No es una API con contrato: si RTVE cambia las direcciones, el catálogo puede dejar de responder. Parte del replay solo se reproduce desde España; fuera, el reproductor lo dice y deja el enlace a RTVE Play. El catálogo de cadenas privadas (Atresplayer, Mitele y similares) se abre en sus propias webs y no se incrusta aquí.
