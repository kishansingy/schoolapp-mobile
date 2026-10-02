<template>
  <app-layout title="Dashboard">
    <div class="home-wrap">

      <div v-if="loading" class="center-loader">
        <div class="spinner"></div>
      </div>

      <template v-else>
        <!-- Hero card -->
        <div class="hero-card">
          <div class="hero-badge">⭐ Student Portal</div>
          <div class="hero-title">Welcome Back,<br>{{ dash?.student?.first_name }}!</div>
          <div class="hero-sub">{{ dash?.student?.admission_no }} · Class {{ dash?.student?.class_id }}</div>
          <div class="hero-stats">
            <div class="hs" v-for="s in dash?.stats" :key="s.label">
              <div class="hs-val">{{ s.value }}</div>
              <div class="hs-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="section-header">
          <span class="section-title">📚 Quick Access</span>
        </div>
        <div class="quick-grid">
          <div v-for="q in quickLinks" :key="q.path" class="quick-card" :style="`background:${q.bg}`" @click="$router.push(q.path)">
            <div class="qc-icon">{{ q.icon }}</div>
            <div class="qc-label">{{ q.label }}</div>
          </div>
        </div>

        <!-- Recent marks -->
        <div v-if="dash?.recent_marks?.length" class="section-header">
          <span class="section-title">📊 Recent Results</span>
          <span class="view-all" @click="$router.push('/student/marks')">View All →</span>
        </div>
        <div v-if="dash?.recent_marks?.length" class="marks-card">
          <div v-for="m in dash.recent_marks.slice(0,3)" :key="m.subject_id" class="mark-row">
            <div class="mark-subject">{{ m.subject_id }}</div>
            <div class="mark-right">
              <div class="mark-score">{{ m.marks_obtained }}/{{ m.max_marks }}</div>
              <div class="grade-pill" :class="`g-${m.grade}`">{{ m.grade }}</div>
            </div>
          </div>
        </div>

        <!-- Notices -->
        <div class="section-header">
          <span class="section-title">📢 Notices</span>
          <span class="view-all">View All →</span>
        </div>
        <div v-for="n in (dash?.notices ?? []).slice(0,3)" :key="n.id" class="notice-card">
          <div class="notice-dot"></div>
          <div>
            <div class="notice-title">{{ n.title }}</div>
            <div class="notice-date">{{ n.publish_date }}</div>
          </div>
        </div>
        <div v-if="!dash?.notices?.length" class="empty-msg">No notices.</div>

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
  { title: '', items: [
    { path: '/student/home',       icon: '🏠', label: 'Dashboard' },
  ]},
  { title: 'ACADEMICS', items: [
    { path: '/student/marks',      icon: '📊', label: 'My Marks' },
    { path: '/student/attendance', icon: '📅', label: 'Attendance' },
    { path: '/student/fees',       icon: '💰', label: 'Fee Status' },
  ]},
  { title: 'ACCOUNT', items: [
    { path: '/student/profile',    icon: '👤', label: 'My Profile' },
  ]},
]

const quickLinks = [
  { path: '/student/marks',      icon: '📊', label: 'Marks',      bg: 'linear-gradient(135deg,#f97316,#fb923c)' },
  { path: '/student/attendance', icon: '📅', label: 'Attendance', bg: 'linear-gradient(135deg,#10b981,#34d399)' },
  { path: '/student/fees',       icon: '💰', label: 'Fees',       bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
  { path: '/student/profile',    icon: '👤', label: 'Profile',    bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' },
]

onMounted(async () => {
  try { dash.value = (await dashApi.get()).data } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.home-wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

/* Hero */
.hero-card {
  background: linear-gradient(135deg,#f97316 0%,#fb923c 50%,#fbbf24 100%);
  border-radius: 20px; padding: 22px; margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(249,115,22,.35);
}
.hero-badge { display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:10px }
.hero-title { font-size:22px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:4px }
.hero-sub   { font-size:13px;color:rgba(255,255,255,.8);margin-bottom:16px }
.hero-stats { display:flex;gap:0 }
.hs { flex:1;background:rgba(255,255,255,.9);border-radius:12px;padding:10px;text-align:center;margin:0 4px }
.hs:first-child { margin-left:0 } .hs:last-child { margin-right:0 }
.hs-val { font-size:18px;font-weight:800;color:#f97316 }
.hs-lbl { font-size:10px;color:#64748b;margin-top:2px }

/* Section */
.section-header { display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px }
.section-title  { font-size:15px;font-weight:700;color:#1e293b }
.view-all       { font-size:13px;color:#3b82f6;font-weight:600;cursor:pointer }

/* Quick grid */
.quick-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px }
.quick-card { border-radius:16px;padding:18px 14px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.12);transition:transform .15s }
.quick-card:active { transform:scale(.97) }
.qc-icon  { font-size:28px;margin-bottom:8px }
.qc-label { font-size:14px;font-weight:700;color:#fff }

/* Marks */
.marks-card { background:#fff;border-radius:16px;padding:4px 0;margin-bottom:4px;box-shadow:0 2px 12px rgba(0,0,0,.06) }
.mark-row   { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #f1f5f9 }
.mark-row:last-child { border-bottom:none }
.mark-subject { font-size:14px;font-weight:600;color:#1e293b }
.mark-right   { display:flex;align-items:center;gap:10px }
.mark-score   { font-size:13px;color:#64748b }
.grade-pill   { padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700 }
.g-A\+,.g-A  { background:#dcfce7;color:#15803d }
.g-B\+,.g-B  { background:#dbeafe;color:#1d4ed8 }
.g-C { background:#fef9c3;color:#854d0e }
.g-F { background:#fee2e2;color:#991b1b }

/* Notices */
.notice-card { display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.notice-dot  { width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-top:5px;flex-shrink:0 }
.notice-title { font-size:14px;font-weight:600;color:#1e293b }
.notice-date  { font-size:12px;color:#94a3b8;margin-top:3px }
.empty-msg    { color:#94a3b8;text-align:center;padding:20px;font-size:13px }
</style>
