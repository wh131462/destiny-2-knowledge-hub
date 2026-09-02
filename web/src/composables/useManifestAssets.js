import { computed, onMounted, ref } from 'vue'

const assetCache = new Map()
const loadState = ref('idle')
const sharedAssets = ref(new Map())
const sharedEquipmentItems = ref([])
const sharedArtifacts = ref([])
const sharedMods = ref([])
const sharedAssetByHash = ref(new Map())
const curatedModLinks = ref(new Map())
const sharedManifestPerks = ref([])
const sharedPlugSets = ref([])
const sharedItemSets = ref([])
const sharedVendorEntries = ref([])
const sharedActivityRewards = ref([])
const sharedCatalogItems = ref([])
let loadPromise = null

async function loadManifest(path) {
  if (assetCache.has(path)) return assetCache.get(path)
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`)
  const payload = await response.json()
  const items = Array.isArray(payload.items) ? payload.items : []
  const entries = items.flatMap(item => {
    const names = [item.name, item.nameZh, item.englishName].filter(Boolean)
    return names.map(name => [String(name).trim().toLowerCase(), item])
  })
  const map = new Map(entries)
  assetCache.set(path, map)
  return map
}

async function loadCollection(path, key) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`)
  const payload = await response.json()
  return Array.isArray(payload[key]) ? payload[key] : []
}

export function useManifestAssets() {
  onMounted(async () => {
    if (!loadPromise) {
      loadState.value = 'loading'
      loadPromise = Promise.all([
        loadManifest('/data/manifest-equipment-rich.json'),
        loadManifest('/data/manifest-abilities.json'),
        loadManifest('/data/manifest-mods.json'),
        loadManifest('/data/manifest-artifact.json'),
        loadManifest('/data/curated-mod-links.json'),
        loadCollection('/data/manifest-perks.json', 'perks'),
        loadCollection('/data/manifest-plugsets.json', 'sets'),
        loadCollection('/data/manifest-item-sets.json', 'sets'),
        loadCollection('/data/manifest-vendor-inventory.json', 'entries'),
        loadCollection('/data/manifest-activity-rewards.json', 'entries'),
        loadCollection('/data/manifest-items.json', 'items')
      ]).then(([equipment, abilities, mods, artifact, modLinks, perks, plugSets, itemSets, vendorEntries, activityRewards, catalogItems]) => {
        sharedAssets.value = new Map([...equipment, ...abilities, ...mods])
        sharedEquipmentItems.value = [...new Set(equipment.values())]
        sharedMods.value = [...new Set(mods.values())]
        sharedArtifacts.value = [...new Set(artifact.values())]
        sharedCatalogItems.value = catalogItems
        sharedAssetByHash.value = new Map([...catalogItems, ...equipment.values(), ...abilities.values(), ...mods.values()].filter(item => item?.hash).map(item => [String(item.hash), item]))
        curatedModLinks.value = new Map([...modLinks.values()].filter(item => item?.id).map(item => [item.id, item]))
        sharedManifestPerks.value = perks
        sharedPlugSets.value = plugSets
        sharedItemSets.value = itemSets
        sharedVendorEntries.value = vendorEntries
        sharedActivityRewards.value = activityRewards
        loadState.value = 'ready'
      }).catch(() => { loadState.value = 'error' })
    }
    await loadPromise
  })

  const assetFor = item => {
    if (!item) return null
    const linkedHash = item.id ? curatedModLinks.value.get(item.id)?.primaryHash : null
    const byHash = sharedAssetByHash.value.get(String(item.manifestHash || item.hash || linkedHash))
    if (byHash) return byHash
    const names = [item.nameEn, item.en, item.name, item.label].filter(Boolean)
    const byName = names.map(name => sharedAssets.value.get(String(name).trim().toLowerCase())).find(Boolean)
    if (byName) return byName
    return null
  }

  const isExactManifestAsset = item => Boolean(assetFor(item)?.hash || (item?.manifestVerified && Number.isInteger(item?.manifestHash)))

  const iconFor = item => {
    const asset = assetFor(item)
    const icon = asset?.icon || item?.icon
    return icon ? (String(icon).startsWith('http') ? icon : `https://www.bungie.net${icon}`) : ''
  }

  const weaponItems = computed(() => {
    const seen = new Set()
    return sharedEquipmentItems.value.filter(item => {
      if (item.itemType !== 3 || !item.name || item.redacted || item.blacklisted) return false
      const key = `${item.name}|${item.weaponFamily || ''}|${item.ammoSlot || ''}|${item.tierTypeHash || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  const recordsForHash = (collection, hash) => collection.value.filter(item => String(item.itemHash || item.hash) === String(hash))
  const entityForHash = hash => sharedAssetByHash.value.get(String(hash)) || null
  return {
    assetFor, iconFor, isExactManifestAsset, weaponItems,
    equipmentItems: computed(() => sharedEquipmentItems.value),
    manifestMods: computed(() => sharedMods.value),
    artifacts: computed(() => sharedArtifacts.value),
    manifestPerks: computed(() => sharedManifestPerks.value),
    plugSets: computed(() => sharedPlugSets.value),
    itemSets: computed(() => sharedItemSets.value),
    vendorEntries: computed(() => sharedVendorEntries.value),
    activityRewards: computed(() => sharedActivityRewards.value),
    recordsForHash, entityForHash,
    status: computed(() => loadState.value)
  }
}
