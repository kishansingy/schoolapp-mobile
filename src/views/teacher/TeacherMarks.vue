<template>
  <app-layout title="Enter Marks" header-gradient="linear-gradient(90deg,#d97706,#f59e0b)">
    <div class="wrap">

      <!-- Filters -->
      <div class="filter-card">
        <div class="filter-group">
          <label class="filter-lbl">Exam</label>
          <select v-model="selectedExam" class="filter-input">
            <option value="">Select Exam</option>
            <option v-for="e in exams" :key="e.id" :value="e.id">{{ e.data?.name }} ({{ e.data?.academic_year }})</option>
          </select>
        </div>
        <div class="filter-group" style="margin-top:10px">
          <label class="filter-lbl">Subject</label>
          <select v-model="selectedSubject" class="filter-input">
            <option value="">Select Subject</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.data?.name }} ({{ s.data?.code }})</option>
          </select>
        </div>
        <div class="filter-group" style="margin-top:10px">
          <label class="filter-lbl">Class</label>
          <select v-model="selectedClass" class="filter-input" @change="loadStudents">
            <option value="">Select Class</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.data?.name }}</option>
          </select>
        </div>
        <div class="filter-row" style="margin-top:10px">
          <div class="filter-group">
            <label class="filter-lbl">Max Marks</label>
            <input type="number" v-model="maxMarks" class="filter-input" placeholder="100" />
          </div>
          <div class="filter-group">
            <label class="filter-lbl">Date</label>
            <input type="date" v-model="writtenDate" class="filter-input" />
          </div>
        </div>
        <button class="load-btn" @click="loadStudents" :disabled="loadingStudents">
          {{ loadingStudents ? 'Loading...' : 'Load Students' }}
        </button>
      </div>

      <!-- Students marks entry -->
      <div v-if="loadingStudents" class="center-loader"><div class="spinner"></div></div>

      <div v-if="students.length && !loadingStudents">
        <div class="marks-header">
          <span class="mh-name">Student</span>
          <span class="mh-marks">Marks / {{ maxMarks || 100 }}</span>
        </div>

        <div v-for="s in students" :key="s.id" class="marks-row">
          <div class="stu-avatar">{{ (s.data?.first_name?.[0]??'') + (s.data?.last_name?.[0]??'') }}</div>
          <div class="stu-info">
            <div class="stu-name">{{ s.data?.first_name }} {{ s.data?.last_name }}</div>
            <div class="stu-adm">{{ s.data?.admission_no }}</div>
          </div>
          <div class="marks-input-wrap">
            <input
              type="number"
              v-model="marksData[s.id]"
              :max="maxMarks || 100"
              min="0"
              class="marks-input"
              :class="gradeClass(marksData[s.id])"
              placeholder="—"
              @input="validateMarks(s.id)"
            />
            <div class="grade-preview" :class="gradeClass(marksData[s.id])">{{ calcGrade(marksData[s.id]) }}</div>
          </div>
        </div>

        <!-- Submit -->
        <div class="submit-wrap">
          <div v-if="saveMsg" class="save-msg" :class="saveMsg.type">{{ saveMsg.text }}</div>
          <button class="submit-btn" @click="submitMarks" :disabled="saving || !selectedExam || !selectedSubject">
            {{ saving ? 'Saving...' : `Save Marks (${filledCount}/${students.length})` }}
          </button>
        </div>
      </div>

      <div v-if="!loadingStudents && !students.length && selectedClass" class="empty-msg">No students found.</div>
      <div style="height:30px"></div>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { tablesApi, recordsApi } from '../../api'
import http from '../../api'

const selectedExam    = ref('')
const selectedSubject = ref('')
const selectedClass   = ref('')
const maxMarks        = ref(100)
const writtenDate     = ref(new Date().toISOString().slice(0, 10))

const exams    = ref([])
const subjects = ref([])
const classes  = ref([])
const students = ref([])
const marksData = ref({})  // { student_id: marks_obtained }

const loadingStudents = ref(false)
const saving  = ref(false)
const saveMsg = ref(null)

let marksTableId = null, studentTableId = null

const filledCount = computed(() => Object.values(marksData.value).filter(v => v !== '' && v !== null && v !== undefined).length)

onMounted(async () => {
  try {
    const tables = (await tablesApi.list()).data
    const examTable    = tables.find(t => t.name === 'exams')
    const subjectTable = tables.find(t => t.name === 'subjects')
    const classTable   = tables.find(t => t.name === 'classes')
    const marksTable   = tables.find(t => t.name === 'marks')
    const stuTable     = tables.find(t => t.name === 'students')

    marksTableId   = marksTable?.id
    studentTableId = stuTable?.id

    if (examTable)    exams.value    = (await recordsApi.list(examTable.id)).data
    if (subjectTable) subjects.value = (await recordsApi.list(subjectTable.id)).data
    if (classTable)   classes.value  = (await recordsApi.list(classTable.id)).data
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
  marksData.value = {}
  students.value = []
  try {
    const res = await recordsApi.list(studentTableId)
    const all = res.data

    if (selectedClass.value) {
      const classRec   = classes.value.find(c => String(c.id) === String(selectedClass.value))
      const classSchId = classRec?.schema_row_id

      students.value = all.filter(s => {
        const cid = String(s.data?.class_id ?? '')
        return cid === String(selectedClass.value) ||
               (classSchId && cid === String(classSchId))
      })
    } else {
      students.value = all
    }
  } catch (e) {
    console.error('Load students error:', e)
    alert('Error loading students: ' + (e.message ?? e))
  } finally {
    loadingStudents.value = false
  }
}

function validateMarks(studentId) {
  const val = parseFloat(marksData.value[studentId])
  const max = parseFloat(maxMarks.value) || 100
  if (val > max) marksData.value[studentId] = max
  if (val < 0)   marksData.value[studentId] = 0
}

function calcGrade(marks) {
  if (marks === '' || marks === null || marks === undefined) return '—'
  const pct = (parseFloat(marks) / (parseFloat(maxMarks.value) || 100)) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

function gradeClass(marks) {
  const g = calcGrade(marks)
  if (g === 'A+' || g === 'A')  return 'g-a'
  if (g === 'B+' || g === 'B')  return 'g-b'
  if (g === 'C')                 return 'g-c'
  if (g === 'F')                 return 'g-f'
  return ''
}

async function submitMarks() {
  if (!marksTableId || !selectedExam.value || !selectedSubject.value) return
  saving.value = true
  saveMsg.value = null
  let saved = 0, failed = 0
  const max = parseFloat(maxMarks.value) || 100

  for (const student of students.value) {
    const obtained = marksData.value[student.id]
    if (obtained === '' || obtained === null || obtained === undefined) continue
    const pct   = Math.round((parseFloat(obtained) / max) * 100)
    const grade = calcGrade(obtained)
    try {
      await http.post(`/tables/${marksTableId}/records`, {
        data: {
          student_id:     student.schema_row_id ?? student.id,
          exam_id:        selectedExam.value,
          subject_id:     selectedSubject.value,
          marks_obtained: parseFloat(obtained),
          max_marks:      max,
          percentage:     pct,
          grade:          grade,
          written_date:   writtenDate.value,
        }
      })
      saved++
    } catch { failed++ }
  }

  saving.value = false
  saveMsg.value = failed
    ? { type: 'warn', text: `Saved ${saved}, ${failed} failed` }
    : { type: 'success', text: `✓ Marks saved for ${saved} students!` }
}
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:40px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.filter-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.07) }
.filter-row  { display:flex;gap:12px }
.filter-group { flex:1 }
.filter-lbl  { font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px }
.filter-input { width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;color:#1e293b;background:#f8fafc;box-sizing:border-box }
.load-btn { width:100%;padding:12px;background:linear-gradient(90deg,#d97706,#f59e0b);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px }
.load-btn:disabled { opacity:.6 }

.marks-header { display:flex;justify-content:space-between;padding:8px 14px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px }

.marks-row { display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:12px;margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,.06) }
.stu-avatar { width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.stu-info   { flex:1;min-width:0 }
.stu-name   { font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.stu-adm    { font-size:11px;color:#94a3b8 }
.marks-input-wrap { display:flex;align-items:center;gap:6px;flex-shrink:0 }
.marks-input { width:60px;padding:8px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;font-weight:700;text-align:center;color:#1e293b;background:#f8fafc }
.marks-input:focus { outline:none;border-color:#f59e0b }
.grade-preview { width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800 }
.g-a { background:#dcfce7;color:#15803d;border-color:#10b981 }
.g-b { background:#dbeafe;color:#1d4ed8;border-color:#3b82f6 }
.g-c { background:#fef9c3;color:#854d0e;border-color:#f59e0b }
.g-f { background:#fee2e2;color:#991b1b;border-color:#ef4444 }

.submit-wrap { margin-top:16px }
.save-msg { padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;margin-bottom:10px;text-align:center }
.save-msg.success { background:#dcfce7;color:#15803d }
.save-msg.warn    { background:#fef9c3;color:#854d0e }
.submit-btn { width:100%;padding:16px;background:linear-gradient(90deg,#d97706,#f59e0b);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(217,119,6,.3) }
.submit-btn:disabled { opacity:.6 }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
