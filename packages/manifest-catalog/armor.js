export const armorSlots = [
  { id: 'helmet', name: '头盔', en: 'Helmet' },
  { id: 'arms', name: '臂甲', en: 'Gauntlets' },
  { id: 'chest', name: '胸甲', en: 'Chest armor' },
  { id: 'legs', name: '腿甲', en: 'Leg armor' },
  { id: 'classItem', name: '职业装备', en: 'Class item' }
]
export const armorClasses = [
  { id: 'titan', name: '泰坦', classItem: '徽记' },
  { id: 'hunter', name: '猎人', classItem: '披风' },
  { id: 'warlock', name: '术士', classItem: '臂环' }
]
export const armorStatNames = ['Health', 'Melee', 'Grenade', 'Class', 'Super', 'Weapons']
const publicItem = item => item && !item.redacted && !item.blacklisted && Boolean(item.name)
const definition = item => ({ hash: item.hash, name: item.name, nameZh: item.nameZh, icon: item.icon, description: item.description, descriptionZh: item.descriptionZh })
const combineDescriptions = values => {
  const unique = [...new Set(values.filter(Boolean))]
  return unique.filter(value => !unique.some(other => other !== value && other.includes(value))).join('\n\n')
}
export const armorName = item => item?.nameZh || item?.name || '未命名'
export const armorDescription = item => item?.descriptionZh || item?.description || ''

// A small, reproducible projection of the official snapshot. Do not infer set
// membership from names: older reissues can have the same name and no bonus.
export function createArmorCatalog({ equipment, sets, plugs, plugSets, mods, references }) {
  const items = equipment.items.filter(item => publicItem(item) && item.itemType === 2)
  const itemHashes = new Set(items.map(item => item.hash))
  const setItems = sets.sets.filter(publicItem).map(set => ({ ...definition(set), itemHashes: set.itemHashes || [], perks: set.perks || [] }))
  const memberships = new Map()
  for (const set of setItems) for (const hash of set.itemHashes) memberships.set(hash, [...(memberships.get(hash) || []), set.hash])
  const plugByHash = new Map(plugs.items.filter(publicItem).map(plug => [plug.hash, plug]))
  const poolByHash = new Map(plugSets.sets.map(pool => [pool.hash, pool.plugItemHashes || []]))
  const referencedPlugs = new Set()
  const armor = items.map(item => {
    const traits = (item.socketPools || []).flatMap(socket => {
      if (socket.socketCategory !== 'ARMOR PERKS') return []
      const hashes = [...new Set([socket.initialItemHash, ...(socket.allowedPlugHashes || []), ...(socket.plugItemHashes || []), ...(poolByHash.get(socket.randomizedPlugSetHash || socket.plugSetHash) || [])])]
        .filter(hash => { const plug = plugByHash.get(hash); return plug && !plug.placeholder && plug.category === 'intrinsics' })
      if (!hashes.length) return []
      hashes.forEach(hash => referencedPlugs.add(hash))
      return [{ socketIndex: socket.socketIndex, hashes, definitionOnly: !socket.randomizedPlugSetHash && !socket.plugSetHash && !(socket.allowedPlugHashes || []).length && !(socket.plugItemHashes || []).length }]
    })
    return { ...definition(item), classId: item.classId, armorSlot: item.armorSlot, tierTypeHash: item.tierTypeHash, iconWatermark: item.iconWatermark,
      setHashes: memberships.get(item.hash) || [], traits, vendorSources: item.vendorSources || [], activitySources: item.activitySources || [] }
  })
  const statItems = armorStatNames.map(name => references.items.find(item => item.kind === 'stats' && item.name === name)).filter(Boolean).map(definition)
  const modItems = mods.items.filter(item => publicItem(item) && !/^(Empty |Deprecated|Default )/i.test(item.name) && (item.energyCost != null || item.perkDetails?.length)).map(item => ({
    ...definition(item), description: combineDescriptions([item.description, ...(item.perkDetails || []).map(p => p.description)]),
    descriptionZh: combineDescriptions([item.descriptionZh || item.description, ...(item.perkDetails || []).map(p => p.descriptionZh || p.description)]),
    slot: item.slot, category: item.category, energyCost: item.energyCost,
    differingPerkNames: (item.perkDetails || []).filter(p => p.name && p.name !== item.name).map(p => p.nameZh || p.name)
  }))
  return { manifestVersion: equipment.manifestVersion, syncedAt: equipment.syncedAt,
    items: armor, sets: setItems, stats: statItems, mods: modItems,
    traits: [...referencedPlugs].map(hash => definition(plugByHash.get(hash))),
    archetypes: plugs.items.filter(item => publicItem(item) && !item.placeholder && item.category === 'armor_archetypes').map(definition),
    unresolvedSetMembers: setItems.flatMap(set => set.itemHashes.filter(hash => !itemHashes.has(hash))) }
}

export function armorGroups(items) {
  const groups = new Map()
  for (const item of items) {
    const key = [item.name, item.classId, item.armorSlot, item.tierTypeHash, [...item.setHashes].sort().join(',')].join('|')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.values()].map(versions => versions.sort((a, b) => b.traits.length - a.traits.length || a.hash - b.hash))
}

// Only occupied, matching class/slot definitions count. A reserved Exotic slot
// never contributes to a legendary set and cannot be allocated twice.
export function armorSetPreview(assignments, sets, items, classId) {
  const byHash = new Map(items.map(item => [item.hash, item]))
  const bySet = new Map(sets.map(set => [String(set.hash), set]))
  let exoticCount = 0
  const counts = new Map()
  const slots = armorSlots.map(slot => {
    const choice = String(assignments[slot.id] || '')
    if (choice === 'exotic') { exoticCount++; return { ...slot, exotic: true, valid: exoticCount === 1 } }
    if (choice.startsWith('exotic:')) {
      exoticCount++
      const item = byHash.get(Number(choice.slice(7)))
      const compatible = item?.tierTypeHash === 2759499571 && item.classId === classId && item.armorSlot === slot.id
      return { ...slot, item: compatible ? item : undefined, exotic: true, valid: compatible && exoticCount === 1 }
    }
    const set = bySet.get(choice)
    const item = set?.itemHashes.map(hash => byHash.get(hash)).find(item => item?.classId === classId && item.armorSlot === slot.id && item.tierTypeHash !== 2759499571)
    if (item) counts.set(set.hash, (counts.get(set.hash) || 0) + 1)
    return { ...slot, item, set, valid: Boolean(item) }
  })
  return { slots, exoticCount, valid: exoticCount <= 1 && slots.every(slot => slot.valid), sets: [...counts].map(([hash, count]) => {
    const set = bySet.get(String(hash))
    return { ...set, count, perks: set.perks.map(perk => ({ ...perk, active: Number(perk.requiredSetCount) > 0 && count >= Number(perk.requiredSetCount) })) }
  }) }
}
