<template>
  <app-layout title="YouTube Channel" header-gradient="linear-gradient(135deg,#dc2626,#ef4444)">
    <div class="page-wrap">

      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>

      <template v-else>
        <div v-if="!videos.length" class="empty-state">
          <div class="empty-icon">▶️</div>
          <div class="empty-text">No videos yet</div>
        </div>

        <div v-for="v in videos" :key="v.id" class="video-card" @click="play(v)">
          <!-- Thumbnail -->
          <div class="thumb-wrap">
            <img
              v-if="v.data.youtube_id"
              :src="`https://img.youtube.com/vi/${v.data.youtube_id}/mqdefault.jpg`"
              class="thumb-img"
              :alt="v.data.title"
            />
            <div v-else class="thumb-placeholder">▶️</div>
            <div class="play-overlay">▶</div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ v.data.title }}</div>
            <div v-if="v.data.description" class="video-desc">{{ v.data.description }}</div>
          </div>
        </div>
      </template>

      <!-- Player modal -->
      <div v-if="playing" class="modal-overlay" @click.self="playing = null">
        <div class="player-sheet">
          <div class="modal-handle"></div>
          <div class="player-title">{{ playing.data.title }}</div>
          <div class="iframe-wrap">
            <iframe
              :src="`https://www.youtube.com/embed/${playing.data.youtube_id}?autoplay=1`"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
              class="yt-iframe"
            ></iframe>
          </div>
          <div v-if="playing.data.description" class="player-desc">{{ playing.data.description }}</div>
          <button class="close-btn" @click="playing = null">Close</button>
        </div>
      </div>

    </div>
  </app-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { youtubeApi } from '../../api'

const videos  = ref([])
const loading = ref(true)
const playing = ref(null)

onMounted(async () => {
  try {
    const res = await youtubeApi.list()
    // Extract youtube_id from URL if not stored
    videos.value = res.data.map(v => {
      if (!v.data.youtube_id && v.data.youtube_url) {
        const match = v.data.youtube_url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
        if (match) v.data.youtube_id = match[1]
      }
      return v
    }).filter(v => v.data.is_active !== false)
  } catch { /* */ }
  finally { loading.value = false }
})

function play(v) {
  if (!v.data.youtube_id) {
    window.open(v.data.youtube_url, '_blank')
    return
  }
  playing.value = v
}
</script>

<style scoped>
.page-wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#ef4444;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:48px;margin-bottom:12px }
.empty-text  { color:#94a3b8;font-size:15px }

.video-card {
  background:#fff;border-radius:16px;overflow:hidden;margin-bottom:14px;
  box-shadow:0 2px 12px rgba(0,0,0,.08);cursor:pointer;
}
.thumb-wrap { position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden }
.thumb-img  { width:100%;height:100%;object-fit:cover }
.thumb-placeholder { width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:#1e293b }
.play-overlay {
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.3);font-size:40px;color:#fff;
  opacity:0;transition:opacity .2s;
}
.video-card:active .play-overlay { opacity:1 }
.video-info  { padding:12px 14px }
.video-title { font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px }
.video-desc  { font-size:13px;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden }

/* Player modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:flex-end }
.player-sheet { background:#fff;border-radius:24px 24px 0 0;padding:16px 20px 40px;width:100%;max-height:90vh;overflow-y:auto }
.modal-handle { width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 14px }
.player-title { font-size:17px;font-weight:700;color:#1e293b;margin-bottom:12px }
.iframe-wrap  { width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:12px;background:#000 }
.yt-iframe    { width:100%;height:100%;border:none }
.player-desc  { font-size:13px;color:#64748b;margin-bottom:16px;line-height:1.5 }
.close-btn { width:100%;padding:14px;background:#ef4444;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer }
</style>
