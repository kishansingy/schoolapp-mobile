<template>
  <app-layout title="Attendance" header-gradient="linear-gradient(90deg,#059669,#10b981)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <!-- Circular progress -->
        <div class="att-hero">
          <div class="circle-wrap">
            <svg viewBox="0 0 100 100" class="circle-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="8"/>
              <circle cx="50" cy="50" r="42" fill="none" :stroke="pct>=75?'#10b981':'#ef4444'" stroke-width="8"
                stroke-linecap="round" stroke-dasharray="264"
                :stroke-dashoffset="264 - (264 * pct / 100)"
                transform="rotate(-90 50 50)" />
            </svg>
            <div class="circle-text">
              <div class="circle-pct">{{ pct }}%</div>
              <div class="circle-lbl">Attendance</div>
            </div>
          </div>
          <div class="att-counts">
            <div class="ac present"><div class="ac-val">{{ counts.present }}</div><div class="ac-lbl">Present</div></div>
            <div class="ac absent"><div class="ac-val">{{ counts.absent }}</div><div class="ac-lbl">Absent</div></div>
            <div class="ac late"><div class="ac-val">{{ counts.late }}</div><div class="ac-lbl">Late</div></div>
          </div>
        </div>

        <!-- Records -->
        <div class="section-title">Recent Records</div>
        <div v-if="!rows.length" class="empty-msg">No attendance records.</div>
        <div v-for="r in rows" :key="r.id ?? r.date" class="att-row">
          <div class="att-date">{{ r.date }}</div>
          <div class="status-pill" :class="`s-${r.status}`">{{ r.status }}</div>
        </div>
        <div style="height:20px"></div>
      </template>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { profileApi } from '../../api'

const rows = ref([]), loading = ref(true)
const menuSections = [
  { title: '', items: [{ path: '/student/home', icon: '🏠', label: 'Dashboard' }]},
  { title: 'ACADEMICS', items: [
    { path: '/student/marks',      icon: '📊', label: 'My Marks' },
    { path: '/student/attendance', icon: '📅', label: 'Attendance' },
    { path: '/student/fees',       icon: '💰', label: 'Fee Status' },
    { path: '/student/profile',    icon: '👤', label: 'My Profile' },
  ]},
]
const counts = computed(() => ({
  present: rows.value.filter(r=>r.status==='present').length,
  absent:  rows.value.filter(r=>r.status==='absent').length,
  late:    rows.value.filter(r=>r.status==='late').length,
}))
const pct = computed(() => {
  const t = rows.value.length
  return t ? Math.round((counts.value.present + counts.value.late) / t * 100) : 0
})
onMounted(async () => {
  try { rows.value = (await profileApi.me()).data.attendance ?? [] } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#10b981;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.att-hero { background:#fff;border-radius:20px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);display:flex;align-items:center;gap:20px }
.circle-wrap { position:relative;width:100px;height:100px;flex-shrink:0 }
.circle-svg  { width:100%;height:100% }
.circle-text { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center }
.circle-pct  { font-size:20px;font-weight:800;color:#1e293b }
.circle-lbl  { font-size:10px;color:#94a3b8 }
.att-counts  { display:flex;flex-direction:column;gap:8px;flex:1 }
.ac          { display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px }
.ac.present  { background:#dcfce7 } .ac.absent { background:#fee2e2 } .ac.late { background:#ffedd5 }
.ac-val      { font-size:18px;font-weight:800;color:#1e293b }
.ac-lbl      { font-size:12px;color:#64748b }

.section-title { font-size:15px;font-weight:700;color:#1e293b;margin:0 0 10px }
.att-row { display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:12px;padding:12px 16px;margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,.05) }
.att-date { font-size:14px;font-weight:600;color:#1e293b }
.status-pill { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize }
.s-present { background:#dcfce7;color:#15803d }
.s-absent  { background:#fee2e2;color:#991b1b }
.s-late    { background:#ffedd5;color:#9a3412 }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
