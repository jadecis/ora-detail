<template>
  <main>
    <section class="services-page">
      <h1>Наши услуги</h1>
      <p class="services-subtitle">Премиум услуги детейлинга, адаптированные под ваш автомобиль.</p>
      <div v-if="bookingSuccess" class="services-status services-status--success">{{ bookingSuccess }}</div>
      <div v-if="authPrompt" class="services-status services-status--auth">
        <span>{{ authPrompt }}</span>
        <button type="button" class="services-status__action" @click="goToAuth">Войти</button>
      </div>

      <div v-if="isAdmin" class="admin-panel">
        <h3>Управление услугами</h3>
        <form class="admin-form" @submit.prevent="createService">
          <input v-model.trim="newService.title" type="text" placeholder="Название" required />
          <input v-model.number="newService.price" type="number" min="1" step="1" placeholder="Цена (число)" required />
          <input v-model.number="newService.duration" type="number" min="1" step="1" placeholder="Длительность (мин)" required />
          <textarea v-model.trim="newService.description" placeholder="Краткое описание" required></textarea>
          <textarea v-model.trim="newService.details" placeholder="Детали"></textarea>
          <input v-model.trim="newService.id" type="text" placeholder="ID (опционально)" />
          <button type="submit">Добавить услугу</button>
        </form>
      </div>

      <div v-if="loading" class="services-status">Loading services...</div>
      <div v-else-if="error" class="services-status services-status--error">{{ error }}</div>

      <div v-else class="services-grid">
        <article v-for="service in services" :key="service.id" class="service-card">
          <div class="service-card__body">
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
          </div>
          <div class="service-card__footer">
            <span class="service-card__price">{{ service.price }}</span>
            <span class="service-card__duration">{{ service.duration }}</span>
            <button
              class="service-card__toggle"
              type="button"
              :aria-expanded="expandedId === service.id"
              :aria-controls="`service-details-${service.id}`"
              @click="toggleDetails(service.id)"
            >
              <span class="service-card__toggle-icon" :class="{ open: expandedId === service.id }">⌄</span>
            </button>
          </div>
          <div
            class="service-card__details"
            :id="`service-details-${service.id}`"
            :class="{ open: expandedId === service.id }"
          >
            <p>{{ service.details }}</p>
          </div>
          <button class="btn-book" type="button" @click="openBooking(service)">Записаться</button>
          <button v-if="isAdmin" class="btn-delete" type="button" @click="removeService(service.id)">Удалить</button>
        </article>
      </div>

      <div v-if="bookingModalOpen" class="booking-modal" role="dialog" aria-modal="true">
        <div class="booking-modal__backdrop" @click="closeBooking"></div>
        <div class="booking-modal__content">
          <h3>Запись на услугу</h3>
          <p class="booking-modal__service">{{ selectedService?.title }}</p>

          <form class="booking-form" novalidate @submit.prevent="submitBooking">
            <div class="booking-field" :class="{ 'is-error': !!bookingErrors.name }">
              <label for="booking-name">Имя</label>
              <input id="booking-name" v-model.trim="bookingForm.name" type="text" placeholder="Введите имя" />
              <span class="field-error">{{ bookingErrors.name }}</span>
            </div>

            <div class="booking-field" :class="{ 'is-error': !!bookingErrors.phone }">
              <label for="booking-phone">Телефон</label>
              <input id="booking-phone" v-model.trim="bookingForm.phone" type="tel" placeholder="+7 (___) ___-__-__" />
              <span class="field-error">{{ bookingErrors.phone }}</span>
            </div>

            <div class="booking-field" :class="{ 'is-error': !!bookingErrors.date }">
              <label for="booking-date">Дата</label>
              <input id="booking-date" v-model="bookingForm.date" type="date" />
              <span class="booking-hint">Пн-Пт: 08:00-24:00, Сб-Вс: 09:00-01:00.</span>
              <span class="field-error">{{ bookingErrors.date }}</span>
            </div>

            <div class="booking-field" :class="{ 'is-error': !!bookingErrors.time }">
              <label for="booking-time">Время</label>
              <select id="booking-time" v-model="bookingForm.time" :disabled="!bookingForm.date">
                <option value="">{{ bookingForm.date ? 'Выберите время' : 'Сначала выберите дату' }}</option>
                <option v-for="slot in availableTimeSlots" :key="slot" :value="slot">{{ slot }}</option>
              </select>
              <span class="field-error">{{ bookingErrors.time }}</span>
            </div>

            <div class="booking-field booking-field--full">
              <label for="booking-comment">Комментарий</label>
              <textarea id="booking-comment" v-model.trim="bookingForm.comment" placeholder="Марка авто, пожелания и т.д."></textarea>
            </div>

            <div class="booking-actions">
              <button type="button" class="btn-cancel" @click="closeBooking">Отмена</button>
              <button type="submit" class="btn-submit-booking">Подтвердить запись</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const services = ref([])
const loading = ref(true)
const error = ref('')
const expandedId = ref('')
const router = useRouter()

const newService = ref({
  id: '',
  title: '',
  description: '',
  details: '',
  price: null,
  duration: null,
})

const currentUser = ref(null)
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const isAuthorized = computed(() => Boolean(currentUser.value?.email || currentUser.value?.login))
const actorIdentity = computed(() => currentUser.value?.email || currentUser.value?.login || '')
const USER_KEY = 'ora-current-user'

const bookingModalOpen = ref(false)
const selectedService = ref(null)
const bookingSuccess = ref('')
const authPrompt = ref('')
const bookingErrors = ref({})
const bookingForm = ref({ name: '', phone: '', date: '', time: '', comment: '' })

const TIME_STEP_MINUTES = 30

function pad2(value) {
  return String(value).padStart(2, '0')
}

function minutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${pad2(hours)}:${pad2(minutes)}`
}

function appendTimeRange(target, startMinutes, endMinutes) {
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += TIME_STEP_MINUTES) {
    target.push(minutesToTime(minutes))
  }
}

function buildTimeSlotsByDate(dateStr) {
  if (!dateStr) return []
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return []

  const day = date.getDay()
  const isWeekend = day === 0 || day === 6
  const slots = []

  if (isWeekend) {
    appendTimeRange(slots, 9 * 60, 23 * 60 + 30)
    appendTimeRange(slots, 0, 60)
  } else {
    appendTimeRange(slots, 8 * 60, 23 * 60 + 30)
  }

  return slots
}

const availableTimeSlots = computed(() => buildTimeSlotsByDate(bookingForm.value.date))

function safeParseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function loadCurrentUser() {
  currentUser.value = safeParseJson(localStorage.getItem(USER_KEY), null)
}

function getUserBookingsKey(user) {
  return user?.email || user?.login || ''
}

function toggleDetails(id) {
  expandedId.value = expandedId.value === id ? '' : id
}

function fillBookingForm() {
  bookingForm.value = {
    name: currentUser.value?.name || '',
    phone: currentUser.value?.phone || '',
    date: '',
    time: '',
    comment: '',
  }
  bookingErrors.value = {}
}

function openBooking(service) {
  loadCurrentUser()
  bookingSuccess.value = ''

  if (!isAuthorized.value) {
    authPrompt.value = 'Чтобы записаться на услугу, войдите в аккаунт.'
    return
  }

  authPrompt.value = ''
  selectedService.value = service
  fillBookingForm()
  bookingModalOpen.value = true
}

function closeBooking() {
  bookingModalOpen.value = false
  selectedService.value = null
  bookingErrors.value = {}
}

function goToAuth() {
  router.push('/profile')
}

function validateBooking() {
  const form = bookingForm.value
  const errors = {}

  if ((form.name || '').trim().length < 2) errors.name = 'Введите имя (минимум 2 символа).'
  if ((form.phone || '').replace(/\D/g, '').length < 10) errors.phone = 'Введите корректный номер телефона.'
  if (!form.date) errors.date = 'Укажите дату записи.'
  if (!form.time) {
    errors.time = 'Укажите время записи.'
  } else if (!availableTimeSlots.value.includes(form.time)) {
    errors.time = 'Выберите время в рамках рабочего графика.'
  }

  bookingErrors.value = errors
  return Object.keys(errors).length === 0
}

async function submitBooking() {
  if (!selectedService.value) return
  if (!validateBooking()) return

  const key = getUserBookingsKey(currentUser.value)
  if (!key) return

  const booking = {
    id: `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    serviceId: selectedService.value.id,
    serviceTitle: selectedService.value.title,
    servicePrice: selectedService.value.price,
    serviceDuration: selectedService.value.duration,
    name: bookingForm.value.name.trim(),
    phone: bookingForm.value.phone.trim(),
    comment: bookingForm.value.comment.trim(),
    appointmentDate: bookingForm.value.date,
    appointmentTime: bookingForm.value.time,
    status: 'active',
    createdAt: new Date().toISOString(),
  }

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': key,
      },
      body: JSON.stringify({ booking }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Не удалось сохранить запись.')
    }

    bookingSuccess.value = 'Вы успешно записаны. Запись добавлена в личный кабинет.'
    closeBooking()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось сохранить запись.'
  }
}

async function loadServices() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/services', { cache: 'no-cache' })
    if (!response.ok) throw new Error('Failed to load services.')
    const data = await response.json()
    services.value = Array.isArray(data?.items) ? data.items : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load services.'
  } finally {
    loading.value = false
  }
}

async function createService() {
  if (!isAdmin.value) return
  if (!Number.isInteger(newService.value.price) || newService.value.price <= 0) {
    error.value = 'Цена должна быть положительным числом.'
    return
  }
  if (!Number.isInteger(newService.value.duration) || newService.value.duration <= 0) {
    error.value = 'Длительность должна быть положительным числом (в минутах).'
    return
  }

  try {
    const response = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': actorIdentity.value,
      },
      body: JSON.stringify(newService.value),
    })
    const data = await response.json()
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Не удалось добавить услугу.')
    }

    newService.value = { id: '', title: '', description: '', details: '', price: null, duration: null }
    await loadServices()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось добавить услугу.'
  }
}

async function removeService(id) {
  if (!isAdmin.value) return

  try {
    const response = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': actorIdentity.value,
      },
    })
    const data = await response.json()
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || 'Не удалось удалить услугу.')
    }

    await loadServices()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось удалить услугу.'
  }
}

onMounted(async () => {
  loadCurrentUser()
  await loadServices()
})

watch(
  () => bookingForm.value.date,
  () => {
    if (!availableTimeSlots.value.includes(bookingForm.value.time)) {
      bookingForm.value.time = ''
    }
  },
)
</script>

<style lang="scss" scoped src="./Services.scss"></style>
