import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { fileURLToPath } from 'node:url';

// Configuración de alias
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    server: {
        proxy: {
            "/api": { target: "http://localhost:3000", changeOrigin: true },
            "/health": { target: "http://localhost:3000", changeOrigin: true }
        }
    }
});