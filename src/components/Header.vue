<template>
  <header>
    <div class="header-container">
      <div class="logo-section">
        <router-link to="/">
          <img class="logo" :src="logo" alt="logo" />
        </router-link>
        <div class="logo-text">ORA Detail</div>
      </div>

      <nav>
        <ul>
          <li class="nav-item">
            <router-link to="/services">
              <img :src="iconServices" alt="services" />
              <span>Услуги</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/products">
              <img :src="iconProducts" alt="products" />
              <span>Товары</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/cart">
              <img :src="iconCart" alt="cart" />
              <span>Корзина</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/profile">
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
import logo from '../assets/icons/logo.png'
import iconProducts from '../assets/icons/товары.png'
import iconServices from '../assets/icons/услуги.png'
import iconProfile from '../assets/icons/профиль.png'
import iconCart from '../assets/icons/корзина.png'
</script>

<style lang="scss" scoped>
@use '../styles/components/header' as *;
</style>
