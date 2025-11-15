// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import {useAuth } from "../stores/auth.ts";


const routes = [
        {
            path: '/',
            redirect: { name: 'Login' },
            // name: 'Home',
            // component: () => import('../views/HomeView.vue'),
            // alias: ['/home'],
            // meta: { requiresAuth: false }
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/LoginView.vue'),
            meta: { requiresAuth: false, guestOnly: true },
        },
        {
            path: '/report',
            name: 'Report',
            component: () => import('../views/ReportView.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'productos',
                    name: 'ReportProductos',
                    component: () => import('@/views/report/ReportProductosSub.vue'), // o tu nuevo archivo
                    meta: { keepAlive: true, requiresAuth: true }
                },
                {
                    path: 'resumen',
                    name: 'ReportResumen',
                    component: () => import('@/views/report/ResumenSub.vue'),
                    meta: { keepAlive: true, requiresAuth: true }
                },
                {
                    path: 'detalle',
                    name: 'ReportDetalle',
                    component: () => import('@/views/report/DetalleSub.vue'),
                    meta: { keepAlive: true, requiresAuth: true }
                },

            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NoFound',
            component: () => import('../views/NotFoundView.vue'),
            meta: { requiresAuth: false }
        },
];

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});
//Errores
router.onError((err) => {
    const msg = String((err as Error)?.message || '')
    if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('ChunkLoadError')
    ) {
        // recarga la app para que baje el nuevo index.html y los nuevos chunks
        window.location.reload()
    }
})

//Guard Global
let bootstrapped = false
router.beforeEach(async (to) => {
    const auth = useAuth()

    // normaliza a lowercase
    if (to.fullPath !== to.fullPath.toLowerCase()) {
        return { path: to.fullPath.toLowerCase(), query: to.query, hash: to.hash }
    }

    // hidrata sesión 1 sola vez (para F5, pestaña nueva, etc.)
    if (!bootstrapped) {
        bootstrapped = true
        await auth.me()
    }

    const isAuth = auth.isAuthenticated

    // protege privadas
    if (to.meta.requiresAuth && !isAuth) {
        auth.returnUrl = to.fullPath
        return { name: 'Login', query: { redirect: to.fullPath } }
    }

    // bloquea login si ya hay sesión
    if (to.meta.guestOnly && isAuth) {
        return { name: 'Report' }
    }

    return true
})