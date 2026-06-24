import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // 1000 kB - Uyarı limitini yükselt
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ve React DOM'u ayrıştır
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor'
          }
          // Firebase ve büyük kütüphaneleri ayrıştır
          if (id.includes('firebase')) {
            return 'firebase-vendor'
          }
        },
      },
    },
  },
})