// Identity-based links: never merge same-name Manifest variants.
export function entityLocation(item, kind = 'items') {
  if (!item) return null
  const curated = typeof item.id === 'string' && !/^\d+$/.test(item.id)
  const id = curated ? item.id : item.hash ?? item.manifestHash ?? item.itemHash
  if (id == null || id === '') return null
  const targetKind = !curated && !item.hash && item.itemHash ? 'items' : kind
  return { name: 'encyclopedia-entry', params: { kind: curated ? 'curated' : targetKind, id: String(id) } }
}

export function buildReferences(build, entities = {}) {
  const ids = new Set([
    build.subclassId, build.exoticArmorId, build.armorSetId,
    ...(build.weapons || []).map(w => w.itemId),
    ...Object.values(build.abilities || {}).flat(),
    ...Object.values(build.armorMods || {}).flat(), ...(build.exoticClassItemTraits || []),
    ...(build.mechanicIds || []), ...(build.activityIds || [])
  ].filter(value => typeof value === 'string'))
  const hashes = new Set([
    ...[...ids].map(id => entities[id]?.manifestHash),
    ...(build.weapons || []).map(w => w.manifestHash),
    ...(build.weapons || []).flatMap(w => (w.perkCombinations || []).flatMap(combo => Object.values(combo.recommendedPerkHashes || {}).flat())),
    ...Object.values(build.armor || {}).map(a => a?.manifestHash),
    ...Object.values(build.mods || {}).flat().map(m => m?.manifestHash),
    build.artifactHash, ...(build.artifactNodeHashes || []), build.ghostArmorerHash
  ].filter(value => value != null).map(String))
  return { ids, hashes }
}

export function relatedBuilds(item, builds, entities = {}) {
  if (!item) return []
  return builds.filter(build => {
    if ((build.visibility || (build.isTemplateBaseline ? 'private' : 'public')) !== 'public') return false
    const refs = buildReferences(build, entities)
    return (item.id && refs.ids.has(item.id)) || [item.hash, item.manifestHash].some(hash => hash != null && refs.hashes.has(String(hash)))
  })
}

export function entryHistory(item) {
  return (Array.isArray(item?.history) ? item.history : [])
    .filter(change => typeof change.date === 'string' && typeof change.summary === 'string')
    .slice().sort((a, b) => b.date.localeCompare(a.date))
}
