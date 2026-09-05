import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Built assets are served by the Spring Boot backend from classpath:/static/admin/,
// reachable at https://<api-domain>/admin/ — same origin as the API, so no CORS setup
// is needed and it works from a phone browser without any extra tunnel configuration.
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../backend/src/main/resources/static/admin',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
});
