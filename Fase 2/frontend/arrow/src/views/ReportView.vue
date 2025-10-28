<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import DataTable from "../components/DataTable.vue";

type Item = {
  id: string;
  stock: number;
  ventaPromCategoria: number;
  min: number;
  max: number;
  factColor: number;
  factCatego: number;
  factGenero: number;
  factExtra: number;
};

/*Calculo*/
const weights = reactive({ wColor: 25, wCatego: 25, wGenero: 25, wExtra: 25 });
const sumPesos = computed(() => Math.max(1, weights.wColor + weights.wCatego + weights.wGenero + weights.wExtra));
const W = (p: number) => p / sumPesos.value;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const totalFactor = (r:Item) =>
    r.factColor*W(weights.wColor) +
    r.factCatego*W(weights.wCatego) +
    r.factGenero*W(weights.wGenero) +
    r.factExtra*W(weights.wExtra);

const proyectada = (r:Item) =>
    clamp(Math.round(r.ventaPromCategoria * totalFactor(r)), r.min, r.max);

const fmt = (n: number | undefined, d = 0) => {
  if (n === undefined || n === null) return '-'; // O un valor predeterminado
  return n.toLocaleString("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d });
};

/*Estados para cargas del backend*/
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/* Función que llama a tu API */
async function obtenerDatos() {
  loading.value = true;
  error.value = null;
  try {
    // Reemplaza '/api/reportes' por tu endpoint real
    const res = await fetch("/api/proyeccion_ventas_total");
    if (!res.ok) throw new Error("No se pudo obtener datos del servidor");
    const data = (await res.json()) as Item[];
    items.value = data;
  } catch (e: any) {
    error.value = e.message;
    items.value = [];    // deja la tabla vacía en caso de error
  } finally {
    loading.value = false;
  }
}

/* Cargar datos al montar la vista */
onMounted(() => {
  obtenerDatos();
});

// Definición de columnas (inyectas etiquetas y cálculos)
const columns = [
  { key: "id", label: "id" },
  { key: "id_linea", label: "id_linea", align: "right", format: (v:number) => fmt(v as number) },
  { key: "color", label: "color", align: "right", format: (v) => fmt(v as string) },
  { key: "genero", label: "genero", align: "right", format: (v) => fmt(v as string) },
  { key: "categoria", label: "categoria", align: "right", format: (v) => fmt(v as string) },
  { key: "sub_categoria", label: "sub_categoria", align: "right", format: (v) => fmt(v as string, 2) },
  { key: "articulos_en_linea", label: "articulos_en_linea", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "ventas_prom_6m_estimado", label: "ventas_prom_6m_estimado", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "ventas_prom_x_articulo_stimado", label: "ventas_prom_x_articulo_stimado", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "fecha_proyeccion", label: "fecha_proyeccion", align: "right", format: (v) => fmt(v as string, 2) },
];

</script>

<template>
  <!-- Botón para recargar manualmente los datos -->
  <button @click="obtenerDatos">Actualizar datos</button>

  <!-- Indicadores de carga y error -->
  <div v-if="loading">Cargando datos…</div>
  <div v-else-if="error" class="error">{{ error }}</div>

  <!-- La tabla se vacía automáticamente si items.length === 0 -->
  <DataTable :columns="columns" :rows="items" />
</template>
