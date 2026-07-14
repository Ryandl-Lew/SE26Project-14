import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // TODO: 后端就绪后配置代理，将 /api 转发到 Express 服务
    // proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
})
