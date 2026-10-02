<template>
  <app-layout title="Notices" header-gradient="linear-gradient(90deg,#7c3aed,#a855f7)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <div v-if="!notices.length" class="empty-msg">No notices available.</div>
        <div v-for="n in notices" :key="n.id" class="notice-card">
          <div class="notice-icon">📢</div>
          <div class="notice-body">
            <div class="notice-title">{{ n.title }}</div>
            <div class="notice-meta">{{ n.audience }} · {{ n.publish_date }}</div>
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

const notices = ref([]), loading = ref(true)
onMounted(async () => {
  try { notices.value = (await dashApi.get()).data.notices ?? [] } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.notice-card { display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.notice-icon { font-size:24px;flex-shrink:0 }
.notice-title { font-size:14px;font-weight:700;color:#1e293b }
.notice-meta  { font-size:12px;color:#94a3b8;margin-top:4px;text-transform:capitalize }
.empty-msg { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
