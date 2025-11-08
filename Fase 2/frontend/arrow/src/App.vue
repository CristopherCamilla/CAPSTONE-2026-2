<template>
  <div class="app">
    <NavBar />
    <main class="content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<style>
.app{
  min-height:100dvh; display:flex; flex-direction:column;
}
.content{
  width:100%; max-width:1280px; margin:0 auto; padding:1.25rem;
}
</style>
