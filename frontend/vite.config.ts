import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  },
  define: {
    // Exposes VITE_API_URL to the app at build time.
    // Set this env var in Vercel dashboard to your Render backend URL.
    // Falls back to '' (same-origin / vite proxy) for local dev.
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL ?? ''),
  }
})
