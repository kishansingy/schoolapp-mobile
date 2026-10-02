<template>
  <app-layout title="Fee Payments" header-gradient="linear-gradient(90deg,#7c3aed,#a855f7)">
    <div class="wrap">

      <!-- Child selector -->
      <div v-if="!selectedChild" class="section-label">Select a child to view fees</div>
      <div v-for="child in children" :key="child.student?.id"
      class="child-chip"
      :class="{active: isSelectedChild(child) }"
      @click="selectChild(child)"
      >
      <div class="chip-avatar">{{ initials(child) }}</div>
      <span>{{ child.student?.first_name }} {{ child.student?.last_name }}</span>
    </div>

    <div v-if="loadingFees" class="center-loader"><div class="spinner"></div></div>

    <template v-else-if="selectedChild">
      <div v-if="!fees.length" class="empty-card">No pending fees for {{ selectedChild.student ? selectedChild.student.first_name : '' }}.</div>

      <template v-else>
        <!-- Fee cards -->
        <div class="section-label" style="margin-top:16px">Pending Fees</div>
        <div v-for="fee in fees" :key="fee.id" class="fee-card" @click="toggleFee(fee.id)">
        <div class="fee-check" :class="{checked: selected.includes(fee.id) }">
        {{ selected.includes(fee.id) ? '✓' : '' }}
      </div>
      <div class="fee-info">
        <div class="fee-type">{{ fee.fee_type }}</div>
        <div class="fee-meta">Due: {{ fee.due_date || 'N/A' }}</div>
      </div>
      <div class="fee-amount">
        <div class="fee-due">₹{{ fee.due_amount }}</div>
        <div class="fee-status" :class="`fs-${fee.status}`">{{ fee.status }}</div>
    </div>
  </div>

  <!-- Pay summary -->
  <div class="pay-card">
    <div class="pay-row">
      <span>Selected</span><strong>{{ selected.length }} item(s)</strong>
    </div>
    <div class="pay-row total">
      <span>Total</span><strong>₹{{ totalDue }}</strong>
    </div>
    <button class="pay-btn" :disabled="!selected.length || paying" @click="startPayment">
    {{ paying? 'Processing...': `Pay ₹${totalDue}` }}
  </button>
</div>
        </template >

        < !--Paid history-- >
  <div v-if="paidFees.length" style="margin-top:16px">
    <div class="section-label">✅ Payment History</div>
    <div v-for="fee in paidFees" :key="fee.id" class="paid-card">
    <div>
      <div class="fee-type">{{ fee.fee_type }}</div>
      <div class="fee-meta">{{ fee.payment_date }} · {{ fee.razorpay_payment_id }}</div>
    </div>
    <div class="fee-due paid">₹{{ fee.amount_paid }}</div>
  </div>
        </div >
      </template >

      < !--Success modal-- >
  <div v-if="successMsg" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-icon">✅</div>
      <div class="modal-title">Payment Successful!</div>
      <div class="modal-msg">{{ successMsg }}</div>
      <button class="pay-btn" @click="successMsg=''; loadFees()">Done</button>
  </div>
      </div >

  <div style="height:30px"></div>
    </div >
  </app - layout >
</template >

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { dashApi, razorpayApi } from '../../api'

const children     = ref([])
const selectedChild = ref(null)
const fees         = ref([])
const paidFees     = ref([])
const selected     = ref([])
const loadingFees  = ref(false)
const paying       = ref(false)
const successMsg   = ref('')

const totalDue = computed(() =>
  fees.value
    .filter(f => selected.value.includes(f.id))
    .reduce((s, f) => s + f.due_amount, 0)
    .toFixed(2)
)

function initials(child) {
  const f = child.student ? (child.student.first_name || '') : ''
  const l = child.student ? (child.student.last_name  || '') : ''
  return (f[0] || '') + (l[0] || '')
}

function isSelectedChild(child) {
  if (!selectedChild.value || !child.student) return false
  return selectedChild.value.student && selectedChild.value.student.id === child.student.id
}

function toggleFee(id) {  const idx = selected.value.indexOf(id)
  idx === -1 ? selected.value.push(id) : selected.value.splice(idx, 1)
}

async function selectChild(child) {
  selectedChild.value = child
  await loadFees()
}

async function loadFees() {
  if (!selectedChild.value) return
  loadingFees.value = true
  try {
    const res = await razorpayApi.pendingFees(selectedChild.value.student.id)
    fees.value     = res.data.fees
    paidFees.value = res.data.paid_fees ?? []
    selected.value = fees.value.map(f => f.id)
  } finally {
    loadingFees.value = false
  }
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = reject
    document.body.appendChild(s)
  })
}

async function startPayment() {
  if (!selected.value.length) return
  paying.value = true
  try {
    await loadRazorpayScript()
    const orderRes = await razorpayApi.createOrder({
      amount:     parseFloat(totalDue.value),
      student_id: selectedChild.value.student.id,
      fee_ids:    selected.value,
      notes:      { student_name: `${selectedChild.value.student.first_name} ${selectedChild.value.student.last_name}` },
    })

    const { order_id, amount, currency, key_id } = orderRes.data

    const options = {
      key:         key_id,
      amount,
      currency,
      order_id,
      name:        'School Fee Payment',
      description: `Fees for ${selectedChild.value.student.first_name}`,
      theme:       { color: '#7c3aed' },
      handler: async (response) => {
        try {
          const verifyRes = await razorpayApi.verifyPayment({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            fee_ids:             selected.value,
            student_id:          selectedChild.value.student.id,
            amount:              parseFloat(totalDue.value),
          })
          successMsg.value = `₹${totalDue.value} paid! ID: ${verifyRes.data.payment_id}`
        } catch {
          alert('Payment received but verification failed. Contact admin.')
        } finally {
          paying.value = false
        }
      },
      modal: { ondismiss: () => { paying.value = false } },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch {
    alert('Failed to initiate payment. Try again.')
    paying.value = false
  }
}

onMounted(async () => {
  try {
    const dash = (await dashApi.get()).data
    children.value = dash.children ?? []
    if (children.value.length === 1) selectChild(children.value[0])
  } catch { /* */ }
})
</script>

<style scoped>
.wrap { padding:16px }
.section-label { font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px }
.child-chip { display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;border-radius:99px;padding:8px 14px;margin:0 6px 8px 0;cursor:pointer;font-size:13px;font-weight:600;color:#475569;border:2px solid transparent }
.child-chip.active { background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-color:#7c3aed }
.chip-avatar { width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700 }
.center-loader { display:flex;justify-content:center;padding:40px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.fee-card { display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer }
.fee-check { width:24px;height:24px;border-radius:6px;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;color:#fff }
.fee-check.checked { background:#7c3aed;border-color:#7c3aed }
.fee-info { flex:1 }
.fee-type { font-size:14px;font-weight:600;color:#1e293b }
.fee-meta { font-size:12px;color:#94a3b8;margin-top:2px }
.fee-amount { text-align:right }
.fee-due { font-size:15px;font-weight:700;color:#1e293b }
.fee-due.paid { color:#10b981 }
.fee-status { font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;margin-top:3px;display:inline-block }
.fs-pending { background:#fef9c3;color:#854d0e }
.fs-partial { background:#ffedd5;color:#9a3412 }
.pay-card { background:#fff;border-radius:16px;padding:16px;margin-top:12px;box-shadow:0 2px 12px rgba(0,0,0,.08) }
.pay-row { display:flex;justify-content:space-between;font-size:14px;color:#475569;padding:4px 0 }
.pay-row.total { font-size:16px;font-weight:700;color:#1e293b;border-top:1px solid #e2e8f0;margin-top:8px;padding-top:10px }
.pay-btn { width:100%;margin-top:14px;padding:14px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer }
.pay-btn:disabled { opacity:.6;cursor:not-allowed }
.paid-card { display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,.06) }
.empty-card { background:#fff;border-radius:14px;padding:24px;text-align:center;color:#64748b;font-size:13px }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999 }
.modal-box { background:#fff;border-radius:20px;padding:32px 24px;text-align:center;width:85%;max-width:320px }
.modal-icon { font-size:52px;margin-bottom:12px }
.modal-title { font-size:18px;font-weight:800;color:#1e293b;margin-bottom:8px }
.modal-msg { font-size:13px;color:#64748b;margin-bottom:20px;line-height:1.5 }
</style>
