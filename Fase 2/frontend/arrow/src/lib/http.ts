import axios from 'axios';

export const http = axios.create({
    // En dev: ''  → usará rutas relativas y Vite las proxyea a :3001
    // En prod: '' → mismo dominio detrás de Apache (/api)
    baseURL: import.meta.env.VITE_API_BASE || '/',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});