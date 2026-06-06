import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    https: true,
    proxy: {
      // All /api requests are proxied to the HTTPS backend
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false  // Accept self-signed cert in dev
      }
    }
  }
});
