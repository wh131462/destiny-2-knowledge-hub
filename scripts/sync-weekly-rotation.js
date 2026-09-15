import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMilestones, validateMilestonesPayload, validateRotationSnapshot, WEEKLY_ROTATION_SCHEMA } from '../packages/weekly-rotation/index.js'
import { activitiesV2 } from '../content/catalog/activities.js'
import { readBungieApiKey } from './lib/bungie-api-key.js'
import { loadRotationDefinitions } from './lib/rotation-definitions.js'

const root = dirname(fileURLToPath(import.meta.url))
const args = new Map(process.argv.slice(2).filter(arg => arg.startsWith('--')).map(arg => {
  const [key, ...rest] = arg.slice(2).split('=')
  return [key, rest.join('=') || true]
}))
const output = String(args.get('out') || join(root, '../web/public/data/weekly-rotation.json'))
const fixturePath = args.get('fixture') ? String(args.get('fixture')) : ''
const endpoint = 'https://www.bungie.net/Platform/Destiny2/Milestones/'
const timeoutMs = 30_000
const retries = 2

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function fetchJson(url, apiKey) {
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'error',
        headers: { Accept: 'application/json', 'X-API-Key': apiKey }
      })
      if (!response.ok) {
        const error = new Error(`Bungie API HTTP ${response.status}`)
        if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === retries) throw error
        lastError = error
      } else {
        return response.json()
      }
    } catch (error) {
      lastError = error.name === 'AbortError' ? new Error('Bungie API 请求超时') : error
      if (attempt === retries) throw lastError
    } finally {
      clearTimeout(timer)
    }
    await sleep(500 * (attempt + 1))
  }
  throw lastError || new Error('Bungie API 请求失败')
}

function addStaleStatus(previous, error) {
  if (!previous) return null
  return { ...previous, status: 'stale', error: String(error.message || error), source: { ...(previous.source || {}), lastAttemptFailedAt: new Date().toISOString() } }
}

async function publish(snapshot) {
  const validation = validateRotationSnapshot(snapshot)
  if (!validation.valid) throw new Error(`轮换快照校验失败：${validation.errors.join(', ')}`)
  await mkdir(dirname(output), { recursive: true })
  const temp = `${output}.tmp-${process.pid}`
  await writeFile(temp, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  await rename(temp, output)
}

async function main() {
  let previous = null
  try { previous = await readJson(output) } catch { /* first sync */ }
  let payload
  let fetchedAt = new Date().toISOString()
  if (fixturePath) {
    payload = await readJson(fixturePath)
    fetchedAt = String(args.get('generatedAt') || fetchedAt)
  } else {
    const apiKey = await readBungieApiKey()
    if (!apiKey && args.has('optional')) {
      console.log('[本周轮换] 未配置 BUNGIE_API_KEY，使用已有快照；在仓库根目录 .env.local 中填写 Key 后重新运行 npm run dev 即可自动同步。')
      return
    }
    if (!apiKey) throw new Error('缺少 BUNGIE_API_KEY；请在仓库根目录的 .env.local 或 .env 中配置，或设置环境变量；离线调试可使用 --fixture=path/to/response.json')
    console.log('[本周轮换] 正在从 Bungie 同步最新活动…')
    payload = await fetchJson(endpoint, apiKey)
  }
  const payloadValidation = validateMilestonesPayload(payload)
  if (!payloadValidation.valid) throw new Error(`Bungie Milestones 响应校验失败：${payloadValidation.errors.join(', ')}`)
  let manifestActivities = []
  let manifestVersion = null
  try {
    const manifest = await readJson(join(root, '../web/public/data/manifest-activities.json'))
    manifestActivities = Array.isArray(manifest.activities) ? manifest.activities : []
    manifestVersion = manifest.manifestVersion || null
  } catch { /* Manifest enrichment is optional; source records remain usable. */ }
  let rewardCatalog = {}
  try {
    const [items, rewards] = await Promise.all([
      readJson(join(root, '../web/public/data/manifest-items.json')),
      readJson(join(root, '../web/public/data/manifest-activity-rewards.json'))
    ])
    if (items.manifestVersion !== rewards.manifestVersion || (manifestVersion && rewards.manifestVersion !== manifestVersion)) throw new Error('Manifest version mismatch')
    rewardCatalog = { items: items.items || [], entries: rewards.entries || [], manifestVersion: rewards.manifestVersion }
  } catch {
    console.warn('[本周轮换] 本地奖励目录缺失或版本不一致，暂不关联官方奖励类型。')
  }
  const definitions = await loadRotationDefinitions({ offline: Boolean(fixturePath) })
  const snapshot = normalizeMilestones(payload, { manifestActivities, editorialActivities: activitiesV2, definitions, rewardCatalog, manifestVersion, generatedAt: fetchedAt })
  snapshot.source = { ...snapshot.source, endpoint, fetchedAt, rewardsManifestVersion: rewardCatalog.manifestVersion || null, schema: WEEKLY_ROTATION_SCHEMA }
  if (snapshot.status === 'unavailable' && previous?.activities?.length) throw new Error('Bungie API 返回空或无法识别的轮换，拒绝覆盖现有快照')
  await publish(snapshot)
  console.log(JSON.stringify({ ok: true, output, status: snapshot.status, activities: snapshot.activities.length, generatedAt: snapshot.generatedAt }))
}

try {
  await main()
} catch (error) {
  let previous = null
  try { previous = await readJson(output) } catch { /* no previous snapshot */ }
  const stale = addStaleStatus(previous, error)
  if (stale) {
    try { await publish(stale) } catch { /* preserve the original file if even stale marking fails */ }
  }
  console.error(`轮换同步失败：${error.message}`)
  if (args.has('optional')) {
    console.warn('[本周轮换] 自动同步未成功，将使用已有快照继续启动本地站点。可运行 npm run rotation:sync 重试。')
  } else {
    process.exitCode = 1
  }
}
