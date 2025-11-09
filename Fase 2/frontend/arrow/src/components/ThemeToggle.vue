<template>
  <button
      :class="btnClass"
      :title="theme==='dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'"
      aria-label="Cambiar tema"
      @click="toggle()"
  >
    <span v-if="theme==='dark'">🌙</span>
    <span v-else>☀️</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = withDefaults(defineProps<{
  variant?: 'inline' | 'floating'
}>(), { variant: 'inline' })

const { theme, toggle } = useTheme()

const btnClass = computed(() =>
    props.variant === 'floating'
        ? 'inline-flex h-10 w-10 items-center justify-center rounded-full ' +
        'border border-black/10 bg-white/80 backdrop-blur hover:bg-white/95 ' +
        'transition dark:border-white/20 dark:bg-black/30 dark:hover:bg-black/40'
        : 'inline-flex h-9 w-9 items-center justify-center rounded-full ' +
        'border border-black/10 bg-white/70 hover:bg-white/90 transition dark:border-white/20 ' +
        'dark:bg-black/30 dark:hover:bg-black/40'
)
</script>
