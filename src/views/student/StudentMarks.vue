<template>
  <app-layout title="My Marks" header-gradient="linear-gradient(90deg,#1b6ca8,#00b4d8)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <!-- Summary card -->
        <div class="summary-card">
          <div class="sum-item"><div class="sum-val">{{ summary.total_obtained }}</div><div class="sum-lbl">Total Obtained</div></div>
          <div class="sum-divider"></div>
          <div class="sum-item"><div class="sum-val">{{ summary.total_max }}</div><div class="sum-lbl">Total Max</div></div>
          <div class="sum-divider"></div>
          <div class="sum-item"><div class="sum-val">{{ summary.pct }}%</div><div class="sum-lbl">Overall</div></div>
          <div class="sum-divider"></div>
          <div class="sum-item"><div class="sum-val grade-pill" :class="`g-${summary.grade}`">{{ summary.grade }}</div><div class="sum-lbl">Grade</div></div>
        </div>

        <div v-if="!rows.length" class="empty-msg">No marks records found.</div>
        <div v-for="r in rows" :key="r.id ?? r.subject_id" class="mark-card">
          <div class="mc-top">
            <div>
              <div class="mc-subject">{{ subjectName(r.subject_id) }}</div>
              <div class="mc-exam">{{ examName(r.exam_id) }} · {{ r.written_date }}</div>
            </div>
            <div class="grade-pill" :class="`g-${r.grade}`">{{ r.grade }}</div>
          </div>
          <div class="mc-bar-wrap">
            <div class="mc-bar" :style="`width:${r.percentage}%;background:${gradeColor(r.grade)}`"></div>
          </div>
          <div class="mc-bottom">
            <span>{{ r.marks_obtained }} / {{ r.max_marks }}</span>
            <span>{{ r.percentage }}%</span>
          </div>
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

const rows    = ref([])
const labels  = ref({})
const loading = ref(true)

const subjectName = (id) => labels.value?.subjects?.[id] ?? `Subject ${id}`
const examName    = (id) => labels.value?.exams?.[id]    ?? `Exam ${id}`

const menuSections = [
  { title: '', items: [{ path: '/student/home', icon: '🏠', label: 'Dashboard' }]},
  { title: 'ACADEMICS', items: [
    { path: '/student/marks',      icon: '📊', label: 'My Marks' },
    { path: '/student/attendance', icon: '📅', label: 'Attendance' },
    { path: '/student/fees',       icon: '💰', label: 'Fee Status' },
    { path: '/student/profile',    icon: '👤', label: 'My Profile' },
  ]},
]

const summary = computed(() => {
  const obt = rows.value.reduce((s,r) => s + (parseFloat(r.marks_obtained)||0), 0)
  const max = rows.value.reduce((s,r) => s + (parseFloat(r.max_marks)||0), 0)
  const pct = max ? Math.round(obt/max*100) : 0
  const grade = pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=40?'D':'F'
  return { total_obtained: obt, total_max: max, pct, grade }
})

const gradeColor = (g) => ({ 'A+':'#10b981','A':'#10b981','B+':'#3b82f6','B':'#3b82f6','C':'#f59e0b','D':'#f97316','F':'#ef4444' }[g] ?? '#94a3b8')

onMounted(async () => {
  try {
    const r = await profileApi.me()
    rows.value   = r.data.marks ?? []
    labels.value = r.data.labels ?? {}
  } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.summary-card { display:flex;background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08) }
.sum-item     { flex:1;text-align:center }
.sum-val      { font-size:18px;font-weight:800;color:#1e293b }
.sum-lbl      { font-size:10px;color:#94a3b8;margin-top:3px }
.sum-divider  { width:1px;background:#e2e8f0;margin:4px 0 }

.mark-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.06) }
.mc-top    { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px }
.mc-subject { font-size:15px;font-weight:700;color:#1e293b }
.mc-exam    { font-size:12px;color:#94a3b8;margin-top:3px }
.mc-bar-wrap { background:#f1f5f9;border-radius:99px;height:6px;margin-bottom:8px }
.mc-bar      { height:6px;border-radius:99px;transition:width .4s }
.mc-bottom   { display:flex;justify-content:space-between;font-size:12px;color:#64748b }

.grade-pill  { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block }
.g-A\+,.g-A { background:#dcfce7;color:#15803d }
.g-B\+,.g-B { background:#dbeafe;color:#1d4ed8 }
.g-C { background:#fef9c3;color:#854d0e }
.g-F { background:#fee2e2;color:#991b1b }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
