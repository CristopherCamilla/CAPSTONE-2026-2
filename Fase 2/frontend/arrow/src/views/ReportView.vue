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

const fmt = (n:number, d=0)=>
    n.toLocaleString("es-CL",{maximumFractionDigits:d,minimumFractionDigits:d});

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
    const res = await fetch("/api/reportes");
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
  { key: "id", label: "código-color" },
  { key: "stock", label: "stock", align: "right", format: (v:number) => fmt(v as number) },
  { key: "ventaPromCategoria", label: "venta prom x categoría", align: "right", format: (v) => fmt(v as number) },
  { key: "min", label: "min", align: "right", format: (v) => fmt(v as number) },
  { key: "max", label: "max", align: "right", format: (v) => fmt(v as number) },
  { key: "factColor", label: "fact x color", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "factCatego", label: "fact x catego", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "factGenero", label: "fact x género", align: "right", format: (v) => fmt(v as number, 2) },
  { key: "factExtra", label: "fact x nose", align: "right", format: (v) => fmt(v as number, 2) },
  {
    key: "totalFactor",
    label: "suma total factor",
    align: "right",
    accessor: (row: Item) => totalFactor(row),
    format: (v) => fmt(v as number, 2),
  },
  {
    key: "cantidadProyectada",
    label: "cantidad proyectada",
    align: "right",
    accessor: (row: Item) => proyectada(row),
    format: (v) => fmt(v as number),
  },
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
