import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Every asset is a separate file (never inlined as data), so the security
    // policy can stay "this site only".
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.{js,jsx}'],
  },
});
