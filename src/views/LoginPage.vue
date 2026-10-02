<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-bg">

        <!-- Logo -->
        <div class="logo-wrap">
          <div class="logo-circle">
            <span class="logo-icon">🏫</span>
          </div>
        </div>

        <!-- Title -->
        <div class="login-title">Welcome Back</div>
        <div class="login-sub">Sign in to continue your school journey</div>

        <!-- Card -->
        <div class="login-card">

          <!-- Role tabs -->
          <div class="tab-row">
            <button v-for="r in roles" :key="r.value"
              class="tab-btn" :class="{ active: selectedRole === r.value }"
              @click="selectedRole = r.value">
              <span>{{ r.icon }}</span> {{ r.label }}
            </button>
          </div>

          <!-- Email field -->
          <div class="input-wrap">
            <span class="input-icon">✉️</span>
            <input v-model="email" type="email" placeholder="Enter your email" class="field-input" />
          </div>

          <!-- Password field -->
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input v-model="password" :type="showPass ? 'text' : 'password'" placeholder="Enter your password" class="field-input" />
            <button class="eye-btn" @click="showPass = !showPass">{{ showPass ? '🙈' : '👁️' }}</button>
          </div>

          <div v-if="error" class="error-box">{{ error }}</div>

          <button class="sign-btn" :disabled="loading" @click="doLogin">
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </div>

        <!-- Role hint -->
        <div class="role-hint">
          Logging in as <strong>{{ roles.find(r=>r.value===selectedRole)?.label }}</strong>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const email        = ref('')
const password     = ref('')
const loading      = ref(false)
const error        = ref('')
const showPass     = ref(false)
const selectedRole = ref('student')

const roles = [
  { value: 'student', label: 'Student',  icon: '🎓' },
  { value: 'parent',  label: 'Parent',   icon: '👨‍👧' },
  { value: 'teacher', label: 'Teacher',  icon: '👨‍🏫' },
  { value: 'driver',  label: 'Driver',   icon: '🚌' },
]

async function doLogin() {
  error.value = ''
  if (!email.value || !password.value) { error.value = 'Please enter email and password.'; return }
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const role = auth.primaryRole
    if (role === 'student')      router.replace('/student/home')
    else if (role === 'parent')  router.replace('/parent/home')
    else if (role === 'driver')  router.replace('/driver/location')
    else if (role === 'teacher' || role === 'admin') router.replace('/teacher/home')
    else error.value = 'No mobile access for this role. Use the web portal.'
  } catch (e) {
    error.value = e.response?.data?.message || 'Invalid email or password.'
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-content { --background: transparent }
.login-bg {
  min-height: 100vh;
  background: linear-gradient(160deg, #0f4c75 0%, #1b6ca8 35%, #00b4d8 70%, #48cae4 100%);
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 24px 40px;
}

.logo-wrap { margin-bottom: 20px }
.logo-circle {
  width: 90px; height: 90px; border-radius: 50%;
  background: rgba(255,255,255,.2); border: 3px solid rgba(255,255,255,.5);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
}
.logo-icon { font-size: 40px }

.login-title { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 6px }
.login-sub   { font-size: 14px; color: rgba(255,255,255,.75); margin-bottom: 32px }

.login-card {
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.3);
  border-radius: 24px;
  padding: 24px;
  width: 100%; max-width: 380px;
}

.tab-row { display: flex; gap: 8px; margin-bottom: 20px; background: rgba(255,255,255,.1); border-radius: 12px; padding: 4px }
.tab-btn {
  flex: 1; padding: 8px 4px; border: none; border-radius: 10px;
  background: transparent; color: rgba(255,255,255,.7); font-size: 12px; cursor: pointer;
  transition: all .2s;
}
.tab-btn.active { background: #fff; color: #1b6ca8; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,.15) }

.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.9); border-radius: 14px;
  padding: 14px 16px; margin-bottom: 12px;
}
.input-icon { font-size: 16px }
.field-input { flex: 1; border: none; background: transparent; font-size: 15px; color: #1e293b; outline: none }
.field-input::placeholder { color: #94a3b8 }
.eye-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 0 }

.error-box { background: rgba(239,68,68,.2); border: 1px solid rgba(239,68,68,.4); color: #fff; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px }

.sign-btn {
  width: 100%; padding: 16px; border: none; border-radius: 14px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 20px rgba(59,130,246,.4);
  transition: opacity .2s;
}
.sign-btn:disabled { opacity: .7 }

.role-hint { margin-top: 20px; color: rgba(255,255,255,.7); font-size: 13px }
.role-hint strong { color: #fff }
</style>
