<!-- src/components/FiltersBar.vue -->
<script setup lang="ts">
import { reactive, toRefs } from 'vue'

type Filters = {
  codigo: string
  genero: string|null
  categoria: string|null
  subcategoria: string|null
}

const props = withDefaults(defineProps<{
  modelValue: Filters,
  generos?: string[],
  categorias?: string[],
  subcategorias?: string[],
}>(), {
  generos: () => ['MUJER','HOMBRE','NIÑO','UNISEX'],
  categorias: () => [],
  subcategorias: () => [],
})

const emit = defineEmits<{
  (e:'update:modelValue', v:Filters): void
  (e:'search'): void
  (e:'reset'): void
}>()

const local = reactive<Filters>({ ...props.modelValue })

function sync<K extends keyof Filters>(k:K, v:Filters[K]){
  (local[k] as any) = v
  emit('update:modelValue', local)
}
function onReset(){
  local.codigo=''; local.genero=null; local.categoria=null; local.subcategoria=null
  emit('update:modelValue', local); emit('reset')
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <input
        class="rounded-md border px-3 py-2 text-sm"
        placeholder="Código"
        :value="local.codigo"
        @input="sync('codigo', ($event.target as HTMLInputElement).value)"
    />

    <select class="rounded-md border px-3 py-2 text-sm"
            :value="local.genero"
            @change="sync('genero', ($event.target as HTMLSelectElement).value || null)">
      <option value="">Género</option>
      <option v-for="g in generos" :key="g" :value="g">{{ g }}</option>
    </select>

    <select class="rounded-md border px-3 py-2 text-sm"
            :value="local.categoria"
            @change="sync('categoria', ($event.target as HTMLSelectElement).value || null)">
      <option value="">Categoría</option>
      <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
    </select>

    <select class="rounded-md border px-3 py-2 text-sm"
            :value="local.subcategoria"
            @change="sync('subcategoria', ($event.target as HTMLSelectElement).value || null)">
      <option value="">Subcategoría</option>
      <option v-for="s in subcategorias" :key="s" :value="s">{{ s }}</option>
    </select>

    <button class="rounded-md bg-blue-600 text-white px-3 py-2 text-sm"
            @click="$emit('search')">Buscar</button>
    <button class="rounded-md bg-slate-500 text-white/90 px-3 py-2 text-sm"
            @click="onReset">Borrar</button>
  </div>
</template>
