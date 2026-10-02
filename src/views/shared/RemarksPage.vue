<template>
  <app-layout title="Remarks & Complaints" header-gradient="linear-gradient(135deg,#b45309,#f59e0b)">
    <div class="page-wrap">

      <!-- Tabs -->
      <div class="tab-row">
        <button v-for="t in tabs" :key="t.value"
          class="tab-btn" :class="{ active: activeTab === t.value }"
          @click="activeTab = t.value">
          {{ t.label }}
        </button>
      </div>

      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>

      <template v-else>
        <div v-if="!filtered.length" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">Nothing here yet</div>
        </div>

        <div v-for="r in filtered" :key="r.id" class="remark-card" @click="selected = r">
          <div class="remark-top">
            <span class="remark-type" :class="r.data.type">{{ r.data.type }}</span>
            <span class="remark-by">by {{ r.data.remark_by }}</span>
            <span class="remark-status" :class="r.data.status">{{ r.data.status }}</span>
          </div>
          <div class="remark-msg">{{ r.data.message }}</div>
          <div class="remark-date">{{ formatDate(r.created_at) }}</div>
        </div>

        <!-- Add complaint button (parent only) -->
        <button v-if="isParent" class="fab" @click="showForm = true">+ New Complaint</button>
      </template>

      <!-- Detail modal -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="remark-top">
            <span class="remark-type" :class="selected.data.type">{{ selected.data.type }}</span>
            <span class="remark-status" :class="selected.data.status">{{ selected.data.status }}</span>
          </div>
          <div class="modal-msg">{{ selected.data.message }}</div>
          <div v-if="selected.data.response" class="response-box">
            <div class="response-label">Response</div>
            <div class="response-text">{{ selected.data.response }}</div>
          </div>
          <button class="close-btn" @click="selected = null">Close</button>
        </div>
      </div>

      <!-- New complaint form (parent) -->
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-title">New Complaint</div>
          <textarea v-model="form.message" placeholder="Describe your complaint…" class="form-textarea" rows="5"></textarea>
          <div v-if="formError" class="error-box">{{ formError }}</div>
          <button class="submit-btn" :disabled="submitting" @click="submitComplaint">
            {{ submitting ? 'Submitting…' : 'Submit Complaint' }}
          </button>
          <button class="close-btn" style="margin-top:8px" @click="showForm = false">Cancel</button>
        </div>
      </div>

    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { remarksApi } from '../../api'
import { useAuthStore } from '../../stores/auth'

const auth     = useAuthStore()
const isParent = auth.isParent

const remarks    = ref([])
const loading    = ref(true)
const selected   = ref(null)
const showForm   = ref(false)
const submitting = ref(false)
const formError  = ref('')
const activeTab  = ref('all')
const form       = ref({ message: '' })

const tabs = [
  { value: 'all',       label: 'All' },
  { value: 'remark',    label: 'Remarks' },
  { value: 'complaint', label: 'Complaints' },
]

const filtered = computed(() => {
  if (activeTab.value === 'all') return remarks.value
  return remarks.value.filter(r => r.data.type === activeTab.value)
})

onMounted(async () => {
  try { remarks.value = (await remarksApi.list()).data } catch { /* */ }
  finally { loading.value = false }
})

async function submitComplaint() {
  formError.value = ''
  if (!form.value.message.trim()) { formError.value = 'Please enter a message.'; return }
  submitting.value = true
  try {
    await remarksApi.create({
      type:       'complaint',
      remark_by:  'parent',
      message:    form.value.message,
      visibility: 'parent_only',
    })
    form.value.message = ''
    showForm.value = false
    const res = await remarksApi.list()
    remarks.value = res.data
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Failed to submit.'
  } finally { submitting.value = false }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.page-wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.tab-row { display:flex;gap:8px;margin-bottom:16px }
.tab-btn { flex:1;padding:9px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#64748b;cursor:pointer }
.tab-btn.active { background:#f59e0b;border-color:#f59e0b;color:#fff }

.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:48px;margin-bottom:12px }
.empty-text  { color:#94a3b8;font-size:15px }

.remark-card { background:#fff;border-radius:16px;padding:14px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.07);cursor:pointer;border-left:4px solid #f59e0b }
.remark-top  { display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap }
.remark-type { font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:capitalize }
.remark-type.remark    { background:#fef3c7;color:#92400e }
.remark-type.complaint { background:#fee2e2;color:#991b1b }
.remark-by   { font-size:11px;color:#94a3b8;flex:1 }
.remark-status { font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:capitalize }
.remark-status.open         { background:#dbeafe;color:#1e40af }
.remark-status.acknowledged { background:#fef9c3;color:#854d0e }
.remark-status.resolved     { background:#dcfce7;color:#15803d }
.remark-msg  { font-size:14px;color:#1e293b;line-height:1.5;margin-bottom:6px }
.remark-date { font-size:11px;color:#94a3b8 }

.fab { position:fixed;bottom:24px;right:20px;padding:14px 22px;background:#f59e0b;color:#fff;border:none;border-radius:28px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(245,158,11,.4);z-index:50 }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end }
.modal-sheet { background:#fff;border-radius:24px 24px 0 0;padding:16px 20px 40px;width:100%;max-height:85vh;overflow-y:auto }
.modal-handle { width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 14px }
.modal-title  { font-size:17px;font-weight:700;color:#1e293b;margin-bottom:14px }
.modal-msg    { font-size:15px;color:#1e293b;line-height:1.6;margin:12px 0 }
.response-box { background:#f0fdf4;border-radius:12px;padding:14px;margin-bottom:14px }
.response-label { font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px }
.response-text  { font-size:14px;color:#1e293b;line-height:1.5 }

.form-textarea { width:100%;padding:14px;border:1.5px solid #e2e8f0;border-radius:14px;font-size:14px;resize:none;outline:none;box-sizing:border-box;margin-bottom:12px }
.form-textarea:focus { border-color:#f59e0b }
.error-box { background:#fee2e2;color:#991b1b;border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:12px }
.submit-btn { width:100%;padding:14px;background:#f59e0b;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer }
.submit-btn:disabled { opacity:.6 }
.close-btn  { width:100%;padding:14px;background:#f1f5f9;color:#64748b;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer }
</style>
