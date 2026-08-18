import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  visualizer({
    open: false,
    filename: "dist/bundle-report.html",
    gzipSize: true,
    brotliSize: true,
  }),
  ],
  build: {
    // Production sourcemaps expose app structure; keep them off for SEO/security.
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    host: '0.0.0.0',      // ← allow external access
    port: 5173,           // optional: default port
    strictPort: true,     // optional: prevent port fallback
  },
})
