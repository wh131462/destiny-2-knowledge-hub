import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { snapshotStatus, validateRotationSnapshot } from '../../packages/weekly-rotation/index.js'
import { readBungieApiKey } from './bungie-api-key.js'

const run = promisify(execFile)
const snapshotPath = fileURLToPath(new URL('../../web/public/data/weekly-rotation.json', import.meta.url))
const scriptPath = fileURLToPath(new URL('../sync-weekly-rotation.js', import.meta.url))

async function synchronize(output) {
  if (!await readBungieApiKey()) throw new Error('未配置 BUNGIE_API_KEY，无法同步最新轮换。请在仓库根目录 .env.local 中配置。')
  try {
    await run(process.execPath, [scriptPath, `--out=${output}`], { timeout: 140_000 })
  } catch {
    // Child-process output can contain environment details; only return a public message.
    throw new Error('Bungie 轮换同步失败，已保留上次数据，请稍后刷新重试。')
  }
}

export function createWeeklyRotationMiddleware({ output = snapshotPath, sync = synchronize, clock = Date.now } = {}) {
  let pending = null
  let lastAttempt = -Infinity
  let syncError = ''
  const readSnapshot = async () => {
    try {
      const snapshot = JSON.parse(await readFile(output, 'utf8'))
      return validateRotationSnapshot(snapshot).valid ? snapshot : null
    } catch { return null }
  }

  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    if (req.method !== 'GET' || url.pathname !== '/data/weekly-rotation.json') return next()
    let snapshot = await readSnapshot()
    const needsSync = url.searchParams.has('refresh') || syncError || clock() - Date.parse(snapshot?.generatedAt) >= 300_000
      || snapshot?.activities?.some(item => Date.parse(item.endDate) <= clock() && Date.parse(item.endDate) > Date.parse(snapshot.generatedAt))
      || ['stale', 'unavailable'].includes(snapshotStatus(snapshot, new Date(clock())))
    if (needsSync && !pending && clock() - lastAttempt >= 60_000) {
      lastAttempt = clock()
      pending = Promise.resolve().then(() => sync(output)).then(() => { syncError = '' }).catch(error => {
        syncError = error.message
      }).finally(() => { pending = null })
    }
    // Serve retained records immediately during background sync. A manual
    // refresh (or first-ever load) waits for the actual sync result.
    if (pending && (url.searchParams.has('refresh') || !snapshot)) {
      await pending
      snapshot = await readSnapshot()
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = snapshot ? 200 : 503
    res.end(JSON.stringify(snapshot
      ? { ...snapshot, ...(syncError ? { status: 'stale', error: syncError } : {}), refreshing: Boolean(pending) }
      : { error: syncError || '暂无可用轮换数据，请稍后刷新重试。' }))
  }
}

export function weeklyRotationDevPlugin() {
  return {
    name: 'weekly-rotation-dev-sync',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(createWeeklyRotationMiddleware())
    }
  }
}
