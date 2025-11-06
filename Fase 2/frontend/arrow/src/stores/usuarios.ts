// stores/usuarios.ts
import { defineStore } from "pinia";
import { usuariosService } from "@/services/usuarios";
import type { Usuario } from "@/lib/api";

export const useUsuariosStore = defineStore("usuarios", {
    state: () => ({
        items: [] as Usuario[],
        page: 1,
        pageSize: 10,
        total: 0,
        search: "",
        loading: false,
        error: "" as string | null
    }),
    actions: {
        async fetch() {
            this.loading = true; this.error = null;
            try {
                const res = await usuariosService.list({
                    page: this.page, pageSize: this.pageSize, search: this.search || undefined
                });
                this.items = res.items;
                this.total = res.total;
            } catch (e: any) {
                this.error = e?.message || "Error cargando usuarios"; // <- axios ya normaliza
            } finally {
                this.loading = false;
            }
        },
        async create(u: Omit<Usuario, "id" | "fecha_registro" | "ultima_conexion"> & { password: string }) {
            await usuariosService.create(u);
            await this.fetch();
        },
        async update(id: number, patch: Partial<Usuario> & { password?: string }) {
            await usuariosService.update(id, patch);
            await this.fetch();
        },
        async remove(id: number) {
            await usuariosService.remove(id);
            await this.fetch();
        }
    }
});
