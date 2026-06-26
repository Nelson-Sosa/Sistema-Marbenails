import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Tailwind CSS v4 — must be before React plugin
    tailwindcss(),
    // React with Fast Refresh
    react(),
  ],

  resolve: {
    alias: {
      // '@' maps to 'src/' — use in any import: '@/components/...', '@/hooks/...'
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    open: true, // Opens browser automatically on dev start
    // Prevent Cross-Origin-Opener-Policy from blocking Firebase Auth popup
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 500,
  },
})
