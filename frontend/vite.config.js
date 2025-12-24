import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: null,
      devOptions: {
        enabled: false
      },
      workbox: {
        disableDevLogs: true,
        globPatterns: [],
        runtimeCaching: [],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Temp Email',
        short_name: 'Temp Email',
        description: 'Temp Email - Temporary Email',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  esbuild: {
    supported: {
      'top-level-await': true
    },
  }
})
