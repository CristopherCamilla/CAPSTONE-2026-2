import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import { createPinia } from 'pinia'
import { router } from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute('data-theme', saved ?? (prefersDark ? 'dark' : 'light'))

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, { theme: { preset: Aura } })

//intenta levantar sesión de la cookie
import { useAuth } from '@/stores/auth'
useAuth(pinia).me().finally(() => {
    app.mount('#app')
})
