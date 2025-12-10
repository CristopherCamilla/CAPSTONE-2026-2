<!-- src/components/ProductPreviewDialog.vue -->
<template>
  <Dialog
      v-model:visible="visible"
      modal
      :closable="true"
      :dismissableMask="true"
      :draggable="false"
      :style="{ width: '70vw', maxWidth: '950px' }"
  >
    <div v-if="product" class="flex flex-col md:flex-row gap-6">
      <!-- Foto grande -->
      <div class="md:w-2/3 flex items-center justify-center">
        <img
            :src="product.imagenUrl"
            :alt="product.descripcion"
            class="max-h-[65vh] w-auto object-contain"
        />
      </div>

      <!-- Tarjeta de datos (como tu 3ª imagen) -->
      <aside
          class="md:w-1/3 bg-slate-100 text-slate-900 rounded-xl p-4 shadow-lg text-sm flex flex-col gap-2"
      >
        <h3 class="font-semibold text-base mb-2">
          {{ product.codigo }} - {{ product.descripcion }}
        </h3>

        <ul class="space-y-1">
          <li>
            <span class="font-medium">Stock:</span>
            {{ product.stockActual }} pares
          </li>
          <li>
            <span class="font-medium">Proyección:</span>
            {{ product.proyeccionPares }} pares
          </li>
          <li>
            <span class="font-medium">Art. x línea:</span>
            {{ product.articulosLinea }}
          </li>
          <li>
            <span class="font-medium">Proyección línea:</span>
            {{ product.proyeccionLinea }}
          </li>
        </ul>
      </aside>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';

interface Producto {
  id: number | string;
  codigo: string;
  descripcion: string;
  imagenUrl: string;
  stockActual: number;
  proyeccionPares: number;
  articulosLinea: number;
  proyeccionLinea: number;
}

const props = defineProps<{
  modelValue: boolean;
  product: Producto | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});
</script>
