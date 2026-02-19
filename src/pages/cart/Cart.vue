<template>
  <main>
    <section class="cart-page">
      <h1>Корзина</h1>
      <p class="cart-subtitle">Премиум товары, адаптированные под ваш автомобиль.</p>

      <div v-if="paidMessage" class="cart-status cart-status--success">{{ paidMessage }}</div>
      <div v-if="authMessage" class="cart-status cart-status--auth">
        <span>{{ authMessage }}</span>
        <button v-if="showAuthAction" type="button" class="cart-status__action" @click="goToAuth">Войти и продолжить</button>
      </div>

      <div v-if="!items.length" class="cart-empty">Корзина пуста.</div>

      <div v-else class="cart-list">
        <article v-for="item in items" :key="item.id" class="cart-item">
          <div class="cart-item__image">
            <img v-if="getImages(item.folder).length" :src="getImages(item.folder)[0]" :alt="item.title" />
          </div>
          <div class="cart-item__info">
            <h3>{{ item.title }}</h3>
            <p class="cart-item__category">{{ item.category }}</p>
            <p class="cart-item__price">{{ item.price }}</p>
            <div class="cart-item__qty">
              <span>Количество</span>
              <div class="cart-item__qty-controls">
                <button type="button" class="qty-btn" @click="changeQty(item.id, -1)">-</button>
                <span class="qty-value">{{ item.qty }}</span>
                <button type="button" class="qty-btn" @click="changeQty(item.id, 1)">+</button>
              </div>
            </div>
          </div>
          <button class="cart-item__remove" type="button" @click="removeItem(item.id)">Удалить</button>
        </article>
      </div>

      <div v-if="items.length" class="cart-summary">
        <div class="cart-summary__total">
          <span>Итого</span>
          <strong>{{ totalPrice }}</strong>
        </div>
        <button class="cart-pay" type="button" @click="pay">Оплатить</button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const items = ref([])
const paidMessage = ref('')
const authMessage = ref('')

const router = useRouter()
const route = useRoute()

const CART_KEY = 'ora-cart'
const USER_KEY = 'ora-current-user'

const imageModules = import.meta.glob('../../assets/images/products/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
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
  return Number.isNaN(number) ? 0 : number
}

function safeParseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const totalPrice = computed(() => {
  const total = items.value.reduce((sum, item) => sum + parsePrice(item.price) * (item.qty || 1), 0)
  return `${total.toLocaleString('ru-RU')} ₽`
})

const showAuthAction = computed(() => !getCurrentUser())

function loadCart() {
  items.value = safeParseJson(localStorage.getItem(CART_KEY), [])
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(items.value))
}

function getCurrentUser() {
  return safeParseJson(localStorage.getItem(USER_KEY), null)
}

function getUserHistoryKey(user) {
  return user?.email || user?.login || ''
}

async function appendOrderToHistory() {
  const user = getCurrentUser()
  if (!user) return false

  const userKey = getUserHistoryKey(user)
  if (!userKey) return false

  const order = {
    id: `ord-${Date.now()}`,
    createdAt: new Date().toISOString(),
    total: totalPrice.value,
    items: items.value.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      price: item.price,
      folder: item.folder || '',
      qty: item.qty || 1,
    })),
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userKey,
      },
      body: JSON.stringify({ order }),
    })
    const data = await response.json().catch(() => null)
    return Boolean(response.ok && data?.ok)
  } catch {
    return false
  }
}

function removeItem(id) {
  items.value = items.value.filter((item) => item.id !== id)
  saveCart()
}

function changeQty(id, delta) {
  const item = items.value.find((entry) => entry.id === id)
  if (!item) return
  const next = (item.qty || 1) + delta
  if (next <= 0) {
    removeItem(id)
    return
  }
  item.qty = next
  saveCart()
}

async function pay() {
  authMessage.value = ''
  const currentUser = getCurrentUser()
  if (!currentUser) {
    paidMessage.value = ''
    authMessage.value = 'Чтобы оформить заказ, войдите в аккаунт. После входа вы вернётесь в корзину.'
    return
  }

  const savedToHistory = await appendOrderToHistory()
  items.value = []
  saveCart()
  paidMessage.value = savedToHistory
    ? 'Спасибо за ваш заказ! Он добавлен в историю заказов в профиле.'
    : 'Спасибо за ваш заказ!'
}

function goToAuth() {
  router.push({ path: '/profile', query: { redirect: 'cart', continueCheckout: '1' } })
}

onMounted(() => {
  loadCart()
  const currentUser = getCurrentUser()
  if (route.query.continueCheckout === '1' && currentUser) {
    authMessage.value = 'Вы вошли в систему. Теперь можно продолжить оформление заказа.'
  }
})
</script>

<style lang="scss" scoped src="./Cart.scss"></style>
