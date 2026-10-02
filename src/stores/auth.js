import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn  = computed(() => !!token.value)
  const roles       = computed(() => user.value?.roles?.map(r => r.name ?? r) ?? [])
  const isStudent   = computed(() => roles.value.includes('student'))
  const isParent    = computed(() => roles.value.includes('parent'))
  const isTeacher   = computed(() => roles.value.includes('teacher'))
  const isAdmin     = computed(() => roles.value.includes('admin'))
  const isDriver    = computed(() => roles.value.includes('driver'))
  const primaryRole = computed(() => {
    if (roles.value.includes('admin'))   return 'admin'
    if (roles.value.includes('teacher')) return 'teacher'
    if (roles.value.includes('driver'))  return 'driver'
    if (roles.value.includes('student')) return 'student'
    if (roles.value.includes('parent'))  return 'parent'
    return 'viewer'
  })

  async function login(email, password) {
    const res = await authApi.login({ email, password })
    user.value  = res.data.user
    token.value = res.data.token
    localStorage.setItem('user',  JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
    return res.data
  }

  async function logout() {
    try { await authApi.logout() } catch { /* ignore */ }
    user.value  = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, roles, isStudent, isParent, isTeacher, isAdmin, isDriver, primaryRole, login, logout }
})
