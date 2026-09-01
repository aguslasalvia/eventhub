import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 80,
    proxy: {
      "/api": {
        target: process.env.API_TARGET || "http://server:3000",
        changeOrigin: true,
      },
    },
  },
})
