
<script setup lang="ts">

type Column<Row> = {
  key: string;                 // id de la columna
  label: string;               // encabezado visible
  align?: "left"|"right"|"center";
  width?: string;
  accessor?: ((row: Row) => unknown) | keyof Row;  // string o función
  format?: (v: unknown, row: Row) => string;       // formateo opcional
};

const props = defineProps<{
  columns: Column<any>[];
  rows: any[];
  rowKey?: (row: any, idx: number) => string | number;
}>();

const rk = (row: any, i: number) =>
    props.rowKey ? props.rowKey(row, i) : row.id ?? i;

function cellValue(col: any, row: any) {
  let v = typeof col.accessor === "function"
      ? col.accessor(row)
      : col.accessor
          ? row[col.accessor as string]
          : row[col.key];
  return col.format ? col.format(v, row) : v;
}
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
      <tr>
        <th v-for="c in columns" :key="c.key" :style="{width:c.width}" :class="c.align">{{ c.label }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row,i) in rows" :key="rk(row,i)">
        <td v-for="c in columns" :key="c.key" :class="c.align">
          <slot :name="`cell-${c.key}`" :row="row" :value="cellValue(c,row)">
            {{ cellValue(c,row) }}
          </slot>
        </td>
      </tr>
      <tr v-if="rows.length===0">
        <td :colspan="columns.length" class="empty">Sin datos</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap{overflow:auto}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #0a3393;padding:8px}
thead th{background: #868686
}
.left{text-align:left}.right{text-align:right}.center{text-align:center}
.empty{text-align:center;color:#777;padding:16px}
</style>
