<template>
  <app-layout title="WhatsApp" header-gradient="linear-gradient(90deg,#075e54,#128c7e)">
    <div class="wrap">

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- PARENT / STUDENT / TEACHER — contact school directly             -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <template v-if="!isAdmin">

        <!-- School contact card -->
        <div class="school-card">
          <div class="school-logo">🏫</div>
          <div class="school-info">
            <div class="school-name">{{ schoolName }}</div>
            <div class="school-num">{{ schoolNumber || 'WhatsApp Business' }}</div>
          </div>
          <div class="wa-badge">
            <span class="wa-dot"></span> WhatsApp
          </div>
        </div>

        <!-- Tabs: Compose / History -->
        <div class="tabs">
          <div class="tab" :class="{ active: tab === 'compose' }" @click="tab = 'compose'">✉️ New Message</div>
          <div class="tab" :class="{ active: tab === 'history' }" @click="loadHistory">📋 Sent History</div>
        </div>

        <!-- Compose -->
        <div v-if="tab === 'compose'">
          <div class="section-label">Your Message</div>
          <textarea
            v-model="message"
            class="msg-area"
            rows="6"
            placeholder="Type your message to the school…"
            maxlength="1000"
          ></textarea>
          <div class="char-count">{{ message.length }} / 1000</div>

          <button class="send-btn" :disabled="!message.trim() || sending" @click="doContactSchool">
            <span v-if="sending">Sending…</span>
            <span v-else>📤 Send to School</span>
          </button>

          <div v-if="result" class="result-card" :class="result.success ? 'result-ok' : 'result-err'">
            {{ result.success ? '✅ Message sent to school successfully!' : `❌ Failed: ${result.error}` }}
          </div>

          <div class="info-note">
            Your message will be sent to the school's WhatsApp business account.
            The school will reply to your registered phone number.
          </div>
        </div>

        <!-- Sent history -->
        <div v-if="tab === 'history'">
          <div v-if="loadingLogs" class="mini-loader"><div class="spinner"></div></div>
          <div v-else-if="!logs.length" class="empty-note">No messages sent yet.</div>
          <div v-else>
            <div v-for="log in logs" :key="log.id" class="log-card">
              <div class="log-header">
                <span class="log-label">To: {{ log.recipient_name || 'School' }}</span>
                <span class="log-badge" :class="log.status === 'sent' ? 'badge-sent' : 'badge-fail'">
                  {{ log.status === 'sent' ? '✓ Sent' : '✗ Failed' }}
                </span>
              </div>
              <div class="log-msg">{{ log.message }}</div>
              <div class="log-time">{{ formatDate(log.created_at) }}</div>
            </div>
          </div>
        </div>

      </template>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- ADMIN — full send form with contact picker + templates           -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <template v-else>

        <div class="tabs">
          <div class="tab" :class="{ active: tab === 'send' }"    @click="tab = 'send'">✉️ Send</div>
          <div class="tab" :class="{ active: tab === 'history' }" @click="loadHistory">📋 History</div>
        </div>

        <div v-if="tab === 'send'">
          <!-- Recipient type -->
          <div class="section-label">Send To</div>
          <div class="type-row">
            <div v-for="t in recipientTypes" :key="t.value"
              class="type-chip" :class="{ active: recipientType === t.value }"
              @click="selectType(t.value)">
              {{ t.icon }} {{ t.label }}
            </div>
          </div>

          <!-- Contact picker -->
          <div class="section-label">Select Contact</div>
          <input v-model="search" class="search-input" placeholder="Search by name…" />

          <div v-if="loadingContacts" class="mini-loader"><div class="spinner"></div></div>
          <div v-else-if="!filteredContacts.length" class="empty-note">No contacts found.</div>
          <div v-else class="contact-list">
            <div v-for="c in filteredContacts" :key="c.id"
              class="contact-item" :class="{ selected: selected?.id === c.id }"
              @click="selectContact(c)">
              <div class="contact-avatar">{{ initials(c.name) }}</div>
              <div class="contact-info">
                <div class="contact-name">{{ c.name }}</div>
                <div class="contact-phone">{{ c.phone }}</div>
              </div>
              <div v-if="selected?.id === c.id" class="check">✓</div>
            </div>
          </div>

          <div class="section-label">Or Enter Number Manually</div>
          <input v-model="manualPhone" class="search-input" placeholder="e.g. 9876543210" type="tel" />

          <!-- Templates (admin only) -->
          <div v-if="templates.length">
            <div class="section-label">Quick Templates</div>
            <div class="template-list">
              <div v-for="t in templates" :key="t.id"
                class="template-chip" :class="{ active: activeTemplate?.id === t.id }"
                @click="applyTemplate(t)">
                {{ t.name }}
              </div>
            </div>
          </div>

          <div class="section-label">Message</div>
          <textarea v-model="message" class="msg-area" rows="5"
            placeholder="Type your WhatsApp message…" maxlength="1000"></textarea>
          <div class="char-count">{{ message.length }} / 1000</div>

          <button class="send-btn" :disabled="!canAdminSend || sending" @click="doAdminSend">
            <span v-if="sending">Sending…</span>
            <span v-else>📤 Send WhatsApp Message</span>
          </button>

          <div v-if="result" class="result-card" :class="result.success ? 'result-ok' : 'result-err'">
            {{ result.success ? '✅ Message sent!' : `❌ Failed: ${result.error}` }}
          </div>
        </div>

        <!-- Admin history -->
        <div v-if="tab === 'history'">
          <div v-if="loadingLogs" class="mini-loader"><div class="spinner"></div></div>
          <div v-else-if="!logs.length" class="empty-note">No messages sent yet.</div>
          <div v-else>
            <div v-for="log in logs" :key="log.id" class="log-card">
              <div class="log-header">
                <div class="log-to">
                  <span class="log-label">{{ log.recipient_name || log.to_number }}</span>
                  <span class="log-num">{{ log.recipient_name ? log.to_number : '' }}</span>
                </div>
                <span class="log-badge" :class="log.status === 'sent' ? 'badge-sent' : 'badge-fail'">
                  {{ log.status === 'sent' ? '✓ Sent' : '✗ Failed' }}
                </span>
              </div>
              <div class="log-msg">{{ log.message }}</div>
              <div class="log-time">{{ formatDate(log.created_at) }}</div>
            </div>
          </div>
        </div>

      </template>

      <div style="height:32px"></div>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { whatsappApi } from '../../api'
import { useAuthStore } from '../../stores/auth'

const auth    = useAuthStore()
const isAdmin = computed(() => auth.roles.includes('admin'))

const tab            = ref(isAdmin.value ? 'send' : 'compose')
const message        = ref('')
const sending        = ref(false)
const result         = ref(null)
const logs           = ref([])
const loadingLogs    = ref(false)
const schoolName     = ref('School Administration')
const schoolNumber   = ref('')

// Admin-only state
const recipientType   = ref('parents')
const contacts        = ref([])
const templates       = ref([])
const search          = ref('')
const selected        = ref(null)
const manualPhone     = ref('')
const activeTemplate  = ref(null)
const loadingContacts = ref(false)

const recipientTypes = [
  { value: 'parents',  icon: '👨‍👧', label: 'Parents'  },
  { value: 'students', icon: '🎓',  label: 'Students' },
  { value: 'staff',    icon: '👨‍🏫', label: 'Staff'    },
]

const filteredContacts = computed(() => {
  const q = search.value.toLowerCase()
  return q ? contacts.value.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
           : contacts.value
})

const canAdminSend = computed(() => {
  const phone = selected.value?.phone || manualPhone.value.trim()
  return !!phone && message.value.trim().length > 0
})

// ── Parent/Student/Teacher: send to school ────────────────────────────────────
async function doContactSchool() {
  if (!message.value.trim() || sending.value) return
  sending.value = true
  result.value  = null
  try {
    await whatsappApi.contactSchool(message.value.trim())
    result.value  = { success: true }
    message.value = ''
  } catch (e) {
    result.value = { success: false, error: e.response?.data?.error || e.response?.data?.message || 'Send failed' }
  } finally {
    sending.value = false
  }
}

// ── Admin: send to a contact ──────────────────────────────────────────────────
async function doAdminSend() {
  if (!canAdminSend.value || sending.value) return
  sending.value = true
  result.value  = null
  const phone = selected.value?.phone || manualPhone.value.trim()
  try {
    await whatsappApi.send({
      to:             phone,
      message:        message.value.trim(),
      recipient_name: selected.value?.name ?? null,
      recipient_type: recipientType.value,
      recipient_id:   selected.value?.id   ?? null,
    })
    result.value = { success: true }
    message.value = ''; selected.value = null; manualPhone.value = ''; activeTemplate.value = null
  } catch (e) {
    result.value = { success: false, error: e.response?.data?.error || e.response?.data?.message || 'Send failed' }
  } finally {
    sending.value = false
  }
}

async function loadHistory() {
  tab.value = isAdmin.value ? 'history' : 'history'
  loadingLogs.value = true
  logs.value = []
  try {
    const res = await whatsappApi.myLogs()
    logs.value = res.data
  } catch { /* */ } finally { loadingLogs.value = false }
}

async function selectType(type) {
  recipientType.value = type; selected.value = null; search.value = ''
  await loadContacts()
}

async function loadContacts() {
  loadingContacts.value = true; contacts.value = []
  try { contacts.value = (await whatsappApi.recipients(recipientType.value)).data }
  catch { /* */ } finally { loadingContacts.value = false }
}

function selectContact(c) {
  selected.value = selected.value?.id === c.id ? null : c
  manualPhone.value = ''
}

function applyTemplate(t) {
  if (activeTemplate.value?.id === t.id) { activeTemplate.value = null; message.value = '' }
  else { activeTemplate.value = t; message.value = t.body }
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  try {
    const cfg = (await whatsappApi.config()).data
    schoolName.value   = cfg.school_name   || 'School Administration'
    schoolNumber.value = cfg.school_number || ''
  } catch { /* */ }

  if (isAdmin.value) {
    await Promise.all([loadContacts(), whatsappApi.templates().then(r => { templates.value = r.data }).catch(() => {})])
  }
})
</script>

<style scoped>
.wrap { padding: 16px }

.school-card { display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);border-left:4px solid #25d366 }
.school-logo { font-size:32px }
.school-info { flex:1 }
.school-name { font-size:15px;font-weight:700;color:#1e293b }
.school-num  { font-size:12px;color:#94a3b8;margin-top:2px }
.wa-badge    { display:flex;align-items:center;gap:5px;background:#dcfce7;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#15803d }
.wa-dot      { width:7px;height:7px;border-radius:50%;background:#25d366 }

.tabs { display:flex;gap:8px;margin-bottom:16px }
.tab  { flex:1;padding:10px;border-radius:12px;background:#f1f5f9;text-align:center;font-size:14px;font-weight:600;color:#64748b;cursor:pointer }
.tab.active { background:linear-gradient(135deg,#075e54,#128c7e);color:#fff }

.section-label { font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px }

.msg-area { width:100%;padding:14px;border:1.5px solid #e2e8f0;border-radius:14px;font-size:15px;resize:none;outline:none;font-family:inherit;box-sizing:border-box;line-height:1.6 }
.msg-area:focus { border-color:#128c7e }
.char-count { text-align:right;font-size:11px;color:#94a3b8;margin-top:4px;margin-bottom:14px }

.send-btn { width:100%;padding:16px;border-radius:14px;border:none;background:linear-gradient(135deg,#075e54,#25d366);color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 4px 16px rgba(37,211,102,.3) }
.send-btn:disabled { opacity:.55;cursor:not-allowed }

.result-card { margin-top:14px;padding:14px 16px;border-radius:12px;font-size:14px;font-weight:600;text-align:center }
.result-ok  { background:#dcfce7;color:#15803d }
.result-err { background:#fee2e2;color:#991b1b }

.info-note { margin-top:16px;padding:12px 14px;background:#f0fdf4;border-radius:12px;font-size:13px;color:#166534;line-height:1.6;border:1px solid #bbf7d0 }

.mini-loader { display:flex;justify-content:center;padding:24px }
.spinner { width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#128c7e;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.empty-note { text-align:center;color:#94a3b8;font-size:13px;padding:20px 0 }

/* Admin extras */
.type-row { display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap }
.type-chip { padding:8px 14px;border-radius:20px;background:#f1f5f9;font-size:13px;font-weight:600;color:#64748b;cursor:pointer }
.type-chip.active { background:linear-gradient(135deg,#075e54,#128c7e);color:#fff }

.search-input { width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:8px }
.search-input:focus { border-color:#128c7e }

.contact-list { max-height:200px;overflow-y:auto;border:1.5px solid #e2e8f0;border-radius:14px;margin-bottom:4px }
.contact-item { display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9 }
.contact-item:last-child { border-bottom:none }
.contact-item.selected { background:#f0fdf4 }
.contact-avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#075e54,#25d366);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0 }
.contact-name  { font-size:14px;font-weight:600;color:#1e293b }
.contact-phone { font-size:12px;color:#94a3b8 }
.check { color:#128c7e;font-weight:700;font-size:16px;margin-left:auto }

.template-list { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px }
.template-chip { padding:7px 14px;border-radius:20px;background:#f1f5f9;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;border:1.5px solid transparent }
.template-chip.active { border-color:#128c7e;background:#f0fdf4;color:#075e54 }

/* Logs */
.log-card { background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.07) }
.log-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px }
.log-to  { flex:1;min-width:0 }
.log-label { font-size:14px;font-weight:700;color:#1e293b;display:block }
.log-num   { font-size:12px;color:#94a3b8 }
.log-badge { font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;flex-shrink:0;margin-left:8px }
.badge-sent { background:#dcfce7;color:#15803d }
.badge-fail { background:#fee2e2;color:#991b1b }
.log-msg  { font-size:13px;color:#475569;line-height:1.5;margin-bottom:6px;white-space:pre-wrap }
.log-time { font-size:11px;color:#94a3b8 }
</style>
