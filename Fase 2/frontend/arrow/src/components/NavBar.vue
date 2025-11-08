<template>
  <nav class="nav">
    <div class="nav__left">
      <router-link to="/" class="brand">Arrow</router-link>
      <router-link to="/about" class="link">Acerca</router-link>
    </div>
    <div class="nav__right">
      <ThemeToggle />
    </div>
  </nav>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<style scoped>
.nav{
  position:sticky; top:0; z-index:50;
  display:flex; align-items:center; justify-content:space-between;
  gap:1rem; padding:.75rem 1rem; backdrop-filter:blur(6px);
  border-bottom:1px solid rgba(0,0,0,.06);
}
:root[data-theme="dark"] .nav{ border-color: rgba(255,255,255,.08); }
.brand{ font-weight:700; text-decoration:none; }
.link{ margin-left:1rem; text-decoration:none; opacity:.8; }
.link.router-link-active{ opacity:1; text-decoration:underline; }
</style>
