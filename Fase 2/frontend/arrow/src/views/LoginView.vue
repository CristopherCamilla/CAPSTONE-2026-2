<script setup lang="ts">
import { ref } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useAuth } from '@/stores/auth'

const email = ref('')
const password = ref('')
const auth = useAuth()
const router = useRouter()
const route = useRoute()

const errorMsg = ref<string|null>(null)

async function onSubmit(e: Event) {
  e.preventDefault()
  errorMsg.value = null
  try {
    const ok = await auth.login(email.value, password.value)
    if (ok) {
      // ⬇️ usa el redirect si venía de una ruta protegida
      const to = (route.query.redirect as string) || '/report'
      router.replace(to)
    }
  } catch (e:any) {
    errorMsg.value = e?.response?.data?.message || 'No se pudo iniciar sesión'
  }
}
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <!-- ... tu header ... -->

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit="onSubmit">
        <div>
          <label for="email" class="block text-sm/6 font-medium text-[var(--fg)]">Email</label>
          <div class="mt-2">
            <input v-model="email" type="email" id="email" required
                   class="block w-full rounded-md px-3 py-2 text-base
           bg-[var(--input)] text-[var(--fg)]
           outline outline-1 -outline-offset-1 outline-[var(--border)]
           placeholder:text-[var(--muted)]
           focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--ring)] sm:text-sm/6" />
          </div>

          <label for="password" class="block text-sm/6 font-medium text-[var(--fg)]">Contraseña</label>
          <div class="mt-2">
            <input v-model="password" type="password" id="password" required
                   class="block w-full rounded-md px-3 py-2 text-base
           bg-[var(--input)] text-[var(--fg)]
           outline outline-1 -outline-offset-1 outline-[var(--border)]
           placeholder:text-[var(--muted)]
           focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--ring)] sm:text-sm/6" />
          </div>
        </div>

        <div>
          <button type="submit" :disabled="auth.loading"
                  class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold
                   text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-indigo-600 disabled:opacity-60">
            {{ auth.loading ? 'Ingresando…' : 'Iniciar Sesión' }}
          </button>
          <p v-if="auth.error" class="mt-2 text-sm text-red-500">
            {{ auth.error }}
          </p>
        </div>
      </form>
      <!-- ... pie ... -->
    </div>
  </div>
</template>
