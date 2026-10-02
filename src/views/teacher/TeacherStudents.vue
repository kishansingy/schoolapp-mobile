<template>
  <app-layout title="My Students" header-gradient="linear-gradient(90deg,#0f4c75,#1b6ca8)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else>
        <!-- Search -->
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="search" type="text" placeholder="Search students..." class="search-input" />
        </div>

        <div v-if="!filtered.length" class="empty-msg">No students found.</div>
        <div v-for="s in filtered" :key="s.id" class="student-card">
          <div class="stu-avatar">{{ (s.data?.first_name?.[0]??'') + (s.data?.last_name?.[0]??'') }}</div>
          <div class="stu-info">
            <div class="stu-name">{{ s.data?.first_name }} {{ s.data?.last_name }}</div>
            <div class="stu-meta">{{ s.data?.admission_no }}</div>
          </div>
          <div class="status-pill" :class="`s-${s.data?.status}`">{{ s.data?.status }}</div>
        </div>
        <div style="height:20px"></div>
      </template>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { tablesApi, recordsApi } from '../../api'

const students = ref([]), loading = ref(true), search = ref('')

const filtered = computed(() => {
  if (!search.value) return students.value
  const q = search.value.toLowerCase()
  return students.value.filter(s =>
    (s.data?.first_name + ' ' + s.data?.last_name).toLowerCase().includes(q) ||
    (s.data?.admission_no ?? '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const tables = (await tablesApi.list()).data
    const st = tables.find(t => t.name === 'students')
    if (st) students.value = (await recordsApi.list(st.id)).data
  } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding:16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#1b6ca8;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.search-wrap { display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:12px 16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.search-icon  { font-size:16px }
.search-input { flex:1;border:none;background:transparent;font-size:14px;color:#1e293b;outline:none }
.search-input::placeholder { color:#94a3b8 }
.student-card { display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.06) }
.stu-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1b6ca8,#00b4d8);color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.stu-info   { flex:1 }
.stu-name   { font-size:14px;font-weight:700;color:#1e293b }
.stu-meta   { font-size:12px;color:#94a3b8;margin-top:2px }
.status-pill { padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:capitalize }
.s-active   { background:#dcfce7;color:#15803d }
.s-inactive { background:#fee2e2;color:#991b1b }
.empty-msg  { color:#94a3b8;text-align:center;padding:40px;font-size:13px }
</style>
