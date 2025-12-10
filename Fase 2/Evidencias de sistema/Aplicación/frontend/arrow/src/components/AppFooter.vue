<!-- AppFooter.vue -->
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
.footer {
  margin-top: auto;
  padding: 0.75rem 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  border-top: 1px solid rgba(0,0,0,.06);

  /* mismo color que el navbar */
  background: #005b8f;   /* ajusta al hex exacto que uses en el header */
  color: #ffffff;
}

.footer a {
  color: #00da78;        /* verde/celeste suave para el link */
  text-decoration: none;
}
.footer a:hover {
  text-decoration: underline;
}

:root[data-theme="dark"] .footer {
  border-color: rgba(255,255,255,.08);
  background: #003f66;   /* un azul más oscuro para dark mode si quieres */
}
</style>
