<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { listarReportes, type ReportRow } from '@/services/reportes'

const rows = ref<ReportRow[]>([])
const loading = ref(false)
const error = ref<string|null>(null)
const preview = ref<string|null>(null)

function fmtNum(v: unknown, d = 0) {
  const n = Number(v)
  return Number.isFinite(n)
      ? n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d })
      : '-'
}

const columns = [
  { key: 'imagen', label: 'Foto' },
  { key: 'codigo', label: 'Código' },
  { key: 'nombre_color', label: 'Color' },
  { key: 'genero', label: 'Género' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'sub_categoria', label: 'Sub categoría' },
  { key: 'articulos_en_linea', label: 'Artíc. en línea', align: 'right' as const, format: (v:unknown)=>fmtNum(v,0) },
  { key: 'stock_actual', label: 'Stock actual', align: 'right' as const, format: (v:unknown)=>fmtNum(v,0) },
  { key: 'venta_prom_6m_estimada', label: 'Venta prom 6m', align: 'right' as const, format: (v:unknown)=>fmtNum(v,2) },
  { key: 'venta_prom_x_articulo_estimada', label: 'Venta prom x art.', align: 'right' as const, format: (v:unknown)=>fmtNum(v,2) },
]

async function cargar() {
  try {
    loading.value = true
    error.value = null
    rows.value = await listarReportes(200, 0)
  } catch (e:any) {
    error.value = e?.message ?? 'Error cargando reportes'
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="toolbar-sub">
    <button @click="cargar">Actualizar</button>
  </div>

  <div v-if="loading">Cargando…</div>
  <div v-else-if="error" class="error">{{ error }}</div>

  <DataTable v-else :columns="columns" :rows="rows" :rowKey="(r)=>r.codigo">
    <!-- slot del DataTable-->
    <template #cell-imagen="{ row }">
      <img
          v-if="row.imagen"
          :src="row.imagen"
          alt="foto"
          loading="lazy"
          @error="(e:any)=> (e.target as HTMLImageElement).src = '/no-image.png'"
          @click="preview = row.imagen"
      style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:zoom-in"
      />
      <span v-else>—</span>
    </template>
  </DataTable>

  <!-- Modal simple para preview grande -->
  <div v-if="preview" class="overlay" @click="preview=null" @keyup.esc="preview=null" tabindex="0">
    <img :src="preview" alt="preview" @click.stop />
  </div>
</template>

<style scoped>
/* overlay a pantalla completa */
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;               /* encima de la tabla con overflow */
}
.overlay img{
  max-width: 92vw;
  max-height: 92vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
</style>
