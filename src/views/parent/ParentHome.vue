<template>
  <app-layout title="Dashboard" header-gradient="linear-gradient(90deg,#7c3aed,#a855f7)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>

        <!-- Hero -->
        <div class="hero-card">
          <div class="hero-badge">👨‍👧 Parent Portal</div>
          <div class="hero-title">Hello,<br>{{ dash?.parent?.first_name ?? auth.user?.name }}!</div>
          <div class="hero-sub">{{ dash?.parent?.relation }} · {{ dash?.parent?.phone }}</div>
        </div>

        <!-- Children -->
        <div class="section-header">
          <span class="section-title">👨‍👧 My Children</span>
          <span class="view-all" @click="$router.push('/parent/children')">View All →</span>
        </div>

        <div v-if="!dash?.children?.length" class="empty-card">No children linked. Contact admin.</div>

        <div v-for="child in (dash?.children ?? [])" :key="child.student.id" class="child-card">
          <div class="child-header">
            <div class="child-avatar">{{ (child.student.first_name?.[0]??'') + (child.student.last_name?.[0]??'') }}</div>
            <div class="child-info">
              <div class="child-name">{{ child.student.first_name }} {{ child.student.last_name }}</div>
              <div class="child-meta">Adm: {{ child.student.admission_no }}</div>
            </div>
          </div>
          <div class="child-stats">
            <div class="cs-item">
              <div class="cs-bar-wrap">
                <div class="cs-bar" :style="`width:${child.attendance}%;background:${child.attendance>=75?'#10b981':'#ef4444'}`"></div>
              </div>
              <div class="cs-row">
                <span class="cs-lbl">Attendance</span>
                <span class="cs-val" :style="child.attendance>=75?'color:#10b981':'color:#ef4444'">{{ child.attendance }}%</span>
              </div>
            </div>
            <div class="cs-fee" :class="child.pending_fees ? 'fee-due' : 'fee-ok'">
              {{ child.pending_fees ? `${child.pending_fees} Pending Fee(s)` : '✓ Fees Clear' }}
            </div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="section-header"><span class="section-title">Quick Actions</span></div>
        <div class="quick-grid">
          <div v-for="q in quickLinks" :key="q.path" class="quick-card" :style="`background:${q.bg}`" @click="$router.push(q.path)">
            <div class="qc-icon">{{ q.icon }}</div>
            <div class="qc-label">{{ q.label }}</div>
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
  { title: '', items: [{ path: '/parent/home', icon: '🏠', label: 'Dashboard' }]},
  { title: 'CHILDREN', items: [
    { path: '/parent/children', icon: '👨‍👧', label: 'My Children' },
    { path: '/parent/fees',     icon: '💰', label: 'Fee Payments' },
    { path: '/parent/notices',  icon: '📢', label: 'Notices' },
  ]},
]

const quickLinks = [
  { path: '/parent/children', icon: '👨‍👧', label: 'Children',  bg: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { path: '/parent/fees',     icon: '💰', label: 'Pay Fees',   bg: 'linear-gradient(135deg,#f97316,#fb923c)' },
  { path: '/parent/notices',  icon: '📢', label: 'Notices',    bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
]

onMounted(async () => {
  try { dash.value = (await dashApi.get()).data } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.hero-card { background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);border-radius:20px;padding:22px;margin-bottom:20px;box-shadow:0 8px 32px rgba(124,58,237,.35) }
.hero-badge { display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:10px }
.hero-title { font-size:22px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:4px }
.hero-sub   { font-size:13px;color:rgba(255,255,255,.8) }

.section-header { display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px }
.section-title  { font-size:15px;font-weight:700;color:#1e293b }
.view-all       { font-size:13px;color:#7c3aed;font-weight:600;cursor:pointer }

.child-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);border-left:4px solid #a855f7 }
.child-header { display:flex;align-items:center;gap:12px;margin-bottom:12px }
.child-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.child-name   { font-size:15px;font-weight:700;color:#1e293b }
.child-meta   { font-size:12px;color:#94a3b8;margin-top:2px }
.cs-bar-wrap  { background:#f1f5f9;border-radius:99px;height:6px;margin-bottom:4px }
.cs-bar       { height:6px;border-radius:99px }
.cs-row       { display:flex;justify-content:space-between }
.cs-lbl       { font-size:12px;color:#64748b }
.cs-val       { font-size:12px;font-weight:700 }
.cs-fee       { margin-top:8px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;text-align:center }
.fee-due      { background:#fee2e2;color:#991b1b }
.fee-ok       { background:#dcfce7;color:#15803d }

.quick-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:4px }
.quick-card { border-radius:14px;padding:14px 10px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.1);text-align:center }
.qc-icon  { font-size:24px;margin-bottom:6px }
.qc-label { font-size:12px;font-weight:700;color:#fff }

.notice-card { display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.notice-dot  { width:8px;height:8px;border-radius:50%;background:#a855f7;margin-top:5px;flex-shrink:0 }
.notice-title { font-size:14px;font-weight:600;color:#1e293b }
.notice-date  { font-size:12px;color:#94a3b8;margin-top:3px }
.empty-card   { background:#fff;border-radius:14px;padding:20px;text-align:center;color:#94a3b8;font-size:13px;margin-bottom:12px }
</style>
