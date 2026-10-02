<template>
  <app-layout title="School Events" header-gradient="linear-gradient(135deg,#7c3aed,#a855f7)">
    <div class="page-wrap">

      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>

      <template v-else>
        <div v-if="!events.length" class="empty-state">
          <div class="empty-icon">🎉</div>
          <div class="empty-text">No events yet</div>
        </div>

        <div v-for="ev in events" :key="ev.id" class="event-card" @click="openEvent(ev)">
          <div class="event-header">
            <div class="event-status" :class="ev.data.status">{{ ev.data.status }}</div>
            <div class="event-date">📅 {{ formatDate(ev.data.event_date) }}</div>
          </div>
          <div class="event-title">{{ ev.data.title }}</div>
          <div v-if="ev.data.venue" class="event-venue">📍 {{ ev.data.venue }}</div>
          <div v-if="ev.data.end_date" class="event-meta">Ends: {{ formatDate(ev.data.end_date) }}</div>
        </div>
      </template>

      <!-- Detail modal -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-status" :class="selected.data.status">{{ selected.data.status }}</div>
          <div class="modal-title">{{ selected.data.title }}</div>
          <div class="modal-meta-row">
            <span>📅 {{ formatDate(selected.data.event_date) }}</span>
            <span v-if="selected.data.venue">📍 {{ selected.data.venue }}</span>
          </div>
          <div v-if="selected.data.description" class="modal-desc" v-html="selected.data.description"></div>

          <!-- Media gallery -->
          <div v-if="media.length" class="gallery">
            <div class="gallery-title">📸 Gallery</div>
            <div class="gallery-grid">
              <div v-for="m in media" :key="m.id" class="gallery-item">
                <img v-if="m.data.media_type === 'image'" :src="`/storage/${m.data.file_path}`" :alt="m.data.caption" />
                <div v-else class="video-thumb">🎬 {{ m.data.caption || 'Video' }}</div>
              </div>
            </div>
          </div>

          <button class="close-btn" @click="selected = null">Close</button>
        </div>
      </div>

    </div>
  </app-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { eventsApi } from '../../api'

const events  = ref([])
const loading = ref(true)
const selected = ref(null)
const media    = ref([])

onMounted(async () => {
  try { events.value = (await eventsApi.list()).data } catch { /* */ }
  finally { loading.value = false }
})

async function openEvent(ev) {
  selected.value = ev
  media.value = []
  try {
    const res = await eventsApi.media(ev.id)
    media.value = res.data
  } catch { /* */ }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.page-wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#7c3aed;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:48px;margin-bottom:12px }
.empty-text  { color:#94a3b8;font-size:15px }

.event-card {
  background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;
  box-shadow:0 2px 12px rgba(0,0,0,.07);cursor:pointer;
  border-left:4px solid #7c3aed;
}
.event-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px }
.event-status { font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:capitalize }
.event-status.upcoming  { background:#ede9fe;color:#7c3aed }
.event-status.ongoing   { background:#dcfce7;color:#15803d }
.event-status.completed { background:#f1f5f9;color:#64748b }
.event-status.cancelled { background:#fee2e2;color:#991b1b }
.event-date  { font-size:12px;color:#64748b }
.event-title { font-size:16px;font-weight:700;color:#1e293b;margin-bottom:6px }
.event-venue { font-size:13px;color:#64748b;margin-bottom:4px }
.event-meta  { font-size:12px;color:#94a3b8 }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end }
.modal-sheet {
  background:#fff;border-radius:24px 24px 0 0;padding:16px 20px 40px;
  width:100%;max-height:85vh;overflow-y:auto;
}
.modal-handle { width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 16px }
.modal-status { font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:10px;text-transform:capitalize }
.modal-status.upcoming  { background:#ede9fe;color:#7c3aed }
.modal-status.ongoing   { background:#dcfce7;color:#15803d }
.modal-status.completed { background:#f1f5f9;color:#64748b }
.modal-title { font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px }
.modal-meta-row { display:flex;gap:16px;font-size:13px;color:#64748b;margin-bottom:12px;flex-wrap:wrap }
.modal-desc { font-size:14px;color:#475569;line-height:1.6;margin-bottom:16px }

.gallery-title { font-size:14px;font-weight:700;color:#1e293b;margin-bottom:10px }
.gallery-grid  { display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px }
.gallery-item img { width:100%;height:100px;object-fit:cover;border-radius:10px }
.video-thumb { height:100px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b }

.close-btn { width:100%;padding:14px;background:#7c3aed;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer }
</style>
