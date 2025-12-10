<!-- src/views/report/DetalleSub.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import DataTable from "../../components/DataTable.vue";

type Item = {
  id: number;
  id_linea: string;
  color: string;
  genero: string;
  categoria: string;
  sub_categoria: string;
  articulos_en_linea: number | string;
  ventas_prom_6m_estimado: number | string;
  ventas_prom_x_articulo_stimado: number | string;
  fecha_proyeccion: string;
};

/* Estado */
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/* Formateador */
function fmt(v: unknown, d = 0): string {
  if (v === null || v === undefined) return "-";
  const n = Number(v as any);
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    return n.toLocaleString("es-CL", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }
  return String(v);
}

/* Carga */
async function obtenerDatos() {
  try {
    loading.value = true;
    error.value = null;

    const res = await fetch("/api/proyeccion_ventas_total");
    if (!res.ok) throw new Error("No se pudo obtener datos del servidor");

    const raw = (await res.json()) as any[];

    const mapped: Item[] = (raw ?? []).map(r => ({
      id: r.id,
      id_linea: r.id_linea,
      color: r.Color ?? null,
      genero: r.Genero ?? null,
      categoria: r.Categoria ?? null,
      sub_categoria: r.SubCategoria ?? null,
      articulos_en_linea: r.articulos_en_linea ?? null,
      ventas_prom_6m_estimado: r.venta_prom_6m_estimada ?? null,
      ventas_prom_x_articulo_stimado: r.venta_prom_x_articulo_estimada ?? null,
      fecha_proyeccion: r.fecha_proyeccion ?? null,
    }));

    items.value = mapped;
  } catch (e: any) {
    error.value = e?.message ?? "Error desconocido";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(obtenerDatos);

/* Columnas */
const columns = [
  { key: "id", label: "ID", align: "left" as const },
  { key: "id_linea", label: "ID Línea", align: "left" as const },
  { key: "color", label: "Color", align: "left" as const },
  { key: "genero", label: "Género", align: "left" as const },
  { key: "categoria", label: "Categoría", align: "left" as const },
  { key: "sub_categoria", label: "Sub categoría", align: "left" as const },
  { key: "articulos_en_linea", label: "Artículos en línea", align: "right" as const, format: (v: unknown) => fmt(v, 0) },
  { key: "ventas_prom_6m_estimado", label: "Ventas prom 6m", align: "right" as const, format: (v: unknown) => fmt(v, 2) },
  { key: "ventas_prom_x_articulo_stimado", label: "Ventas prom x art.", align: "right" as const, format: (v: unknown) => fmt(v, 2) },
  { key: "fecha_proyeccion", label: "Fecha proyección", align: "left" as const, format: (v: unknown) => fmt(v) },
];
</script>

<template>
  <div>
    <button class="text-black" @click="obtenerDatos">Actualizar datos</button>

    <div class="text-black" v-if="loading">Cargando datos…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <DataTable class="text-black " :columns="columns" :rows="items" :rowKey="(r)=>r.id" />
  </div>
</template>

<style scoped>
.error{ color:#b91c1c; margin:8px 0 }
button{ margin-bottom:12px }
</style>
