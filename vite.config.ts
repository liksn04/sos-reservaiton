import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function isPackage(id: string, packageName: string) {
  return id.includes(`/node_modules/${packageName}/`)
}

function isScopedPackage(id: string, scope: string) {
  return id.includes(`/node_modules/${scope}/`)
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            isPackage(id, 'react') ||
            isPackage(id, 'react-dom') ||
            isPackage(id, 'react-is') ||
            isPackage(id, 'scheduler') ||
            isPackage(id, 'use-sync-external-store')
          ) {
            return 'react-core'
          }

          if (isPackage(id, 'react-router') || isPackage(id, 'react-router-dom')) {
            return 'router'
          }

          if (
            isPackage(id, 'recharts') ||
            isPackage(id, 'victory-vendor') ||
            isPackage(id, 'decimal.js-light') ||
            id.includes('/node_modules/d3-')
          ) {
            return 'charts-vendor'
          }

          if (
            isPackage(id, 'framer-motion') ||
            isPackage(id, 'motion-dom') ||
            isPackage(id, 'motion-utils') ||
            isPackage(id, 'lucide-react')
          ) {
            return 'motion-ui'
          }

          if (isScopedPackage(id, '@supabase')) {
            return 'supabase'
          }

          if (isScopedPackage(id, '@tanstack')) {
            return 'query'
          }

          if (isPackage(id, 'date-fns')) {
            return 'date-utils'
          }

          if (isPackage(id, 'workbox-window')) {
            return 'pwa'
          }

          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: '빛소리 예약',
        short_name: '빛소리',
        description: '빛소리 동아리방 예약 시스템',
        theme_color: '#cc97ff',
        background_color: '#131316',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 60 * 5 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 50 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5150,
  },
})
