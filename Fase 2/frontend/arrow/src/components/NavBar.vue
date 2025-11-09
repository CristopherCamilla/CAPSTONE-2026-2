<!-- src/components/Navbar.vue -->
<template>
  <header class="sticky top-0 z-50 backdrop-blur border-b border-black/5 dark:border-white/10">
    <nav class="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
      <!-- izquierda -->
      <div class="flex items-center gap-3 min-w-0">
        <RouterLink to="/" class="font-bold truncate">Arrow</RouterLink>
        <div class="hidden sm:flex items-center gap-4">
          <RouterLink to="/about" class="opacity-80 hover:opacity-100">Acerca</RouterLink>
          <!-- agrega más enlaces -->
        </div>
      </div>

      <!-- derecha (desktop) -->
      <div class="hidden sm:flex items-center gap-3">
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
          <div class="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
            <span class="text-sm opacity-70">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const open = ref(false)
const close = () => (open.value = false)

// cierra el menú al cambiar de ruta
import { useRouter } from 'vue-router'
const router = useRouter()
const unreg = router.afterEach(() => (open.value = false))
onBeforeUnmount(unreg)

// cierra al presionar Esc
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
