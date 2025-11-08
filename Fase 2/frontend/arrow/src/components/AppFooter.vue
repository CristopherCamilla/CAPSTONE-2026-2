<template>
  <footer class="footer">
    <span>© {{ year }} Proyecto Arrow</span>
    <a href="https://example.com" target="_blank" rel="noreferrer">Soporte</a>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.footer{
  margin-top:auto; padding:1rem; display:flex; gap:1rem; justify-content:center;
  border-top:1px solid rgba(0,0,0,.06);
}
:root[data-theme="dark"] .footer{ border-color: rgba(255,255,255,.08); }
</style>
