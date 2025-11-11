<template>
  <header
      class="sticky top-0 z-50 backdrop-blur border-b border-black/5 dark:border-white/10
         bg-white/70 dark:bg-slate-900/40">
    <nav class="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
      <!-- izquierda -->
      <div class="flex items-center gap-3 min-w-0">
        <RouterLink to="/" class="flex items-center gap-4">
          <img :src="AristoLogo" alt="Aristo" class="h-7 w-auto" />
          <img :src="IntercoLogo" alt="Interco" class="h-7 w-auto" />
        </RouterLink>

        <!-- enlaces solo si autenticado -->
        <div v-if="auth.isAuthenticated" class="flex items-center gap-4 text-[var(--link)]">
          <RouterLink to="/report/productos" class="hover:underline">Productos</RouterLink>
          <RouterLink to="/report/resumen" class="hover:underline">Resumen</RouterLink>
          <RouterLink to="/report/detalle" class="hover:underline">Detalle</RouterLink>
          <RouterLink to="/report/resumen" class="hover:underline">Acerca</RouterLink>
        </div>
      </div>

      <!-- derecha (desktop) -->
      <div class="hidden sm:flex items-center gap-3">
        <!-- si NO hay sesión -->
        <RouterLink
            v-if="!isAuth"
            :to="{ name: 'Login' }"
            class="rounded-lg px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          Iniciar sesión
        </RouterLink>

        <!-- si hay sesión -->
        <div v-else class="flex items-center gap-3">
          <div class="hidden md:flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center text-xs font-semibold">
              {{ initials }}
            </div>
            <span class="text-xs opacity-70">{{ auth.user?.email }}</span>
          </div>
          <button
              @click="onLogout"
              class="rounded-lg px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-sm"
          >
            Cerrar sesión
          </button>
        </div>

        <ThemeToggle />
      </div>

      <!-- botón hamburguesa (móvil) -->
      <button
          class="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-black/10 dark:border-white/10"
          aria-label="Abrir menú"
          @click="open = !open"
      >
        <span v-if="!open">☰</span>
        <span v-else>×</span>
      </button>
    </nav>

    <!-- menú móvil -->
    <transition name="fade">
      <div v-if="open" class="sm:hidden border-t border-black/5 dark:border-white/10">
        <div class="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
          <RouterLink @click="close" to="/" class="py-2">Inicio</RouterLink>
          <RouterLink @click="close" to="/about" class="py-2">Acerca</RouterLink>

          <!-- solo con sesión -->
          <template v-if="isAuth">
            <RouterLink @click="close" to="/report/resumen"  class="py-2">Resumen</RouterLink>
            <RouterLink @click="close" to="/report/detalle"  class="py-2">Detalle</RouterLink>
            <RouterLink @click="close" to="/report/productos" class="py-2">Productos</RouterLink>
          </template>

          <div class="pt-2 mt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
            <span class="text-sm opacity-70">Tema</span>
            <ThemeToggle />
          </div>

          <!-- action login / logout -->
          <div class="pt-2">
            <RouterLink
                v-if="!isAuth"
                @click="close"
                :to="{ name: 'Login' }"
                class="inline-flex w-full items-center justify-center rounded-lg px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >
              Iniciar sesión
            </RouterLink>

            <button
                v-else
                @click="onLogout"
                class="inline-flex w-full items-center justify-center rounded-lg px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuth } from '@/stores/auth'
import AristoLogo from '@/assets/brand/aristo_logo.svg'
import IntercoLogo from '@/assets/brand/interco_logo.svg'

const auth = useAuth()
const isAuth = computed(() => !!auth.user)

const initials = computed(() => {
  const n = [auth.user?.nombre, auth.user?.apellido].filter(Boolean).join(' ').trim()
  if (!n) return (auth.user?.email ?? '?').slice(0, 2).toUpperCase()
  return n.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
})

const router = useRouter()
async function onLogout() {
  try {
    await auth.logout()
  } finally {
    router.push({ name: 'Login' })
    open.value = false
  }
}

const open = ref(false)
const close = () => (open.value = false)

// cierra el menú al cambiar de ruta
const unreg = router.afterEach(() => (open.value = false))
onBeforeUnmount(unreg)

// cierra al presionar Esc
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
:root{
  --nav:#0f172a20; /* ajusta según tu tema */
}
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
