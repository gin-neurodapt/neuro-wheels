import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { WHEELS } from './src/wheels/config.js';
import { wheelColoursCss } from './src/wheels/colour.js';

// The wheels' colours from config.js as a stylesheet (see colour.js). After
// changing a colour, restart `npm run dev` to see it.
function wheelColours() {
  const id = 'virtual:wheel-colours.css';
  const resolved = `\0${id}`;
  return {
    name: 'wheel-colours',
    resolveId: (source) => (source === id ? resolved : null),
    load: (source) => (source === resolved ? wheelColoursCss(WHEELS) : null),
  };
}

export default defineConfig({
  plugins: [react(), wheelColours()],
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
