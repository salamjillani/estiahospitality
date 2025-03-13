import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: import.meta.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: import.meta.env.VITE_WS_URL || "ws://localhost:5000",
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/socket.io/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});