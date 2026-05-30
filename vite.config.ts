import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

// Detect whether this build is targeted at Electron (packaged desktop app).
// We check the npm lifecycle event name (e.g. "electron:build", "electron:build:win",
// "electron:dev") which is set automatically by npm when a script runs. PWA/service-
// worker features are incompatible with Electron's file:// protocol, so they are
// disabled for Electron builds but left enabled for standard web builds.
const isElectronBuild = (process.env.npm_lifecycle_event || '').includes('electron');

export default defineConfig({
  plugins: [
    react(),
    ...(isElectronBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
              name: 'ClaimCutter - UK Small Claims Guide',
              short_name: 'ClaimCutter',
              description: 'Guide through the UK small claims process',
              theme_color: '#1e3a5f',
              background_color: '#1e3a5f',
              display: 'standalone',
              scope: '/',
              start_url: '/',
              icons: [
                {
                  src: 'icon-192.png',
                  sizes: '192x192',
                  type: 'image/png'
                },
                {
                  src: 'icon-512.png',
                  sizes: '512x512',
                  type: 'image/png'
                },
                {
                  src: 'icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable'
                }
              ]
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/api\./i,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'api-cache',
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 60 * 60 * 24
                    },
                    cacheableResponse: {
                      statuses: [0, 200]
                    }
                  }
                }
              ]
            }
          })
        ]),
    // Only activate Electron plugins for electron:dev and electron:build scripts.
    // Without this guard, vite-plugin-electron tries to spawn the Electron main
    // process during plain `npm run dev` web mode, which crashes because Electron
    // APIs (e.g. app.getPath) are unavailable in plain Node.js.
    ...(isElectronBuild
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron']
                  }
                }
              }
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron'
                }
              }
            }
          ]),
          renderer()
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
