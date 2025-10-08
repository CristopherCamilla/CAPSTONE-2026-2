<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import DataTable from "../components/DataTable.vue";

type Item = {
  id: string; stock: number; ventaPromCategoria: number; min: number; max: number;
  factColor: number; factCatego: number; factGenero: number; factExtra: number;
};

const weights = reactive({ wColor:25, wCatego:25, wGenero:25, wExtra:25 });

const items = ref<Item[]>([
  { id:"9999-02", stock:100, ventaPromCategoria:5000, min:850, max:2500, factColor:1.00, factCatego:0.90, factGenero:1.10, factExtra:0.15 },
  { id:"9999-03", stock:60,  ventaPromCategoria:2200, min:400, max:1600, factColor:0.95, factCatego:0.85, factGenero:1.00, factExtra:0.10 },
  { id:"9999-16", stock:20,  ventaPromCategoria:800,  min:150, max:700,  factColor:1.10, factCatego:0.80, factGenero:0.90, factExtra:0.05 },
]);

const sumPesos = computed(() =>
    Math.max(1, weights.wColor + weights.wCatego + weights.wGenero + weights.wExtra)
);
const W = (p:number)=> p/sumPesos.value;
const clamp = (v:number, lo:number, hi:number)=> Math.min(Math.max(v,lo),hi);

const totalFactor = (r:Item) =>
    r.factColor*W(weights.wColor) +
    r.factCatego*W(weights.wCatego) +
    r.factGenero*W(weights.wGenero) +
    r.factExtra*W(weights.wExtra);

const proyectada = (r:Item) =>
    clamp(Math.round(r.ventaPromCategoria * totalFactor(r)), r.min, r.max);

const fmt = (n:number, d=0)=> n.toLocaleString("es-CL",{maximumFractionDigits:d,minimumFractionDigits:d});

// Definición de columnas (inyectas etiquetas y cálculos aquí)
const columns = [
  { key:"id", label:"código-color" },
  { key:"stock", label:"stock", align:"right", format:(v)=>fmt(v as number) },
  { key:"ventaPromCategoria", label:"venta prom x categoría", align:"right", format:(v)=>fmt(v as number) },
  { key:"min", label:"min", align:"right", format:(v)=>fmt(v as number) },
  { key:"max", label:"max", align:"right", format:(v)=>fmt(v as number) },
  { key:"factColor", label:"fact x color", align:"right", format:(v,row)=>fmt(v as number,2) },
  { key:"factCatego", label:"fact x catego", align:"right", format:(v)=>fmt(v as number,2) },
  { key:"factGenero", label:"fact x género", align:"right", format:(v)=>fmt(v as number,2) },
  { key:"factExtra", label:"fact x nose", align:"right", format:(v)=>fmt(v as number,2) },
  { key:"totalFactor", label:"suma total factor", align:"right",
    accessor: (row:Item)=> totalFactor(row), format:(v)=>fmt(v as number,2)
  },
  { key:"cantidadProyectada", label:"cantidad proyectada", align:"right",
    accessor: (row:Item)=> proyectada(row), format:(v)=>fmt(v as number)
  },
];
</script>

<template>
  <!-- controles de pesos, filtros, etc. arriba… -->
  <DataTable :columns="columns" :rows="items" />
</template>
