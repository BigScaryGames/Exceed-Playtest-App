import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Exceed-Playtest-App/', // For GitHub Pages - use repo name
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().replace('T', ' ').substring(0, 19)),
  },
  // Expose build time as VITE_BUILD_TIME
  envPrefix: 'VITE',
  envDir: '.',
})
