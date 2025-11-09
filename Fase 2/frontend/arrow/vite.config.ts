import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
    plugins: [vue(), tailwind()],
    base: './',
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
        proxy: {
            '/api': { target: 'http://localhost:3001', changeOrigin: true }
        }
    }
})