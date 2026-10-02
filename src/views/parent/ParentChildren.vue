<template>
  <app-layout title="My Children" header-gradient="linear-gradient(90deg,#7c3aed,#a855f7)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <div v-if="!children.length" class="empty-msg">No children linked. Contact admin.</div>
        <div v-for="child in children" :key="child.student?.id" class="child-card">
          <div class="child-header">
            <div class="child-avatar">{{ (child.student?.first_name?.[0]??'') + (child.student?.last_name?.[0]??'') }}</div>
            <div class="child-info">
              <div class="child-name">{{ child.student?.first_name }} {{ child.student?.last_name }}</div>
              <div class="child-meta">Adm: {{ child.student?.admission_no }}</div>
            </div>
          </div>
          <div class="child-stats">
            <div class="cs-bar-wrap">
              <div class="cs-bar" :style="`width:${child.attendance}%;background:${child.attendance>=75?'#10b981':'#ef4444'}`"></div>
            </div>
            <div class="cs-row">
              <span class="cs-lbl">Attendance</span>
              <span class="cs-val" :style="child.attendance>=75?'color:#10b981':'color:#ef4444'">{{ child.attendance }}%</span>
            </div>
            <div class="cs-fee" :class="child.pending_fees ? 'fee-due' : 'fee-ok'">
              {{ child.pending_fees ? `${child.pending_fees} Pending Fee(s)` : '✓ All Fees Clear' }}
            </div>
          </div>
        </div>
        <div style="height:20px"></div>
      </template>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { dashApi } from '../../api'

const children = ref([]), loading = ref(true)
onMounted(async () => {
  try { children.value = (await dashApi.get()).data.children ?? [] } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.child-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);border-left:4px solid #a855f7 }
.child-header { display:flex;align-items:center;gap:12px;margin-bottom:12px }
.child-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.child-name { font-size:15px;font-weight:700;color:#1e293b }
.child-meta { font-size:12px;color:#94a3b8;margin-top:2px }
.cs-bar-wrap { background:#f1f5f9;border-radius:99px;height:6px;margin-bottom:4px }
.cs-bar { height:6px;border-radius:99px }
.cs-row { display:flex;justify-content:space-between }
.cs-lbl { font-size:12px;color:#64748b }
.cs-val { font-size:12px;font-weight:700 }
.cs-fee { margin-top:8px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;text-align:center }
.fee-due { background:#fee2e2;color:#991b1b }
.fee-ok  { background:#dcfce7;color:#15803d }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
