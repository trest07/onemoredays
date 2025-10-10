import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'One More Day',
        short_name: 'One More Day',
        description: 'Drop notes and photos on the map.',
        theme_color: '#111827',
        background_color: '#0b1220',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      // 🔑 Disable SW in dev so it never intercepts @vite/client / HMR
      devOptions: { enabled: false, type: 'module' },
      // (keep your workbox config — only used in prod build)
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
        navigateFallback: '/offline',
        runtimeCaching: [
          { // your existing caches...
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-shell' }
          },
          {
            urlPattern: ({ url }) => /cdn\.vibezcitizens\.com$/i.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-assets',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' &&
              /supabase\.co/i.test(url.hostname) &&
              /rest|storage/i.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          // prod-only: map tiles (safe; SW disabled in dev)
          {
            urlPattern: ({ url }) => /basemaps\.cartocdn\.com$/i.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => /tile\.openstreetmap\.org$/i.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    host: true,
    // 🔧 If you test on phone over LAN or behind VPN/proxy, set explicit HMR endpoint:
    hmr: {
      protocol: 'ws',
      host: 'localhost',     // or your machine LAN IP if opening from phone
      port: 5173,
      clientPort: 5173
    }
  }
})
