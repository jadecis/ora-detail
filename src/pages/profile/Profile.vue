<template>
  <main>
    <section class="profile-page">
      <h1>?????? ???????</h1>
      <p class="profile-subtitle">??????? ? ??????? ??? ?????????????????, ????? ???????? ????? ? ????????? ???????.</p>

      <div v-if="currentUser" class="profile-status">
        <div>
          <div class="profile-status__label">?? ????? ???</div>
          <div class="profile-status__user">{{ displayName }}</div>
          <div class="profile-status__email">{{ currentUser.email }}</div>
        </div>
        <button type="button" class="btn-logout" @click="logout">?????</button>
      </div>

      <template v-else>
        <form class="profile-form form-login" novalidate>
          <h2>?????</h2>
          <div class="form-field">
            <label for="login-email">Email</label>
            <input id="login-email" name="login-email" type="email" placeholder="you@mail.com" />
            <span class="field-error"></span>
          </div>

          <div class="form-field">
            <label for="login-password">??????</label>
            <input id="login-password" name="login-password" type="password" placeholder="??????" />
            <span class="field-error"></span>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-submit">?????</button>
          </div>
          <div class="form-switch">
            <span>??? ?????????</span>
            <button type="button" class="btn-link" id="show-register">??????????????????</button>
          </div>
          <div class="form-success" aria-live="polite"></div>
        </form>

        <form class="profile-form form-register is-hidden" novalidate>
          <h2>???????????</h2>
          <div class="form-field">
            <label for="name">???</label>
            <input id="name" name="name" type="text" placeholder="??????? ???" />
            <span class="field-error"></span>
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@mail.com" />
            <span class="field-error"></span>
          </div>

          <div class="form-field">
            <label for="phone">???????</label>
            <input id="phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" />
            <span class="field-error"></span>
          </div>

          <div class="form-field">
            <label for="password">??????</label>
            <input id="password" name="password" type="password" placeholder="??????? 6 ????????" />
            <span class="field-error"></span>
          </div>

          <div class="form-field">
            <label for="confirm">????????? ??????</label>
            <input id="confirm" name="confirm" type="password" placeholder="????????? ??????" />
            <span class="field-error"></span>
          </div>

          <label class="form-check">
            <input id="agree" name="agree" type="checkbox" />
            <span>???????? ? ????????? ? ????????? ??????????????????</span>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn-submit">??????????????????</button>
          </div>
          <div class="form-switch">
            <span>??? ???? ????????</span>
            <button type="button" class="btn-link" id="show-login">?????</button>
          </div>
          <div class="form-success" aria-live="polite"></div>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

const currentUser = ref(null)

const loadCurrentUser = () => {
  const stored = localStorage.getItem('ora-current-user')
  currentUser.value = stored ? JSON.parse(stored) : null
}

const displayName = computed(() => currentUser.value?.name || currentUser.value?.email || '????????????')

const logout = () => {
  localStorage.removeItem('ora-current-user')
  currentUser.value = null
}

let formLogin = null
let formRegister = null

onMounted(() => {
  const $ = window.jQuery
  if (!$) return

  loadCurrentUser()

  formLogin = $('.form-login')
  formRegister = $('.form-register')

  if (currentUser.value) return

  const showError = ($field, message) => {
    const $wrap = $field.closest('.form-field')
    $wrap.addClass('is-error')
    $wrap.find('.field-error').text(message)
    $field.addClass('shake')
    setTimeout(() => $field.removeClass('shake'), 420)
  }

  const clearErrors = ($form) => {
    $form.find('.form-field').removeClass('is-error')
    $form.find('.field-error').text('')
    $form.find('.form-success').hide().text('')
  }

  const isEmail = (value) => /\S+@\S+\.\S+/.test(value)

  const toggleForms = (target) => {
    if (target === 'register') {
      formLogin.addClass('is-hidden')
      formRegister.removeClass('is-hidden')
    } else {
      formRegister.addClass('is-hidden')
      formLogin.removeClass('is-hidden')
    }
    clearErrors(formLogin)
    clearErrors(formRegister)
  }

  $('#show-register').on('click.profile', () => toggleForms('register'))
  $('#show-login').on('click.profile', () => toggleForms('login'))

  formLogin.on('submit.profile', (event) => {
    event.preventDefault()
    clearErrors(formLogin)
    const email = $('#login-email').val().trim()
    const password = $('#login-password').val()
    let valid = true

    if (!isEmail(email)) {
      showError($('#login-email'), '??????? ?????????? email.')
      valid = false
    }
    if (!password) {
      showError($('#login-password'), '??????? ??????.')
      valid = false
    }
    if (!valid) return

    const stored = localStorage.getItem('ora-users')
    const users = stored ? JSON.parse(stored) : []
    const user = users.find((u) => u.email === email && u.password === password)
    if (!user) {
      showError($('#login-email'), '???????????? ?? ?????? ??? ?????? ????????.')
      showError($('#login-password'), '')
      return
    }

    formLogin.find('.form-success').text('???? ????????. ????? ??????????!').fadeIn(150)
    localStorage.setItem('ora-current-user', JSON.stringify(user))
    currentUser.value = user
    formLogin[0].reset()
  })

  formRegister.on('submit.profile', (event) => {
    event.preventDefault()
    clearErrors(formRegister)

    const name = $('#name').val().trim()
    const email = $('#email').val().trim()
    const phone = $('#phone').val().trim()
    const password = $('#password').val()
    const confirm = $('#confirm').val()
    const agree = $('#agree').is(':checked')
    let valid = true

    if (name.length < 2) {
      showError($('#name'), '??????? ??? (??????? 2 ???????).')
      valid = false
    }
    if (!isEmail(email)) {
      showError($('#email'), '??????? ?????????? email.')
      valid = false
    }
    if (phone.replace(/\D/g, '').length < 10) {
      showError($('#phone'), '??????? ?????????? ????? ????????.')
      valid = false
    }
    if (password.length < 6) {
      showError($('#password'), '?????? ?????? ???? ??????? 6 ????????.')
      valid = false
    }
    if (confirm !== password || !confirm) {
      showError($('#confirm'), '?????? ?? ?????????.')
      valid = false
    }
    if (!agree) {
      showError($('#agree'), '??????????? ????????.')
      valid = false
    }
    if (!valid) return

    const key = 'ora-users'
    const stored = localStorage.getItem(key)
    const users = stored ? JSON.parse(stored) : []
    users.push({ name, email, phone, password, createdAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(users))

    formRegister.find('.form-success').text('??????????? ???????! ?????? ?????????.').fadeIn(150)
    formRegister[0].reset()
    localStorage.setItem('ora-current-user', JSON.stringify({ name, email, phone }))
    currentUser.value = { name, email, phone }
  })
})

onBeforeUnmount(() => {
  const $ = window.jQuery
  if (!$) return
  $('#show-register').off('click.profile')
  $('#show-login').off('click.profile')
  if (formLogin) formLogin.off('submit.profile')
  if (formRegister) formRegister.off('submit.profile')
})
</script>

<style lang="scss" scoped src="./Profile.scss"></style>
