import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Built assets are served by Spring Boot backend from classpath:/static/tma/
// reachable at https://uzbishchi.uz/tma/
export default defineConfig({
  base: '/tma/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../backend/src/main/resources/static/tma',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.uzbishchi.uz',
        changeOrigin: true,
      },
    },
  },
});
