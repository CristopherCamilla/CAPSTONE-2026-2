<template>
  <button class="theme-toggle" @click="toggle()" :title="theme==='dark'?'Cambiar a claro':'Cambiar a oscuro'">
    <span v-if="theme==='dark'">🌙</span>
    <span v-else>☀️</span>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
const { theme, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle{
  border:1px solid rgba(0,0,0,.12);
  padding:.5rem .75rem; border-radius:999px; background:transparent; cursor:pointer;
}
:root[data-theme="dark"] .theme-toggle{ border-color: rgba(255,255,255,.25); }
</style>
