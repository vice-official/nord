import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api-v1': {
        target: 'https://gigachat.devices.sberbank.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-v1/, ''),
        secure: false,
      }
    }
  }
})