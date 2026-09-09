const classes = ['titan', 'hunter', 'warlock']
const elements = ['solar', 'arc', 'void', 'stasis', 'strand', 'prismatic']
export const skillPoolKeys = {
  super: 'superIds', classAbility: 'classAbilityIds', movement: 'movementIds',
  melee: 'meleeIds', grenade: 'grenadeIds', aspect: 'aspectIds',
  fragment: 'fragmentIds', facet: 'facetIds',
  transcendence: 'transcendenceIds', transcendenceGrenade: 'transcendenceGrenadeIds'
}
const slug = name => name.replace(/[’']/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
export function skillId(name, kind) {
  // Preserve IDs already stored in shared builds and local recommendation drafts.
  const overrides = {
    'super:Silence and Squall': 'super-silence-squall',
    "classAbility:Marksman's Dodge": 'class-marksman-dodge',
    'aspect:Child of the Old Gods': 'aspect-child-of-old-gods',
    'aspect:The Wanderer': 'aspect-wanderer',
    'grenade:Void Wall': 'grenade-voidwall'
  }
  if (overrides[kind + ':' + name]) return overrides[kind + ':' + name]
  if (kind === 'facet') return slug(name.replace('Facet of ', 'facet-'))
  if (kind === 'fragment') return slug(name.replace(/^(Echo|Ember|Spark|Thread) of /, '$1-'))
  const prefix = { classAbility: 'class', transcendenceGrenade: 'transcendence-grenade' }[kind] || kind
  return prefix + '-' + slug(kind === 'grenade' ? name.replace(/ Grenade$/, '') : name)
}
function kindFor(item, prismatic) {
  const suffix = item?.plug?.plugCategoryIdentifier?.split('.').at(-1)
  return {
    class_abilities: 'classAbility', movement: 'movement', supers: 'super',
    melee: 'melee', grenades: 'grenade', aspects: 'aspect', totems: 'aspect',
    fragments: prismatic ? 'facet' : 'fragment', trinkets: 'fragment',
    transcendence: 'transcendence', prism_grenade: 'transcendenceGrenade'
  }[suffix]
}
const usable = item => Boolean(item?.displayProperties?.name && [19, 20].includes(item.itemType) &&
  !item.redacted && !item.blacklisted && !/^(Empty|Locked|Deprecated)\b/.test(item.displayProperties.name))

// Reachable plugs, not a name/type search over the entire inventory. This excludes
// old subclass trees, quest rewards, empty sockets and unselectable ability copies.
export function buildSubclassCatalog({ inventory, plugSets, perks = {}, inventoryZh = {}, perksZh = {}, verifiedAt = '' }) {
  const definitions = new Map(), skills = new Map(), errors = []
  const roots = Object.values(inventory).filter(item => item.itemType === 16 && item.equippable &&
    classes[item.classType] && !item.redacted && !item.blacklisted && item.sockets?.socketEntries?.length)
  const subclasses = roots.map(root => {
    const classId = classes[root.classType]
    const categories = root.sockets.socketEntries.map(s => inventory[s.singleInitialItemHash]?.plug?.plugCategoryIdentifier || '')
    const branch = categories.map(c => c.split('.')[1]).find(c => elements.includes(c) || c === 'prism')
    const element = branch === 'prism' ? 'prismatic' : branch
    if (!element) errors.push('Unknown subclass element: ' + root.hash)
    const id = classId + '-' + element, prismatic = element === 'prismatic'
    const pools = Object.fromEntries(Object.values(skillPoolKeys).map(key => [key, []]))
    const sockets = []
    for (const [index, socket] of root.sockets.socketEntries.entries()) {
      const setHashes = [socket.reusablePlugSetHash, socket.randomizedPlugSetHash].filter(Boolean)
      for (const hash of setHashes) if (!plugSets[hash]) errors.push('Missing plug set: ' + hash + ' for ' + id)
      const hashes = [...new Set([socket.singleInitialItemHash,
        ...(socket.reusablePlugItems || []).map(p => p.plugItemHash),
        ...setHashes.flatMap(hash => (plugSets[hash]?.reusablePlugItems || []).map(p => p.plugItemHash))
      ].filter(Boolean))]
      const candidates = []
      let socketKind = kindFor(inventory[socket.singleInitialItemHash], prismatic)
      for (const hash of hashes) {
        const raw = inventory[hash]
        if (!raw) { errors.push('Missing socket plug: ' + hash + ' for ' + id); continue }
        if (!usable(raw)) continue
        const kind = kindFor(raw, prismatic)
        if (!kind) { errors.push('Unclassified subclass plug: ' + hash + ' for ' + id); continue }
        socketKind ||= kind
        if (socketKind !== kind) { errors.push('Mixed skill kinds in socket: ' + id + ':' + index); continue }
        const name = raw.displayProperties.name, entryId = skillId(name, kind)
        const typeName = raw.itemTypeDisplayName || ''
        const skillElement = /^(Solar|Arc|Void|Stasis|Strand|Prismatic)\b/.exec(typeName)?.[1]?.toLowerCase() ||
          (['classAbility', 'movement'].includes(kind) ? 'neutral' : element)
        // Visibility 1 is conditional/disabled display, not hidden (2). Several
        // live aspects keep their only effect here; a guide must still show it.
        const perkDetails = (raw.perks || []).filter(p => [0, 1].includes(p.perkVisibility)).map(p => ({
          hash: p.perkHash, name: perks[p.perkHash]?.displayProperties?.name || '',
          nameZh: perksZh[p.perkHash]?.name || null,
          description: perks[p.perkHash]?.displayProperties?.description || '',
          descriptionZh: perksZh[p.perkHash]?.description || null, visibility: p.perkVisibility
        })).filter(p => p.description || p.descriptionZh)
        const definition = {
          hash, name, nameZh: inventoryZh[hash]?.name || null,
          description: raw.displayProperties.description || '',
          descriptionZh: inventoryZh[hash]?.description || null,
          icon: raw.displayProperties.icon || null, typeName, kind, element: skillElement,
          classType: raw.classType ?? 3, classId: kind === 'aspect' ? classId : classes[raw.classType] || null,
          plugCategoryIdentifier: raw.plug.plugCategoryIdentifier,
          fragmentSlots: (raw.investmentStats || []).find(s => s.statTypeHash === 2223994109)?.value ?? null,
          itemType: raw.itemType, itemSubType: raw.itemSubType || 0,
          categoryHashes: raw.itemCategoryHashes || [], perkDetails, redacted: false, blacklisted: false
        }
        definitions.set(hash, definition)
        const existing = skills.get(entryId)
        if (existing && (existing.en !== name || existing.kind !== kind)) errors.push('Skill ID collision: ' + entryId)
        const skill = existing || {
          id: entryId, name: definition.nameZh || name, en: name, kind, element: skillElement,
          classIds: [], ...(kind === 'aspect' ? { classId } : {}),
          manifestHash: hash, icon: definition.icon,
          description: perkDetails.map(p => p.descriptionZh || p.description).filter(Boolean).join('\n\n') || definition.descriptionZh || definition.description,
          manifestHashesBySubclass: {}, sourceIds: ['bungie-manifest'], verifiedAt, manifestVerified: true
        }
        if (!skill.classIds.includes(classId)) skill.classIds.push(classId)
        const previousHash = skill.manifestHashesBySubclass[id]
        if (previousHash && previousHash !== hash) errors.push('Ambiguous skill variant: ' + entryId + ' in ' + id)
        skill.manifestHashesBySubclass[id] = hash
        skills.set(entryId, skill)
        if (!pools[skillPoolKeys[kind]].includes(entryId)) pools[skillPoolKeys[kind]].push(entryId)
        candidates.push(hash)
      }
      sockets.push({ index, kind: socketKind || null, socketTypeHash: socket.socketTypeHash, initialHash: socket.singleInitialItemHash || null, inlineHashes: (socket.reusablePlugItems || []).map(p => p.plugItemHash), plugSetHashes: setHashes, hashes: candidates })
    }
    for (const kind of ['super', 'classAbility', 'movement', 'melee', 'grenade', 'aspect', ...(prismatic ? ['facet', 'transcendence', 'transcendenceGrenade'] : ['fragment'])]) {
      if (!pools[skillPoolKeys[kind]].length) errors.push('Empty ' + kind + ' pool: ' + id)
    }
    return {
      id, classId, type: prismatic ? 'prismatic' : 'mono', element,
      name: inventoryZh[root.hash]?.name || root.displayProperties.name, en: root.displayProperties.name,
      manifestHash: root.hash, icon: root.displayProperties.icon,
      ...pools, sockets, sourceIds: ['bungie-manifest'], verifiedAt,
      aspectSocketCount: sockets.filter(s => s.kind === 'aspect').length,
      maxFragmentSockets: sockets.filter(s => ['facet', 'fragment'].includes(s.kind)).length
    }
  }).sort((a, b) => classes.indexOf(a.classId) - classes.indexOf(b.classId) || elements.indexOf(a.element) - elements.indexOf(b.element))
  if (new Set(subclasses.map(s => s.id)).size !== subclasses.length) errors.push('Duplicate active subclass IDs')
  if (errors.length) throw new Error('Subclass catalog incomplete:\n' + errors.join('\n'))
  return { subclasses, skills: [...skills.values()].sort((a, b) => a.id.localeCompare(b.id)), definitions: [...definitions.values()].sort((a, b) => a.hash - b.hash) }
}

export function auditSubclassCoverage({ subclasses, skills, definitions, inventoryItems, plugSets }) {
  const errors = [], rows = []
  const items = new Map(inventoryItems.map(item => [item.hash, item]))
  const sets = new Map(plugSets.map(set => [set.hash, set.plugItemHashes]))
  const skillById = new Map(skills.map(skill => [skill.id, skill]))
  const definitionByHash = new Map(definitions.map(item => [item.hash, item]))
  const allExpected = new Set()
  for (const sub of subclasses) {
    const expectedByKind = new Map(), reachable = new Set()
    for (const socket of sub.sockets) {
      const hashes = [socket.initialHash, ...(socket.inlineHashes || [])]
      for (const hash of socket.plugSetHashes) {
        if (!sets.has(hash)) errors.push(sub.id + ': missing source PlugSet ' + hash)
        hashes.push(...(sets.get(hash) || []))
      }
      for (const hash of new Set(hashes.filter(Boolean))) {
        const item = items.get(hash)
        if (!item) { errors.push(sub.id + ': unresolved source item ' + hash); continue }
        if (![19, 20].includes(item.itemType) || /^(Empty|Locked|Deprecated)\b/.test(item.name)) continue
        allExpected.add(hash); reachable.add(hash)
        const expected = expectedByKind.get(socket.kind) || new Set()
        expected.add(hash); expectedByKind.set(socket.kind, expected)
        if (!socket.hashes.includes(hash)) errors.push(sub.id + ': missing socket option ' + hash)
        const definition = definitionByHash.get(hash)
        if (!definition) errors.push(sub.id + ': missing normalized definition ' + hash)
        else {
          if (!definition.icon || !definition.nameZh) errors.push(sub.id + ': missing image/Chinese name ' + hash)
          if (!definition.descriptionZh && !definition.perkDetails?.some(p => p.descriptionZh)) errors.push(sub.id + ': missing Chinese effect ' + hash)
        }
      }
    }
    const counts = {}
    for (const [kind, key] of Object.entries(skillPoolKeys)) {
      const ids = sub[key] || [], expected = expectedByKind.get(kind) || new Set()
      const actual = new Set(ids.map(id => skillById.get(id)?.manifestHashesBySubclass?.[sub.id]))
      if (ids.length !== new Set(ids).size) errors.push(sub.id + ': duplicate ' + key)
      for (const hash of expected) if (!actual.has(hash)) errors.push(sub.id + ': missing selectable ' + kind + ' ' + hash)
      for (const hash of actual) if (!expected.has(hash)) errors.push(sub.id + ': invalid selectable ' + kind + ' ' + hash)
      counts[kind] = ids.length
    }
    rows.push({ id: sub.id, name: sub.name, ...counts, sourceOptions: reachable.size })
  }
  for (const skill of skills) if (!Object.values(skill.manifestHashesBySubclass || {}).some(hash => allExpected.has(hash))) errors.push('Unreachable catalog skill: ' + skill.id)
  for (const definition of definitions) if (!allExpected.has(definition.hash)) errors.push('Unreachable definition: ' + definition.hash)
  return { status: errors.length ? 'failed' : 'passed', subclasses: subclasses.length, skills: skills.length, definitions: allExpected.size, errors, rows }
}
