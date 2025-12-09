import axios, { AxiosError } from 'axios';

// En dev: '' → usará rutas relativas y Vite las proxyea a :3001
// En prod: '' → mismo dominio detrás de Apache (/api)
const BASE = import.meta.env.VITE_API_BASE || '/';

// ====== Instancia Axios ======
export const http = axios.create({
    baseURL: BASE,
    timeout: 20000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor de request (ej: token)
http.interceptors.request.use((config) => {
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor de respuesta -> normaliza errores
http.interceptors.response.use(
    (res) => res,
    (error) => {
        if (axios.isAxiosError(error)) {
            const ax = error as AxiosError<any>;
            const apiErr = new Error(
                ax.response?.data?.message ||
                ax.message ||
                "Error de red"
            );
            (apiErr as any).status = ax.response?.status;
            (apiErr as any).details = ax.response?.data;
            return Promise.reject(apiErr);
        }
        return Promise.reject(error);
    }
);