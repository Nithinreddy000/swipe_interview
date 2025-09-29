import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Skip TypeScript checking during build for faster deployment
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@reduxjs/toolkit', 'react-redux'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          ai: ['@google/generative-ai'],
        }
      }
    }
  }
})
