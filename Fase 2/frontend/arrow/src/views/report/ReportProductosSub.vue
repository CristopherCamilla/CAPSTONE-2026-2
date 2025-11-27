<!-- ReportProductosSub -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Image from 'primevue/image'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

import {
  listarReportes,
  type ReportRow,
  type ReportFilters,
  obtenerOpcionesFiltros
} from '@/services/reportes'

const rows = ref<ReportRow[]>([])
const totalRows = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

const filters = ref<ReportFilters>({
  codigo: '',
  genero: '',
  categoria: '',
  subcategoria: '',
})

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function limpiar() {
  filters.value = {
    codigo: '',
    genero: '',
    categoria: '',
    subcategoria: ''
  }
  cargar()
}

function fmtNum(v: unknown, d = 0) {
  const n = Number(v)
  return Number.isFinite(n)
      ? n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d })
      : '—'
}

async function cargar() {
  const MIN_LOADING_MS = 1200
  const start = performance.now()
  try {
    loading.value = true
    error.value = null

    const validFilters = {
      codigo: filters.value.codigo?.trim() || '',
      genero: filters.value.genero?.trim() || '',
      categoria: filters.value.categoria?.trim() || '',
      subcategoria: filters.value.subcategoria?.trim() || '',
    }

    const appliedFilters = Object.values(validFilters).every(f => f === '')

    if (appliedFilters) {
      const { items, total } = await listarReportes(1200, 0)
      rows.value = items
      totalRows.value = total
    } else {
      const { items, total } = await listarReportes(1200, 0, validFilters)
      rows.value = items
      totalRows.value = total
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Error cargando reportes'
    rows.value = []
    totalRows.value = 0
  } finally {
    const elapsed = performance.now() - start
    const remaining = MIN_LOADING_MS - elapsed
    if (remaining > 0) {
      await sleep(remaining)
    }
    loading.value = false
  }
}

type Opt = { label: string; value: string }

const generoOpts       = ref<Opt[]>([])
const categoriaOpts    = ref<Opt[]>([])
const subcategoriaOpts = ref<Opt[]>([])

function toOpts(values: string[]): Opt[] {
  return values.map(v => ({ label: v, value: v }))
}

async function cargarFiltros() {
  try {
    const { generos, categorias, subcategorias } = await obtenerOpcionesFiltros()
    generoOpts.value       = toOpts(generos)
    categoriaOpts.value    = toOpts(categorias)
    subcategoriaOpts.value = toOpts(subcategorias)
  } catch (e: any) {
    console.error('Error cargando filtros:', e)
  }
}

/* ====== ESTADO PARA EL MODAL ====== */
const previewVisible = ref(false)
const selectedRow = ref<ReportRow | null>(null)

function abrirPreview(row: ReportRow) {
  selectedRow.value = row
  previewVisible.value = true
}

onMounted(() => {
  cargarFiltros()
  cargar()
})
</script>

<template>
  <section class="w-full px-2 sm:px-4 py-3 space-y-3">
    <!-- FILTROS -->
    <div
        class="flex flex-wrap gap-2 items-end sm:items-center
             bg-slate-50/70 dark:bg-slate-900/40 rounded-lg p-2 sm:p-3"
    >
      <InputText
          placeholder="Código"
          v-model.trim="filters.codigo"
          class="w-full xs:w-32 sm:w-40"
      />

      <Select
          v-model="filters.genero"
          :options="generoOpts"
          optionLabel="label"
          optionValue="value"
          placeholder="Género"
          showClear
          class="w-full xs:w-40 sm:w-44"
      />

      <Select
          v-model="filters.categoria"
          :options="categoriaOpts"
          optionLabel="label"
          optionValue="value"
          placeholder="Categoría"
          showClear
          class="w-full xs:w-44 sm:w-48"
      />

      <Select
          v-model="filters.subcategoria"
          :options="subcategoriaOpts"
          optionLabel="label"
          optionValue="value"
          placeholder="Subcategoría"
          showClear
          class="w-full xs:w-44 sm:w-48"
      />

      <div class="flex flex-wrap gap-2">
        <Button label="Buscar" icon="pi pi-search" @click="cargar" />
        <Button label="Borrar" severity="secondary" @click="limpiar" />
      </div>
    </div>

    <!-- INFO DE RESULTADOS -->
    <div
        v-if="!loading && !error"
        class="text-xs text-slate-600 dark:text-slate-300 px-1"
    >
      Mostrando {{ rows.length }} de {{ totalRows }} productos
    </div>

    <!-- ESTADOS -->
    <div
        v-if="loading"
        class="flex flex-col items-center justify-center w-full py-16 gap-3"
    >
      <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
      <span class="text-sm text-slate-600 dark:text-slate-200">
        Cargando reportes…
      </span>
    </div>

    <div v-else-if="error" class="error text-sm">
      {{ error }}
    </div>

    <!-- TABLA -->
    <div
        v-else
        class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"
    >
      <DataTable
          :value="rows"
          dataKey="row_id"
          paginator
          :rows="20"
          :rowsPerPageOptions="[10,20,50,100]"
          stripedRows
          removableSort
          :loading="loading"
          :virtualScrollerOptions="{ itemSize: 56 }"
          responsiveLayout="scroll"
          breakpoint="960px"
          class="min-w-[900px] text-xs sm:text-sm"
      >
        <template #empty>Sin resultados.</template>

        <!-- FOTO: ahora abre el modal personalizado -->
        <Column header="Foto" style="width: 150px">
          <template #body="{ data }">
            <div
                class="w-16 h-16 flex items-center justify-center cursor-pointer
                     transition-transform hover:scale-110"
                @click="abrirPreview(data)"
            >
              <img
                  :src="data.imagen || '/no-image.png'"
                  alt="foto"
                  class="max-h-16 max-w-16 object-contain rounded-md bg-black/90 p-[1px]"
              />
            </div>
          </template>
        </Column>

        <Column field="codigo" header="Código" sortable style="min-width: 80px" />
        <Column field="nombre_color" header="Color" sortable style="min-width: 110px" />
        <Column field="genero" header="Género" sortable style="min-width: 110px" />
        <Column field="categoria" header="Categoría" sortable style="min-width: 130px" />
        <Column field="sub_categoria" header="Sub categoría" sortable style="min-width: 140px" />

        <Column
            field="articulos_en_linea"
            header="Artíc. en línea"
            sortable
            dataType="numeric"
            style="min-width: 110px; text-align: right"
        >
          <template #body="{ data }">
            {{ fmtNum(data.articulos_en_linea, 0) }}
          </template>
        </Column>

        <Column
            field="stock_actual"
            header="Stock actual"
            sortable
            dataType="numeric"
            style="min-width: 110px; text-align: right"
        >
          <template #body="{ data }">
            {{ fmtNum(data.stock_actual, 0) }}
          </template>
        </Column>

        <Column
            field="venta_prom_6m_estimada"
            header="Venta prom 6m"
            sortable
            dataType="numeric"
            style="min-width: 130px; text-align: right"
        >
          <template #body="{ data }">
            {{ fmtNum(data.venta_prom_6m_estimada, 2) }}
          </template>
        </Column>

        <Column
            field="venta_prom_x_articulo_estimada"
            header="Venta prom x art."
            sortable
            dataType="numeric"
            style="min-width: 140px; text-align: right"
        >
          <template #body="{ data }">
            {{ fmtNum(data.venta_prom_x_articulo_estimada, 2) }}
          </template>
        </Column>
      </DataTable>

      <!-- MODAL DE PREVIEW -->
      <Dialog
          v-model:visible="previewVisible"
          modal
          :closable="true"
          :dismissableMask="true"
          :draggable="false"
          :style="{ width: '70vw', maxWidth: '950px' }"
      >
        <div v-if="selectedRow" class="flex flex-col md:flex-row gap-6">
          <!-- Foto grande -->
          <div class="md:w-2/3 flex items-center justify-center">
            <img
                :src="selectedRow.imagen || '/no-image.png'"
                :alt="selectedRow.codigo"
                class="max-h-[65vh] w-auto object-contain"
            />
          </div>

          <!-- Tarjeta de datos -->
          <aside
              class="md:w-1/3 bg-slate-100 text-slate-900 rounded-xl p-4 shadow-lg
                   text-sm flex flex-col gap-2"
          >
            <h3 class="font-semibold text-base mb-2">
              {{ selectedRow.codigo }} — {{ selectedRow.nombre_color }}
            </h3>

            <ul class="space-y-1">
              <li>
                <span class="font-medium">Género:</span>
                {{ selectedRow.genero }}
              </li>
              <li>
                <span class="font-medium">Categoría:</span>
                {{ selectedRow.categoria }} / {{ selectedRow.sub_categoria }}
              </li>
              <li>
                <span class="font-medium">Stock:</span>
                {{ fmtNum(selectedRow.stock_actual, 0) }} pares
              </li>
              <li>
                <span class="font-medium">Proyección 6m:</span>
                {{ fmtNum(selectedRow.venta_prom_6m_estimada, 0) }} pares
              </li>
              <li>
                <span class="font-medium">Art. x línea:</span>
                {{ fmtNum(selectedRow.articulos_en_linea, 0) }}
              </li>
              <li>
                <span class="font-medium">Venta prom x art.:</span>
                {{ fmtNum(selectedRow.venta_prom_x_articulo_estimada, 2) }}
              </li>
            </ul>
          </aside>
        </div>
      </Dialog>
    </div>
  </section>
</template>

<style scoped>
.error {
  color: #ef4444;
}
</style>
