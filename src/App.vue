<template>
  <div id="app">
    <AppHeader />
    <router-view />
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from './components/Header.vue'
import AppFooter from './components/Footer.vue'
</script>

<style>
/* global app-level styles if needed */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
