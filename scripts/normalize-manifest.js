import { readFile, mkdir, writeFile } from 'node:fs/promises'

const input = new URL('../data/manifest/DestinyInventoryItemDefinition.json', import.meta.url)
const outputDir = new URL('../data/catalog/', import.meta.url)
const output = new URL('manifest-items.json', outputDir)
const equipmentOutput = new URL('manifest-equipment.json', outputDir)
const publicStatus = new URL('../web/public/data/manifest-status.json', import.meta.url)
const publicEquipment = new URL('../web/public/data/manifest-equipment.json', import.meta.url)
const publicItems = new URL('../web/public/data/manifest-items.json', import.meta.url)
const activityInput = new URL('../data/manifest/DestinyActivityDefinition.json', import.meta.url)
const perkInput = new URL('../data/manifest/DestinySandboxPerkDefinition.json', import.meta.url)
const activityOutput = new URL('manifest-activities.json', outputDir)
const perkOutput = new URL('manifest-perks.json', outputDir)
const publicActivities = new URL('../web/public/data/manifest-activities.json', import.meta.url)
const publicPerks = new URL('../web/public/data/manifest-perks.json', import.meta.url)
const loadOptional = async url => { try { return JSON.parse(await readFile(url, 'utf8')) } catch { return { data: {} } } }
const localeSnapshot = await loadOptional(new URL('../data/catalog/manifest-locales-zh-chs.json', import.meta.url))

const snapshot = JSON.parse(await readFile(input, 'utf8'))
const definitions = snapshot.data || {}
const localizedDefinitions = localeSnapshot.items || {}
const items = Object.entries(definitions)
  .map(([hash, item]) => ({
    hash: Number(hash),
    name: item.displayProperties?.name || '',
    nameZh: localizedDefinitions[hash]?.name || null,
    description: item.displayProperties?.description || '',
    descriptionZh: localizedDefinitions[hash]?.description || null,
    icon: item.displayProperties?.icon || null,
    itemType: item.itemType || 0,
    itemTypeDisplayName: item.itemTypeDisplayName || '',
    itemCategoryHashes: item.itemCategoryHashes || [],
    tierTypeHash: item.inventory?.tierTypeHash || null,
    equipmentSlotHash: item.equippingBlock?.equipmentSlotTypeHash || null,
    damageTypeHashes: item.damageTypeHashes || [],
    traitHashes: item.sandboxPerkHash ? [item.sandboxPerkHash] : [],
    collectibleHash: item.collectibleHash || null,
    sourceHash: item.sourceData?.sourceHash || null,
    redacted: Boolean(item.redacted),
    blacklisted: Boolean(item.blacklisted)
  }))
  .filter(item => item.name && !item.redacted && !item.blacklisted)

await mkdir(outputDir, { recursive: true })
const itemsPayload = {
  manifestVersion: snapshot.manifestVersion,
  syncedAt: snapshot.syncedAt,
  sourceComponent: snapshot.component,
  count: items.length,
  items
}
await writeFile(output, `${JSON.stringify(itemsPayload, null, 2)}\n`)
await writeFile(publicItems, `${JSON.stringify(itemsPayload, null, 2)}\n`)
const equipment = items.filter(item => [2, 3].includes(item.itemType))
await writeFile(equipmentOutput, `${JSON.stringify({
  manifestVersion: snapshot.manifestVersion,
  syncedAt: snapshot.syncedAt,
  sourceComponent: snapshot.component,
  count: equipment.length,
  items: equipment
}, null, 2)}\n`)
await mkdir(new URL('../web/public/data/', import.meta.url), { recursive: true })
await writeFile(publicEquipment, `${JSON.stringify({
  manifestVersion: snapshot.manifestVersion,
  syncedAt: snapshot.syncedAt,
  count: equipment.length,
  items: equipment
}, null, 2)}\n`)

const activitySnapshot = JSON.parse(await readFile(activityInput, 'utf8'))
const localizedActivities = localeSnapshot.activities || {}
const activities = Object.entries(activitySnapshot.data || {}).map(([hash, item]) => ({
  hash: Number(hash),
  name: item.displayProperties?.name || '',
  nameZh: localizedActivities[hash]?.name || null,
  description: item.displayProperties?.description || '',
  descriptionZh: localizedActivities[hash]?.description || null,
  icon: item.displayProperties?.icon || null,
  releaseTime: item.releaseTime || 0,
  activityLightLevel: item.activityLightLevel || 0,
  activityTypeHash: item.activityTypeHash || null,
  isPvP: Boolean(item.isPvP),
  isPlaylist: Boolean(item.isPlaylist),
  matchmaking: item.matchmaking ? { isMatchmade: Boolean(item.matchmaking.isMatchmade), minParty: item.matchmaking.minParty || 1, maxParty: item.matchmaking.maxParty || 6 } : null,
  activityModeHashes: item.activityModeHashes || [],
  redacted: Boolean(item.redacted),
  blacklisted: Boolean(item.blacklisted)
})).filter(item => item.name && !item.redacted && !item.blacklisted)
const activityPayload = { manifestVersion: activitySnapshot.manifestVersion, syncedAt: activitySnapshot.syncedAt, count: activities.length, activities }
await writeFile(activityOutput, `${JSON.stringify(activityPayload, null, 2)}\n`)
await writeFile(publicActivities, `${JSON.stringify(activityPayload, null, 2)}\n`)

const perkSnapshot = JSON.parse(await readFile(perkInput, 'utf8'))
const localizedPerks = localeSnapshot.perks || {}
const perks = Object.entries(perkSnapshot.data || {}).map(([hash, item]) => ({
  hash: Number(hash), name: item.displayProperties?.name || '', nameZh: localizedPerks[hash]?.name || null, description: item.displayProperties?.description || '', descriptionZh: localizedPerks[hash]?.description || null,
  icon: item.displayProperties?.icon || null, damageType: item.damageType || 0,
  isDisplayable: Boolean(item.isDisplayable), redacted: Boolean(item.redacted), blacklisted: Boolean(item.blacklisted)
})).filter(item => item.name && !item.redacted && !item.blacklisted)
const perkPayload = { manifestVersion: perkSnapshot.manifestVersion, syncedAt: perkSnapshot.syncedAt, count: perks.length, perks }
await writeFile(perkOutput, `${JSON.stringify(perkPayload, null, 2)}\n`)
await writeFile(publicPerks, `${JSON.stringify(perkPayload, null, 2)}\n`)
try {
  const status = JSON.parse(await readFile(publicStatus, 'utf8'))
  const components = [...(status.components || []).filter(item => !['manifest-items', 'manifest-equipment', 'manifest-activities', 'manifest-perks'].includes(item.component)), { component: 'manifest-items', count: items.length }, { component: 'manifest-equipment', count: equipment.length }, { component: 'manifest-activities', count: activities.length }, { component: 'manifest-perks', count: perks.length }]
  await writeFile(publicStatus, `${JSON.stringify({ ...status, manifestVersion: snapshot.manifestVersion, syncedAt: snapshot.syncedAt, components }, null, 2)}\n`)
} catch {
  // The public status file is optional when normalizing a fresh checkout.
}
console.log(`已生成轻量装备索引：${items.length} 条`)
