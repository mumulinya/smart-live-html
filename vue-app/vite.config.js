import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/app-dev-api': {
        target: 'http://127.0.0.1:8080', // Adjust based on common.js logic if needed, user had some commented out IPs
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/app-dev-api/, '')
      }
    }
  }
})
