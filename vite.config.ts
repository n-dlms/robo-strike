import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // only our tests — exclude vendored SDK suites (vendor/ is gitignored)
    include: ['tests/**/*.test.ts'],
  },
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
