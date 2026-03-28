import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        short_name: 'FieldSnap',
        name: 'FieldSnap Site Documentation',
        icons: [
          {
            src: 'favicon.svg',
            type: 'image/svg+xml',
            sizes: '512x512'
          },
          {
            src: 'favicon.svg',
            type: 'image/svg+xml',
            sizes: '192x192',
            purpose: 'maskable'
          }
        ],
        start_url: '.',
        display: 'standalone',
        theme_color: '#007bff',
        background_color: '#ffffff',
        orientation: 'portrait'
      }
    })
  ],
})
