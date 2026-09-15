import { computed, onBeforeUnmount, onMounted, ref, readonly } from 'vue'
import { dataUrl } from '@/utils/dataUrl'
import { activitiesV2 } from '@/data/v2'
import { filterRotationRecords, remainingTime, rotationQuery, ROTATION_CATEGORIES, snapshotStatus, summarizeRotation, validateRotationSnapshot, WEEKLY_ROTATION_SCHEMA } from '../../../packages/weekly-rotation/index.js'

export { filterRotationRecords, remainingTime, rotationQuery }

const snapshot = ref(null)
const state = ref('idle')
const error = ref('')
const now = ref(new Date())
let request = null
let timer = null

const activityById = new Map(activitiesV2.map(item => [item.id, item]))

async function load() {
  if (request) return request
  state.value = 'loading'
  error.value = ''
  request = fetch(dataUrl('weekly-rotation.json')).then(async response => {
    if (!response.ok) throw new Error(`轮换快照加载失败：HTTP ${response.status}`)
    const payload = await response.json()
    const check = validateRotationSnapshot(payload)
    if (!check.valid || payload.schema !== WEEKLY_ROTATION_SCHEMA) throw new Error(`轮换快照格式不正确：${check.errors.join(', ')}`)
    snapshot.value = payload
    state.value = 'ready'
    return payload
  }).catch(loadError => {
    error.value = loadError.message || '轮换快照加载失败。'
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

const records = computed(() => (snapshot.value?.activities || []).map(item => ({ ...item, guide: guideFor(item), iconUrl: iconUrl(item) })))
const categories = computed(() => ROTATION_CATEGORIES.filter(category => records.value.some(item => item.category === category)))
const lastUpdated = computed(() => snapshot.value?.generatedAt || '')

export function useWeeklyRotation() {
  onMounted(() => {
    load().catch(() => {})
    timer = window.setInterval(() => { now.value = new Date() }, 60_000)
  })
  onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })

  return {
    snapshot: readonly(snapshot), records, categories, state: readonly(state), error: readonly(error), now: readonly(now), lastUpdated,
    status, remaining, guideFor, load,
    summary: (locale = 'zh', items = null) => summarizeRotation(snapshot.value, { locale, records: items })
  }
}
