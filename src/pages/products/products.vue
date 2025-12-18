<template>
  <main>
    <section class="content-wrapper">
      <main style="flex:1;">
        <Slider class="small-slider one-button" />
        <h1>Товары</h1>
        <div class="products">
          <!-- Placeholder: actual product cards should be implemented here or migrated -->
          <div class="product-card" v-for="n in 8" :key="n">
            <div class="product-image">
              <img src="../../assets/images/products/auto_shampoo/1.jpg" alt="prod" />
            </div>
            <div class="product-info">
              <h3>Продукт {{ n }}</h3>
              <p class="product-price">₽999</p>
              <button class="btn-cart">В корзину</button>
            </div>
          </div>
        </div>
      </main>
    </section>
  </main>
</template>

<script setup>
import Slider from '../../components/Slider.vue'
</script>

<style lang="scss" scoped>
@use '../../styles/styles' as *;
</style>
