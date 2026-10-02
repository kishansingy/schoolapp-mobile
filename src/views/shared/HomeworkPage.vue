<template>
  <app-layout title="Homework" header-gradient="linear-gradient(135deg,#0369a1,#0ea5e9)">
    <div class="page-wrap">

      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>

      <template v-else>
        <!-- Filter tabs -->
        <div class="filter-row">
          <button v-for="f in filters" :key="f.value"
            class="filter-btn" :class="{ active: activeFilter === f.value }"
            @click="activeFilter = f.value">
            {{ f.label }}
          </button>
        </div>

        <div v-if="!filtered.length" class="empty-state">
          <div class="empty-icon">📓</div>
          <div class="empty-text">No homework found</div>
        </div>

        <div v-for="hw in filtered" :key="hw.id" class="hw-card" @click="selected = hw">
          <div class="hw-top">
            <div class="hw-subject">{{ hw.data.subject_id }}</div>
            <div class="hw-due" :class="isDue(hw.data.submission_date) ? 'overdue' : ''">
              Due: {{ formatDate(hw.data.submission_date) }}
            </div>
          </div>
          <div class="hw-title">{{ hw.data.title }}</div>
          <div class="hw-meta">
            <span>📅 Assigned: {{ formatDate(hw.data.assigned_date) }}</span>
            <span class="hw-status" :class="hw.data.status">{{ hw.data.status }}</span>
          </div>
        </div>
      </template>

      <!-- Detail modal -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="hw-subject big">{{ selected.data.subject_id }}</div>
          <div class="modal-title">{{ selected.data.title }}</div>
          <div class="detail-row">
            <div class="detail-item">
              <div class="detail-label">Assigned</div>
              <div class="detail-val">{{ formatDate(selected.data.assigned_date) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Due Date</div>
              <div class="detail-val" :class="isDue(selected.data.submission_date) ? 'text-red' : ''">
                {{ formatDate(selected.data.submission_date) }}
              </div>
            </div>
          </div>
          <div v-if="selected.data.description" class="modal-desc" v-html="selected.data.description"></div>
          <div v-if="selected.data.attachment" class="attachment-row">
            <a :href="`/storage/${selected.data.attachment}`" target="_blank" class="attach-btn">📎 View Attachment</a>
          </div>
          <button class="close-btn" @click="selected = null">Close</button>
        </div>
      </div>

    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { homeworkApi } from '../../api'

const homework    = ref([])
const loading     = ref(true)
const selected    = ref(null)
const activeFilter = ref('all')

const filters = [
  { value: 'all',    label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

const filtered = computed(() => {
  if (activeFilter.value === 'all') return homework.value
  return homework.value.filter(h => h.data.status === activeFilter.value)
})

onMounted(async () => {
  try { homework.value = (await homeworkApi.list()).data } catch { /* */ }
  finally { loading.value = false }
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isDue(d) {
  if (!d) return false
  return new Date(d) < new Date()
}
</script>

<style scoped>
.page-wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.filter-row { display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px }
.filter-btn { padding:7px 16px;border-radius:20px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;white-space:nowrap }
.filter-btn.active { background:#0ea5e9;border-color:#0ea5e9;color:#fff }

.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:48px;margin-bottom:12px }
.empty-text  { color:#94a3b8;font-size:15px }

.hw-card {
  background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;
  box-shadow:0 2px 12px rgba(0,0,0,.07);cursor:pointer;
  border-left:4px solid #0ea5e9;
}
.hw-top { display:flex;justify-content:space-between;align-items:center;margin-bottom:6px }
.hw-subject { font-size:12px;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:.5px }
.hw-subject.big { font-size:14px;margin-bottom:6px }
.hw-due { font-size:12px;color:#64748b }
.hw-due.overdue { color:#ef4444;font-weight:700 }
.hw-title { font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px }
.hw-meta { display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#94a3b8 }
.hw-status { padding:3px 10px;border-radius:20px;font-weight:700;font-size:11px;text-transform:capitalize }
.hw-status.active { background:#dcfce7;color:#15803d }
.hw-status.closed { background:#f1f5f9;color:#64748b }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end }
.modal-sheet { background:#fff;border-radius:24px 24px 0 0;padding:16px 20px 40px;width:100%;max-height:85vh;overflow-y:auto }
.modal-handle { width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 16px }
.modal-title { font-size:20px;font-weight:800;color:#1e293b;margin-bottom:14px }
.detail-row { display:flex;gap:12px;margin-bottom:14px }
.detail-item { flex:1;background:#f8fafc;border-radius:12px;padding:12px }
.detail-label { font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px }
.detail-val { font-size:14px;font-weight:700;color:#1e293b }
.text-red { color:#ef4444 }
.modal-desc { font-size:14px;color:#475569;line-height:1.6;margin-bottom:16px }
.attachment-row { margin-bottom:16px }
.attach-btn { display:inline-block;padding:10px 20px;background:#f0f9ff;color:#0ea5e9;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none }
.close-btn { width:100%;padding:14px;background:#0ea5e9;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer }
</style>
