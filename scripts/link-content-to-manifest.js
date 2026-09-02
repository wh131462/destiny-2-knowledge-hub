import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { gearItems } from '../content/catalog/gear.js'

const snapshot = JSON.parse(await readFile(new URL('../data/manifest/DestinyInventoryItemDefinition.json', import.meta.url), 'utf8'))
const definitions = snapshot.data || {}
const byHash = new Map(Object.entries(definitions).map(([hash, item]) => [Number(hash), item]))
const preferredCandidate = (kind, candidates) => [...candidates].sort((a, b) => {
  if (kind === 'gear') {
    const aEquip = Number(a.itemType === 3 || a.itemType === 2)
    const bEquip = Number(b.itemType === 3 || b.itemType === 2)
    if (aEquip !== bEquip) return bEquip - aEquip
    const aSockets = byHash.get(a.hash)?.sockets?.socketEntries?.length || 0
    const bSockets = byHash.get(b.hash)?.sockets?.socketEntries?.length || 0
    return bSockets - aSockets
  }
  return Number(a.itemType === 19) - Number(b.itemType === 19)
})[0] || null
const byName = new Map()
const normalizeName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/gi, '').toLowerCase()
const byNormalizedName = new Map()
for (const [hash, item] of Object.entries(definitions)) {
  const name = item.displayProperties?.name?.trim()
  if (!name) continue
  const values = byName.get(name) || []
  values.push({ hash: Number(hash), itemType: item.itemType || 0, categoryHashes: item.itemCategoryHashes || [] })
  byName.set(name, values)
  const normalized = normalizeName(name)
  if (normalized) {
    const normalizedValues = byNormalizedName.get(normalized) || []
    normalizedValues.push({ hash: Number(hash), itemType: item.itemType || 0, categoryHashes: item.itemCategoryHashes || [], manifestName: name })
    byNormalizedName.set(normalized, normalizedValues)
  }
}

const collections = [
  ['ability', abilities],
  ['aspect', aspects],
  ['subclass', subclasses],
  ['gear', gearItems]
]
const links = {}
for (const [kind, collection] of collections) {
  for (const entity of collection) {
    const exactCandidates = byName.get(entity.en) || []
    const candidates = exactCandidates.length ? exactCandidates : byNormalizedName.get(normalizeName(entity.en)) || []
    const primary = preferredCandidate(kind, candidates)
    links[entity.id] = {
      kind,
      englishName: entity.en,
      manifestVersion: snapshot.manifestVersion,
      hashes: candidates.slice(0, 12).map(item => item.hash),
      matched: candidates.length > 0,
      matchReason: exactCandidates.length ? 'exact-name' : candidates.length ? 'normalized-name' : 'not-found-in-manifest',
      manifest: primary ? {
        hash: primary.hash,
        name: primary.manifestName || entity.en,
        itemType: primary.itemType,
        categoryHashes: primary.categoryHashes,
        classType: byHash.get(primary.hash)?.classType ?? null,
        equipmentSlotHash: byHash.get(primary.hash)?.equippingBlock?.equipmentSlotTypeHash ?? null,
        defaultDamageType: byHash.get(primary.hash)?.defaultDamageType ?? null,
        perkSocketCount: byHash.get(primary.hash)?.sockets?.socketEntries?.filter(socket => socket.reusablePlugSetHash || socket.reusablePlugItems?.length).length || 0
      } : null
    }
  }
}

const outputDir = new URL('../data/catalog/', import.meta.url)
const publicDir = new URL('../web/public/data/', import.meta.url)
const publicStatus = new URL('../web/public/data/manifest-status.json', import.meta.url)
await mkdir(outputDir, { recursive: true })
await mkdir(publicDir, { recursive: true })
const payload = {
  manifestVersion: snapshot.manifestVersion,
  generatedAt: new Date().toISOString(),
  count: Object.keys(links).length,
  matched: Object.values(links).filter(item => item.matched).length,
  links
}
await writeFile(new URL('curated-manifest-links.json', outputDir), `${JSON.stringify(payload, null, 2)}\n`)
await writeFile(new URL('curated-manifest-links.json', publicDir), `${JSON.stringify(payload, null, 2)}\n`)
try {
  const status = JSON.parse(await readFile(publicStatus, 'utf8'))
  const components = [...(status.components || []).filter(item => item.component !== 'curated-links'), { component: 'curated-links', count: Object.values(links).filter(item => item.matched).length }]
  await writeFile(publicStatus, `${JSON.stringify({ ...status, components }, null, 2)}\n`)
} catch {
  // Optional when generating data before the first public status snapshot.
}
console.log(`已生成构筑实体 Manifest 映射：${Object.values(links).filter(item => item.matched).length}/${Object.keys(links).length}`)
