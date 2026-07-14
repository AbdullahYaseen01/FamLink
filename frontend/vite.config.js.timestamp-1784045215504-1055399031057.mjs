// vite.config.js
import { defineConfig } from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { visualizer } from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: "dist/bundle-report.html",
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    sourcemap: true,
    // 👈 add this line
    minify: "esbuild"
  },
  server: {
    host: "0.0.0.0",
    // ← allow external access
    port: 5173,
    // optional: default port
    strictPort: true
    // optional: prevent port fallback
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU0FcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxQcm9qZWN0c1xcXFxGYW15bGluay11cGRhdGVcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFVTQVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFByb2plY3RzXFxcXEZhbXlsaW5rLXVwZGF0ZVxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvVVNBL09uZURyaXZlL0Rlc2t0b3AvUHJvamVjdHMvRmFteWxpbmstdXBkYXRlL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSxcbiAgdmlzdWFsaXplcih7XG4gICAgb3BlbjogdHJ1ZSxcbiAgICBmaWxlbmFtZTogXCJkaXN0L2J1bmRsZS1yZXBvcnQuaHRtbFwiLFxuICAgIGd6aXBTaXplOiB0cnVlLFxuICAgIGJyb3RsaVNpemU6IHRydWUsXG4gIH0pLFxuICBdLFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogdHJ1ZSwgLy8gXHVEODNEXHVEQzQ4IGFkZCB0aGlzIGxpbmVcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLCAgICAgIC8vIFx1MjE5MCBhbGxvdyBleHRlcm5hbCBhY2Nlc3NcbiAgICBwb3J0OiA1MTczLCAgICAgICAgICAgLy8gb3B0aW9uYWw6IGRlZmF1bHQgcG9ydFxuICAgIHN0cmljdFBvcnQ6IHRydWUsICAgICAvLyBvcHRpb25hbDogcHJldmVudCBwb3J0IGZhbGxiYWNrXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErWCxTQUFTLG9CQUFvQjtBQUM1WixPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFHM0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQUMsTUFBTTtBQUFBLElBQ2hCLFdBQVc7QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNEO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUE7QUFBQSxJQUNYLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sWUFBWTtBQUFBO0FBQUEsRUFDZDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
