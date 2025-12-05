<!--NavBar.vue-->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import UsuarioModal from '@/components/UsuarioModal.vue'
import { useAuth } from '@/stores/auth'
import AristoLogo from '@/assets/brand/aristo_logo.svg'
import IntercoLogo from '@/assets/brand/interco_logo.svg'

const auth = useAuth()
const isAuth = computed(() => auth.isAuthenticated)
const route = useRoute()

// Config central de los enlaces protegidos
const navItems = [
  { to: '/report/productos', label: 'Productos' },
  { to: '/report/resumen',   label: 'Resumen' },
]

// helper: saber si un link está “activo”
const isActive = (to: string) => route.path.startsWith(to)

const initials = computed(() => {
  const n = [auth.user?.nombre, auth.user?.apellido].filter(Boolean).join(' ').trim()
  if (!n) return (auth.user?.email ?? '?').slice(0, 2).toUpperCase()
  return n
      .split(/\s+/)
      .slice(0, 2)
      .map(s => s[0])
      .join('')
      .toUpperCase()
})

const router = useRouter()
const open = ref(false)
const showUsuarioModal = ref(false)
const close = () => (open.value = false)

async function onLogout() {
  try {
    await auth.logout()
  } finally {
    router.push({ name: 'Login' })
    open.value = false
  }
}

// cierra el menú al cambiar de ruta
const unreg = router.afterEach(() => (open.value = false))
onBeforeUnmount(unreg)

// cierra al presionar Esc
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <header
      class="sticky top-0 z-50 border-b bg-sky-800"
  >
    <nav class="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
      <!-- IZQUIERDA: logos -->
      <div class="flex items-center gap-2 shrink-0">
        <RouterLink to="/" class="flex items-center gap-2">
          <img :src="AristoLogo" alt="Aristo" class="h-7 w-auto" />
          <img :src="IntercoLogo" alt="Interco" class="h-7 w-auto" />
        </RouterLink>
      </div>

      <!-- CENTRO: navItems centrados -->
      <div class="flex-1 flex justify-center">
        <div
            v-if="isAuth"
            class="hidden md:flex items-center gap-2 text-sm overflow-x-auto scrollbar-none"
        >
          <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap
                   border border-transparent"
              :class="isActive(item.to)
              ? 'bg-indigo-500 text-white shadow-sm border-indigo-600'
              : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-400 hover:border-indigo-400'"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </div>

      <!-- DERECHA (desktop: md+) -->
      <div class="hidden md:flex items-center gap-3 shrink-0">
        <RouterLink
            v-if="!isAuth"
            :to="{ name: 'Login' }"
            class="rounded-lg px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          Iniciar sesión
        </RouterLink>

        <div v-else class="flex items-center gap-3">
          <!-- Botón Agregar Usuario (solo para patatas@email.com) -->
          <button
              v-if="auth.user?.email === 'patatas@email.com'"
              @click="showUsuarioModal = true"
              class="rounded-lg px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm"
          >
            + Usuario
          </button>
          
          <div class="hidden lg:flex items-center gap-2">
            <div
                class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400
                     grid place-items-center text-xs font-semibold"
            >
              {{ initials }}
            </div>
            <span class="text-xs opacity-70 truncate max-w-[180px]">
              {{ auth.user?.email }}
            </span>
          </div>
          <button
              @click="onLogout"
              class="rounded-lg px-3 py-1.5 bg-rose-800 hover:bg-rose-400 text-white text-sm"
          >
            Cerrar sesión
          </button>
        </div>

        <ThemeToggle />
      </div>

      <!-- Modal de Usuario -->
      <UsuarioModal
          v-model="showUsuarioModal"
          @usuario-creado="showUsuarioModal = false"
      />

      <!-- HAMBURGUESA (solo móvil/tablet) -->
      <button
          class="md:hidden ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full
               border border-black/10 dark:border-white/10"
          aria-label="Abrir menú"
          @click="open = !open"
      >
        <span v-if="!open">☰</span>
        <span v-else>×</span>
      </button>
    </nav>

    <!-- menú móvil igual que ya lo tenías -->
    <transition name="fade">
      <div v-if="open" class="md:hidden border-t border-black/5 dark:border-white/10">
        <div class="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
          <RouterLink @click="close" to="/" class="py-2">Inicio</RouterLink>

          <template v-if="isAuth">
            <RouterLink
                v-for="item in navItems"
                :key="item.to"
                @click="close"
                :to="item.to"
                class="py-2"
            >
              {{ item.label }}
            </RouterLink>
          </template>

          <div
              class="pt-2 mt-2 border-t border-black/5 dark:border-white/10
                   flex items-center justify-between"
          >
            <span class="text-sm opacity-70">Tema</span>
            <ThemeToggle />
          </div>

          <div class="pt-2 space-y-2">
            <!-- Botón Agregar Usuario (móvil, solo para patatas@email.com) -->
            <button
                v-if="isAuth && auth.user?.email === 'patatas@email.com'"
                @click="showUsuarioModal = true; close()"
                class="inline-flex w-full items-center justify-center rounded-lg px-3 py-2
                     bg-green-600 hover:bg-green-500 text-white text-sm"
            >
              + Agregar Usuario
            </button>

            <RouterLink
                v-if="!isAuth"
                @click="close"
                :to="{ name: 'Login' }"
                class="inline-flex w-full items-center justify-center rounded-lg px-3 py-2
                     bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >
              Iniciar sesión
            </RouterLink>

            <button
                v-else
                @click="onLogout"
                class="inline-flex w-full items-center justify-center rounded-lg px-3 py-2
                     bg-rose-600 hover:bg-rose-500 text-white text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>


<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
