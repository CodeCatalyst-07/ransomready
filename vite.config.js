import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs also work when Electron loads dist through file://.
  base: './',
  server: {
    host: 'localhost',
    port: 5173,
    // Fail clearly instead of changing ports while Electron waits on 5173.
    strictPort: true,
  },
});
