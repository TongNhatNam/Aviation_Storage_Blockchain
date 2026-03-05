import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('ethers')) return 'ethers-vendor'
          if (id.includes('web3')) return 'web3-vendor'
          return 'vendor'
        },
      },
    },
  },
})
