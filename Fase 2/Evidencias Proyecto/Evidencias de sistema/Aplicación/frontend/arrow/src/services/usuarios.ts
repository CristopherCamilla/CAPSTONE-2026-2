//services/usuarios.ts
import { http } from '@/lib/http'
import type { Usuario, Paged } from '@/lib/api'

// Query de listado (todas opcionales)
type ListParams = {
    page?: number
    pageSize?: number
    search?: string
}

// Payload para crear (sin id/fechas, con password)
type CreatePayload =
    Omit<Usuario, 'id' | 'fecha_registro' | 'ultima_conexion'> & { password: string }

// Patch para actualizar (todo opcional, password opcional)
type UpdatePayload =
    Partial<Omit<Usuario, 'id' | 'fecha_registro' | 'ultima_conexion'>> & {
    password?: string
}

export const usuariosService = {
    list(params?: ListParams) {
        return http
            .get<Paged<Usuario>>('/api/usuarios', { params })
            .then(r => r.data)
    },

    get(id: number) {
        return http
            .get<Usuario>(`/api/usuarios/${id}`)
            .then(r => r.data)
    },

    create(payload: CreatePayload) {
        return http
            .post<Usuario>('/api/usuarios', payload)
            .then(r => r.data)
    },

    update(id: number, patch: UpdatePayload) {   // ← aquí tipado, adiós "any"
        return http
            .put<Usuario>(`/api/usuarios/${id}`, patch)
            .then(r => r.data)
    },

    remove(id: number) {
        return http
            .delete<{ ok: boolean }>(`/api/usuarios/${id}`)
            .then(r => r.data)
    },
}