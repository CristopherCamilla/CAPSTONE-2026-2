<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const email = ref('')
const password = ref('')
const auth = useAuth()
const router = useRouter()

const errorMsg = ref<string|null>(null)

async function onSubmit(e: Event) {
  e.preventDefault()
  errorMsg.value = null
  try {
    const ok = await auth.login(email.value, password.value)
    if (ok) router.push('/')
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
          <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Email</label>
          <div class="mt-2">
            <input v-model="email" type="email" id="email" required
                   class="block w-full rounded-md bg-white px-3 py-1.5 text-base
                     text-gray-900 outline-1 -outline-offset-1 outline-gray-300
                     placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2
                     focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white
                     dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Contraseña</label>
          <div class="mt-2">
            <input v-model="password" type="password" id="password" required
                   class="block w-full rounded-md bg-white px-3 py-1.5 text-base
                     text-gray-900 outline-1 -outline-offset-1 outline-gray-300
                     placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2
                     focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white
                     dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
          </div>
        </div>

        <div>
          <button type="submit" :disabled="auth.loading"
                  class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold
                   text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-indigo-600 disabled:opacity-60">
            {{ auth.loading ? 'Ingresando…' : 'Iniciar Sesión' }}
          </button>
          <p v-if="errorMsg" class="mt-3 text-sm text-red-500">{{ errorMsg }}</p>
        </div>
      </form>
      <!-- ... pie ... -->
    </div>
  </div>
</template>
