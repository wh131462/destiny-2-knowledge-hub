import { computed, onBeforeUnmount, onMounted, ref, readonly } from 'vue'
import { dataUrl } from '@/utils/dataUrl'
import { activitiesV2 } from '@/data/v2'
import { filterRotationRecords, remainingTime, rotationQuery, ROTATION_CATEGORIES, snapshotStatus, summarizeRotation, validateRotationSnapshot, nextRotationBoundary, rotationRecordStatus, selectRotationSnapshot, weeklyResetWindow } from '../../../packages/weekly-rotation/index.js'

export { filterRotationRecords, remainingTime, rotationQuery }

const snapshot = ref(null)
const state = ref('idle')
const error = ref('')
const now = ref(new Date())
const lastChecked = ref('')
const refreshResult = ref('')
let request = null
let lastAttempt = 0
let nextBoundary = Infinity
const cacheKey = `d2hub-weekly-rotation:${dataUrl('weekly-rotation.json')}`

function restoreSnapshot() {
  if (snapshot.value) return
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey))
    if (validateRotationSnapshot(cached).valid && cached.activities.length) snapshot.value = cached
  } catch { /* Storage may be unavailable; the network request still works. */ }
}

const activityById = new Map(activitiesV2.map(item => [item.id, item]))

async function load({ force = false } = {}) {
  if (request) return request
  state.value = 'loading'
  error.value = ''
  refreshResult.value = ''
  now.value = new Date()
  lastAttempt = now.value.valueOf()
  nextBoundary = nextRotationBoundary(snapshot.value, now.value)
  const path = dataUrl('weekly-rotation.json')
  // Every read bypasses cached deployments. Only a manual refresh forces a local API sync.
  const url = `${path}?${force ? 'refresh' : 't'}=${lastAttempt}`
  request = fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(150_000) }).then(async response => {
    if (!response.ok) {
      const failure = await response.json().catch(() => null)
      throw new Error(failure?.error || `轮换快照加载失败：HTTP ${response.status}`)
    }
    const payload = await response.json()
    const check = validateRotationSnapshot(payload)
    if (!check.valid) throw new Error('轮换数据格式异常，已保留上次数据，将自动重试。')
    if (selectRotationSnapshot(snapshot.value, payload, new Date()) !== payload) throw new Error('暂未获取到更新的有效数据，已保留上次数据，将自动重试。')
    const changed = payload.generatedAt !== snapshot.value?.generatedAt
    snapshot.value = payload
    now.value = new Date()
    lastChecked.value = now.value.toISOString()
    const dataState = snapshotStatus(payload, now.value)
    refreshResult.value = payload.refreshing ? 'pending' : payload.error ? 'failed' : ['stale', 'unavailable'].includes(dataState) ? dataState : (changed ? 'updated' : 'unchanged')
    nextBoundary = nextRotationBoundary(payload, new Date(lastAttempt))
    if (payload.activities.length) {
      try { localStorage.setItem(cacheKey, JSON.stringify(payload)) } catch { /* Keep the in-memory fallback. */ }
    }
    state.value = 'ready'
    return payload
  }).catch(loadError => {
    error.value = loadError.message || '轮换快照加载失败。'
    refreshResult.value = 'failed'
    state.value = snapshot.value ? 'stale' : 'error'
    throw loadError
  }).finally(() => { request = null })
  return request
}

function status() {
  return snapshotStatus(snapshot.value, now.value)
}

function remaining(endDate) {
  return remainingTime(endDate, now.value)
}

function guideFor(item) {
  return item?.guideId ? activityById.get(item.guideId) || null : null
}

function iconUrl(item) {
  if (!item?.icon) return ''
  return item.icon.startsWith('http') ? item.icon : `https://www.bungie.net${item.icon}`
}

const records = computed(() => (snapshot.value?.activities || []).map(item => ({ ...item, guide: guideFor(item), iconUrl: iconUrl(item), dataStatus: rotationRecordStatus(item, status(), now.value) })))
const categories = computed(() => ROTATION_CATEGORIES.filter(category => records.value.some(item => item.category === category)))
const lastUpdated = computed(() => snapshot.value?.generatedAt || '')
const currentWeek = computed(() => weeklyResetWindow(now.value))

export function useWeeklyRotation() {
  let timer = null
  const checkForUpdate = () => {
    now.value = new Date()
    const retryAfter = error.value || snapshot.value?.error || snapshot.value?.refreshing || ['stale', 'unavailable'].includes(status()) ? 60_000 : 300_000
    if (document.visibilityState === 'visible' && navigator.onLine !== false && (now.value.valueOf() >= nextBoundary || now.value.valueOf() - lastAttempt >= retryAfter)) {
      load().catch(() => {})
    }
  }
  const onOnline = () => load().catch(() => {})
  onMounted(() => {
    restoreSnapshot()
    load().catch(() => {})
    timer = window.setInterval(checkForUpdate, 1_000)
    document.addEventListener('visibilitychange', checkForUpdate)
    window.addEventListener('online', onOnline)
  })
  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
    document.removeEventListener('visibilitychange', checkForUpdate)
    window.removeEventListener('online', onOnline)
  })

  return {
    snapshot: readonly(snapshot), records, categories, state: readonly(state), error: readonly(error), now: readonly(now), lastUpdated,
    status, remaining, guideFor, load, currentWeek, lastChecked: readonly(lastChecked), refreshResult: readonly(refreshResult),
    summary: (locale = 'zh', items = null) => summarizeRotation(snapshot.value, { locale, records: items })
  }
}
