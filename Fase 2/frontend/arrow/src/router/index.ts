import { createRouter, createWebHistory } from 'vue-router'
import {useAuthStoreLocal} from "../stores/authLocal.ts";


const routes = [
        {
            path: '/',
            name: 'Home',
            component: () => import('../views/HomeView.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/LoginView.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/report',
            name: 'Report',
            component: () => import('../views/ReportView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/NoFound',
            name: 'NoFound',
            component: () => import('../views/NotFoundView.vue'),
            meta: { requiresAuth: true }
        },
];

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});
//Guard Global
router.beforeEach(async (to) => {
    const auth = useAuthStoreLocal()
    const isAuth = auth.isAuthenticated

    if (to.meta.requiresAuth && !isAuth) {
        auth.returnUrl = to.fullPath
        return { name: 'Login', query: { redirect: to.fullPath } }
    }
    // Si la ruta es el login y ya está logueado, redirige al dashboard
    if (isAuth && to.name === 'Login') {
        return { name: '/' }
    }
    return true;
})
