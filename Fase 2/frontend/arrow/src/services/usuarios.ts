import { api, type Usuario, type Paged } from "@/lib/api";

export const usuariosService = {
    list(params?: { page?: number; pageSize?: number; search?: string }) {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", String(params.page));
        if (params?.pageSize) q.set("pageSize", String(params.pageSize));
        if (params?.search) q.set("search", params.search);
        const qs = q.toString() ? `?${q.toString()}` : "";
        return api.get<Paged<Usuario>>(`/api/usuarios${qs}`);
    },

    get(id: number) {
        return api.get<Usuario>(`/api/usuarios/${id}`);
    },

    create(payload: Omit<Usuario, "id" | "fecha_registro" | "ultima_conexion"> & { password: string }) {
        return api.post<Usuario>("/api/usuarios", payload);
    },

    update(id: number, patch: Partial<Usuario> & { password?: string }) {
        return api.put<Usuario>(`/api/usuarios/${id}`, patch);
    },

    remove(id: number) {
        return api.del<{ ok: boolean }>(`/api/usuarios/${id}`);
    }
};