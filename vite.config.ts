import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Official RTVE public RSS / API — same-origin in dev to avoid CORS.
      "/proxy/rtve": {
        target: "https://www.rtve.es",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/rtve/, ""),
      },
      // Official Onda Cero / Atresmedia Radio public podcast RSS (Triton mounts).
      // Direct responses send ACAO:* with credentials=true (invalid combo); proxy avoids browser CORS quirks.
      "/proxy/ondacero": {
        target: "https://www.ondacero.es",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/ondacero/, ""),
      },
      // Cadena SER / Prisa PlaySER public podcast RSS.
      "/proxy/ser": {
        target: "https://fapi-top.prisasd.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/ser/, ""),
      },
      // COPE documented public program audio RSS.
      "/proxy/cope": {
        target: "https://www.cope.es",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/cope/, ""),
      },
      // Europa FM Triton podcast RSS (Atresmedia Radio).
      "/proxy/europafm": {
        target: "https://www.europafm.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/europafm/, ""),
      },
      // Melodía FM public podcast RSS (Atresmedia Radio).
      "/proxy/melodiafm": {
        target: "https://www.melodia-fm.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/melodiafm/, ""),
      },
    },
  },
});
