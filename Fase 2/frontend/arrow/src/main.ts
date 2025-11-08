import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import { createPinia } from 'pinia';
import { router } from './router'

// aplicar tema guardado o del sistema ANTES de montar
const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.setAttribute('data-theme', (saved ?? (prefersDark ? 'dark' : 'light')))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
