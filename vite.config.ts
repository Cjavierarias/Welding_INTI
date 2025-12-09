import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        apple_touch_startup_image: [],
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#1976d2',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        short_name: 'WeldSim',
        description: 'Simulador de soldadura con AR y sensores',
        lang: 'es',

        
        name: 'Simulador de Soldadura AR',
        short_name: 'WeldingSim',
        description: 'Simulador de técnicas de soldadura con realidad aumentada',
        theme_color: '#1976d2',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020'
  }
})
