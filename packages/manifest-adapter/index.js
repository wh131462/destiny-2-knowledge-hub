import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const manifestDir = resolve(new URL('../../data/manifest/', import.meta.url).pathname)

const parseJson = async (fileName) => {
  const raw = await readFile(resolve(manifestDir, fileName), 'utf8')
  return JSON.parse(raw)
}

export const readManifestIndex = () => parseJson('manifest-index.json')

export const loadManifestComponent = async (component) => {
  const index = await readManifestIndex()
  const entry = index.files.find(file => file.component === component)
  if (!entry) return null
  const snapshot = await parseJson(entry.fileName)
  return {
    component,
    manifestVersion: snapshot.manifestVersion,
    syncedAt: snapshot.syncedAt,
    sourcePath: snapshot.sourcePath,
    definitions: snapshot.data
  }
}

const display = (definition = {}) => definition.displayProperties ?? {}

export const normalizeManifestEntity = (hash, definition, component) => ({
  id: `${component.toLowerCase()}-${hash}`,
  hash: Number(hash),
  component,
  name: display(definition).name || `未命名实体 ${hash}`,
  description: display(definition).description || '',
  icon: display(definition).icon || null,
  index: definition.index ?? null,
  redacted: Boolean(definition.redacted),
  blacklisted: Boolean(definition.blacklisted)
})

export const loadNormalizedComponent = async (component) => {
  const snapshot = await loadManifestComponent(component)
  if (!snapshot) return null
  const entities = Object.entries(snapshot.definitions)
    .map(([hash, definition]) => normalizeManifestEntity(hash, definition, component))
    .filter(entity => !entity.redacted && !entity.blacklisted)
  return { ...snapshot, entities }
}

export const manifestCatalogSummary = async () => {
  const index = await readManifestIndex()
  return {
    manifestVersion: index.manifestVersion,
    syncedAt: index.syncedAt,
    locale: index.locale,
    components: index.files.map(file => ({ component: file.component, count: file.count }))
  }
}

export const loadManifestItemIndex = async () => {
  const raw = await readFile(resolve(manifestDir, '../catalog/manifest-items.json'), 'utf8')
  return JSON.parse(raw)
}

export const loadManifestCatalogFile = async (fileName) => {
  const raw = await readFile(resolve(manifestDir, '../catalog', fileName), 'utf8')
  return JSON.parse(raw)
}

export const loadManifestActivities = () => loadManifestCatalogFile('manifest-activities.json')
export const loadManifestPerks = () => loadManifestCatalogFile('manifest-perks.json')
export const loadManifestEquipmentRich = () => loadManifestCatalogFile('manifest-equipment-rich.json')
export const loadManifestEquipmentCatalog = () => loadManifestCatalogFile('manifest-equipment-catalog.json')
export const loadManifestAbilities = () => loadManifestCatalogFile('manifest-abilities.json')
export const loadManifestMods = () => loadManifestCatalogFile('manifest-mods.json')
export const loadManifestPlugSets = () => loadManifestCatalogFile('manifest-plugsets.json')
export const loadManifestVendorInventory = () => loadManifestCatalogFile('manifest-vendor-inventory.json')
export const loadManifestActivityRewards = () => loadManifestCatalogFile('manifest-activity-rewards.json')
export const loadManifestItemSets = () => loadManifestCatalogFile('manifest-item-sets.json')
export const loadCuratedAcquisitionIndex = () => loadManifestCatalogFile('curated-acquisition-index.json')
export const loadAcquisitionSources = () => loadManifestCatalogFile('acquisition-sources.json')
export const loadCuratedModLinks = () => loadManifestCatalogFile('curated-mod-links.json')
export const loadManifestDropCoverage = () => loadManifestCatalogFile('manifest-drop-coverage.json')

export const loadCuratedManifestLinks = async () => {
  const raw = await readFile(resolve(manifestDir, '../catalog/curated-manifest-links.json'), 'utf8')
  return JSON.parse(raw)
}

export const resolveCuratedManifestHashes = async (entityId) => {
  const index = await loadCuratedManifestLinks()
  return index.links[entityId]?.hashes || []
}

export const resolveCuratedManifestEntity = async (entityId) => {
  const index = await loadCuratedManifestLinks()
  return index.links[entityId] || null
}
