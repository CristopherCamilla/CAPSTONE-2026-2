// src/lib/api.ts
import axios, { AxiosError } from "axios";

const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");

// ====== Tipos compartidos (como ya tenías) ======
export type Usuario = {
    id: number;
    nombre: string;
    apellido: string;
    usuario: string;
    email: string;
    rol: "admin" | "editor" | "usuario";
    estado: "activo" | "inactivo";
    fecha_registro?: string;
    ultima_conexion?: string | null;
};

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

// ====== Normalización de errores ======
export type ApiError = Error & {
    status?: number;
    details?: unknown;
};

function toApiError(err: unknown): ApiError {
    if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<any>;
        const apiErr: ApiError = new Error(
            ax.response?.data?.message ||
            ax.message ||
            "Error de red"
        );
        apiErr.status = ax.response?.status;
        apiErr.details = ax.response?.data;
        return apiErr;
    }
    return new Error(String(err || "Error desconocido"));
}

// ====== Instancia Axios ======
export const http = axios.create({
    baseURL: BASE,              // <- "/api" en dev/prod
    timeout: 20000,
    headers: { "Content-Type": "application/json" },
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
    (error) => Promise.reject(toApiError(error))
);

// ====== Helpers para devolver "data" directo ======
export const api = {
    get:  async <T>(url: string, params?: any) => (await http.get<T>(url, { params })).data,
    post: async <T>(url: string, body?: any)     => (await http.post<T>(url, body)).data,
    put:  async <T>(url: string, body?: any)     => (await http.put<T>(url, body)).data,
    del:  async <T>(url: string)                 => (await http.delete<T>(url)).data,
};

// DEBUG
console.log("VITE_API_BASE =", BASE);
