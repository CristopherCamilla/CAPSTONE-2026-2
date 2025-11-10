// src/stores/auth.ts
import { defineStore } from 'pinia'
import { http } from '@/lib/http'

type User = {
    id: string
    email: string
    nombre?: string
    apellido?: string
    rol?: string
} | null

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null as User,
        loading: false,
        error: '' as string,           // <-- agrega error
        returnUrl: null as string | null,
    }),
    getters: {
        isAuthenticated: (s) => !!s.user,
    },
    actions: {
        async login(email: string, password: string) {
            this.loading = true
            this.error = ''
            try {
                const { data } = await http.post('/api/auth/login', { email, password })
                this.user = data.user
                return true
            } catch (e: any) {
                this.user = null
                this.error = e?.response?.status === 401
                    ? 'Credenciales inválidas'
                    : 'No se pudo iniciar sesión'
                return false
            } finally {
                this.loading = false
            }
        },
        async me() {
            try {
                const { data } = await http.get('/api/auth/session', {
                    validateStatus: () => true, // nunca lanza por 401, etc.
                });
                this.user = data?.user ?? null;
            } catch {
                this.user = null;
            }
        },
        async logout() {
            await http.post('/api/auth/logout')
            this.user = null
        },
    },
})
