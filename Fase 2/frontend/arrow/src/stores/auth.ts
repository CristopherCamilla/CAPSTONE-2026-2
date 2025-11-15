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

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
            const MIN_LOADING_MS = 2000;     // 👈1.2s
            const start = performance.now(); // para medir cuánto duró realmente

            this.loading = true;
            this.error = '';
            try {
                const { data } = await http.post('/api/auth/login', { email, password });
                this.user = data.user;
                return true;
            } catch (e: any) {
                this.user = null;
                this.error = e?.response?.status === 401
                    ? 'Credenciales inválidas'
                    : 'No se pudo iniciar sesión';
                return false;
            } finally {
                const elapsed = performance.now() - start;
                const remaining = MIN_LOADING_MS - elapsed;
                if (remaining > 0) {
                    await sleep(remaining);      // 👈 mantiene el spinner el tiempo faltante
                }
                this.loading = false;
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
