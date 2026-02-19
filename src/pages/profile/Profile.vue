<template>
  <main>
    <section class="profile-page">
      <h1>Личный кабинет</h1>
      <p class="profile-subtitle">
        {{ isAuthorized ? 'Управляйте профилем, следите за активными записями и историей заказов.' : 'Войдите в аккаунт или зарегистрируйтесь, чтобы оформить заказ и сохранять историю.' }}
      </p>

      <template v-if="isAuthorized">
        <div class="profile-tabs">
          <div class="profile-tabs__left">
        <button
          type="button"
          class="profile-tab-btn"
          :class="{ active: profileTab === 'edit' }"
          @click="profileTab = 'edit'"
        >
          Профиль
        </button>
        <button
          type="button"
          class="profile-tab-btn"
          :class="{ active: profileTab === 'orders' }"
          @click="profileTab = 'orders'"
        >
          История заказов
        </button>
        <button
          type="button"
          class="profile-tab-btn"
          :class="{ active: profileTab === 'bookings' }"
          @click="profileTab = 'bookings'"
        >
          Активные записи
        </button>
          </div>
          <button type="button" class="btn-logout" @click="logout">Выйти</button>
        </div>

        <form
          v-if="profileTab === 'edit'"
        class="profile-form form-edit"
        novalidate
        @submit.prevent="submitEdit"
      >
        <h2>Редактирование профиля</h2>
        <div class="form-field" :class="{ 'is-error': !!editErrors.name }">
          <label for="edit-name">Имя</label>
          <input id="edit-name" v-model.trim="editForm.name" name="edit-name" type="text" placeholder="Введите имя" />
          <span class="field-error">{{ editErrors.name }}</span>
        </div>

        <div class="form-field" :class="{ 'is-error': !!editErrors.email }">
          <label for="edit-email">Email</label>
          <input id="edit-email" v-model="editForm.email" name="edit-email" type="email" placeholder="you@mail.com" readonly />
          <span class="field-error">{{ editErrors.email }}</span>
        </div>

        <div class="form-field" :class="{ 'is-error': !!editErrors.phone }">
          <label for="edit-phone">Телефон</label>
          <input id="edit-phone" v-model.trim="editForm.phone" name="edit-phone" type="tel" placeholder="+7 (___) ___-__-__" />
          <span class="field-error">{{ editErrors.phone }}</span>
        </div>

        <div class="form-field" :class="{ 'is-error': !!editErrors.password }">
          <label for="edit-password">Новый пароль</label>
          <input id="edit-password" v-model="editForm.password" name="edit-password" type="password" placeholder="Минимум 6 символов" />
          <span class="field-error">{{ editErrors.password }}</span>
        </div>

        <div class="form-field" :class="{ 'is-error': !!editErrors.confirm }">
          <label for="edit-confirm">Повторите пароль</label>
          <input id="edit-confirm" v-model="editForm.confirm" name="edit-confirm" type="password" placeholder="Повторите пароль" />
          <span class="field-error">{{ editErrors.confirm }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit">Сохранить</button>
        </div>
        <div class="form-success" aria-live="polite" v-if="editSuccess">{{ editSuccess }}</div>
        </form>

        <section v-if="profileTab === 'orders'" class="orders-history">
        <h2>История заказов</h2>
        <p v-if="!ordersHistory.length" class="orders-empty">У вас пока нет оформленных заказов.</p>

        <div v-else class="orders-list">
          <article v-for="order in ordersHistory" :key="order.id" class="order-card">
            <div class="order-card__head">
              <strong>Заказ {{ order.id }}</strong>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-card__items">
              <div v-for="item in order.items" :key="`${order.id}-${item.id}`" class="order-card__item">
                <span>{{ item.title }}</span>
                <span>x{{ item.qty }}</span>
                <span>{{ item.price }}</span>
              </div>
            </div>
            <div class="order-card__total">Итого: {{ order.total }}</div>
            <div class="order-card__actions">
              <button type="button" class="btn-repeat-order" @click="repeatOrder(order)">Повторить заказ</button>
            </div>
          </article>
        </div>
        <div v-if="orderActionSuccess" class="form-success" aria-live="polite">{{ orderActionSuccess }}</div>
        </section>

        <section v-if="profileTab === 'bookings'" class="orders-history">
          <h2>Активные записи</h2>
          <p v-if="!serviceBookings.length" class="orders-empty">У вас пока нет активных записей на услуги.</p>

          <div v-else class="orders-list">
            <article v-for="booking in serviceBookings" :key="booking.id" class="order-card">
              <div class="order-card__head">
                <strong>{{ booking.serviceTitle }}</strong>
                <span>{{ formatDate(booking.createdAt) }}</span>
              </div>
              <div class="booking-card__meta">
                <span>Дата: {{ formatSchedule(booking.appointmentDate, booking.appointmentTime) }}</span>
                <span>Телефон: {{ booking.phone }}</span>
                <span v-if="booking.servicePrice">Цена: {{ booking.servicePrice }}</span>
                <span v-if="booking.serviceDuration">Время: {{ booking.serviceDuration }}</span>
              </div>
              <p v-if="booking.comment" class="booking-card__comment">{{ booking.comment }}</p>
            </article>
          </div>
        </section>
      </template>

      <template v-else>
        <form v-if="authTab === 'login'" class="profile-form form-login" novalidate @submit.prevent="submitLogin">
          <h2>Войти</h2>
          <div class="form-field" :class="{ 'is-error': !!loginErrors.email }">
            <label for="login-email">Email или логин</label>
            <input id="login-email" v-model.trim="loginForm.email" name="login-email" type="text" placeholder="you@mail.com или admin" />
            <span class="field-error">{{ loginErrors.email }}</span>
          </div>

          <div class="form-field" :class="{ 'is-error': !!loginErrors.password }">
            <label for="login-password">Пароль</label>
            <input id="login-password" v-model="loginForm.password" name="login-password" type="password" placeholder="Пароль" />
            <span class="field-error">{{ loginErrors.password }}</span>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-submit">Войти</button>
          </div>
          <div class="form-switch">
            <span>Нет аккаунта?</span>
            <button type="button" class="btn-link auth-switch-btn" @click="switchAuthTab('register')">Зарегистрироваться</button>
          </div>
          <div class="form-success" aria-live="polite" v-if="loginSuccess">{{ loginSuccess }}</div>
        </form>

        <form v-else class="profile-form form-register" novalidate @submit.prevent="submitRegister">
          <h2>Регистрация</h2>
          <div class="form-field" :class="{ 'is-error': !!registerErrors.name }">
            <label for="name">Имя</label>
            <input id="name" v-model.trim="registerForm.name" name="name" type="text" placeholder="Введите имя" />
            <span class="field-error">{{ registerErrors.name }}</span>
          </div>

          <div class="form-field" :class="{ 'is-error': !!registerErrors.email }">
            <label for="email">Email</label>
            <input id="email" v-model.trim="registerForm.email" name="email" type="email" placeholder="you@mail.com" />
            <span class="field-error">{{ registerErrors.email }}</span>
          </div>

          <div class="form-field" :class="{ 'is-error': !!registerErrors.phone }">
            <label for="phone">Телефон</label>
            <input id="phone" v-model.trim="registerForm.phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" />
            <span class="field-error">{{ registerErrors.phone }}</span>
          </div>

          <div class="form-field" :class="{ 'is-error': !!registerErrors.password }">
            <label for="password">Пароль</label>
            <input id="password" v-model="registerForm.password" name="password" type="password" placeholder="Минимум 6 символов" />
            <span class="field-error">{{ registerErrors.password }}</span>
          </div>

          <div class="form-field" :class="{ 'is-error': !!registerErrors.confirm }">
            <label for="confirm">Повторите пароль</label>
            <input id="confirm" v-model="registerForm.confirm" name="confirm" type="password" placeholder="Повторите пароль" />
            <span class="field-error">{{ registerErrors.confirm }}</span>
          </div>

          <label class="form-check" :class="{ 'is-error': !!registerErrors.agree }">
            <input id="agree" v-model="registerForm.agree" name="agree" type="checkbox" />
            <span>Согласен с условиями и политикой конфиденциальности</span>
          </label>
          <div class="field-error">{{ registerErrors.agree }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-submit">Зарегистрироваться</button>
          </div>
          <div class="form-switch">
            <span>Уже есть аккаунт?</span>
            <button type="button" class="btn-link auth-switch-btn" @click="switchAuthTab('login')">Войти</button>
          </div>
          <div class="form-success" aria-live="polite" v-if="registerSuccess">{{ registerSuccess }}</div>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const currentUser = ref(null)
const authTab = ref('login')
const profileTab = ref('edit')
const ordersHistory = ref([])
const serviceBookings = ref([])
const orderActionSuccess = ref('')
const router = useRouter()
const route = useRoute()

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ name: '', email: '', phone: '', password: '', confirm: '', agree: false })
const editForm = ref({ name: '', email: '', phone: '', password: '', confirm: '' })

const loginErrors = ref({})
const registerErrors = ref({})
const editErrors = ref({})

const loginSuccess = ref('')
const registerSuccess = ref('')
const editSuccess = ref('')

const isAuthorized = computed(() => Boolean(currentUser.value?.email || currentUser.value?.login))

const isEmail = (value) => /\S+@\S+\.\S+/.test(value)
const isLoginOrEmail = (value) => isEmail(value) || /^[a-zA-Z0-9_.-]{3,}$/.test(value)
const USER_KEY = 'ora-current-user'
const CART_KEY = 'ora-cart'

const safeParseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const loadCurrentUser = () => {
  currentUser.value = safeParseJson(localStorage.getItem(USER_KEY), null)
}

const getUserHistoryKey = (user) => user?.email || user?.login || ''

const loadOrderHistory = async () => {
  if (!currentUser.value) {
    ordersHistory.value = []
    return
  }

  const key = getUserHistoryKey(currentUser.value)
  try {
    const response = await fetch('/api/orders', {
      headers: {
        'x-user-email': key,
      },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      ordersHistory.value = []
      return
    }
    const rawHistory = Array.isArray(data.items) ? data.items : []
    ordersHistory.value = rawHistory.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {
    ordersHistory.value = []
  }
}

const loadServiceBookings = async () => {
  if (!currentUser.value) {
    serviceBookings.value = []
    return
  }

  const key = getUserHistoryKey(currentUser.value)
  try {
    const response = await fetch('/api/bookings', {
      headers: {
        'x-user-email': key,
      },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      serviceBookings.value = []
      return
    }
    const rawBookings = Array.isArray(data.items) ? data.items : []
    serviceBookings.value = rawBookings
      .filter((item) => item?.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {
    serviceBookings.value = []
  }
}

const formatDate = (isoDate) => {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU')
}

const formatSchedule = (dateStr, timeStr) => {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T${timeStr || '00:00'}`)
  if (Number.isNaN(date.getTime())) return `${dateStr} ${timeStr || ''}`.trim()
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const repeatOrder = (order) => {
  const existingCart = safeParseJson(localStorage.getItem(CART_KEY), [])
  const cartById = new Map(existingCart.map((item) => [item.id, { ...item }]))

  ;(order.items || []).forEach((item) => {
    if (!item?.id) return
    const current = cartById.get(item.id)
    if (current) {
      current.qty = (current.qty || 1) + (item.qty || 1)
      cartById.set(item.id, current)
      return
    }

    cartById.set(item.id, {
      id: item.id,
      title: item.title || '',
      category: item.category || '',
      price: item.price || '',
      folder: item.folder || '',
      qty: item.qty || 1,
    })
  })

  const nextCart = Array.from(cartById.values())
  localStorage.setItem(CART_KEY, JSON.stringify(nextCart))
  orderActionSuccess.value = 'Заказ добавлен в корзину.'
  router.push('/cart')
}

const clearAuthMessages = () => {
  loginErrors.value = {}
  registerErrors.value = {}
  loginSuccess.value = ''
  registerSuccess.value = ''
}

const switchAuthTab = (tab) => {
  authTab.value = tab
  clearAuthMessages()
}

const fillEditForm = () => {
  if (!currentUser.value) return
  editForm.value = {
    name: currentUser.value.name || '',
    email: currentUser.value.email || '',
    phone: currentUser.value.phone || '',
    password: '',
    confirm: '',
  }
}

const sendJson = async (url, method, payload) => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : null,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  return { ok: response.ok, data }
}

const submitLogin = async () => {
  loginErrors.value = {}
  loginSuccess.value = ''

  const email = loginForm.value.email.trim()
  const password = loginForm.value.password
  const errors = {}

  if (!isLoginOrEmail(email)) errors.email = 'Введите email или логин.'
  if (!password) errors.password = 'Введите пароль.'

  if (Object.keys(errors).length) {
    loginErrors.value = errors
    return
  }

  const { ok, data } = await sendJson('/api/login', 'POST', { email, password })
  if (!ok || !data?.ok) {
    const message = data?.message || 'Login failed.'
    loginErrors.value = { email: message, password: '' }
    return
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  currentUser.value = data.user
  profileTab.value = 'edit'
  loginForm.value = { email: '', password: '' }
  loginSuccess.value = 'Вход выполнен. Добро пожаловать!'

  if (route.query.redirect === 'cart' && route.query.continueCheckout === '1') {
    router.push({ path: '/cart', query: { continueCheckout: '1' } })
  }
}

const submitRegister = async () => {
  registerErrors.value = {}
  registerSuccess.value = ''

  const form = registerForm.value
  const errors = {}

  if ((form.name || '').trim().length < 2) errors.name = 'Введите имя (минимум 2 символа).'
  if (!isEmail(form.email || '')) errors.email = 'Введите корректный email.'
  if ((form.phone || '').replace(/\D/g, '').length < 10) errors.phone = 'Введите корректный номер телефона.'
  if ((form.password || '').length < 6) errors.password = 'Пароль должен быть минимум 6 символов.'
  if (!form.confirm || form.confirm !== form.password) errors.confirm = 'Пароли не совпадают.'
  if (!form.agree) errors.agree = 'Подтвердите согласие.'

  if (Object.keys(errors).length) {
    registerErrors.value = errors
    return
  }

  const { ok, data } = await sendJson('/api/register', 'POST', {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password,
  })

  if (!ok || !data?.ok) {
    registerErrors.value = { email: data?.message || 'Register failed.' }
    return
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  currentUser.value = data.user
  profileTab.value = 'edit'
  registerSuccess.value = 'Регистрация успешна! Данные сохранены.'

  if (route.query.redirect === 'cart' && route.query.continueCheckout === '1') {
    router.push({ path: '/cart', query: { continueCheckout: '1' } })
  }
}

const submitEdit = async () => {
  editErrors.value = {}
  editSuccess.value = ''

  const form = editForm.value
  const errors = {}

  if ((form.name || '').trim().length < 2) errors.name = 'Имя слишком короткое.'
  if (!isEmail(form.email || '')) errors.email = 'Некорректный email.'
  if ((form.phone || '').replace(/\D/g, '').length < 10) errors.phone = 'Некорректный номер телефона.'

  if (form.password) {
    if (form.password.length < 6) errors.password = 'Пароль слишком короткий.'
    if (form.confirm !== form.password) errors.confirm = 'Пароли не совпадают.'
  }

  if (Object.keys(errors).length) {
    editErrors.value = errors
    return
  }

  const { ok, data } = await sendJson('/api/profile', 'PUT', {
    email: form.email.trim(),
    name: form.name.trim(),
    phone: form.phone.trim(),
    password: form.password,
  })

  if (!ok || !data?.ok) {
    editErrors.value = { email: data?.message || 'Не удалось обновить профиль.' }
    return
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  currentUser.value = data.user
  editSuccess.value = 'Профиль обновлён.'
  editForm.value.password = ''
  editForm.value.confirm = ''
}

const logout = () => {
  localStorage.removeItem(USER_KEY)
  currentUser.value = null
  authTab.value = 'login'
  profileTab.value = 'edit'
  ordersHistory.value = []
  serviceBookings.value = []
  orderActionSuccess.value = ''
  clearAuthMessages()
}

onMounted(() => {
  loadCurrentUser()
  fillEditForm()
  void loadOrderHistory()
  void loadServiceBookings()
})

watch(currentUser, () => {
  fillEditForm()
  void loadOrderHistory()
  void loadServiceBookings()
  orderActionSuccess.value = ''
})
</script>

<style lang="scss" scoped src="./Profile.scss"></style>
