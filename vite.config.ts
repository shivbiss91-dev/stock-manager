import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'strip-gh-redirect',
      transformIndexHtml(html, ctx) {
        if (ctx.bundle) {
          return html
            .replace(/<script>\s*\/\/ When served directly on GitHub Pages[\s\S]*?<\/script>\s*/, '')
            .replace(/<noscript>\s*<meta http-equiv="refresh" content="0; url=\.\/docs\/">\s*<\/noscript>\s*/, '');
        }
        return html;
      },
    },
  ],
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
