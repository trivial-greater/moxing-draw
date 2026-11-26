import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { moxingProxyPlugin } from './server/proxyPlugin';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), moxingProxyPlugin()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
