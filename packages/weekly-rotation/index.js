import { createRewardResolver } from './rewards.js'

export const WEEKLY_ROTATION_SCHEMA = 'd2hub-weekly-rotation-v1'
export const ROTATION_STATUSES = ['fresh', 'partial', 'stale', 'unavailable']
export const ROTATION_CATEGORIES = ['pve', 'pvp', 'raid', 'dungeon', 'exotic-mission', 'vendor', 'event', 'other']

const CATEGORY_LABELS = {
  pve: ['pve', 'vanguard', 'strike', 'nightfall', 'gambit'],
  pvp: ['pvp', 'crucible', 'trials', 'iron banner', 'ironbanner'],
  raid: ['raid', '突袭'],
  dungeon: ['dungeon', '地牢'],
  'exotic-mission': ['exotic mission', '异域任务'],
  vendor: ['vendor', 'merchant', '商人', 'xur'],
  event: ['event', 'festival', 'solstice', '铁旗', 'iron banner']
}

const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const asArray = value => Array.isArray(value) ? value : []
const text = value => typeof value === 'string' ? value.trim() : ''
const number = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null
const iso = value => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function milestoneEntries(payload) {
  const rawRoot = payload?.Response ?? payload?.response ?? payload
  const root = rawRoot && typeof rawRoot === 'object' ? rawRoot : {}
  if (Array.isArray(root)) return root
  return Object.entries(root).map(([key, value]) => ({ ...asObject(value), milestoneHash: value?.milestoneHash ?? number(key) }))
}

function displayFor(milestone, activity) {
  const display = asObject(milestone.displayProperties || milestone.display || activity?.displayProperties)
  return {
    name: text(display.name) || text(milestone.name) || text(activity?.name) || '',
    description: text(display.description) || text(milestone.description) || text(activity?.description) || '',
    icon: text(display.icon) || text(milestone.icon) || text(activity?.icon) || ''
  }
}

function classify(name, activity, editorial) {
  // DestinyActivityTypeDefinition: use semantic types before broad PvE fallbacks.
  const types = { 2043403989: 'raid', 608898761: 'dungeon', 1227821118: 'exotic-mission' }
  const officialCategory = [activity?.activityTypeHash, ...asArray(activity?.activityModeHashes)].map(hash => types[hash]).find(Boolean)
  if (officialCategory) return officialCategory
  if (activity?.isPvP) return 'pvp'
  if (ROTATION_CATEGORIES.includes(editorial?.category)) return editorial.category
  const haystack = [name, activity?.name, activity?.nameZh, editorial?.name, editorial?.en, ...(editorial?.aliases || [])].filter(Boolean).join(' ').toLowerCase()
  for (const category of ['raid', 'dungeon', 'exotic-mission', 'vendor', 'pvp', 'event', 'pve']) {
    if (CATEGORY_LABELS[category].some(label => haystack.includes(label))) return category
  }
  if (activity?.isPlaylist) return 'pve'
  return 'other'
}

function difficultyFor(row, milestone, activity) {
  const explicit = text(row?.difficulty || milestone.difficulty || milestone.tier)
  if (explicit) return explicit
  return text(activity?.name).match(/:\s*(Standard|Normal|Master|Legend|Legendary|Expert|Grandmaster)\s*$/i)?.[1] || null
}

export function cleanRotationDescription(value, locale = 'en') {
  return text(value)
    .replace(/\{var:\d+\}%?/g, locale === 'zh' ? '（数值以游戏内为准）' : '(value shown in game)')
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/\[(?:Arc|Solar|Void|Stasis|Strand|Disruption|Stagger|ShieldPiercing)\]\s*/g, '')
    .trim()
}

function resolveModifiers(values, definitions = {}) {
  return values.map(value => {
    const hash = number(value)
    const en = definitions.en?.[hash]
    const zh = definitions['zh-chs']?.[hash]
    const name = text(en?.displayProperties?.name) || (hash === null ? text(value) : '')
    const nameZh = text(zh?.displayProperties?.name)
    const description = cleanRotationDescription(en?.displayProperties?.description)
    const descriptionZh = cleanRotationDescription(zh?.displayProperties?.description, 'zh')
    return {
      hash, name, nameZh, description, descriptionZh,
      icon: text(en?.displayProperties?.icon || zh?.displayProperties?.icon),
      displayInActivitySelection: en?.displayInActivitySelection ?? zh?.displayInActivitySelection ?? null,
      kind: /challenge|挑战/i.test(`${name} ${description} ${nameZh} ${descriptionZh}`) ? 'challenge' : 'modifier',
      hidden: Boolean(en || zh) && !name && !nameZh,
      resolved: Boolean(name || nameZh)
    }
  })
}

function findActivity(hash, activities) {
  if (hash === null) return null
  return activities.find(item => String(item.hash ?? item.activityHash ?? item.id) === String(hash)) || null
}

function findEditorial(display, activity, editorialActivities) {
  const haystack = [display.name, activity?.name, activity?.nameZh].filter(Boolean).join(' ').toLowerCase()
  if (!haystack) return null
  return editorialActivities.find(item => [item.name, item.en, ...(item.aliases || [])].filter(Boolean).some(value => haystack.includes(String(value).toLowerCase()) || String(value).toLowerCase().includes(haystack))) || null
}

function modifierNames(milestone) {
  return asArray(milestone.modifiers || milestone.modifierHashes || milestone.activity?.modifierHashes)
    .map(value => typeof value === 'object' ? text(value.name || value.displayProperties?.name) : text(value) || number(value))
    .filter(value => value !== null && value !== '')
}

function rewardNames(milestone) {
  return asArray(milestone.rewards || milestone.rewardEntries).map(value => typeof value === 'object'
    ? text(value.name || value.displayProperties?.name || value.rewardName)
    : text(value) || number(value)).filter(value => value !== null && value !== '')
}

export function categoryLabel(category) {
  return ROTATION_CATEGORIES.includes(category) ? category : 'other'
}

export function remainingTime(endDate, currentTime = new Date()) {
  if (!endDate) return null
  const distance = new Date(endDate).valueOf() - new Date(currentTime).valueOf()
  if (!Number.isFinite(distance)) return null
  if (distance <= 0) return { expired: true, totalMs: distance }
  const days = Math.floor(distance / 86_400_000)
  const hours = Math.floor((distance % 86_400_000) / 3_600_000)
  const minutes = Math.floor((distance % 3_600_000) / 60_000)
  return { expired: false, days, hours, minutes, totalMs: distance }
}

// Destiny resets every Tuesday at 17:00 UTC, independent of browser timezone/DST.
export function weeklyResetWindow(currentTime = new Date()) {
  const now = new Date(currentTime)
  if (!Number.isFinite(now.valueOf())) return null
  const start = new Date(now)
  start.setUTCHours(17, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 5) % 7)
  if (start > now) start.setUTCDate(start.getUTCDate() - 7)
  return { start: start.toISOString(), end: new Date(start.valueOf() + 7 * 86_400_000).toISOString() }
}

export function rotationTimeLabel({ startDate, endDate } = {}, currentTime = new Date(), locale = 'zh') {
  const tr = (zh, en) => locale === 'en' ? en : zh
  const start = startDate ? remainingTime(startDate, currentTime) : null
  const end = remainingTime(endDate, currentTime)
  if ((startDate && !start) || !end || (startDate && new Date(startDate) >= new Date(endDate))) return tr('周期未提供', 'No reset window')
  if (start && !start.expired) return tr('尚未开始', 'Not started')
  if (end.expired) return tr('本期已结束', 'Period ended')
  if (end.totalMs < 60_000) return tr('即将重置', 'Resetting soon')
  const duration = end.days ? tr(`${end.days}天 ${end.hours}小时`, `${end.days}d ${end.hours}h`) : tr(`${end.hours}小时 ${end.minutes}分`, `${end.hours}h ${end.minutes}m`)
  return tr(`剩余 ${duration}`, `${duration} left`)
}

export function nextRotationBoundary(snapshot, currentTime = new Date()) {
  const now = new Date(currentTime).valueOf()
  const boundaries = [snapshot?.week?.end, weeklyResetWindow(currentTime)?.end,
    ...(snapshot?.activities || []).flatMap(item => [item.startDate, item.endDate])]
    .map(value => Date.parse(value)).filter(value => Number.isFinite(value) && value > now)
  return boundaries.length ? Math.min(...boundaries) : Infinity
}

export function rotationRecordStatus(item, snapshotState, currentTime = new Date()) {
  if (remainingTime(item?.endDate, currentTime)?.expired) return 'stale'
  return snapshotState
}

// Never replace useful records with an empty response, an older deployment, or
// an expired upstream response just because it was fetched more recently.
export function selectRotationSnapshot(previous, incoming, currentTime = new Date()) {
  if (!previous?.activities?.length) return incoming
  if (!incoming?.activities?.length) return previous
  if (Date.parse(incoming.generatedAt) < Date.parse(previous.generatedAt)) return previous
  // A failed refresh may mark otherwise valid retained data as stale. Compare
  // actual periods here so that its newer content is not rolled back in CI.
  if (!isSnapshotStale({ ...previous, status: 'partial' }, currentTime)
    && isSnapshotStale({ ...incoming, status: 'partial' }, currentTime)) return previous
  return incoming
}

export function rotationQuery(query = {}) {
  const categoryValue = String(query.category || 'all')
  const statusValue = String(query.status || 'all')
  return {
    category: ROTATION_CATEGORIES.includes(categoryValue) ? categoryValue : 'all',
    difficulty: String(query.difficulty || 'all'),
    status: [...ROTATION_STATUSES, 'all'].includes(statusValue) ? statusValue : 'all'
  }
}

export function filterRotationRecords(items = [], { category = 'all', difficulty = 'all', status = 'all' } = {}, snapshotState = 'unavailable') {
  return items.filter(item =>
    (category === 'all' || item.category === category) &&
    (difficulty === 'all' || item.difficulty === difficulty) &&
    (status === 'all' || (item.dataStatus || snapshotState) === status)
  )
}

export function groupRotationRecords(items = [], currentTime = new Date()) {
  const now = new Date(currentTime).valueOf()
  const phases = { active: 0, upcoming: 1, unknown: 2, stale: 3 }
  const phaseFor = item => {
    const end = Date.parse(item.endDate)
    const start = Date.parse(item.startDate)
    if (['stale', 'unavailable'].includes(item.dataStatus) || end <= now) return 'stale'
    if (!Number.isFinite(end) || (item.startDate && (!Number.isFinite(start) || start >= end))) return 'unknown'
    return start > now ? 'upcoming' : 'active'
  }
  const hasName = value => Boolean(text(value?.name) || text(value?.nameZh))
  const hasRewards = item => asArray(item.rewards).some(value => text(value) && !/^\d+$/.test(value))
    || asArray(item.rewardDetails?.official).some(hasName) || asArray(item.rewardDetails?.examples).some(hasName)
  const hasChallenges = item => asArray(item.modifierDetails).some(value => !value?.hidden && value?.kind === 'challenge' && hasName(value))
  const ranked = items.map(item => {
    const phase = phaseFor(item)
    const end = Date.parse(item.endDate)
    // Information coverage is a navigation aid, never a claim about drop value.
    return { item, phase, rank: [phases[phase], phase === 'active' && end - now <= 86_400_000 ? 0 : 1,
      hasRewards(item) ? 0 : 1, hasChallenges(item) ? 0 : 1, item.guideId || item.guide ? 0 : 1] }
  }).sort((a, b) => {
    for (let index = 0; index < a.rank.length; index++) {
      const difference = a.rank[index] - b.rank[index]
      if (difference) return difference
    }
    const aEnd = Date.parse(a.item.endDate), bEnd = Date.parse(b.item.endDate)
    if (Number.isFinite(aEnd) && Number.isFinite(bEnd) && aEnd !== bEnd) return aEnd - bEnd
    // Keep equal-priority records stable across refreshes and API ordering changes.
    return String(a.item.id).localeCompare(String(b.item.id), 'en', { numeric: true })
  })
  const groups = new Map()
  for (const { item, phase } of ranked) {
    const key = `${phase}:${item.category}`
    if (!groups.has(key)) groups.set(key, { key, category: item.category, phase, items: [] })
    groups.get(key).items.push(item)
  }
  return [...groups.values()]
}

export function normalizeMilestones(payload, { manifestActivities = [], editorialActivities = [], definitions = {}, rewardCatalog = {}, manifestVersion = null, generatedAt = new Date().toISOString() } = {}) {
  const resolveRewards = createRewardResolver(rewardCatalog)
  const entries = milestoneEntries(payload)
  const records = []
  for (const milestone of entries) {
    const activities = asArray(milestone.activities)
    const activityRows = activities.length ? activities : [null]
    const milestoneHash = number(milestone.milestoneHash ?? milestone.hash)
    const milestoneDefinition = definitions.milestones?.en?.[milestoneHash]
    const milestoneZh = definitions.milestones?.['zh-chs']?.[milestoneHash]
    const startDate = iso(milestone.startDate || milestone.startTime || milestone.start)
    const endDate = iso(milestone.endDate || milestone.endTime || milestone.end)
    for (const activityRow of activityRows) {
      const activityHash = number(activityRow?.activityHash ?? activityRow?.hash ?? milestone.activityHash)
      const activity = findActivity(activityHash, manifestActivities)
      const display = displayFor(milestone, activity || milestoneDefinition)
      if (!display.name) Object.assign(display, displayFor(milestoneDefinition || {}, null))
      const editorial = findEditorial(display, activity, editorialActivities)
      const category = classify(display.name, activity, editorial)
      const id = `${milestoneHash ?? 'milestone'}:${activityHash ?? records.length}`
      const modifiers = [...new Set([...(activityRow ? modifierNames(milestone) : []), ...modifierNames(activityRow || milestone)])]
      const champions = [...new Set([...(activityRow ? asArray(milestone.champions) : []), ...asArray(activityRow?.champions || milestone.champions)])]
        .map(value => typeof value === 'object' ? text(value.name || value.type) : text(value) || number(value))
        .filter(value => value !== null && value !== '')
      const rewards = [...new Set([...(activityRow ? rewardNames(milestone) : []), ...rewardNames(activityRow || milestone)])]
      records.push({
        id,
        milestoneHash,
        activityHash,
        name: display.name || 'Unnamed activity',
        nameZh: text(activity?.nameZh) || text(milestoneZh?.displayProperties?.name) || text(editorial?.name) || (display.name ? '' : '名称待解析'),
        description: display.description,
        descriptionZh: text(activity?.descriptionZh) || text(milestoneZh?.displayProperties?.description),
        icon: display.icon,
        category: categoryLabel(category),
        startDate,
        endDate,
        difficulty: difficultyFor(activityRow, milestone, activity),
        modifiers,
        modifierDetails: resolveModifiers(modifiers, definitions.modifiers),
        champions,
        rewards,
        rewardDetails: resolveRewards(activityHash, editorial),
        guideId: editorial?.id || null,
        source: { provider: 'bungie-milestones', mappedToManifest: Boolean(activity), mappedToGuide: Boolean(editorial), mappedToMilestone: Boolean(milestoneDefinition || milestoneZh) }
      })
    }
  }
  const unique = [...new Map(records.map(item => [item.id, item])).values()]
  const missingCategories = ROTATION_CATEGORIES.filter(category => !unique.some(item => item.category === category))
  const status = entries.length && unique.length ? (missingCategories.length ? 'partial' : 'fresh') : 'unavailable'
  return {
    schema: WEEKLY_ROTATION_SCHEMA,
    generatedAt: iso(generatedAt) || new Date().toISOString(),
    status,
    week: weeklyResetWindow(iso(generatedAt) || new Date()),
    source: { provider: 'bungie-milestones', fetchedAt: iso(generatedAt) || new Date().toISOString(), manifestVersion: text(manifestVersion) || null, definitionVersions: definitions.versions || {} },
    activities: unique,
    missingCategories,
    counts: Object.fromEntries(ROTATION_CATEGORIES.map(category => [category, unique.filter(item => item.category === category).length]))
  }
}

export function validateMilestonesPayload(payload) {
  const rawRoot = payload?.Response ?? payload?.response ?? payload
  const root = rawRoot && typeof rawRoot === 'object' ? rawRoot : {}
  const errors = []
  for (const [key, milestone] of (Array.isArray(root) ? root.entries() : Object.entries(root))) {
    if (!milestone || typeof milestone !== 'object' || Array.isArray(milestone)) { errors.push(`${key}: milestone`); continue }
    for (const field of ['startDate', 'startTime', 'start', 'endDate', 'endTime', 'end']) {
      if (milestone[field] !== undefined && milestone[field] !== null && !iso(milestone[field])) errors.push(`${key}.${field}`)
    }
    const start = iso(milestone.startDate || milestone.startTime || milestone.start)
    const end = iso(milestone.endDate || milestone.endTime || milestone.end)
    if (start && end && new Date(start) >= new Date(end)) errors.push(`${key}.window`)
    if (milestone.activities !== undefined && !Array.isArray(milestone.activities)) errors.push(`${key}.activities`)
    for (const [index, activity] of asArray(milestone.activities).entries()) {
      if (!activity || typeof activity !== 'object' || Array.isArray(activity)) errors.push(`${key}.activities[${index}]`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function validateRotationSnapshot(snapshot) {
  const value = asObject(snapshot)
  const errors = []
  if (value.schema !== WEEKLY_ROTATION_SCHEMA) errors.push('schema')
  if (!iso(value.generatedAt)) errors.push('generatedAt')
  if (!ROTATION_STATUSES.includes(value.status)) errors.push('status')
  const activities = Array.isArray(value.activities) ? value.activities : []
  if (!Array.isArray(value.activities)) errors.push('activities')
  if (!Array.isArray(value.missingCategories)) errors.push('missingCategories')
  const week = asObject(value.week)
  if (activities.length && !iso(week.start)) errors.push('week.start')
  if (activities.length && !iso(week.end)) errors.push('week.end')
  if (week.start && week.end && new Date(week.start) >= new Date(week.end)) errors.push('week.window')
  for (const [index, activity] of activities.entries()) {
    if (!activity || typeof activity !== 'object' || Array.isArray(activity)) { errors.push(`activities[${index}]`); continue }
    if (!text(activity.id) || !text(activity.name)) errors.push(`activities[${index}] identity`)
    if (!ROTATION_CATEGORIES.includes(activity.category)) errors.push(`activities[${index}] category`)
    if (activity.startDate && !iso(activity.startDate)) errors.push(`activities[${index}] startDate`)
    if (activity.endDate && !iso(activity.endDate)) errors.push(`activities[${index}] endDate`)
    if (activity.startDate && activity.endDate && new Date(activity.startDate) >= new Date(activity.endDate)) errors.push(`activities[${index}] window`)
  }
  return { valid: errors.length === 0, errors }
}

export function isSnapshotStale(snapshot, now = new Date()) {
  if (!snapshot || snapshot.status === 'unavailable') return true
  const time = new Date(now).valueOf()
  const generated = Date.parse(snapshot.generatedAt)
  const currentWeek = weeklyResetWindow(now)
  const dated = (snapshot.activities || []).filter(item => item.endDate)
  return !currentWeek || !Number.isFinite(generated) || generated < Date.parse(currentWeek.start)
    || remainingTime(snapshot.week?.end, now)?.expired === true
    || (dated.length > 0 && dated.every(item => remainingTime(item.endDate, now)?.expired))
    || generated > time + 300_000 || snapshot.status === 'stale'
}

export function snapshotStatus(snapshot, now = new Date()) {
  if (!snapshot?.activities?.length || snapshot.status === 'unavailable') return 'unavailable'
  if (isSnapshotStale(snapshot, now)) return 'stale'
  return snapshot.status
}

export function summarizeRotation(snapshot, { locale = 'zh', records = null } = {}) {
  const rows = records || snapshot?.activities || []
  const title = locale === 'en' ? 'Destiny 2 weekly rotation' : '命运2本周轮换'
  const status = locale === 'en' ? `Status: ${snapshotStatus(snapshot)}` : `状态：${snapshotStatus(snapshot)}`
  return [title, status, ...rows.map(item => `- ${locale === 'en' ? (item.name || item.nameZh) : (item.nameZh || item.name)}${item.endDate ? ` (${new Date(item.endDate).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')})` : ''}`)].join('\n')
}
