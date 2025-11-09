<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30">
      <h1 class="text-xl font-semibold">Tailwind OK</h1>
      <p class="text-sm text-[color:var(--muted)]">Colores cambian con el tema.</p>
    </div>

    <Button label="PrimeVue OK" icon="pi pi-check" />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
