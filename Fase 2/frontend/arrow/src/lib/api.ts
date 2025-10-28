
//se deja vacio en dev para usar el proxy en vite.config.ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(url: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(API_BASE + url, {
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        ...opts,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    return (await res.json()) as T;
}

export const api = {
    get:  <T>(url: string) => request<T>(url),
    post: <T>(url: string, body?: any) => request<T>(url, { method: "POST", body: JSON.stringify(body) }),
    put:  <T>(url: string, body?: any) => request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
    del:  <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

// Tipos básicos (ajusta si cambias el backend)
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

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number; };