<template>
  <app-layout title="Dashboard" header-gradient="linear-gradient(90deg,#0f4c75,#1b6ca8)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>

        <!-- Hero -->
        <div class="hero-card">
          <div class="hero-badge">👨‍🏫 Teacher Portal</div>
          <div class="hero-title">Welcome,<br>{{ dash?.staff?.first_name ?? auth.user?.name }}!</div>
          <div class="hero-sub">{{ dash?.staff?.designation }} · {{ dash?.staff?.department }}</div>
          <div class="hero-stats">
            <div class="hs" v-for="s in (dash?.stats ?? [])" :key="s.label">
              <div class="hs-val">{{ s.value }}</div>
              <div class="hs-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="section-header"><span class="section-title">⚡ Quick Actions</span></div>
        <div class="quick-grid">
          <div v-for="q in quickLinks" :key="q.path" class="quick-card" :style="`background:${q.bg}`" @click="$router.push(q.path)">
            <div class="qc-icon">{{ q.icon }}</div>
            <div class="qc-label">{{ q.label }}</div>
          </div>
        </div>

        <!-- My classes -->
        <div v-if="dash?.my_classes?.length">
          <div class="section-header"><span class="section-title">🏫 My Classes</span></div>
          <div class="class-chips">
            <div v-for="c in dash.my_classes" :key="c.id" class="class-chip">{{ c.name }}</div>
          </div>
        </div>

        <!-- Notices -->
        <div class="section-header"><span class="section-title">📢 Notices</span></div>
        <div v-for="n in (dash?.notices ?? []).slice(0,3)" :key="n.id" class="notice-card">
          <div class="notice-dot"></div>
          <div><div class="notice-title">{{ n.title }}</div><div class="notice-date">{{ n.publish_date }}</div></div>
        </div>
        <div style="height:20px"></div>
      </template>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { dashApi } from '../../api'

const auth  = useAuthStore()
const dash  = ref(null)
const loading = ref(true)

const menuSections = [
  { title: '', items: [{ path: '/teacher/home', icon: '🏠', label: 'Dashboard' }]},
  { title: 'CLASSROOM', items: [
    { path: '/teacher/attendance', icon: '✅', label: 'Mark Attendance' },
    { path: '/teacher/marks',      icon: '📝', label: 'Enter Marks' },
    { path: '/teacher/students',   icon: '👥', label: 'My Students' },
  ]},
]

const quickLinks = [
  { path: '/teacher/attendance', icon: '✅', label: 'Attendance', bg: 'linear-gradient(135deg,#10b981,#34d399)' },
  { path: '/teacher/marks',      icon: '📝', label: 'Marks',      bg: 'linear-gradient(135deg,#f97316,#fb923c)' },
  { path: '/teacher/students',   icon: '👥', label: 'Students',   bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
]

onMounted(async () => {
  try { dash.value = (await dashApi.get()).data } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#1b6ca8;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.hero-card { background:linear-gradient(135deg,#0f4c75,#1b6ca8,#00b4d8);border-radius:20px;padding:22px;margin-bottom:20px;box-shadow:0 8px 32px rgba(27,108,168,.35) }
.hero-badge { display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:10px }
.hero-title { font-size:22px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:4px }
.hero-sub   { font-size:13px;color:rgba(255,255,255,.8);margin-bottom:16px }
.hero-stats { display:flex;gap:0 }
.hs { flex:1;background:rgba(255,255,255,.9);border-radius:12px;padding:10px;text-align:center;margin:0 4px }
.hs:first-child { margin-left:0 } .hs:last-child { margin-right:0 }
.hs-val { font-size:18px;font-weight:800;color:#1b6ca8 }
.hs-lbl { font-size:10px;color:#64748b;margin-top:2px }

.section-header { display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px }
.section-title  { font-size:15px;font-weight:700;color:#1e293b }

.quick-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:4px }
.quick-card { border-radius:14px;padding:16px 10px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center }
.qc-icon  { font-size:26px;margin-bottom:6px }
.qc-label { font-size:12px;font-weight:700;color:#fff }

.class-chips { display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px }
.class-chip  { background:#dbeafe;color:#1d4ed8;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600 }

.notice-card { display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.notice-dot  { width:8px;height:8px;border-radius:50%;background:#1b6ca8;margin-top:5px;flex-shrink:0 }
.notice-title { font-size:14px;font-weight:600;color:#1e293b }
.notice-date  { font-size:12px;color:#94a3b8;margin-top:3px }
</style>
