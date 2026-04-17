import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['content/*', 'fonts/*'],
      manifest: {
        name: 'ImpView',
        short_name: 'ImpView',
        description: 'The Improverts Visuals Software',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/content/i.png', sizes: '192x192', type: 'image/png' },
          { src: '/content/i.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,mp4,webm,ttf,webmanifest}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 // 50 MB — allow large video files
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        display: './display.html'
      }
    }
  }
})
