import { defineStore } from 'pinia';

type User = { name: string } | null

export const useAuthStoreLocal = defineStore('auth', {
    state: () => ({
        user: null as User, // forma de autentificacion
        returnUrl: null as string | null,
    }),
    getters: {
        isAuthenticated: (s) => !!s.user,
    },
    actions: {
        login() {
            // TODO: reemplazar por llamada real a tu backend
            this.user = { name: 'aus' }

        },
        logout() {
            this.user = null
            this.returnUrl = null
        },
    },
});