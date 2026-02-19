<template>
  <header>
    <div class="header-container">
      <div class="logo-section">
        <router-link to="/">
          <img class="logo" :src="logo" alt="logo" />
        </router-link>
        <div class="logo-text">ORA Detail</div>
      </div>

      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="isMenuOpen"
        aria-label="Открыть меню"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span class="menu-toggle__line"></span>
        <span class="menu-toggle__line"></span>
        <span class="menu-toggle__line"></span>
      </button>

      <nav :class="{ 'is-open': isMenuOpen }">
        <ul>
          <li class="nav-item nav-item--theme">
            <button
              type="button"
              class="theme-toggle"
              :class="{ 'is-dark': isDarkTheme }"
              :aria-label="isDarkTheme ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'"
              @click="toggleTheme"
            >
              <span class="theme-toggle__icon" aria-hidden="true">{{ isDarkTheme ? '☀' : '🌙' }}</span>
            </button>
          </li>
          <li class="nav-item">
            <router-link to="/services" @click="closeMenu">
              <img :src="iconServices" alt="services" />
              <span>Услуги</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/products" @click="closeMenu">
              <img :src="iconProducts" alt="products" />
              <span>Товары</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/cart" @click="closeMenu">
              <img :src="iconCart" alt="cart" />
              <span>Корзина</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/profile" @click="closeMenu">
              <img :src="iconProfile" alt="profile" />
              <span>Профиль</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import logo from '../assets/icons/logo.png'
import iconProducts from '../assets/icons/товары.png'
import iconServices from '../assets/icons/услуги.png'
import iconProfile from '../assets/icons/профиль.png'
import iconCart from '../assets/icons/корзина.png'

const THEME_KEY = 'ora-theme'
const DARK_THEME = 'dark'
const LEGACY_THEME = 'midnight-cyan'
const isDarkTheme = ref(false)
const isMenuOpen = ref(false)
const route = useRoute()

const applyTheme = (themeName) => {
  const root = document.documentElement
  if (themeName === DARK_THEME || themeName === LEGACY_THEME) {
    root.setAttribute('data-theme', DARK_THEME)
    isDarkTheme.value = true
    return
  }

  root.removeAttribute('data-theme')
  isDarkTheme.value = false
}

const toggleTheme = () => {
  const nextTheme = isDarkTheme.value ? 'light' : DARK_THEME
  localStorage.setItem(THEME_KEY, nextTheme)
  applyTheme(nextTheme)
}

const closeMenu = () => {
  isMenuOpen.value = false
}

onMounted(() => {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light'
  applyTheme(savedTheme)
})

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  },
)
</script>

<style lang="scss" scoped>
@use '../styles/components/header' as *;
</style>
