<template>
  <section class="hero-banner">
    <div class="slides">
      <div
        v-for="(img, i) in images"
        :key="img"
        class="slide"
        :class="{ active: i === current }"
        :style="{ backgroundImage: `url(${img})` }"
      ></div>
    </div>
    <div class="hero-content">
      <h2>Добро пожаловать в ORA</h2>
      <button>Посмотреть наши услуги</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// use Vite's new glob options: query + import to get URL strings (replaces deprecated `as: 'url'`)
const modules = import.meta.glob('../assets/images/main-slider/*.{jpg,jpeg,png,gif,webp}', { eager: true, query: '?url', import: 'default' })
const imagesStatic = Object.entries(modules)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([, url]) => url)
// reactive list that we'll filter after preload
const images = ref(imagesStatic.slice())

const current = ref(0)
let timer = null
const intervalMs = 4500

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    if (img.complete) return resolve(true)
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
  })
}

onMounted(async () => {
  if (images.value.length === 0) return

  // preload all images to avoid flicker / skipped frames
  const loadPromises = images.value.map((u) => loadImage(u))
  const results = await Promise.all(loadPromises)

  // log failed loads (if any) to help debugging missing images
  const failed = images.value.filter((_, idx) => !results[idx])
  if (failed.length) console.warn('Slider: failed to preload images', failed)

  // remove failed images from rotation
  const successful = images.value.filter((_, idx) => results[idx])
  images.value = successful
  console.debug('Slider: images used', images.value)

  // show first image immediately (already set to 0)
  if (images.value.length > 1) {
    timer = setInterval(() => {
      current.value = (current.value + 1) % images.value.length
      console.debug('Slider: current', current.value)
    }, intervalMs)
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss">
@use '../styles/components/slider' as *;
</style>
