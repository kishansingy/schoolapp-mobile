<template>
  <app-layout title="Share My Location" header-gradient="linear-gradient(90deg,#b45309,#f59e0b)">
    <div class="wrap">

      <!-- Bus info -->
      <div v-if="busInfo" class="bus-card">
        <div class="bus-row">
          <span class="bus-icon">🚌</span>
          <div>
            <div class="bus-name">{{ busInfo.name }}</div>
            <div class="bus-plate">{{ busInfo.number_plate }}</div>
          </div>
        </div>
      </div>

      <!-- Status card -->
      <div class="status-card" :class="sharing ? 'card-live' : 'card-off'">
        <div class="status-icon">{{ sharing ? '📡' : '📵' }}</div>
        <div class="status-title">{{ sharing ? 'Sharing Live Location' : 'Location Sharing Off' }}</div>
        <div class="status-sub">
          {{ sharing ? 'Parents & students can see your bus on the map' : 'Start sharing so parents can track the bus' }}
        </div>
        <div v-if="sharing && lastPos" class="coords">
          📍 {{ lastPos.latitude.toFixed(5) }}, {{ lastPos.longitude.toFixed(5) }}
          <span v-if="lastPos.speed != null"> · {{ Math.round(lastPos.speed) }} km/h</span>
        </div>
        <div v-if="sharing" class="update-time">Last sent: {{ lastSentTime || '—' }} · updates every 1 min</div>
      </div>

      <!-- Error -->
      <div v-if="gpsError" class="error-card">⚠️ {{ gpsError }}</div>

      <!-- Map preview -->
      <div v-if="sharing" class="map-container">
        <div id="driver-map" ref="mapEl" class="map"></div>
      </div>

      <!-- Toggle button -->
      <button
        class="toggle-btn"
        :class="sharing ? 'btn-stop' : 'btn-start'"
        @click="toggleSharing"
        :disabled="toggling"
      >
        <span v-if="toggling">Please wait...</span>
        <span v-else-if="sharing">⏹ Stop Sharing</span>
        <span v-else>▶ Start Sharing Location</span>
      </button>

      <div class="note">
        Your GPS location is sent to the server every 1 minute while sharing is active.
        The map on your screen updates in real-time. Turn off when your route is complete.
      </div>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { busApi } from '../../api'

const sharing    = ref(false)
const toggling   = ref(false)
const gpsError   = ref(null)
const lastPos    = ref(null)
const lastSentTime = ref('')
const busInfo    = ref(null)
const mapEl      = ref(null)
let watchId      = null
let sendTimer    = null   // 60-second server push interval
let latestCoords = null   // most recent GPS coords (updated by watchPosition)
let map          = null
let marker       = null
let L            = null

const SEND_INTERVAL_MS = 60_000 // 1 minute

async function toggleSharing() {
  toggling.value = true
  gpsError.value = null

  if (sharing.value) {
    // Stop
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
    clearInterval(sendTimer); sendTimer = null
    latestCoords = null
    try { await busApi.stopSharing() } catch { /* */ }
    sharing.value = false
    if (map) { map.remove(); map = null; marker = null }
  } else {
    // Start — request GPS permission first
    if (!navigator.geolocation) {
      gpsError.value = 'GPS is not supported on this device.'
      toggling.value = false
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        sharing.value = true
        toggling.value = false
        await nextTick()
        await initMap()
        startWatching()
        // Send immediately, then every 60 seconds
        await sendLocation(pos.coords)
        sendTimer = setInterval(() => {
          if (latestCoords) sendLocation(latestCoords)
        }, SEND_INTERVAL_MS)
      },
      (err) => {
        gpsError.value = `GPS error: ${err.message}. Please allow location access.`
        toggling.value = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return
  }
  toggling.value = false
}

function startWatching() {
  // watchPosition keeps GPS warm and updates latestCoords continuously.
  // Actual server push happens on the 60-second interval, not on every tick.
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      latestCoords = pos.coords
      // Always update the map in real-time so the driver sees their own position
      updateMap(pos.coords.latitude, pos.coords.longitude)
    },
    (err) => { gpsError.value = `GPS: ${err.message}` },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
  )
}

async function sendLocation(coords) {
  const payload = {
    latitude:  coords.latitude,
    longitude: coords.longitude,
    speed:     coords.speed != null ? coords.speed * 3.6 : null, // m/s → km/h
    heading:   coords.heading,
    is_active: true,
  }
  lastPos.value = payload
  lastSentTime.value = new Date().toLocaleTimeString()

  try {
    const res = await busApi.updateLocation(payload)
    if (res.data.bus) busInfo.value = res.data.bus
  } catch { /* silent */ }

  updateMap(coords.latitude, coords.longitude)
}

function updateMap(lat, lng) {
  if (!map || !L) return
  const pos = [lat, lng]
  if (marker) {
    marker.setLatLng(pos)
  } else {
    const icon = L.divIcon({ html: '<div class="bus-marker">🚌</div>', className: '', iconSize: [40,40], iconAnchor: [20,20] })
    marker = L.marker(pos, { icon }).addTo(map)
  }
  map.setView(pos, map.getZoom() < 14 ? 15 : map.getZoom())
}

async function initMap() {
  await nextTick()
  if (!mapEl.value) return
  if (!window.L) await loadLeaflet()
  L = window.L
  map = L.map(mapEl.value, { zoomControl: true }).setView([20.5937, 78.9629], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19,
  }).addTo(map)
}

function loadLeaflet() {
  return new Promise((resolve) => {
    if (document.getElementById('leaflet-css')) { resolve(); return }
    const css = document.createElement('link')
    css.id = 'leaflet-css'; css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = resolve
    document.head.appendChild(script)
  })
}

onUnmounted(() => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  clearInterval(sendTimer)
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.wrap { padding:16px }

.bus-card { background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.08);border-left:4px solid #f59e0b }
.bus-row  { display:flex;align-items:center;gap:12px }
.bus-icon { font-size:28px }
.bus-name { font-size:15px;font-weight:700;color:#1e293b }
.bus-plate { font-size:12px;color:#94a3b8 }

.status-card { border-radius:20px;padding:28px 20px;text-align:center;margin-bottom:16px;transition:all .3s }
.card-live { background:linear-gradient(135deg,#064e3b,#065f46);box-shadow:0 8px 32px rgba(6,78,59,.4) }
.card-off  { background:linear-gradient(135deg,#1e293b,#334155);box-shadow:0 8px 32px rgba(0,0,0,.3) }
.status-icon  { font-size:48px;margin-bottom:12px }
.status-title { font-size:20px;font-weight:800;color:#fff;margin-bottom:6px }
.status-sub   { font-size:13px;color:rgba(255,255,255,.7);margin-bottom:10px }
.coords       { font-size:12px;color:rgba(255,255,255,.6);font-family:monospace;margin-bottom:4px }
.update-time  { font-size:11px;color:rgba(255,255,255,.5) }

.error-card { background:#fee2e2;border-radius:12px;padding:12px 16px;color:#991b1b;font-size:13px;margin-bottom:14px }

.map-container { border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 4px 16px rgba(0,0,0,.12) }
.map { height:280px;width:100% }

.toggle-btn { width:100%;padding:16px;border-radius:14px;border:none;font-size:16px;font-weight:800;cursor:pointer;margin-bottom:12px;transition:all .2s }
.btn-start { background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;box-shadow:0 4px 16px rgba(180,83,9,.4) }
.btn-stop  { background:linear-gradient(135deg,#991b1b,#ef4444);color:#fff;box-shadow:0 4px 16px rgba(153,27,27,.4) }
.toggle-btn:disabled { opacity:.6 }

.note { font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;padding:0 10px 20px }
</style>

<style>
.bus-marker { font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4)) }
</style>
