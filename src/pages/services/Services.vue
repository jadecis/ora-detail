<template>
  <main>
    <section class="services-page">
      <h1>Наши услуги</h1>
      <p class="services-subtitle">Премиум услуги детейлинга, адаптированные под ваш автомобиль.</p>

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
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const services = ref([])
const loading = ref(true)
const error = ref('')
const expandedId = ref('')

function toggleDetails(id) {
  expandedId.value = expandedId.value === id ? '' : id
}

onMounted(async () => {
  try {
    const response = await fetch('/ora-services.json', { cache: 'no-cache' })
    if (!response.ok) throw new Error('Failed to load services.')
    const data = await response.json()
    services.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load services.'
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped src="./Services.scss"></style>
