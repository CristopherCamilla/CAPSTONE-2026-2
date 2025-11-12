<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Image from 'primevue/image'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { listarReportes, type ReportRow } from '@/services/reportes'

const rows = ref<ReportRow[]>([])
const loading = ref(false)
const error = ref<string|null>(null)

const filters = ref({
  codigo: '',
  genero: '',
  categoria: '',
  subcategoria: '',
})

function fmtNum(v: unknown, d = 0) {
  const n = Number(v)
  return Number.isFinite(n)
      ? n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d })
      : '—'
}

async function cargar() {
  try {
    loading.value = true
    error.value = null
    console.log('Filtros: ', filters.value)

    // Verificar si los filtros están vacíos
    const validFilters = {
      codigo: filters.value.codigo.trim() || '',  // Si está vacío, lo dejamos vacío
      genero: filters.value.genero?.trim() || '',  // Eliminar espacios de genero
      categoria: filters.value.categoria?.trim() || '',  // Eliminar espacios de categoria
      subcategoria: filters.value.subcategoria?.trim() || '',  // Eliminar espacios de subcategoria
    }
    console.log("Filtros antes de enviar al backend: ", validFilters);
    // Si todos los filtros son vacíos, no enviar ninguno
    const appliedFilters = Object.values(validFilters).every(f => f === '')

    if (appliedFilters) {
      // Si no hay filtros aplicados, obtener todos los productos
      rows.value = await listarReportes(200, 0)  // Se pueden pasar los valores por defecto
      console.log('Datos cargados sin filtro:', rows.value)
    } else {
      // Si hay filtros, enviar los filtros aplicados
      rows.value = await listarReportes(200, 0, validFilters)
      console.log('Datos cargados con filtro:', rows.value)
    }
  } catch (e:any) {
    error.value = e?.message ?? 'Error cargando reportes'
    rows.value = []
  } finally {
    loading.value = false
  }
}


function limpiar() {
  // Reiniciar los filtros a sus valores predeterminados
  filters.value = {
    codigo: '',
    genero: '',
    categoria: '',
    subcategoria: ''
  };
  console.log('limpieza ', filters.value)
  // Volver a cargar los productos sin aplicar ningún filtro
  cargar();
}

/* Opciones de selects deducidas de los datos */
type Opt = { label: string; value: string }

function toOpts(values: (string | null | undefined)[]): Opt[] {
  const uniq = Array.from(new Set(values.filter((x): x is string => !!x))).sort()
  return uniq.map(v => ({ label: v, value: v }))
}

const generos       = computed<Opt[]>(() => toOpts((rows.value ?? []).map(r => r.genero)))
const categorias    = computed<Opt[]>(() => toOpts((rows.value ?? []).map(r => r.categoria)))
const subcategorias = computed<Opt[]>(() => toOpts((rows.value ?? []).map(r => r.sub_categoria)))

</script>

<template>
  <!-- Barra de filtros -->
  <div class="flex flex-wrap gap-2 items-center mb-3">
    <InputText
        placeholder="Código"
        v-model.trim="filters.codigo"
        class="w-40"
    />

    <Select
        v-model="filters.genero"
        :options="generos ?? []"
        optionLabel="label"
        optionValue="value"
        placeholder="Género"
        showClear
        class="w-44"
    />

    <Select
        v-model="filters.categoria"
        :options="categorias ?? []"
        optionLabel="label"
        optionValue="value"
        placeholder="Categoría"
        showClear
        class="w-48"
    />

    <Select
        v-model="filters.subcategoria"
        :options="subcategorias ?? []"
        optionLabel="label"
        optionValue="value"
        placeholder="Subcategoría"
        showClear
        class="w-48"
    />

    <Button label="Buscar" icon="pi pi-search" @click="cargar" />
    <Button label="Borrar" severity="secondary" @click="limpiar" />
  </div>

  <div v-if="loading">Cargando…</div>
  <div v-else-if="error" class="error">{{ error }}</div>

  <DataTable
      v-else
      :value="rows"
      dataKey="codigo"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10,20,50,100]"
      stripedRows
      removableSort
      :loading="loading"
      :virtualScrollerOptions="{ itemSize: 56 }"
      class="w-full"
  >
    <template #empty>Sin resultados.</template>

    <Column header="Foto" style="width: 84px">
      <template #body="{ data }">
        <Image
            :src="data.imagen || '/no-image.png'"
            alt="foto"
            preview
            :imageStyle="{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }"
        />
      </template>
    </Column>

    <Column field="codigo" header="Código" sortable />
    <Column field="nombre_color" header="Color" sortable />
    <Column field="genero" header="Género" sortable />
    <Column field="categoria" header="Categoría" sortable />
    <Column field="sub_categoria" header="Sub categoría" sortable />

    <Column field="articulos_en_linea" header="Artíc. en línea" sortable dataType="numeric" style="text-align:right">
      <template #body="{ data }">{{ fmtNum(data.articulos_en_linea, 0) }}</template>
    </Column>

    <Column field="stock_actual" header="Stock actual" sortable dataType="numeric" style="text-align:right">
      <template #body="{ data }">{{ fmtNum(data.stock_actual, 0) }}</template>
    </Column>

    <Column field="venta_prom_6m_estimada" header="Venta prom 6m" sortable dataType="numeric" style="text-align:right">
      <template #body="{ data }">{{ fmtNum(data.venta_prom_6m_estimada, 2) }}</template>
    </Column>

    <Column field="venta_prom_x_articulo_estimada" header="Venta prom x art." sortable dataType="numeric" style="text-align:right">
      <template #body="{ data }">{{ fmtNum(data.venta_prom_x_articulo_estimada, 2) }}</template>
    </Column>
  </DataTable>
</template>

<style scoped>
.error { color: #ef4444; }
</style>
