<template>
  <main>
    <section class="products-hero">
      <Slider class="small-slider one-button" :simple="true" />
    </section>

    <section class="products-page">
      <h1>Наши товары</h1>
      <p class="products-subtitle">Премиум товары, адаптированные под ваш автомобиль.</p>

      <div v-if="loading" class="products-status">Загрузка товаров...</div>
      <div v-else-if="error" class="products-status products-status--error">{{ error }}</div>

      <div class="products-layout">
        <aside class="filters">
          <div class="filters-inner">
            <h3>Фильтры</h3>
            <div class="filter-group">
              <h4>Категории</h4>
              <label v-for="category in categories" :key="category">
                <input type="checkbox" :value="category" v-model="selectedCategories" />
                {{ category }}
              </label>
            </div>

            <div class="filter-group">
              <h4>Цена</h4>
              <div class="price-inputs">
                <input type="number" v-model.number="priceMin" placeholder="от" />
                <input type="number" v-model.number="priceMax" placeholder="до" />
              </div>
            </div>

            <div class="filter-actions">
              <button class="btn-apply" type="button" @click="applyFilters">Применить</button>
              <button class="btn-clear" type="button" @click="clearFilters">Очистить</button>
            </div>
          </div>
        </aside>

        <div v-if="!loading && !error" class="products">
          <div class="product-card" v-for="product in filteredProducts" :key="product.id">
            <div class="product-image">
              <div v-if="getImages(product.folder).length" class="product-slides">
                <div class="p-slide" v-for="(img, idx) in getImages(product.folder)" :key="idx">
                  <img :src="img" :alt="product.title" />
                </div>
              </div>
            </div>
            <div class="product-info">
              <h3>{{ product.title }}</h3>
              <p class="product-category">{{ product.category }}</p>
              <p class="product-price"><img class="price-icon" :src="iconWallet" alt="Цена" />{{ product.price }}</p>
              <button class="btn-cart" type="button" @click="addToCart(product)">
                <img :src="iconCart" alt="Добавить в корзину" />
                {{ cartCounts[product.id] ? `В корзине: ${cartCounts[product.id]}` : 'Добавить в корзину' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Slider from '../../components/Slider.vue'

const iconCart = new URL('../../assets/icons/корзина.png', import.meta.url).href
const iconWallet = new URL('../../assets/icons/кошелек.png', import.meta.url).href

const products = ref([])
const loading = ref(true)
const error = ref('')

const selectedCategories = ref([])
const priceMin = ref('')
const priceMax = ref('')
const appliedCategories = ref([])
const appliedMin = ref('')
const appliedMax = ref('')
const cartCounts = ref({})

const imageModules = import.meta.glob('../../assets/images/products/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
})

const imageIndex = Object.entries(imageModules).reduce((acc, [path, url]) => {
  const match = path.match(/products\/([^/]+)\/([^/]+)\./)
  if (match) {
    const folder = match[1]
    const name = match[2]
    if (!acc[folder]) acc[folder] = []
    acc[folder].push({ name, url })
  }
  return acc
}, {})

Object.values(imageIndex).forEach((list) => {
  list.sort((a, b) => a.name.localeCompare(b.name))
})

function getImages(folder) {
  return (imageIndex[folder] || []).map((item) => item.url)
}

function parsePrice(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '')
  const number = Number.parseInt(digits, 10)
  return Number.isNaN(number) ? null : number
}

const categories = computed(() => {
  const list = products.value.map((product) => product.category).filter(Boolean)
  return Array.from(new Set(list))
})

const filteredProducts = computed(() => {
  let list = products.value.slice()

  if (appliedCategories.value.length) {
    list = list.filter((product) => appliedCategories.value.includes(product.category))
  }

  const min = parsePrice(appliedMin.value)
  const max = parsePrice(appliedMax.value)

  if (min !== null) {
    list = list.filter((product) => {
      const price = parsePrice(product.price)
      return price === null ? false : price >= min
    })
  }

  if (max !== null) {
    list = list.filter((product) => {
      const price = parsePrice(product.price)
      return price === null ? false : price <= max
    })
  }

  return list
})

function applyFilters() {
  appliedCategories.value = [...selectedCategories.value]
  appliedMin.value = priceMin.value
  appliedMax.value = priceMax.value
}

function clearFilters() {
  selectedCategories.value = []
  priceMin.value = ''
  priceMax.value = ''
  applyFilters()
}

function updateCartCounts(cart) {
  const counts = {}
  cart.forEach((item) => {
    counts[item.id] = item.qty || 1
  })
  cartCounts.value = counts
}

function addToCart(product) {
  const key = 'ora-cart'
  const stored = localStorage.getItem(key)
  const cart = stored ? JSON.parse(stored) : []
  const existing = cart.find((item) => item.id === product.id)
  if (existing) {
    existing.qty = (existing.qty || 1) + 1
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      folder: product.folder,
      qty: 1
    })
  }
  localStorage.setItem(key, JSON.stringify(cart))
  updateCartCounts(cart)
}

onMounted(async () => {
  try {
    const url = new URL('../../products.json', import.meta.url)
    const response = await fetch(url, { cache: 'no-cache' })
    if (!response.ok) throw new Error('Ошибка загрузки товаров.')
    const data = await response.json()
    products.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Неизвестная ошибка загрузки товаров.'
  } finally {
    loading.value = false
  }

  const stored = localStorage.getItem('ora-cart')
  const cart = stored ? JSON.parse(stored) : []
  updateCartCounts(cart)
})
</script>

<style lang="scss" scoped src="./Products.scss"></style>
