import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a default API URL
const defaultApiUrl = 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: defaultApiUrl,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "ws://localhost:5000",
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/socket.io/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});