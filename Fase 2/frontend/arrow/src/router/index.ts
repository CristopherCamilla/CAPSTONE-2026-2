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
            meta: { requiresAuth: false }
        },
        {
            path: '/report',
            component: () => import('../views/ReportView.vue'),
            meta: { requiresAuth: false },
            children: [
                { path: '', redirect: { name: 'ReportResumen' } },
                {
                    path: 'resumen',
                    name: 'ReportResumen',
                    component: () => import('@/views/report/ResumenSub.vue'),
                    meta: { keepAlive: true, requiresAuth: false }
                },
                {
                    path: 'detalle',
                    name: 'ReportDetalle',
                    component: () => import('@/views/report/DetalleSub.vue'),
                    meta: { keepAlive: true, requiresAuth: false }
                },
                {
                    path: 'productos',
                    name: 'ReportProductos',
                    component: () => import('@/views/report/ReportProductosSub.vue'), // o tu nuevo archivo
                    meta: { keepAlive: true, requiresAuth: false }
                }
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
router.beforeEach(async (to) => {
    const auth = useAuth ()
    const isAuth = auth.isAuthenticated
    //Para que todas las rutas sean LOWERCASE
    if (to.fullPath !== to.fullPath.toLowerCase()) {
        return { path: to.fullPath.toLowerCase(), query: to.query, hash: to.hash }
    }

    if (to.meta.requiresAuth && !isAuth) {
        auth.returnUrl = to.fullPath
        return { name: 'Login', query: { redirect: to.fullPath } }
    }
    // Si la ruta es el login y ya está logueado, redirige al dashboard
    if (isAuth && to.name === 'Report') {
        return { name: 'Report' }
    }
    return true;
})