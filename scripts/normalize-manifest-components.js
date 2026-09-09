import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { armorMods, gearItems } from '../content/catalog/gear.js'
import { armorSets } from '../content/catalog/sets.js'
import { acquisitionById } from '../content/acquisition/paths.js'
import { buildArtifactCatalog, buildPlugCatalog, perkDetails as resolvePerks, definition } from '../packages/manifest-catalog/index.js'
import { buildSubclassCatalog } from '../packages/subclass-catalog/index.js'
import { definitionMetadata, plugOptionMetadata } from '../packages/manifest-catalog/item-metadata.js'

const root = new URL('../', import.meta.url)
const manifestDir = new URL('data/manifest/', root)
const catalogDir = new URL('data/catalog/', root)
const publicDir = new URL('web/public/data/', root)

const load = async name => JSON.parse(await readFile(new URL(name, manifestDir), 'utf8'))
const writeJson = async (url, payload) => writeFile(url, `${JSON.stringify(payload, null, 2)}\n`)
const clean = value => String(value || '').trim()
const normalizeName = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/gi, '').toLowerCase()

const inventorySnapshot = await load('DestinyInventoryItemDefinition.json')
const inventory = inventorySnapshot.data || {}
const artifactSnapshot = await load('DestinyArtifactDefinition.json')
const artifacts = artifactSnapshot.data || {}
const statSnapshot = await load('DestinyStatDefinition.json')
const statDefinitions = statSnapshot.data || {}
const statNames = Object.fromEntries(Object.entries(statDefinitions).map(([hash, item]) => [String(hash), clean(item.displayProperties?.name)]).filter(([, name]) => name))
const localeSnapshot = await load(new URL('../catalog/manifest-locales-zh-chs.json', manifestDir))
const inventoryZh = localeSnapshot.items || {}
const perksZh = localeSnapshot.perks || {}
const vendorsZh = localeSnapshot.vendors || {}
const categorySnapshot = await load('DestinyItemCategoryDefinition.json')
const categories = categorySnapshot.data || {}
const equipmentSlotSnapshot = await load('DestinyEquipmentSlotDefinition.json')
const equipmentSlots = equipmentSlotSnapshot.data || {}
const perkSnapshot = await load('DestinySandboxPerkDefinition.json')
const perks = perkSnapshot.data || {}
const plugSetSnapshot = await load('DestinyPlugSetDefinition.json')
const plugSets = plugSetSnapshot.data || {}
const socketCategorySnapshot = await load('DestinySocketCategoryDefinition.json')
const socketCategories = socketCategorySnapshot.data || {}
const socketTypeSnapshot = await load('DestinySocketTypeDefinition.json')
const socketTypes = socketTypeSnapshot.data || {}
const vendorSnapshot = await load('DestinyVendorDefinition.json')
const vendors = vendorSnapshot.data || {}
const activitySnapshot = await load('DestinyActivityDefinition.json')
const activities = activitySnapshot.data || {}
const activitiesZh = localeSnapshot.activities || {}
const equipableSetSnapshot = await load('DestinyEquipableItemSetDefinition.json')
const equipableSets = equipableSetSnapshot.data || {}
for (const source of [artifactSnapshot, statSnapshot, localeSnapshot, categorySnapshot, equipmentSlotSnapshot, perkSnapshot, plugSetSnapshot, socketCategorySnapshot, socketTypeSnapshot, vendorSnapshot, activitySnapshot, equipableSetSnapshot]) {
  if (source.manifestVersion && source.manifestVersion !== inventorySnapshot.manifestVersion) {
    throw new Error('Manifest 组件版本不一致，请完整运行 npm run manifest:sync:knowledge 后重试；拒绝混合旧技能池与新定义。')
  }
}

const categoryName = hash => clean(categories[String(hash)]?.displayProperties?.name)
const categoryNames = hashes => (hashes || []).map(categoryName).filter(Boolean)
const socketCategoryName = hash => clean(socketCategories[String(hash)]?.displayProperties?.name)
const socketTypeCategoryHash = hash => socketTypes[String(hash)]?.socketCategoryHash || null
const weaponFamilies = new Set([
  'Auto Rifle', 'Hand Cannon', 'Pulse Rifle', 'Scout Rifle', 'Fusion Rifle', 'Sniper Rifle',
  'Shotgun', 'Machine Gun', 'Rocket Launcher', 'Sidearm', 'Sword', 'Grenade Launchers',
  'Linear Fusion Rifles', 'Trace Rifles', 'Bows', 'Glaives', 'Submachine Guns'
])
const classNames = { 0: 'titan', 1: 'hunter', 2: 'warlock' }
const armorSlotNames = { 45: 'helmet', 46: 'arms', 47: 'chest', 48: 'legs', 49: 'classItem' }
const plugSetByHash = new Map(Object.entries(plugSets).map(([hash, set]) => [Number(hash), set]))
const itemName = hash => clean(inventory[String(hash)]?.displayProperties?.name)
const itemNameZh = hash => clean(inventoryZh[String(hash)]?.name)
const itemDescriptionZh = hash => inventoryZh[String(hash)]?.description || ''
const perkNameZh = hash => clean(perksZh[String(hash)]?.name)
const perkDescriptionZh = hash => perksZh[String(hash)]?.description || ''
const socketPlugHashes = socket => [...new Set([socket.singleInitialItemHash, ...(socket.reusablePlugItems || []).map(item => item.plugItemHash), ...[socket.reusablePlugSetHash, socket.randomizedPlugSetHash].flatMap(hash => (plugSetByHash.get(hash)?.reusablePlugItems || []).map(item => item.plugItemHash))].filter(Boolean))]
const vendorSourcesByItem = new Map()
const activitySourcesByItem = new Map()
const vendorEntries = []
for (const [hash, vendor] of Object.entries(vendors)) {
  if (vendor.enabled === false || vendor.visible === false) continue
  for (const sale of vendor.itemList || []) {
    if (!sale.itemHash) continue
    const entry = {
      vendorHash: Number(hash),
      vendorName: clean(vendor.displayProperties?.name) || `Vendor ${hash}`,
      vendorNameZh: vendorsZh[hash]?.name || null,
      vendorIdentifier: clean(vendor.vendorIdentifier) || null,
      itemHash: Number(sale.itemHash),
      vendorItemIndex: sale.vendorItemIndex,
      category: clean(sale.displayCategory) || null,
      categoryIndex: sale.categoryIndex ?? null,
      quantity: sale.quantity || 1,
      currencies: (sale.currencies || []).map(currency => ({ itemHash: currency.itemHash || null, quantity: currency.quantity || null }))
    }
    vendorEntries.push(entry)
    const sources = vendorSourcesByItem.get(entry.itemHash) || []
    sources.push(entry)
    vendorSourcesByItem.set(entry.itemHash, sources)
  }
}
const activityRewardEntries = []
for (const [hash, activity] of Object.entries(activities)) {
  if (activity.redacted || activity.blacklisted) continue
  const activityName = clean(activity.displayProperties?.name)
  if (!activityName) continue
  for (const [rewardIndex, reward] of (activity.rewards || []).entries()) {
    for (const [itemIndex, rewardItem] of (reward.rewardItems || []).entries()) {
      if (!rewardItem.itemHash) continue
      const entry = {
        activityHash: Number(hash),
        activityName,
        activityNameZh: activitiesZh[hash]?.name || null,
        rewardIndex,
        itemIndex,
        itemHash: Number(rewardItem.itemHash),
        quantity: rewardItem.quantity || 0,
        conditional: Boolean(rewardItem.hasConditionalVisibility),
        rewardText: reward.rewardText || ''
      }
      activityRewardEntries.push(entry)
      const sources = activitySourcesByItem.get(entry.itemHash) || []
      sources.push(entry)
      activitySourcesByItem.set(entry.itemHash, sources)
    }
  }
}
const equipment = Object.entries(inventory).map(([hash, item]) => {
  const itemCategories = item.itemCategoryHashes || []
  const names = categoryNames(itemCategories)
  const weaponFamily = names.find(name => weaponFamilies.has(name)) || null
  const armorCategory = itemCategories.find(category => armorSlotNames[category])
  const equipmentSlotHash = item.equippingBlock?.equipmentSlotTypeHash || null
  const socketPools = (item.sockets?.socketEntries || []).map((socket, socketIndex) => {
    const socketCategoryHash = socketTypeCategoryHash(socket.socketTypeHash)
    const socketCategory = socketCategoryName(socketCategoryHash) || null
    const shouldExpand = item.itemType === 3 && /WEAPON PERK/i.test(socketCategory || '')
    const plugItemHashes = shouldExpand ? socketPlugHashes(socket) : []
    const plugTypes = socketPlugHashes(socket).map(hash => inventory[String(hash)]?.itemTypeDisplayName || '')
    const perkColumn = plugTypes.some(t => /Barrel|Bowstring|Blade/.test(t)) ? 'barrel'
      : plugTypes.some(t => /Magazine|Arrow|Guard/.test(t)) ? 'magazine'
      : plugTypes.some(t => /Origin Trait/.test(t)) ? 'origin'
      : plugTypes.some(t => t === 'Trait') && socketIndex === 3 ? 'trait1'
      : plugTypes.some(t => t === 'Trait') && socketIndex === 4 ? 'trait2' : null
    return {
      perkColumn,
      socketIndex,
      // Keep only real armor-mod candidates here. Cosmetic plug sets can contain
      // thousands of entries; their references remain available without expansion.
      allowedPlugHashes: item.itemType === 2 ? [...new Set([socket.singleInitialItemHash, ...(socket.reusablePlugItems || []).map(p => p.plugItemHash)])].filter(hash => {
        const plug = inventory[String(hash)]?.plug
        return plug?.plugCategoryIdentifier?.startsWith('enhancements.') && Number.isFinite(plug.energyCost?.energyCost)
      }) : [],
      randomizedPlugSetHash: socket.randomizedPlugSetHash || null,
      socketTypeHash: socket.socketTypeHash || null,
      socketCategoryHash,
      socketCategory,
      initialItemHash: socket.singleInitialItemHash || null,
      plugSetHash: socket.reusablePlugSetHash || null,
      plugItemCount: socketPlugHashes(socket).length,
      plugItemHashes,
      plugOptions: shouldExpand ? [socket.reusablePlugSetHash, socket.randomizedPlugSetHash].filter(Boolean).flatMap(setHash =>
        (plugSetByHash.get(setHash)?.reusablePlugItems || []).map(plugOptionMetadata).filter(entry => entry.craftingRequirements || entry.currentlyCanRoll === false).map(entry => ({ ...entry, plugSetHash: setHash,
          source: setHash === socket.randomizedPlugSetHash ? 'randomized' : 'reusable' }))) : [],
      plugNames: plugItemHashes.map(itemName),
      plugNamesZh: plugItemHashes.map(itemNameZh)
    }
  })
  const weaponPerkSockets = socketPools.filter(socket => /WEAPON PERK/i.test(socket.socketCategory || ''))
  const baseStats = item.stats?.stats || {}
  const statValues = Object.fromEntries(Object.entries(baseStats).map(([hash, value]) => [statNames[hash] || hash, value.value]).filter(([, value]) => Number.isFinite(value)))
  return {
    hash: Number(hash),
    name: clean(item.displayProperties?.name),
    ...definitionMetadata(item, inventory, inventoryZh[hash]),
    nameZh: itemNameZh(hash) || null,
    description: item.displayProperties?.description || '',
    descriptionZh: itemDescriptionZh(hash) || null,
    icon: item.displayProperties?.icon || null,
    iconWatermark: item.iconWatermark || item.quality?.displayVersionWatermarkIcons?.[item.quality?.currentVersion || 0] || null,
    itemType: item.itemType || 0,
    itemSubType: item.itemSubType || 0,
    classType: item.classType ?? 3,
    classId: classNames[item.classType] || null,
    equipmentSlotHash,
    equipmentSlotName: clean(equipmentSlots[String(equipmentSlotHash)]?.displayProperties?.name) || null,
    armorSlot: armorCategory ? armorSlotNames[armorCategory] : null,
    weaponFamily,
    ammoSlot: itemCategories.includes(2) ? 'kinetic' : itemCategories.includes(3) ? 'energy' : itemCategories.includes(4) ? 'power' : null,
    damageType: item.defaultDamageType || 0,
    categoryHashes: itemCategories,
    categoryNames: names,
    tierTypeHash: item.inventory?.tierTypeHash || null,
    collectibleHash: item.collectibleHash || null,
    sourceHash: item.sourceData?.sourceHash || null,
    vendorSources: (vendorSourcesByItem.get(Number(hash)) || []),
    activitySources: (activitySourcesByItem.get(Number(hash)) || []),
    socketCount: item.sockets?.socketEntries?.length || 0,
    reusablePlugSetHashes: (item.sockets?.socketEntries || []).map(socket => socket.reusablePlugSetHash).filter(Boolean),
    socketPools,
    baseStats: statValues,
    baseStatsByHash: baseStats,
    perkOptions: [...new Set(weaponPerkSockets.flatMap(socket => socket.plugNames))].filter(name => !/^Empty /.test(name)),
    perkOptionsZh: [...new Set(weaponPerkSockets.flatMap(socket => socket.plugNamesZh))].filter(Boolean),
    redacted: Boolean(item.redacted),
    blacklisted: Boolean(item.blacklisted)
  }
}).filter(item => item.name && !item.redacted && !item.blacklisted && [2, 3].includes(item.itemType))

const subclassCatalog = buildSubclassCatalog({
  inventory, plugSets, perks, inventoryZh, perksZh,
  verifiedAt: inventorySnapshot.syncedAt?.slice(0, 10)
})
const abilityDefinitions = subclassCatalog.definitions

const mods = Object.entries(inventory).map(([hash, item]) => {
  const identifier = clean(item.plug?.plugCategoryIdentifier)
  const displayName = clean(item.displayProperties?.name)
  const isStatMod = identifier === 'mods' && /Enhancement Mod$/i.test(displayName)
  if ((!identifier.startsWith('enhancements.') && !isStatMod) || !displayName || item.redacted || item.blacklisted) return null
  const perkDetails = resolvePerks(item, perks, perksZh)
  const suffix = identifier.split('.').at(-1) || ''
  const slot = suffix.includes('head') ? 'helmet' : suffix.includes('arms') ? 'arms' : suffix.includes('chest') ? 'chest' : suffix.includes('legs') ? 'legs' : suffix.includes('class_item') ? 'classItem' : suffix.includes('artifact') ? 'artifact' : 'any'
  return {
    hash: Number(hash),
    name: displayName,
    ...definitionMetadata(item, inventory, inventoryZh[hash]),
    nameZh: itemNameZh(hash) || null,
    description: item.displayProperties?.description || '',
    descriptionZh: itemDescriptionZh(hash) || null,
    icon: item.displayProperties?.icon || null,
    category: identifier,
    slot,
    energyCost: item.plug?.energyCost?.energyCost ?? null,
    energyTypeHash: item.plug?.energyCost?.energyTypeHash || null,
    perkDetails,
    sourceItemHash: item.acquireRewardSiteHash || null,
    redacted: Boolean(item.redacted),
    blacklisted: Boolean(item.blacklisted)
  }
}).filter(Boolean)

const artifactEntries = buildArtifactCatalog({ inventory, artifacts, plugSets, perks, locales: localeSnapshot })
const allPlugs = buildPlugCatalog({ inventory, perks, locales: localeSnapshot })

const plugSetEntries = Object.entries(plugSets).map(([hash, set]) => ({
  hash: Number(hash),
  plugItemHashes: (set.reusablePlugItems || []).map(item => item.plugItemHash).filter(Boolean),
  reusablePlugItems: (set.reusablePlugItems || []).map(plugOptionMetadata),
  isFakePlugSet: Boolean(set.isFakePlugSet),
  redacted: Boolean(set.redacted),
  blacklisted: Boolean(set.blacklisted)
})).filter(item => !item.redacted && !item.blacklisted)

const header = source => ({ manifestVersion: source.manifestVersion, syncedAt: source.syncedAt, sourceComponent: source.component })
await mkdir(catalogDir, { recursive: true })
await mkdir(publicDir, { recursive: true })
const equipmentPayload = { ...header(inventorySnapshot), count: equipment.length, items: equipment }
const abilityPayload = { ...header(inventorySnapshot), count: abilityDefinitions.length, items: abilityDefinitions }
const subclassPayload = {
  ...header(inventorySnapshot), sourceComponents: ['DestinyInventoryItemDefinition', 'DestinyPlugSetDefinition', 'DestinySandboxPerkDefinition'],
  count: subclassCatalog.subclasses.length, skillCount: subclassCatalog.skills.length,
  subclasses: subclassCatalog.subclasses, skills: subclassCatalog.skills
}
await writeJson(new URL('manifest-subclasses.json', catalogDir), subclassPayload)
await writeJson(new URL('manifest-subclasses.json', publicDir), subclassPayload)
const equipmentCatalogPayload = {
  ...header(inventorySnapshot),
  count: equipment.length,
  items: equipment.map(item => ({
    hash: item.hash, name: item.name, nameZh: item.nameZh, description: item.description, descriptionZh: item.descriptionZh, icon: item.icon, itemType: item.itemType, itemSubType: item.itemSubType,
    versionInfo: item.versionInfo, typeName: item.typeName, definitionState: item.definitionState, availabilityStatus: item.availabilityStatus,
    insertionRules: item.insertionRules, enabledRules: item.enabledRules, tooltipNotifications: item.tooltipNotifications,
    equipRequirements: item.equipRequirements,
    classId: item.classId, armorSlot: item.armorSlot, weaponFamily: item.weaponFamily, ammoSlot: item.ammoSlot,
    damageType: item.damageType, perkSockets: item.socketPools.filter(s => s.plugItemHashes.length).map(s => ({ socketIndex: s.socketIndex, perkColumn: s.perkColumn, plugItemHashes: s.plugItemHashes, plugOptions: s.plugOptions })), perkOptions: item.perkOptions, perkOptionsZh: item.perkOptionsZh,
    vendorSources: item.vendorSources.map(source => ({ vendorHash: source.vendorHash, vendorName: source.vendorName, vendorNameZh: source.vendorNameZh, itemHash: source.itemHash })),
    activitySources: item.activitySources.map(source => ({ activityHash: source.activityHash, activityName: source.activityName, activityNameZh: source.activityNameZh, itemHash: source.itemHash }))
  }))
}
const modsPayload = { ...header(inventorySnapshot), count: mods.length, items: mods }
const artifactPayload = { ...header(inventorySnapshot), sourceComponents: ['DestinyInventoryItemDefinition', 'DestinyArtifactDefinition', 'DestinyPlugSetDefinition', 'DestinySandboxPerkDefinition'], schemaVersion: 2, count: artifactEntries.length, selectableCount: artifactEntries.filter(a => a.selectable).length, items: artifactEntries }
const modsByNormalizedName = new Map()
for (const mod of mods) {
  const key = normalizeName(mod.name)
  if (!key) continue
  const values = modsByNormalizedName.get(key) || []
  values.push(mod)
  modsByNormalizedName.set(key, values)
}
const curatedModLinks = armorMods.map(mod => {
  const englishName = mod.en || ({
    'stat-health': 'Health Mod', 'stat-melee': 'Melee Mod', 'stat-grenade': 'Grenade Mod', 'stat-class': 'Class Mod', 'stat-super': 'Super Mod', 'stat-weapons': 'Weapons Mod',
    'hands-on': 'Hands-On', 'ashes-to-assets': 'Ashes to Assets', 'heavy-ammo-finder': 'Heavy Ammo Finder', 'heavy-ammo-scout': 'Heavy Ammo Scout',
    'heavy-handed': 'Heavy Handed', firepower: 'Firepower', 'impact-induction': 'Impact Induction', 'focusing-strike': 'Focusing Strike',
    'concussive-dampener': 'Concussive Dampener', 'melee-damage-resistance': 'Melee Damage Resistance', 'sniper-damage-resistance': 'Sniper Damage Resistance',
    recuperation: 'Recuperation', 'better-already': 'Better Already', 'solar-weapon-surge': 'Solar Weapon Surge', 'void-weapon-surge': 'Void Weapon Surge',
    'special-finisher': 'Special Finisher', 'powerful-attraction': 'Powerful Attraction', reaper: 'Reaper', bomber: 'Bomber'
  }[mod.id] || mod.name)
  const aliases = {
    'stat-health': 'Minor Health Mod',
    'stat-melee': 'Minor Melee Mod',
    'stat-grenade': 'Minor Grenade Mod',
    'stat-class': 'Minor Class Mod',
    'stat-super': 'Minor Super Mod',
    'stat-weapons': 'Minor Weapons Mod'
  }
  const candidates = modsByNormalizedName.get(normalizeName(englishName)) || modsByNormalizedName.get(normalizeName(aliases[mod.id])) || []
  const primary = [...candidates].sort((a, b) => Number(b.energyCost === mod.cost) - Number(a.energyCost === mod.cost))[0] || null
  return {
    id: mod.id, name: mod.name, englishName, matched: candidates.length > 0,
    manifestVersion: inventorySnapshot.manifestVersion, manifestHashes: candidates.map(item => item.hash), primaryHash: primary?.hash || null,
    declared: { slot: mod.slot, energyCost: mod.cost, effect: mod.effect || null, stat: mod.stat || null, value: mod.value || null },
    official: primary ? { slot: primary.slot, energyCost: primary.energyCost, description: primary.description, perkDetails: primary.perkDetails } : null,
    consistent: Boolean(primary && (primary.slot === mod.slot || mod.slot === 'any') && (primary.energyCost == null || primary.energyCost === mod.cost))
  }
})
const curatedModLinksPayload = { ...header(inventorySnapshot), count: curatedModLinks.length, matched: curatedModLinks.filter(item => item.matched).length, consistent: curatedModLinks.filter(item => item.consistent).length, items: curatedModLinks }
const plugSetsPayload = { ...header(plugSetSnapshot), count: plugSetEntries.length, sets: plugSetEntries }
const vendorPayload = { ...header(vendorSnapshot), count: vendorEntries.length, vendorCount: new Set(vendorEntries.map(item => item.vendorHash)).size, entries: vendorEntries }
const activityRewardPayload = { ...header(activitySnapshot), count: activityRewardEntries.length, activityCount: new Set(activityRewardEntries.map(item => item.activityHash)).size, entries: activityRewardEntries }
const equipableSetEntries = Object.entries(equipableSets).map(([hash, set]) => ({
  hash: Number(hash),
  name: clean(set.displayProperties?.name),
  nameZh: localeSnapshot.itemSets?.[hash]?.name || null,
  icon: set.displayProperties?.icon || inventory[(set.setItems || [])[0]]?.displayProperties?.icon || null,
  description: set.displayProperties?.description || '',
  descriptionZh: localeSnapshot.itemSets?.[hash]?.description || null,
  itemHashes: (set.setItems || []).filter(Boolean),
  items: (set.setItems || []).map(itemName).filter(Boolean),
  perks: (set.setPerks || []).map(perk => ({ requiredSetCount: perk.requiredSetCount || 0, sandboxPerkHash: perk.sandboxPerkHash || null, name: clean(perks[String(perk.sandboxPerkHash)]?.displayProperties?.name), nameZh: perkNameZh(perk.sandboxPerkHash) || null, description: perks[String(perk.sandboxPerkHash)]?.displayProperties?.description || '', descriptionZh: perkDescriptionZh(perk.sandboxPerkHash) || null })).filter(perk => perk.sandboxPerkHash),
  redacted: Boolean(set.redacted),
  blacklisted: Boolean(set.blacklisted)
})).filter(set => set.name && !set.redacted && !set.blacklisted)
const equipableSetPayload = { ...header(equipableSetSnapshot), count: equipableSetEntries.length, sets: equipableSetEntries }
const equipmentByName = new Map()
const equipmentByNormalizedName = new Map()
for (const item of equipment) {
  const values = equipmentByName.get(item.name) || []
  values.push(item)
  equipmentByName.set(item.name, values)
  const normalized = normalizeName(item.name)
  if (normalized) {
    const normalizedValues = equipmentByNormalizedName.get(normalized) || []
    normalizedValues.push(item)
    equipmentByNormalizedName.set(normalized, normalizedValues)
  }
}
const curatedAcquisition = gearItems.map(gear => {
  const exactVariants = equipmentByName.get(gear.en) || []
  const variants = exactVariants.length ? exactVariants : equipmentByNormalizedName.get(normalizeName(gear.en)) || []
  const vendorSources = [...new Map(variants.flatMap(item => item.vendorSources).map(source => [`${source.vendorHash}:${source.itemHash}`, source])).values()]
  const activitySources = [...new Map(variants.flatMap(item => item.activitySources).map(source => [`${source.activityHash}:${source.itemHash}`, source])).values()]
  const perkOptions = [...new Set(variants.flatMap(item => item.perkOptions || []))]
  const primary = [...variants].sort((a, b) => Number(b.itemType === 3 || b.itemType === 2) - Number(a.itemType === 3 || a.itemType === 2))[0] || null
  return { id: gear.id, name: gear.name, englishName: gear.en, matched: variants.length > 0, matchReason: exactVariants.length ? 'exact-name' : variants.length ? 'normalized-name' : 'not-found-in-manifest', manifestHashes: variants.map(item => item.hash), primaryHash: primary?.hash || null, weaponFamily: primary?.weaponFamily || null, armorSlot: primary?.armorSlot || null, perkOptions, vendorSources, activitySources }
})
const setAcquisition = armorSets.map(set => ({
  id: set.id,
  name: set.name,
  englishName: set.en,
  kind: 'armorSet',
  acquisitionId: set.acquisitionId,
  path: acquisitionById[set.acquisitionId] || null,
  matched: equipableSetEntries.some(item => normalizeName(item.name) === normalizeName(set.en)),
  sourceIds: set.sourceIds || []
}))
const curatedAcquisitionPayload = { ...header(inventorySnapshot), count: curatedAcquisition.length, matched: curatedAcquisition.filter(item => item.matched).length, items: curatedAcquisition }
const acquisitionSourcesPayload = {
  ...header(inventorySnapshot),
  count: curatedAcquisition.length + setAcquisition.length,
  items: [
    ...curatedAcquisition.map(item => ({ ...item, kind: 'gear', path: acquisitionById[gearItems.find(gear => gear.id === item.id)?.acquisitionId] || null })),
    ...setAcquisition
  ],
  note: '官方 Manifest 候选与本站编辑获取路径的统一视图；活动奖励候选不等同于精确遭遇战掉落。'
}
const rewardMappingSnapshot = await load('DestinyRewardMappingDefinition.json')
if (Object.values(rewardMappingSnapshot.data).some(r => r.mappingHash)) throw new Error('RewardMapping 已出现非空映射，请更新解析器，拒绝继续宣称空映射。')
const dropPayload = {
  ...header(inventorySnapshot),
  count: equipment.length,
  withSourceHash: equipment.filter(item => item.sourceHash).length,
  withVendorSource: equipment.filter(item => item.vendorSources.length).length,
  withActivityReward: equipment.filter(item => item.activitySources.length).length,
  activityRewardEdges: activityRewardEntries.length,
  withRewardMapping: 0,
  status: 'activity-rewards-available-reward-mapping-empty',
  note: '已从 DestinyActivityDefinition.rewards 建立活动奖励候选；RewardMappingDefinition 仍只有空壳映射哈希，无法推导更细的遭遇战、轮换或条件概率。'
}
for (const [name, payload] of [['manifest-equipment-rich.json', equipmentPayload], ['manifest-equipment-catalog.json', equipmentCatalogPayload], ['manifest-abilities.json', abilityPayload], ['manifest-mods.json', modsPayload], ['manifest-artifact.json', artifactPayload], ['manifest-plugs.json', { ...header(inventorySnapshot), count: allPlugs.length, items: allPlugs }], ['curated-mod-links.json', curatedModLinksPayload], ['manifest-plugsets.json', plugSetsPayload], ['manifest-vendor-inventory.json', vendorPayload], ['manifest-activity-rewards.json', activityRewardPayload], ['manifest-item-sets.json', equipableSetPayload], ['curated-acquisition-index.json', curatedAcquisitionPayload], ['acquisition-sources.json', acquisitionSourcesPayload], ['manifest-drop-coverage.json', dropPayload]]) {
  await writeJson(new URL(name, catalogDir), payload)
  await writeJson(new URL(name, publicDir), payload)
}

try {
  const statusUrl = new URL('manifest-status.json', publicDir)
  const status = JSON.parse(await readFile(statusUrl, 'utf8'))
  const generated = [
    { component: 'manifest-equipment-rich', count: equipment.length },
    { component: 'manifest-equipment-catalog', count: equipment.length },
    { component: 'manifest-abilities', count: abilityDefinitions.length },
    { component: 'manifest-subclasses', count: subclassCatalog.subclasses.length },
    { component: 'manifest-mods', count: mods.length },
    { component: 'manifest-artifact', count: artifactEntries.length },
    { component: 'curated-mod-links', count: curatedModLinks.filter(item => item.matched).length },
    { component: 'manifest-plugsets', count: plugSetEntries.length },
    { component: 'manifest-vendor-inventory', count: vendorEntries.length },
    { component: 'manifest-activity-rewards', count: activityRewardEntries.length },
    { component: 'manifest-item-sets', count: equipableSetEntries.length },
    { component: 'curated-acquisition-index', count: curatedAcquisition.filter(item => item.matched).length },
    { component: 'acquisition-sources', count: acquisitionSourcesPayload.count },
    { component: 'manifest-drop-coverage', count: 0 }
  ]
  const components = [...(status.components || []).filter(item => !generated.some(next => next.component === item.component)), ...generated]
  await writeJson(statusUrl, { ...status, components })
} catch {
  // Status is optional when running this script before the first sync.
}

console.log(`已生成装备语义索引：${equipment.length} 条；模组：${mods.length} 条；PlugSet：${plugSetEntries.length} 条`)

// Small reference types are published in full (including unnamed public hashes).
const references = { classes: 'DestinyClassDefinition', damageTypes: 'DestinyDamageTypeDefinition', stats: 'DestinyStatDefinition', activityTypes: 'DestinyActivityTypeDefinition', itemCategories: 'DestinyItemCategoryDefinition', equipmentSlots: 'DestinyEquipmentSlotDefinition', socketCategories: 'DestinySocketCategoryDefinition', socketTypes: 'DestinySocketTypeDefinition' }
const referenceItems = []
for (const [key, component] of Object.entries(references)) {
  const source = await load(component + '.json')
  if (source.manifestVersion !== inventorySnapshot.manifestVersion) throw new Error('Reference version mismatch: ' + component)
  referenceItems.push(...Object.entries(source.data).filter(([, i]) => !i.redacted && !i.blacklisted).map(([hash, i]) => ({ ...definition(hash, i, localeSnapshot[key]?.[hash]), sourceComponent: component, kind: key, raw: i })))
}
for (const dir of [catalogDir, publicDir]) await writeJson(new URL('manifest-references.json', dir), { ...header(inventorySnapshot), count: referenceItems.length, items: referenceItems })

// Keep the lightweight armor page projection in sync with every normalization.
const { generateArmorCatalog } = await import('./generate-armor-catalog.js')
await generateArmorCatalog()
