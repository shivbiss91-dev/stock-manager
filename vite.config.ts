import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const htmlEntryPlugin: Plugin = {
  name: 'html-entry-inject',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      // If index.html points to compiled bundle (for GitHub Pages static hosting),
      // swap to TypeScript source during Vite development and Vite build.
      let transformed = html.replace(
        /<script type="module" crossorigin src="[^"]*assets\/[^"]*"><\/script>/,
        '<script type="module" src="/src/main.tsx"></script>'
      );
      transformed = transformed.replace(
        /<link rel="stylesheet" crossorigin href="[^"]*assets\/[^"]*">/,
        ''
      );
      return transformed;
    },
  },
};

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), htmlEntryPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/docs/**', '**/dist/**'],
    },
  },
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{ts,tsx}'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
