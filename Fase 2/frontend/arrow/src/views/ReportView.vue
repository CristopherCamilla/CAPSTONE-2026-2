<template>
  <section class="container">
    <header class="toolbar">

    </header>
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.container .container--wide{ padding:24px; max-width: none; width: 100%; }
.toolbar{ display:flex; flex-direction: column; max-width: none; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px }
.tabs{ display:flex; gap:8px }
.tab{ padding:8px 12px; border:1px solid #334155; border-radius:8px; text-decoration:none }
.active{ background:#0f172a; color:#fff }


</style>
