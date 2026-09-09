import { definitionMetadata } from './item-metadata.js'
// Public definitions are not a claim of current acquisition or account unlocks.
export const isPublic = item => Boolean(item?.displayProperties?.name?.trim() && !item.redacted && !item.blacklisted)
export const isArtifactItem = item => item?.equippingBlock?.equipmentSlotTypeHash === 1506418338
export const isReprisedArtifact = item => isArtifactItem(item) && item.equippable && item.preview?.screenStyle === 'screen_style_seasonal_artifact_reprise'
export const isPlaceholder = item => !isPublic(item) || item.plug?.isDummyPlug || /^(Empty|Locked|Deprecated)\b/.test(item.displayProperties.name)

export function definition(hash, item, localized = {}) {
  return { hash: Number(hash), name: item.displayProperties?.name || '', nameZh: localized.name || null,
    description: item.displayProperties?.description || '', descriptionZh: localized.description || null,
    icon: item.displayProperties?.icon || null }
}

export function plugHashes(socket, plugSets) {
  for (const hash of [socket.reusablePlugSetHash, socket.randomizedPlugSetHash].filter(Boolean)) {
    if (!plugSets[hash]) throw new Error(`Missing PlugSet ${hash}`)
  }
  return [...new Set([socket.singleInitialItemHash, ...(socket.reusablePlugItems || []).map(p => p.plugItemHash),
    ...[socket.reusablePlugSetHash, socket.randomizedPlugSetHash].flatMap(h => (plugSets[h]?.reusablePlugItems || []).map(p => p.plugItemHash))].filter(Boolean))]
}

export function perkDetails(item, perks, localized = {}) {
  return (item.perks || []).map(entry => {
    const perk = perks[entry.perkHash]
    if (!perk) throw new Error(`Missing SandboxPerk ${entry.perkHash} on ${item.hash}`)
    return { ...definition(entry.perkHash, perk, localized[entry.perkHash]), visibility: entry.perkVisibility,
      requirement: entry.requirementDisplayString || '' }
  })
}

export function buildPlugCatalog({ inventory, perks, locales }) {
  return Object.entries(inventory).filter(([, i]) => isPublic(i) && i.plug).map(([hash, item]) => ({
    ...definition(hash, item, locales.items?.[hash]), itemType: item.itemType, typeName: item.itemTypeDisplayName,
    category: item.plug.plugCategoryIdentifier, categoryHash: item.plug.plugCategoryHash,
    placeholder: Boolean(isPlaceholder(item)), energyCost: item.plug.energyCost?.energyCost ?? null,
    ...definitionMetadata(item, inventory, locales.items?.[hash]),
    investmentStats: item.investmentStats || [], perkDetails: perkDetails(item, perks, locales.perks)
  }))
}

export function buildArtifactCatalog({ inventory, artifacts, plugSets, perks, locales }) {
  const node = hash => {
    const item = inventory[hash]
    if (!item) throw new Error(`Missing artifact node ${hash}`)
    return { ...definition(hash, item, locales.items?.[hash]), perkDetails: perkDetails(item, perks, locales.perks),
      ...definitionMetadata(item, inventory, locales.items?.[hash]) }
  }
  const reprised = Object.entries(inventory).filter(([, item]) => isPublic(item) && isReprisedArtifact(item)).map(([hash, item]) => {
    const sockets = (item.sockets?.socketEntries || []).map((socket, socketIndex) => {
      const allHashes = plugHashes(socket, plugSets)
      const hashes = allHashes.filter(h => {
        if (!inventory[h]) throw new Error(`Missing artifact plug ${h} on ${hash}`)
        return inventory[h].plug?.plugCategoryIdentifier === 'artifact_perks' && !isPlaceholder(inventory[h])
      })
      return { socketIndex, socketTypeHash: socket.socketTypeHash,
        reusablePlugSetHash: socket.reusablePlugSetHash || null, randomizedPlugSetHash: socket.randomizedPlugSetHash || null,
        initialItemHash: socket.singleInitialItemHash || null, nodeHashes: hashes }
    }).filter(s => s.nodeHashes.length)
    if (!sockets.length) throw new Error(`Reprised artifact ${hash} has no resolved sockets`)
    return { ...definition(hash, item, locales.items?.[hash]), kind: 'reprised', selectable: true,
      availability: 'definition-only', sourceComponent: 'DestinyInventoryItemDefinition', seasonHash: item.seasonHash || null,
      sockets, nodes: [...new Set(sockets.flatMap(s => s.nodeHashes))].map(node), tiers: [],
      selectionLimit: sockets.length, note: '复刻神器：按官方插槽配置；不代表账号已解锁或当前活动允许使用。' }
  })
  // The singleton legacy root is reused by old preview records. Never attach its
  // nodes to historical artifacts by preview.artifactHash or an English name.
  const legacy = Object.entries(artifacts).filter(([, a]) => isPublic(a)).map(([hash, a]) => ({
    ...definition(hash, a, locales.artifacts?.[hash]), kind: 'legacy', selectable: false,
    availability: 'legacy-definition', sourceComponent: 'DestinyArtifactDefinition', sockets: [],
    tiers: (a.tiers || []).map((t, i) => ({ ...t, tierIndex: i + 1, items: t.items.map(n => node(n.itemHash)) })),
    nodes: [...new Set((a.tiers || []).flatMap(t => t.items.map(n => n.itemHash)))].map(node),
    note: '旧赛季节点定义，仅用于查阅和保留旧草稿；不是复刻神器的可选节点。'
  }))
  const historical = Object.entries(inventory).filter(([, i]) => isPublic(i) && isArtifactItem(i) && !isReprisedArtifact(i)).map(([hash, i]) => ({
    ...definition(hash, i, locales.items?.[hash]), kind: 'historical', selectable: false,
    availability: 'historical-definition', sourceComponent: 'DestinyInventoryItemDefinition', seasonHash: i.seasonHash || null,
    sockets: [], tiers: [], nodes: [], note: '历史物品记录；本快照没有提供该版本独立节点树，不借用其他神器节点。'
  }))
  return [...legacy, ...reprised, ...historical]
}

export function compareKeys(expected, actual) {
  const wanted = new Set(expected.map(String)), got = new Set(actual.map(String))
  return { expected: wanted.size, actual: got.size, missing: [...wanted].filter(k => !got.has(k)),
    extra: [...got].filter(k => !wanted.has(k)), duplicates: actual.length - got.size }
}
