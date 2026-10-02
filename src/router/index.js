import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/',       redirect: '/login' },
  { path: '/login',  component: () => import('../views/LoginPage.vue'), meta: { public: true } },

  // ── Student ───────────────────────────────────────────────────────────────
  { path: '/student', component: () => import('../views/student/StudentTabs.vue'),
    children: [
      { path: '',           redirect: '/student/home' },
      { path: 'home',       component: () => import('../views/student/StudentHome.vue') },
      { path: 'marks',      component: () => import('../views/student/StudentMarks.vue') },
      { path: 'attendance', component: () => import('../views/student/StudentAttendance.vue') },
      { path: 'fees',       component: () => import('../views/student/StudentFees.vue') },
      { path: 'profile',    component: () => import('../views/student/StudentProfile.vue') },
      // New modules
      { path: 'events',     component: () => import('../views/shared/EventsPage.vue') },
      { path: 'homework',   component: () => import('../views/shared/HomeworkPage.vue') },
      { path: 'youtube',    component: () => import('../views/shared/YoutubePage.vue') },
      { path: 'chat',       component: () => import('../views/shared/ChatPage.vue') },
      { path: 'remarks',    component: () => import('../views/shared/RemarksPage.vue') },
      { path: 'bus',        component: () => import('../views/shared/BusTrackingPage.vue') },
      { path: 'whatsapp',   component: () => import('../views/shared/WhatsappPage.vue') },
    ]
  },

  // ── Parent ────────────────────────────────────────────────────────────────
  { path: '/parent', component: () => import('../views/parent/ParentTabs.vue'),
    children: [
      { path: '',           redirect: '/parent/home' },
      { path: 'home',       component: () => import('../views/parent/ParentHome.vue') },
      { path: 'children',   component: () => import('../views/parent/ParentChildren.vue') },
      { path: 'fees',       component: () => import('../views/parent/ParentFees.vue') },
      { path: 'notices',    component: () => import('../views/parent/ParentNotices.vue') },
      // New modules
      { path: 'events',     component: () => import('../views/shared/EventsPage.vue') },
      { path: 'homework',   component: () => import('../views/shared/HomeworkPage.vue') },
      { path: 'youtube',    component: () => import('../views/shared/YoutubePage.vue') },
      { path: 'chat',       component: () => import('../views/shared/ChatPage.vue') },
      { path: 'remarks',    component: () => import('../views/shared/RemarksPage.vue') },
      { path: 'bus',        component: () => import('../views/shared/BusTrackingPage.vue') },
      { path: 'whatsapp',   component: () => import('../views/shared/WhatsappPage.vue') },
    ]
  },

  // ── Teacher ───────────────────────────────────────────────────────────────
  { path: '/teacher', component: () => import('../views/teacher/TeacherTabs.vue'),
    children: [
      { path: '',           redirect: '/teacher/home' },
      { path: 'home',       component: () => import('../views/teacher/TeacherHome.vue') },
      { path: 'attendance', component: () => import('../views/teacher/TeacherAttendance.vue') },
      { path: 'marks',      component: () => import('../views/teacher/TeacherMarks.vue') },
      { path: 'students',   component: () => import('../views/teacher/TeacherStudents.vue') },
      // New modules
      { path: 'events',     component: () => import('../views/shared/EventsPage.vue') },
      { path: 'homework',   component: () => import('../views/shared/HomeworkPage.vue') },
      { path: 'youtube',    component: () => import('../views/shared/YoutubePage.vue') },
      { path: 'chat',       component: () => import('../views/shared/ChatPage.vue') },
      { path: 'remarks',    component: () => import('../views/shared/RemarksPage.vue') },
      { path: 'bus',        component: () => import('../views/shared/BusTrackingPage.vue') },
      { path: 'whatsapp',   component: () => import('../views/shared/WhatsappPage.vue') },
    ]
  },

  // ── Driver ────────────────────────────────────────────────────────────────
  { path: '/driver/location', component: () => import('../views/driver/DriverLocationPage.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return '/login'
  return true
})

export default router
