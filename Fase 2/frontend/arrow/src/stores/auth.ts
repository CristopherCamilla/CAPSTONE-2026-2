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
        loading: false as boolean,
        returnUrl: null as string | null,
    }),
    getters: {
        isAuthenticated: (s) => !!s.user,
    },
    actions: {
        async login(email: string, password: string) {
            this.loading = true
            try {
                const { data } = await http.post('/api/auth/login', { email, password })
                this.user = data.user
                return true
            } finally {
                this.loading = false
            }
        },
        async me() {
            try {
                const { data } = await http.get('/api/auth/me')
                this.user = data ?? null
            } catch {
                this.user = null
            }
        },
        async logout() {
            await http.post('/api/auth/logout')
            this.user = null
        },
    },
})
