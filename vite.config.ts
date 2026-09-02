import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 200,
    reportCompressedSize: true,
  },
  server: {
    port: 5173,
  },
  publicDir: 'public',
})
