<template>
  <app-layout title="Bus Tracking" header-gradient="linear-gradient(90deg,#0f766e,#14b8a6)">
    <div class="wrap">

      <!-- Loading -->
      <div v-if="loading" class="center-loader"><div class="spinner"></div></div>

      <!-- No bus assigned -->
      <div v-else-if="!buses.length" class="empty-state">
        <div class="empty-icon">🚌</div>
        <div class="empty-title">No Bus Assigned</div>
        <div class="empty-sub">Contact admin to assign a bus to your account.</div>
      </div>

      <template v-else>
        <!-- Bus selector (if multiple) -->
        <div v-if="buses.length > 1" class="bus-tabs">
          <div
            v-for="(b, i) in buses"
            :key="i"
            class="bus-tab"
            :class="{ active: selectedIdx === i }"
            @click="selectBus(i)"
          >
            {{ b.bus?.name ?? b.name ?? 'Bus ' + (i+1) }}
          </div>
        </div>

        <!-- Bus info card -->
        <div class="bus-card">
          <div class="bus-header">
            <div class="bus-icon">🚌</div>
            <div class="bus-info">
              <div class="bus-name">{{ currentBus?.bus?.name ?? currentBus?.name }}</div>
              <div class="bus-plate">{{ currentBus?.bus?.number_plate ?? currentBus?.number_plate ?? '' }}</div>
            </div>
            <div class="bus-status" :class="isActive ? 'status-live' : 'status-off'">
              {{ isActive ? '● LIVE' : '○ Offline' }}
            </div>
          </div>
          <div v-if="currentBus?.bus?.driver_name || currentBus?.driver_name" class="driver-row">
            <span class="driver-label">Driver:</span>
            <span class="driver-val">{{ currentBus?.bus?.driver_name ?? currentBus?.driver_name }}</span>
            <a v-if="driverPhone" :href="`tel:${driverPhone}`" class="call-btn">📞 Call</a>
          </div>
          <div v-if="currentBus?.pickup_stop" class="pickup-row">
            <span class="driver-label">Your Stop:</span>
            <span class="driver-val">{{ currentBus.pickup_stop }}</span>
          </div>
          <div v-if="locationData" class="location-meta">
            <span>🕐 {{ lastUpdated }}</span>
            <span v-if="locationData.speed != null">· {{ Math.round(locationData.speed) }} km/h</span>
          </div>
        </div>

        <!-- Map -->
        <div class="map-container">
          <div v-if="!isActive" class="map-overlay">
            <div class="map-overlay-text">🚌 Driver is not sharing location</div>
          </div>
          <div id="bus-map" ref="mapEl" class="map"></div>
        </div>

        <!-- Refresh button -->
        <button class="refresh-btn" @click="fetchLocation" :disabled="refreshing">
          <span v-if="refreshing">Refreshing...</span>
          <span v-else>🔄 Refresh Location</span>
        </button>

        <div class="auto-refresh-note">Auto-refreshes every 1 minute</div>
      </template>
    </div>
  </app-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { busApi } from '../../api'

const loading    = ref(true)
const refreshing = ref(false)
const buses      = ref([])
const selectedIdx = ref(0)
const locationData = ref(null)
let map = null
let marker = null
let timer = null
let L = null

const currentBus = computed(() => buses.value[selectedIdx.value] ?? null)
const isActive   = computed(() => locationData.value?.is_active === true)
const driverPhone = computed(() => currentBus.value?.bus?.driver_phone ?? currentBus.value?.driver_phone ?? null)

const lastUpdated = computed(() => {
  if (!locationData.value?.located_at) return ''
  const d = new Date(locationData.value.located_at)
  return d.toLocaleTimeString()
})

async function loadBuses() {
  try {
    const res = await busApi.myBus()
    buses.value = res.data.buses ?? []
  } catch {
    buses.value = []
  } finally {
    loading.value = false
  }
}

async function fetchLocation() {
  if (!currentBus.value) return
  refreshing.value = true
  try {
    const busId = currentBus.value?.bus?.id ?? currentBus.value?.id
    if (!busId) return
    const res = await busApi.busLocation(busId)
    locationData.value = res.data.location
    updateMap()
  } catch {
    locationData.value = null
  } finally {
    refreshing.value = false
  }
}

function selectBus(i) {
  selectedIdx.value = i
  locationData.value = null
  fetchLocation()
}

function updateMap() {
  if (!map || !L || !locationData.value) return
  const { latitude: lat, longitude: lng } = locationData.value
  if (!lat || !lng) return

  const pos = [lat, lng]
  if (marker) {
    marker.setLatLng(pos)
  } else {
    const busIcon = L.divIcon({
      html: '<div class="bus-marker">🚌</div>',
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
    marker = L.marker(pos, { icon: busIcon }).addTo(map)
  }
  map.setView(pos, map.getZoom() < 14 ? 15 : map.getZoom())
}

async function initMap() {
  await nextTick()
  if (!mapEl.value) return

  // Dynamically load Leaflet
  if (!window.L) {
    await loadLeaflet()
  }
  L = window.L

  map = L.map(mapEl.value, { zoomControl: true }).setView([20.5937, 78.9629], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)
}

function loadLeaflet() {
  return new Promise((resolve) => {
    if (document.getElementById('leaflet-css')) { resolve(); return }

    const css = document.createElement('link')
    css.id   = 'leaflet-css'
    css.rel  = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = resolve
    document.head.appendChild(script)
  })
}

const mapEl = ref(null)

watch(() => buses.value.length, async (len) => {
  if (len > 0) {
    await initMap()
    await fetchLocation()
    timer = setInterval(fetchLocation, 60_000) // poll every 1 minute
  }
})

onMounted(async () => {
  await loadBuses()
})

onUnmounted(() => {
  clearInterval(timer)
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.wrap { padding: 16px }
.center-loader { display:flex;justify-content:center;padding:80px }
.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#14b8a6;border-radius:50%;animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }

.empty-state { text-align:center;padding:60px 20px }
.empty-icon  { font-size:64px;margin-bottom:16px }
.empty-title { font-size:20px;font-weight:700;color:#1e293b;margin-bottom:8px }
.empty-sub   { font-size:14px;color:#94a3b8 }

.bus-tabs { display:flex;gap:8px;margin-bottom:12px;overflow-x:auto;padding-bottom:4px }
.bus-tab  { padding:8px 16px;border-radius:20px;background:#f1f5f9;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;white-space:nowrap;flex-shrink:0 }
.bus-tab.active { background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff }

.bus-card { background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.08);border-left:4px solid #14b8a6 }
.bus-header { display:flex;align-items:center;gap:12px;margin-bottom:10px }
.bus-icon   { font-size:32px }
.bus-info   { flex:1 }
.bus-name   { font-size:16px;font-weight:700;color:#1e293b }
.bus-plate  { font-size:12px;color:#94a3b8;margin-top:2px }
.bus-status { font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px }
.status-live { background:#dcfce7;color:#15803d }
.status-off  { background:#f1f5f9;color:#94a3b8 }

.driver-row, .pickup-row { display:flex;align-items:center;gap:8px;margin-bottom:6px }
.driver-label { font-size:12px;color:#94a3b8;font-weight:600 }
.driver-val   { font-size:13px;color:#1e293b;font-weight:600;flex:1 }
.call-btn     { background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-decoration:none }

.location-meta { font-size:12px;color:#94a3b8;margin-top:6px;display:flex;gap:8px }

.map-container { position:relative;border-radius:16px;overflow:hidden;margin-bottom:14px;box-shadow:0 4px 16px rgba(0,0,0,.12) }
.map { height:340px;width:100% }
.map-overlay { position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:999;display:flex;align-items:center;justify-content:center;border-radius:16px }
.map-overlay-text { color:#fff;font-size:15px;font-weight:700;text-align:center;padding:20px }

.refresh-btn { width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:8px }
.refresh-btn:disabled { opacity:.6 }
.auto-refresh-note { text-align:center;font-size:12px;color:#94a3b8;margin-bottom:20px }
</style>

<style>
.bus-marker { font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4)) }
</style>
