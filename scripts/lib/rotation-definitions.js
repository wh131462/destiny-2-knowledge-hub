import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cacheRoot = fileURLToPath(new URL('../../.cache/weekly-rotation/', import.meta.url))
const components = { modifiers: 'DestinyActivityModifierDefinition', milestones: 'DestinyMilestoneDefinition' }
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

// Small public definition tables only; credentials never enter this cache.
export async function loadRotationDefinitions({ offline = false, cacheDir = cacheRoot, fetcher = fetch, warn = console.warn } = {}) {
  let manifest = null
  if (!offline) {
    try {
      const response = await fetcher('https://www.bungie.net/Platform/Destiny2/Manifest/', { signal: AbortSignal.timeout(15_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      manifest = (await response.json()).Response
      if (!manifest?.version) throw new Error('missing version')
    } catch {
      warn('[本周轮换] 官方名称定义暂时无法更新，将使用本地定义；未解析的编号仅保留在来源详情。')
    }
  }
  const result = {}
  const tables = await Promise.all(Object.entries(components).flatMap(([key, component]) => ['en', 'zh-chs'].map(async locale => {
    const file = join(cacheDir, `${component}.${locale}.json`)
    let cached = null
    try { cached = await readJson(file) } catch { /* optional cache */ }
    const sourcePath = manifest?.jsonWorldComponentContentPaths?.[locale]?.[component]
    if (sourcePath && cached?.sourcePath !== sourcePath) {
      try {
        if (!sourcePath.startsWith('/common/destiny2_content/')) throw new Error('invalid component path')
        const response = await fetcher(`https://www.bungie.net${sourcePath}`, { signal: AbortSignal.timeout(15_000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid definitions')
        cached = { manifestVersion: manifest.version, sourcePath, data }
        try {
          await mkdir(cacheDir, { recursive: true })
          const temp = `${file}.${process.pid}.tmp`
          await writeFile(temp, JSON.stringify(cached))
          await rename(temp, file)
        } catch { /* Definitions are usable even when caching is unavailable. */ }
      } catch {
        warn(`[本周轮换] ${component} (${locale}) 更新失败，使用已有定义。`)
      }
    }
    return { key, locale, cached }
  })))
  for (const { key, locale, cached } of tables) {
    result[key] ||= {}
    result[key][locale] = cached?.data || {}
  }
  result.versions = Object.fromEntries(tables.map(({ key, locale, cached }) => [`${key}:${locale}`, cached?.manifestVersion || null]))
  return result
}
