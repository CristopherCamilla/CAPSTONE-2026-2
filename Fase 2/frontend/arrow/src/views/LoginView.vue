<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useAuth } from '@/stores/auth'
import ProgressSpinner from 'primevue/progressspinner'

const email = ref('')
const password = ref('')
const auth = useAuth()
const router = useRouter()
const route = useRoute()

const errorMsg = ref<string|null>(null)

async function onSubmit(e: Event) {
  e.preventDefault()

  // limpiamos error anterior
  auth.error = ''

  try {
    const ok = await auth.login(email.value, password.value)
    if (ok) {
      const to = (route.query.redirect as string) || '/report/resumen'
      router.replace(to)
    }
  } catch (e:any) {
    errorMsg.value = e?.response?.data?.message || 'No se pudo iniciar sesión'
  }
}
</script>

<template>
  <div class="relative flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit="onSubmit">
        <div>
          <label for="email" class="block text-sm/6 font-medium text-slate-900">Email</label>
          <div class="mt-2">
            <input
                v-model="email"
                type="email"
                id="email"
                required
                class="block w-full rounded-md px-3 py-2 text-base
                     text-slate-900
                     border border-slate-300 dark:border-slate-700
                     outline outline-1 -outline-offset-1 outline-[var(--border)]
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm/6"
            />
          </div>

          <label for="password" class="mt-4 block text-sm/6 font-medium text-slate-900">
            Contraseña
          </label>
          <div class="mt-2">
            <input
                v-model="password"
                type="password"
                id="password"
                required
                class="block w-full rounded-md px-3 py-2 text-base
                     text-slate-900
                     border border-slate-300 dark:border-slate-700
                     outline outline-1 -outline-offset-1 outline-[var(--border)]
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div>
          <button
              type="submit"
              :disabled="auth.loading"
              class="flex w-full items-center justify-center gap-2
                   rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold
                   text-white shadow-xs hover:bg-indigo-500
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-indigo-600 disabled:opacity-60"
          >
            <ProgressSpinner
                v-if="auth.loading"
                style="width:18px;height:18px"
                strokeWidth="4"
            />
            <span>
              {{ auth.loading ? 'Ingresando…' : 'Iniciar sesión' }}
            </span>
          </button>

          <p v-if="auth.error" class="mt-2 text-sm text-red-500">
            {{ auth.error }}
          </p>
        </div>
      </form>
    </div>

    <!-- overlay global mientras se hace login (opcional, pero queda pro) -->
    <teleport to="body">
      <div
          v-if="auth.loading"
          class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40"
      >
        <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
        <span class="mt-3 text-sm text-white">
          Iniciando sesión…
        </span>
      </div>
    </teleport>
  </div>
</template>
