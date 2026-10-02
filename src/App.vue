<template>
  <ion-app>
    <!-- Global side menu — works across all pages -->
    <ion-menu content-id="main-content" type="overlay" menu-id="main-menu">
      <ion-content class="menu-content">
        <!-- User header -->
        <div class="menu-header">
          <div class="menu-avatar">{{ initials }}</div>
          <div class="menu-user-info">
            <div class="menu-name">{{ auth.user?.name }}</div>
            <div class="menu-email">{{ auth.user?.email }}</div>
          </div>
        </div>

        <!-- Nav -->
        <div class="menu-nav">
          <template v-for="section in currentMenuSections" :key="section.title">
            <div v-if="section.title" class="menu-section-title">{{ section.title }}</div>
            <ion-menu-toggle v-for="item in section.items" :key="item.path" auto-hide="false">
              <div class="menu-item" :class="{ active: route.path === item.path }" @click="navigate(item.path)">
                <span class="menu-item-icon">{{ item.icon }}</span>
                <span class="menu-item-label">{{ item.label }}</span>
                <span v-if="item.badge" class="menu-badge">{{ item.badge }}</span>
              </div>
            </ion-menu-toggle>
          </template>
        </div>

        <!-- Logout -->
        <div class="menu-footer">
          <ion-menu-toggle auto-hide="false">
            <div class="menu-item logout-item" @click="doLogout">
              <span class="menu-item-icon">🚪</span>
              <span class="menu-item-label" style="color:#ef4444">Logout</span>
            </div>
          </ion-menu-toggle>
          <div class="menu-version">School App v1.0.0</div>
        </div>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonMenuToggle, menuController } from '@ionic/vue'
import { useAuthStore } from './stores/auth'
import { chatApi } from './api'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const unreadCount = ref(0)
let badgeTimer = null

onMounted(() => {
  if (auth.isLoggedIn) {
    fetchUnread()
    badgeTimer = setInterval(fetchUnread, 10000)
  }
})
onUnmounted(() => clearInterval(badgeTimer))

async function fetchUnread() {
  if (!auth.isLoggedIn) return
  try {
    const res = await chatApi.unread()
    unreadCount.value = res.data.count
  } catch { /* */ }
}

const initials = computed(() => {
  const n = auth.user?.name ?? ''
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
})

const studentMenu = [
  { title: '', items: [{ path: '/student/home', icon: '🏠', label: 'Dashboard' }] },
  { title: 'ACADEMICS', items: [
    { path: '/student/marks',      icon: '📊', label: 'My Marks' },
    { path: '/student/attendance', icon: '📅', label: 'Attendance' },
    { path: '/student/fees',       icon: '💰', label: 'Fee Status' },
    { path: '/student/profile',    icon: '👤', label: 'My Profile' },
  ]},
  { title: 'SCHOOL', items: [
    { path: '/student/events',    icon: '🎉', label: 'Events' },
    { path: '/student/homework',  icon: '📓', label: 'Homework' },
    { path: '/student/youtube',   icon: '▶️', label: 'YouTube Channel' },
    { path: '/student/chat',      icon: '💬', label: 'Messages' },
    { path: '/student/remarks',   icon: '📝', label: 'Remarks' },
    { path: '/student/bus',       icon: '🚌', label: 'Bus Tracking' },
    { path: '/student/whatsapp',  icon: '📱', label: 'WhatsApp' },
  ]},
]
const parentMenu = [
  { title: '', items: [{ path: '/parent/home', icon: '🏠', label: 'Dashboard' }] },
  { title: 'CHILDREN', items: [
    { path: '/parent/children', icon: '👨‍👧', label: 'My Children' },
    { path: '/parent/fees',     icon: '💰', label: 'Fee Payments' },
    { path: '/parent/notices',  icon: '📢', label: 'Notices' },
  ]},
  { title: 'SCHOOL', items: [
    { path: '/parent/events',    icon: '🎉', label: 'Events' },
    { path: '/parent/homework',  icon: '📓', label: 'Homework' },
    { path: '/parent/youtube',   icon: '▶️', label: 'YouTube Channel' },
    { path: '/parent/chat',      icon: '💬', label: 'Messages' },
    { path: '/parent/remarks',   icon: '📝', label: 'Remarks & Complaints' },
    { path: '/parent/bus',       icon: '🚌', label: 'Bus Tracking' },
    { path: '/parent/whatsapp',  icon: '📱', label: 'WhatsApp' },
  ]},
]
const teacherMenu = [
  { title: '', items: [{ path: '/teacher/home', icon: '🏠', label: 'Dashboard' }] },
  { title: 'CLASSROOM', items: [
    { path: '/teacher/attendance', icon: '✅', label: 'Mark Attendance' },
    { path: '/teacher/marks',      icon: '📝', label: 'Enter Marks' },
    { path: '/teacher/students',   icon: '👥', label: 'My Students' },
  ]},
  { title: 'SCHOOL', items: [
    { path: '/teacher/events',    icon: '🎉', label: 'Events' },
    { path: '/teacher/homework',  icon: '📓', label: 'Homework' },
    { path: '/teacher/youtube',   icon: '▶️', label: 'YouTube Channel' },
    { path: '/teacher/chat',      icon: '💬', label: 'Messages' },
    { path: '/teacher/remarks',   icon: '📝', label: 'Remarks' },
    { path: '/teacher/bus',       icon: '🚌', label: 'Bus Tracking' },
    { path: '/teacher/whatsapp',  icon: '📱', label: 'WhatsApp' },
  ]},
]

const currentMenuSections = computed(() => {
  const p = route.path
  const badge = unreadCount.value > 0 ? unreadCount.value : null

  const injectBadge = (sections) => sections.map(section => ({
    ...section,
    items: section.items.map(item =>
      item.path.endsWith('/chat') ? { ...item, badge } : item
    )
  }))

  if (p.startsWith('/student')) return injectBadge(studentMenu)
  if (p.startsWith('/parent'))  return injectBadge(parentMenu)
  if (p.startsWith('/teacher')) return injectBadge(teacherMenu)
  return []
})

function navigate(path) {
  menuController.close('main-menu')
  router.push(path)
}

async function doLogout() {
  menuController.close('main-menu')
  clearInterval(badgeTimer)
  badgeTimer = null
  await auth.logout()
  router.replace('/login')
}
</script>

<style>
/* Global menu styles */
ion-menu { --width: 280px }
.menu-content { --background: linear-gradient(160deg,#1e1b4b,#312e81,#4338ca) !important }

.menu-header {
  display: flex; align-items: center; gap: 12px;
  padding: 52px 20px 20px;
  background: rgba(255,255,255,.1);
  border-bottom: 1px solid rgba(255,255,255,.15);
}
.menu-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg,#f97316,#fb923c);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.menu-user-info { flex: 1; min-width: 0 }
.menu-name  { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.menu-email { font-size: 12px; color: rgba(255,255,255,.6); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }

.menu-nav { padding: 12px 0; flex: 1 }
.menu-section-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,.4); letter-spacing: 1.5px; padding: 12px 20px 6px; text-transform: uppercase }

.menu-item {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 20px; cursor: pointer;
  transition: background .15s; position: relative;
}
.menu-item:hover, .menu-item.active { background: rgba(255,255,255,.12) }
.menu-item.active::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 4px; background: #f97316; border-radius: 0 4px 4px 0;
}
.menu-item-icon  { font-size: 18px; width: 24px; text-align: center }
.menu-item-label { font-size: 14px; color: #fff; font-weight: 500; flex: 1 }
.menu-badge { background: #f97316; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px }

.menu-footer { padding: 12px 0; border-top: 1px solid rgba(255,255,255,.1) }
.menu-version { text-align: center; font-size: 11px; color: rgba(255,255,255,.3); padding: 8px }
</style>
