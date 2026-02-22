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
  padding-top: 100px;
}

@media (max-width: 900px) {
  #app {
    padding-top: 88px;
  }
}

@media (max-width: 700px) {
  #app {
    padding-top: 74px;
  }
}
</style>
