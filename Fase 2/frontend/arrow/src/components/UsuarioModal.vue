<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Agregar Usuario"
    :style="{ width: '500px' }"
    :closable="true"
    @hide="resetForm"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-2">
        <label for="nombre" class="block text-sm font-medium">Nombre *</label>
        <InputText
          id="nombre"
          v-model="form.nombre"
          class="w-full"
          :class="{ 'p-invalid': errors.nombre }"
          placeholder="Ingrese el nombre"
        />
        <small v-if="errors.nombre" class="p-error">{{ errors.nombre }}</small>
      </div>

      <div class="space-y-2">
        <label for="apellido" class="block text-sm font-medium">Apellido *</label>
        <InputText
          id="apellido"
          v-model="form.apellido"
          class="w-full"
          :class="{ 'p-invalid': errors.apellido }"
          placeholder="Ingrese el apellido"
        />
        <small v-if="errors.apellido" class="p-error">{{ errors.apellido }}</small>
      </div>

      <div class="space-y-2">
        <label for="usuario" class="block text-sm font-medium">Usuario *</label>
        <InputText
          id="usuario"
          v-model="form.usuario"
          class="w-full"
          :class="{ 'p-invalid': errors.usuario }"
          placeholder="Ingrese el nombre de usuario"
        />
        <small v-if="errors.usuario" class="p-error">{{ errors.usuario }}</small>
      </div>

      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium">Email *</label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          class="w-full"
          :class="{ 'p-invalid': errors.email }"
          placeholder="usuario@ejemplo.com"
        />
        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
      </div>

      <div class="space-y-2">
        <label for="password" class="block text-sm font-medium">Contraseña *</label>
        <Password
          id="password"
          v-model="form.password"
          class="w-full"
          :class="{ 'p-invalid': errors.password }"
          placeholder="Mínimo 6 caracteres"
          :feedback="true"
          toggleMask
        />
        <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
      </div>

      <div class="space-y-2">
        <label for="rol" class="block text-sm font-medium">Rol *</label>
        <Select
          id="rol"
          v-model="form.rol"
          :options="rolOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          :class="{ 'p-invalid': errors.rol }"
          placeholder="Seleccione un rol"
        />
        <small v-if="errors.rol" class="p-error">{{ errors.rol }}</small>
      </div>

      <div class="space-y-2">
        <label for="estado" class="block text-sm font-medium">Estado *</label>
        <Select
          id="estado"
          v-model="form.estado"
          :options="estadoOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          :class="{ 'p-invalid': errors.estado }"
          placeholder="Seleccione un estado"
        />
        <small v-if="errors.estado" class="p-error">{{ errors.estado }}</small>
      </div>

      <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </form>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        @click="close"
        :disabled="loading"
      />
      <Button
        label="Crear Usuario"
        @click="handleSubmit"
        :loading="loading"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { usuariosService } from '@/services/usuarios'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'usuario-creado'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const errorMessage = ref('')

const form = ref({
  nombre: '',
  apellido: '',
  usuario: '',
  email: '',
  password: '',
  rol: 'usuario' as 'admin' | 'editor' | 'usuario',
  estado: 'activo' as 'activo' | 'inactivo'
})

const errors = ref<Record<string, string>>({})

const rolOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Usuario', value: 'usuario' }
]

const estadoOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' }
]

function validateForm(): boolean {
  errors.value = {}

  if (!form.value.nombre.trim()) {
    errors.value.nombre = 'El nombre es requerido'
  }

  if (!form.value.apellido.trim()) {
    errors.value.apellido = 'El apellido es requerido'
  }

  if (!form.value.usuario.trim()) {
    errors.value.usuario = 'El usuario es requerido'
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'El email es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'El email no es válido'
  }

  if (!form.value.password) {
    errors.value.password = 'La contraseña es requerida'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  errorMessage.value = ''
  // Limpiar errores de campos específicos
  errors.value.email = ''
  errors.value.usuario = ''

  try {
    await usuariosService.create({
      nombre: form.value.nombre.trim(),
      apellido: form.value.apellido.trim(),
      usuario: form.value.usuario.trim(),
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password,
      rol: form.value.rol,
      estado: form.value.estado
    })

    emit('usuario-creado')
    close()
  } catch (error: any) {
    // Manejar errores específicos del backend
    // El backend retorna { message, field } en el body cuando hay duplicados (409)
    if (error?.status === 409) {
      const responseData = error?.details || error?.response?.data || {}
      const field = responseData.field
      const message = responseData.message || error?.message || 'Ya está en uso'
      
      if (field === 'email') {
        errors.value.email = message
      } else if (field === 'usuario') {
        errors.value.usuario = message
      } else {
        errorMessage.value = message
      }
    } else {
      errorMessage.value = error?.message || 'Error al crear el usuario. Por favor, intente nuevamente.'
    }
    console.error('Error creando usuario:', error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    nombre: '',
    apellido: '',
    usuario: '',
    email: '',
    password: '',
    rol: 'usuario',
    estado: 'activo'
  }
  errors.value = {}
  errorMessage.value = ''
}

function close() {
  visible.value = false
  resetForm()
}
</script>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>

