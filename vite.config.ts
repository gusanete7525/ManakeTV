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
    },
  },
});
