<template>
  <app-layout title="My Profile" header-gradient="linear-gradient(90deg,#7c3aed,#8b5cf6)">
    <div class="wrap">
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>
      <template v-else-if="student">

        <!-- Profile header -->
        <div class="profile-hero">
          <div class="profile-avatar">{{ initials }}</div>
          <div class="profile-name">{{ student.first_name }} {{ student.last_name }}</div>
          <div class="profile-adm">{{ student.admission_no }}</div>
          <div class="status-pill" :class="`s-${student.status}`">{{ student.status }}</div>
        </div>

        <!-- Info sections -->
        <div class="info-card">
          <div class="info-title">Personal Information</div>
          <div class="info-row"><span class="info-lbl">Date of Birth</span><span class="info-val">{{ student.date_of_birth || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Gender</span><span class="info-val" style="text-transform:capitalize">{{ student.gender || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Blood Group</span><span class="info-val">{{ student.blood_group || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Religion</span><span class="info-val">{{ student.religion || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Nationality</span><span class="info-val">{{ student.nationality || '—' }}</span></div>
        </div>

        <div class="info-card">
          <div class="info-title">Contact Information</div>
          <div class="info-row"><span class="info-lbl">Phone</span><span class="info-val">{{ student.phone || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Email</span><span class="info-val">{{ student.email || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">WhatsApp</span><span class="info-val">{{ student.whatsapp || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Address</span><span class="info-val">{{ student.address || '—' }}</span></div>
        </div>

        <div class="info-card">
          <div class="info-title">Academic Information</div>
          <div class="info-row"><span class="info-lbl">Admission No</span><span class="info-val">{{ student.admission_no || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Admission Date</span><span class="info-val">{{ student.admission_date || '—' }}</span></div>
          <div class="info-row"><span class="info-lbl">Category</span><span class="info-val" style="text-transform:uppercase">{{ student.category || '—' }}</span></div>
        </div>

        <div style="height:20px"></div>
      </template>
      <div v-else class="empty-msg">Profile not found.</div>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { profileApi } from '../../api'

const student = ref(null)
const loading = ref(true)

const initials = computed(() => {
  const s = student.value
  return s ? (s.first_name?.[0] ?? '') + (s.last_name?.[0] ?? '') : '?'
})

onMounted(async () => {
  try { student.value = (await profileApi.me()).data.student } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#8b5cf6;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.profile-hero { text-align:center;padding:24px 16px 20px;background:#fff;border-radius:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08) }
.profile-avatar { width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 12px }
.profile-name { font-size:20px;font-weight:800;color:#1e293b;margin-bottom:4px }
.profile-adm  { font-size:13px;color:#94a3b8;margin-bottom:10px }

.status-pill { display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:capitalize }
.s-active   { background:#dcfce7;color:#15803d }
.s-inactive { background:#fee2e2;color:#991b1b }

.info-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.06) }
.info-title { font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f1f5f9 }
.info-row   { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f8fafc }
.info-row:last-child { border-bottom:none }
.info-lbl   { font-size:13px;color:#94a3b8;font-weight:500 }
.info-val   { font-size:13px;color:#1e293b;font-weight:600;text-align:right;max-width:60% }
.empty-msg  { color:#94a3b8;text-align:center;padding:60px;font-size:13px }
</style>
