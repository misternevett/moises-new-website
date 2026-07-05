import { defineConfig } from 'vite'

export default defineConfig({
  base: '/moises-new-website/',
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173,
  },
})
