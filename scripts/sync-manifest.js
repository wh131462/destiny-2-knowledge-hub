import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'

const endpoint = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
const apiRoot = 'https://www.bungie.net'
const outputDir = new URL('../data/manifest/', import.meta.url)
const publicStatusFile = new URL('../web/public/data/manifest-status.json', import.meta.url)

const args = new Set(process.argv.slice(2))
const componentArg = process.argv.find(value => value.startsWith('--components='))
const inputArg = process.argv.find(value => value.startsWith('--input='))
const localeArg = process.argv.find(value => value.startsWith('--locale='))
const locale = localeArg?.slice('--locale='.length).trim() || 'en'
const requestedComponents = componentArg
  ? componentArg.slice('--components='.length).split(',').map(value => value.trim()).filter(Boolean)
  : []

const defaultComponents = [
  'DestinyClassDefinition',
  'DestinyDamageTypeDefinition',
  'DestinyStatDefinition',
  'DestinyActivityTypeDefinition'
]

const fetchJson = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return response.json()
}

const writeJson = async (url, payload) => {
  await writeFile(url, `${JSON.stringify(payload, null, 2)}\n`)
}

let stagingDir = null
try {
  const payload = inputArg
    ? JSON.parse(await readFile(inputArg.slice('--input='.length), 'utf8'))
    : await fetchJson(endpoint)
  const manifest = payload.Response
  if (!manifest?.version) throw new Error('Manifest 响应缺少 version')

  const syncedAt = new Date().toISOString()
  const available = manifest.jsonWorldComponentContentPaths?.[locale] ?? {}
  if (!Object.keys(available).length) throw new Error(`Manifest 不支持语言：${locale}`)
  const components = args.has('--all-components')
    ? Object.keys(available).sort()
    : requestedComponents.length ? requestedComponents : defaultComponents
  const unknown = components.filter(component => !available[component])
  if (unknown.length) throw new Error(`未知 Manifest 组件：${unknown.join(', ')}`)

  stagingDir = await mkdtemp(join(tmpdir(), 'd2-manifest-sync-'))
  const files = []
  const snapshots = []
  for (const component of components) {
    const relativePath = available[component]
    const data = await fetchJson(`${apiRoot}${relativePath}`)
    const fileName = locale === 'en' ? `${component}.json` : `${component}.${locale}.json`
    snapshots.push({ fileName, payload: {
      manifestVersion: manifest.version,
      syncedAt,
      locale,
      component,
      sourcePath: relativePath,
      data
    }, stagedFile: join(stagingDir, fileName) })
    await writeJson(snapshots.at(-1).stagedFile, snapshots.at(-1).payload)
    files.push({ component, locale, fileName, sourcePath: relativePath, count: Object.keys(data).length })
    console.log(`已同步 ${component}：${Object.keys(data).length} 条`) 
  }

  const worldPath = manifest.jsonWorldContentPaths?.[locale]
  if (args.has('--aggregate') && worldPath) {
    const aggregate = await fetchJson(`${apiRoot}${worldPath}`)
    const fileName = `aggregate-${basename(worldPath)}`
    snapshots.push({ fileName, payload: {
      manifestVersion: manifest.version,
      syncedAt,
      locale,
      sourcePath: worldPath,
      data: aggregate
    }, stagedFile: join(stagingDir, fileName) })
    await writeJson(snapshots.at(-1).stagedFile, snapshots.at(-1).payload)
    files.push({ component: 'aggregate', locale, fileName, sourcePath: worldPath, count: Object.keys(aggregate).length })
    console.log(`已同步 aggregate：${Object.keys(aggregate).length} 条`)
  }

  await mkdir(outputDir, { recursive: true })
  await writeJson(new URL('manifest-metadata.json', outputDir), { syncedAt, endpoint, payload })
  for (const snapshot of snapshots) {
    await rm(new URL(snapshot.fileName, outputDir), { force: true })
    await rename(snapshot.stagedFile, new URL(snapshot.fileName, outputDir))
  }
  let previous = null
  try { previous = JSON.parse(await readFile(new URL('manifest-index.json', outputDir), 'utf8')) } catch { /* first sync */ }
  const mergedFiles = [
    ...(previous?.files || []).filter(previousFile => !files.some(file => file.component === previousFile.component && file.locale === (previousFile.locale || 'en'))),
    ...files
  ]
  const locales = [...new Set(mergedFiles.map(file => file.locale || 'en'))]
  await writeJson(new URL('manifest-index.json', outputDir), {
    manifestVersion: manifest.version,
    syncedAt,
    endpoint,
    locale: locales.join(', '),
    locales,
    files: mergedFiles,
    availableComponents: Object.keys(available).sort(),
    usage: '使用 --components=... 选择组件，或使用 --all-components 下载当前 Manifest 的全部 JSON 组件。'
  })
  await mkdir(new URL('../web/public/data/', import.meta.url), { recursive: true })
  let previousStatus = null
  try { previousStatus = JSON.parse(await readFile(publicStatusFile, 'utf8')) } catch { /* first sync */ }
  const mergedComponents = [
    ...(previousStatus?.components || []).filter(previousFile => !files.some(file => (locale === 'en' ? file.component : `${file.component}:${locale}`) === previousFile.component)),
    ...files.map(file => ({ component: locale === 'en' ? file.component : `${file.component}:${locale}`, count: file.count }))
  ]
  const statusLocales = [...new Set([...(previousStatus?.locales || String(previousStatus?.locale || 'en').split(',').map(value => value.trim()).filter(Boolean)), locale])]
  await writeJson(publicStatusFile, {
    manifestVersion: manifest.version,
    syncedAt,
    locale: statusLocales.join(', '),
    locales: statusLocales,
    components: mergedComponents
  })
  await rm(stagingDir, { recursive: true, force: true })
  stagingDir = null
  console.log(`Bungie Manifest 同步完成：${manifest.version}`)
} catch (error) {
  if (stagingDir) await rm(stagingDir, { recursive: true, force: true })
  console.error(`Manifest 同步失败：${error.message}`)
  console.error('现有本地快照未被覆盖；网络恢复后可再次运行 npm run manifest:sync。')
  process.exitCode = 1
}
