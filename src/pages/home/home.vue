<template>
  <main>
    <Slider class="large-slider" />
    <h2 class="specialists-title">Наши специалисты</h2>
    <section class="team-image">
      <div class="team-image__wrapper">
        <img :src="team" alt="Наша команда специалистов" class="team-image__img" />
        <div class="team-image__overlay">
          <h3>Наши специалисты — эксперты детейлинга</h3>
          <p>Наши специалисты — команда опытных детейлеров: профессионалы с профильным обучением и годами практики. Они используют современные методы мойки и глубокой чистки, аккуратно удаляют загрязнения любой сложности, заботятся о состоянии кузова и салона и выполняют работу быстро, но тщательно. Доверяя нам автомобиль, вы получаете безупречную чистоту и внимательное отношение к каждой детали.</p>
        </div>
      </div>
    </section>
    <section class="other-photos">
      <div class="other-photos__grid">
        <div v-for="(p, i) in otherPhotos" :key="i" class="photo-card">
          <img :src="p.src" :alt="p.alt" class="photo-card__img" />
          <div class="photo-card__overlay">
            <p>{{ p.slogan }}</p>
          </div>
        </div>
      </div>
    </section>    
  </main>
</template>

<script setup>
import Slider from '../../components/Slider.vue'
import girls from '../../assets/images/other/girls.png'
import team from '../../assets/images/other/team.png'
import boys from '../../assets/images/other/boys.png'
import team_men from '../../assets/images/other/team_men.png'
import team_woman from '../../assets/images/other/team_woman.png'

const otherPhotos = [
  { src: team_men, alt: 'Команда (мужчины)', slogan: 'Профессионализм в каждом движении' },
  { src: team_woman, alt: 'Команда (женщины)', slogan: 'Тщательная чистка, заметный результат' },
  { src: boys, alt: 'Наши помощники', slogan: 'Быстро. Аккуратно. Качественно.' },
  { src: girls, alt: 'Наши специалисты (женщины)', slogan: 'Внимание к деталям и безупречная чистота' }
]
</script>

<style lang="scss" scoped src="./Home.scss"></style>
