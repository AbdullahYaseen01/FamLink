// vite.config.js
import { defineConfig } from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { visualizer } from "file:///C:/Users/USA/OneDrive/Desktop/Projects/Famylink-update/frontend/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU0FcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxQcm9qZWN0c1xcXFxGYW15bGluay11cGRhdGVcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFVTQVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFByb2plY3RzXFxcXEZhbXlsaW5rLXVwZGF0ZVxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvVVNBL09uZURyaXZlL0Rlc2t0b3AvUHJvamVjdHMvRmFteWxpbmstdXBkYXRlL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSxcbiAgdmlzdWFsaXplcih7XG4gICAgb3BlbjogZmFsc2UsXG4gICAgZmlsZW5hbWU6IFwiZGlzdC9idW5kbGUtcmVwb3J0Lmh0bWxcIixcbiAgICBnemlwU2l6ZTogdHJ1ZSxcbiAgICBicm90bGlTaXplOiB0cnVlLFxuICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsIC8vIFx1RDgzRFx1REM0OCBhZGQgdGhpcyBsaW5lXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcwLjAuMC4wJywgICAgICAvLyBcdTIxOTAgYWxsb3cgZXh0ZXJuYWwgYWNjZXNzXG4gICAgcG9ydDogNTE3MywgICAgICAgICAgIC8vIG9wdGlvbmFsOiBkZWZhdWx0IHBvcnRcbiAgICBzdHJpY3RQb3J0OiB0cnVlLCAgICAgLy8gb3B0aW9uYWw6IHByZXZlbnQgcG9ydCBmYWxsYmFja1xuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1gsU0FBUyxvQkFBb0I7QUFDNVosT0FBTyxXQUFXO0FBQ2xCLFNBQVMsa0JBQWtCO0FBRzNCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUFDLE1BQU07QUFBQSxJQUNoQixXQUFXO0FBQUEsTUFDVCxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQUEsRUFDRDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBO0FBQUEsSUFDWCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLFlBQVk7QUFBQTtBQUFBLEVBQ2Q7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
