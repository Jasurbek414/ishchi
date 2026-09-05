import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Built assets are served by the Spring Boot backend from classpath:/static/ (root),
// reachable at https://uzbishchi.uz — same origin as the API, so no CORS setup needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});
