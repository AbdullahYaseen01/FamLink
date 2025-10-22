import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from "rollup-plugin-visualizer";
import purgecss from "vite-plugin-purgecss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  purgecss({
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}", // all source files where class names might appear
    ],
    safelist: [/^ant-/, /^slick-/, /^swiper-/, /^react-/, /^emoji-/], // ⚠️ important for Ant Design and other libs
  }),
  visualizer({
    open: true,
    filename: "dist/bundle-report.html",
    gzipSize: true,
    brotliSize: true,
  }),
  ],
  build: {
    sourcemap: true, // 👈 add this line
    minify: 'esbuild',
  },
  server: {
    host: '0.0.0.0',      // ← allow external access
    port: 5173,           // optional: default port
    strictPort: true,     // optional: prevent port fallback
  },
})
