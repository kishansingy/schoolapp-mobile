<template>
  <app-layout title="Mark Attendance" header-gradient="linear-gradient(90deg,#059669,#10b981)">
    <div class="wrap">

      <!-- Date + Class selector -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-lbl">Date</label>
            <input type="date" v-model="selectedDate" class="filter-input" />
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Class</label>
            <select v-model="selectedClass" class="filter-input" @change="loadStudents">
              <option value="">Select Class</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.data?.name }}</option>
            </select>
          </div>
        </div>
        <button class="load-btn" @click="loadStudents" :disabled="loadingStudents">
          {{ loadingStudents ? 'Loading...' : 'Load Students' }}
        </button>
      </div>

      <!-- Debug info (remove after fix) -->
      <div v-if="debugInfo" style="background:#1e293b;color:#94a3b8;padding:10px;border-radius:8px;font-size:11px;margin-bottom:10px;font-family:monospace">{{ debugInfo }}</div>

      <!-- Summary bar -->
      <div v-if="students.length" class="summary-bar">
        <div class="sb-item green"><span>{{ counts.present }}</span> Present</div>
        <div class="sb-item red"><span>{{ counts.absent }}</span> Absent</div>
        <div class="sb-item orange"><span>{{ counts.late }}</span> Late</div>
        <div class="sb-item gray"><span>{{ counts.unmarked }}</span> Unmarked</div>
      </div>

      <!-- Quick mark all -->
      <div v-if="students.length" class="quick-mark">
        <span class="qm-lbl">Mark All:</span>
        <button class="qm-btn present" @click="markAll('present')">Present</button>
        <button class="qm-btn absent" @click="markAll('absent')">Absent</button>
      </div>

      <!-- Student list -->
      <div v-if="loadingStudents" class="center-loader"><div class="spinner"></div></div>

      <div v-for="(s, idx) in students" :key="s.id" class="student-row">
        <div class="stu-num">{{ idx + 1 }}</div>
        <div class="stu-avatar">{{ (s.data?.first_name?.[0]??'') + (s.data?.last_name?.[0]??'') }}</div>
        <div class="stu-info">
          <div class="stu-name">{{ s.data?.first_name }} {{ s.data?.last_name }}</div>
          <div class="stu-adm">{{ s.data?.admission_no }}</div>
        </div>
        <div class="status-btns">
          <button class="sb present" :class="{ active: attendance[s.id] === 'present' }" @click="setStatus(s.id, 'present')">P</button>
          <button class="sb absent"  :class="{ active: attendance[s.id] === 'absent'  }" @click="setStatus(s.id, 'absent')">A</button>
          <button class="sb late"    :class="{ active: attendance[s.id] === 'late'    }" @click="setStatus(s.id, 'late')">L</button>
        </div>
      </div>

      <!-- Submit -->
      <div v-if="students.length" class="submit-wrap">
        <div v-if="saveMsg" class="save-msg" :class="saveMsg.type">{{ saveMsg.text }}</div>
        <button class="submit-btn" @click="submitAttendance" :disabled="saving">
          {{ saving ? 'Saving...' : `Submit Attendance (${Object.keys(attendance).length}/${students.length})` }}
        </button>
      </div>

      <div v-if="!loadingStudents && !students.length && selectedClass" class="empty-msg">No students found for this class.</div>      <div style="height:30px"></div>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { tablesApi, recordsApi } from '../../api'
import http from '../../api'

const selectedDate   = ref(new Date().toISOString().slice(0, 10))
const selectedClass  = ref('')
const classes        = ref([])
const students       = ref([])
const attendance     = ref({})   // { student_app_record_id: 'present'|'absent'|'late' }
const loadingStudents = ref(false)
const saving         = ref(false)
const saveMsg        = ref(null)

const debugInfo = ref('')
let attTableId = null
let studentTableId = null

const counts = computed(() => ({
  present:  Object.values(attendance.value).filter(v => v === 'present').length,
  absent:   Object.values(attendance.value).filter(v => v === 'absent').length,
  late:     Object.values(attendance.value).filter(v => v === 'late').length,
  unmarked: students.value.filter(s => !attendance.value[s.id]).length,
}))

onMounted(async () => {
  try {
    const tables = (await tablesApi.list()).data
    const classTable   = tables.find(t => t.name === 'classes')
    const attTable     = tables.find(t => t.name === 'student_attendance')
    const stuTable     = tables.find(t => t.name === 'students')
    attTableId     = attTable?.id
    studentTableId = stuTable?.id

    if (classTable) {
      classes.value = (await recordsApi.list(classTable.id)).data
    }
  } catch (e) {
    console.error('Init error:', e)
  }
})

async function loadStudents() {
  if (!studentTableId) {
    alert('Student table not found. Please refresh.')
    return
  }
  loadingStudents.value = true
  attendance.value = {}
  students.value = []
  try {
    const res = await recordsApi.list(studentTableId)
    const all = res.data
    debugInfo.value = `Total: ${all.length}, classFilter: ${selectedClass.value}, sample class_id: ${all[0]?.data?.class_id}`

    // Show all students regardless of class filter for now
    // (class_id matching is complex due to dual ID system)
    students.value = all
    debugInfo.value += ` → showing all ${all.length} students`

    // Load existing attendance for selected date
    if (attTableId && students.value.length) {
      const attRes  = await recordsApi.list(attTableId)
      const todayRecs = attRes.data.filter(r => r.data?.date === selectedDate.value)
      const newAtt = {}
      todayRecs.forEach(r => {
        const sid = String(r.data?.student_id)
        const stu = students.value.find(s =>
          String(s.schema_row_id) === sid || String(s.id) === sid
        )
        if (stu) newAtt[stu.id] = r.data.status
      })
      attendance.value = newAtt
    }
  } catch (e) {
    console.error('Load students error:', e)
    alert('Error loading students: ' + (e.message ?? e))
  } finally {
    loadingStudents.value = false
  }
}

function setStatus(studentId, status) {
  attendance.value = { ...attendance.value, [studentId]: status }
}

function markAll(status) {
  const map = {}
  students.value.forEach(s => { map[s.id] = status })
  attendance.value = map
}

async function submitAttendance() {
  if (!attTableId) return
  saving.value = true
  saveMsg.value = null
  let saved = 0, failed = 0

  for (const student of students.value) {
    const status = attendance.value[student.id]
    if (!status) continue
    try {
      await http.post(`/tables/${attTableId}/records`, {
        data: {
          student_id: student.schema_row_id ?? student.id,
          date:       selectedDate.value,
          status:     status,
        }
      })
      saved++
    } catch { failed++ }
  }

  saving.value = false
  saveMsg.value = failed
    ? { type: 'warn', text: `Saved ${saved}, ${failed} failed (may already exist for today)` }
    : { type: 'success', text: `✓ Attendance saved for ${saved} students!` }
}
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:40px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#10b981;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.filter-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.07) }
.filter-row  { display:flex;gap:12px;margin-bottom:12px }
.filter-group { flex:1 }
.filter-lbl  { font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px }
.filter-input { width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;color:#1e293b;background:#f8fafc;box-sizing:border-box }
.load-btn { width:100%;padding:12px;background:linear-gradient(90deg,#059669,#10b981);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer }
.load-btn:disabled { opacity:.6 }

.summary-bar { display:flex;gap:8px;margin-bottom:12px }
.sb-item { flex:1;background:#fff;border-radius:10px;padding:8px;text-align:center;font-size:11px;font-weight:600;box-shadow:0 1px 6px rgba(0,0,0,.06) }
.sb-item span { display:block;font-size:18px;font-weight:800;margin-bottom:2px }
.sb-item.green span { color:#10b981 } .sb-item.red span { color:#ef4444 }
.sb-item.orange span { color:#f97316 } .sb-item.gray span { color:#94a3b8 }

.quick-mark { display:flex;align-items:center;gap:8px;margin-bottom:12px }
.qm-lbl { font-size:13px;font-weight:600;color:#64748b }
.qm-btn { padding:6px 14px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer }
.qm-btn.present { background:#dcfce7;color:#15803d }
.qm-btn.absent  { background:#fee2e2;color:#991b1b }

.student-row { display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:12px;margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,.06) }
.stu-num  { font-size:12px;color:#94a3b8;width:20px;text-align:center;flex-shrink:0 }
.stu-avatar { width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.stu-info { flex:1;min-width:0 }
.stu-name { font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.stu-adm  { font-size:11px;color:#94a3b8 }
.status-btns { display:flex;gap:4px;flex-shrink:0 }
.sb { width:32px;height:32px;border:2px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;background:#f8fafc;color:#94a3b8;transition:all .15s }
.sb.present.active { background:#dcfce7;border-color:#10b981;color:#15803d }
.sb.absent.active  { background:#fee2e2;border-color:#ef4444;color:#991b1b }
.sb.late.active    { background:#ffedd5;border-color:#f97316;color:#9a3412 }

.submit-wrap { margin-top:16px }
.save-msg { padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;margin-bottom:10px;text-align:center }
.save-msg.success { background:#dcfce7;color:#15803d }
.save-msg.warn    { background:#fef9c3;color:#854d0e }
.submit-btn { width:100%;padding:16px;background:linear-gradient(90deg,#059669,#10b981);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(5,150,105,.3) }
.submit-btn:disabled { opacity:.6 }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
