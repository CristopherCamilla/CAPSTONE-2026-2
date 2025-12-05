// src/lib/api.ts
// ====== Tipos compartidos ======
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
