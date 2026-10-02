<template>
  <app-layout title="Fee Status" header-gradient="linear-gradient(90deg,#d97706,#f59e0b)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <!-- Summary -->
        <div class="summary-card">
          <div class="sum-item">
            <div class="sum-val green">₹{{ totals.paid }}</div>
            <div class="sum-lbl">Total Paid</div>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-item">
            <div class="sum-val red">{{ totals.pending }}</div>
            <div class="sum-lbl">Pending</div>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-item">
            <div class="sum-val orange">{{ totals.partial }}</div>
            <div class="sum-lbl">Partial</div>
          </div>
        </div>

        <div v-if="!rows.length" class="empty-msg">No fee records found.</div>

        <div v-for="r in rows" :key="r.id ?? r.receipt_no" class="fee-card">
          <div class="fee-top">
            <div>
              <div class="fee-receipt">{{ r.receipt_no }}</div>
              <div class="fee-meta">{{ r.payment_date }} · {{ r.payment_mode }}</div>
            </div>
            <div class="fee-right">
              <div class="fee-amount">₹{{ r.amount_paid }}</div>
              <div class="status-pill" :class="`s-${r.status}`">{{ r.status }}</div>
            </div>
          </div>
          <div v-if="r.discount > 0 || r.fine > 0" class="fee-extras">
            <span v-if="r.discount > 0">Discount: ₹{{ r.discount }}</span>
            <span v-if="r.fine > 0">Fine: ₹{{ r.fine }}</span>
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
const loading = ref(true)

const totals = computed(() => ({
  paid:    rows.value.filter(r => r.status === 'paid').reduce((s, r) => s + (parseFloat(r.amount_paid) || 0), 0),
  pending: rows.value.filter(r => r.status === 'pending').length,
  partial: rows.value.filter(r => r.status === 'partial').length,
}))

onMounted(async () => {
  try { rows.value = (await profileApi.me()).data.fees ?? [] } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.summary-card { display:flex;background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08) }
.sum-item     { flex:1;text-align:center }
.sum-val      { font-size:18px;font-weight:800;color:#1e293b }
.sum-val.green  { color:#10b981 }
.sum-val.red    { color:#ef4444 }
.sum-val.orange { color:#f97316 }
.sum-lbl      { font-size:10px;color:#94a3b8;margin-top:3px }
.sum-divider  { width:1px;background:#e2e8f0;margin:4px 0 }

.fee-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.06) }
.fee-top  { display:flex;justify-content:space-between;align-items:flex-start }
.fee-receipt { font-size:15px;font-weight:700;color:#1e293b }
.fee-meta    { font-size:12px;color:#94a3b8;margin-top:3px;text-transform:capitalize }
.fee-right   { text-align:right }
.fee-amount  { font-size:16px;font-weight:800;color:#1e293b }
.fee-extras  { margin-top:8px;font-size:12px;color:#64748b;display:flex;gap:12px }

.status-pill { display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-top:4px;text-transform:capitalize }
.s-paid    { background:#dcfce7;color:#15803d }
.s-pending { background:#fee2e2;color:#991b1b }
.s-partial { background:#ffedd5;color:#9a3412 }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
