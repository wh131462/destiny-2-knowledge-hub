// A recommendation document, never a character inventory or a stat-roll solver.
export const SCHEMA = 'd2hub-manual-loadout-v3'
export const statLabels = { health: '生命值', melee: '近战', grenade: '手雷', class: '职业', super: '超能', weapons: '武器' }
export const armorLabels = { helmet: '头盔', arms: '臂铠', chest: '胸甲', legs: '腿甲', classItem: '职业装备' }
export const weaponSlots = ['kinetic', 'energy', 'power']
export const perkColumns = [
  { key: 'barrel', label: '枪管 / 弓弦 / 刀身' }, { key: 'magazine', label: '弹匣 / 箭矢 / 护手' },
  { key: 'trait1', label: '特性一' }, { key: 'trait2', label: '特性二' },
  { key: 'origin', label: '起源特性' }, { key: 'masterwork', label: '大师之作' }
]
export const alternatives = value => [...new Set((Array.isArray(value) ? value : String(value || '').split(/[／/]/)).map(x => String(x).trim()).filter(Boolean))]
export const emptyPerks = () => Object.fromEntries(perkColumns.map(c => [c.key, []]))
export const MAX_PERK_COMBINATIONS = 20
export const emptyPerkCombination = (id = 'combo-1', name = '组合 1') => ({ id, name, recommendedPerks: emptyPerks(), notes: '' })
export const emptyWeapon = (manifestHash = null) => ({ manifestHash, perkCombinations: [emptyPerkCombination()], notes: '' })
export function updatePerkCombination(weapon, id, changes) {
  return { ...weapon, perkCombinations: weapon.perkCombinations.map(c => c.id === id ? { ...c, ...changes, id } : c) }
}
export function addPerkCombination(weapon, copyId) {
  if (weapon.perkCombinations.length >= MAX_PERK_COMBINATIONS) throw new Error(`最多 ${MAX_PERK_COMBINATIONS} 个 Perk 组合`)
  const source = copyId ? weapon.perkCombinations.find(c => c.id === copyId) : null
  if (copyId && !source) throw new Error('要复制的 Perk 组合不存在')
  let index = 1
  while (weapon.perkCombinations.some(c => c.id === `combo-${index}`)) index++
  const combination = emptyPerkCombination(`combo-${index}`, source ? `${source.name.slice(0, 75)} 副本` : `组合 ${index}`)
  if (source) {
    // Vue rows may be proxies; copy each mutable collection without sharing arrays.
    combination.recommendedPerks = Object.fromEntries(Object.entries(source.recommendedPerks).map(([key, values]) => [key, [...values]]))
    if (source.recommendedPerkHashes) combination.recommendedPerkHashes = Object.fromEntries(Object.entries(source.recommendedPerkHashes).map(([key, hashes]) => [key, [...hashes]]))
    combination.notes = source.notes
  }
  return { ...weapon, perkCombinations: [...weapon.perkCombinations, combination] }
}
export function removePerkCombination(weapon, id) {
  if (weapon.perkCombinations.length <= 1) return weapon
  return { ...weapon, perkCombinations: weapon.perkCombinations.filter(c => c.id !== id) }
}
export function blankDraft() {
  return {
    schema: SCHEMA, name: '我的配装一图流', classId: 'hunter', subclassId: 'hunter-arc', manifestVersion: '',
    abilities: { superId: '', classAbilityId: '', movementId: '', meleeId: '', grenadeId: '', aspectIds: [], facetIds: [], fragmentIds: [] },
    weapons: weaponSlots.map(() => emptyWeapon()),
    armor: Object.fromEntries(Object.keys(armorLabels).map(s => [s, null])),
    mods: Object.fromEntries(Object.keys(armorLabels).map(s => [s, []])),
    statRecommendations: Object.fromEntries(Object.keys(statLabels).map(s => [s, { min: null, max: null }])),
    artifactHash: null, artifactNodeHashes: [], artifactAssignments: [], ghostArmorerHash: null,
    statNotes: '', farmingNotes: '', notes: '', armorNotes: ''
  }
}
export function formatTarget(target) {
  if (typeof target === 'number') return `≥ ${target}`
  if (target?.min != null && target?.max != null) return target.min === target.max ? String(target.min) : `${target.min}–${target.max}`
  if (target?.min != null) return `≥ ${target.min}`
  if (target?.max != null) return `≤ ${target.max}`
  return '无要求'
}
export function targetErrors(targets) {
  const errors = []
  for (const [key, target] of Object.entries(targets || {})) {
    if (!Object.hasOwn(statLabels, key) || !target || typeof target !== 'object') { errors.push('属性建议格式不正确'); continue }
    for (const value of [target.min, target.max]) if (value != null && (!Number.isInteger(value) || value < 0 || value > 200)) errors.push(`${statLabels[key]}建议应在 0–200 之间`)
    if (target.min != null && target.max != null && target.min > target.max) errors.push(`${statLabels[key]}下限不能高于上限`)
  }
  return errors
}
export function isArmorMod(mod) {
  return Boolean(mod && Number.isFinite(mod.energyCost) && !mod.redacted && !mod.blacklisted &&
    !/ghost|artifact/i.test(mod.category || '') && !/^(Empty|Locked|Deprecated)\b/i.test(mod.name || '') &&
    (mod.category || '').startsWith('enhancements.'))
}
const modIndexes = new WeakMap(), plugIndexes = new WeakMap()
const noPlugSets = []
export function armorSockets(armor, mods, plugSets = noPlugSets) {
  if (!modIndexes.has(mods)) modIndexes.set(mods, new Map(mods.filter(isArmorMod).map(m => [Number(m.hash), m])))
  if (!plugIndexes.has(plugSets)) plugIndexes.set(plugSets, new Map(plugSets.map(s => [Number(s.hash), s.plugItemHashes || []])))
  const modByHash = modIndexes.get(mods), sets = plugIndexes.get(plugSets)
  return (armor?.socketPools || []).map((s, i) => ({
    index: s.socketIndex ?? i,
    options: [...new Set([...(s.allowedPlugHashes || []), ...(sets.get(s.plugSetHash) || []), ...(sets.get(s.randomizedPlugSetHash) || [])])].map(h => modByHash.get(Number(h))).filter(Boolean)
  })).filter(s => s.options.length)
}
export function modErrors(armor, assignments, mods, plugSets) {
  const sockets = armorSockets(armor, mods, plugSets)
  const seen = new Set(), errors = []
  let energy = 0
  for (const assignment of assignments || []) {
    if (!assignment?.manifestHash) continue
    const socket = sockets.find(s => s.index === assignment.socketIndex)
    const mod = socket?.options.find(m => Number(m.hash) === Number(assignment.manifestHash))
    if (seen.has(assignment.socketIndex)) errors.push('同一插槽不能放置两个模组')
    seen.add(assignment.socketIndex)
    if (!mod) errors.push('模组与所选护甲插槽不兼容，或能量数据缺失')
    else energy += mod.energyCost
  }
  if (energy > 10) errors.push(`模组能量 ${energy}/10，超过满升级规划容量`)
  return errors
}
// Match old hash-only recommendations to exact sockets, most constrained first.
// Augmenting paths also handle future non-nested socket pools.
export function assignArtifactNodes(artifact, hashes) {
  const slots = artifact?.sockets || [], owners = new Map()
  function place(hash, visited) {
    for (const s of slots) {
      if (visited.has(s.socketIndex) || !s.nodeHashes.includes(Number(hash))) continue
      visited.add(s.socketIndex)
      if (!owners.has(s.socketIndex) || place(owners.get(s.socketIndex), visited)) { owners.set(s.socketIndex, Number(hash)); return true }
    }
    return false
  }
  if (new Set(hashes.map(Number)).size !== hashes.length || !hashes.every(h => place(h, new Set()))) return null
  return [...owners].map(([socketIndex, nodeHash]) => ({ socketIndex, nodeHash })).sort((a, b) => a.socketIndex - b.socketIndex)
}
export function artifactErrors(artifact, hashes, assignments) {
  if (assignments?.length && !hashes?.length) return ['神器插槽有分配但缺少对应节点列表']
  if (!hashes?.length) return []
  if (!artifact) return ['请先选择神器；原节点尚未归属神器']
  const errors = [], selected = new Set(hashes.map(Number))
  if (artifact.selectable === false) errors.push('所选神器为旧定义或历史记录，请选择复刻神器并重新配置节点')
  if (selected.size !== hashes.length) errors.push('神器节点不能重复')
  if (artifact.kind === 'reprised') {
    if (!assignArtifactNodes(artifact, hashes)) errors.push('节点组合无法放入所选神器的官方插槽池')
    if (assignments?.length) {
      if (assignments.length !== hashes.length || new Set(assignments.map(a => a.socketIndex)).size !== assignments.length || new Set(assignments.map(a => a.nodeHash)).size !== assignments.length) errors.push('神器插槽分配数量不一致或重复')
      for (const a of assignments) if (!selected.has(a.nodeHash) || !artifact.sockets.find(s => s.socketIndex === a.socketIndex)?.nodeHashes.includes(a.nodeHash)) errors.push('神器节点不兼容指定插槽')
    }
    return errors
  }
  // Explicit planning limit for this snapshot; do not infer it from tier count.
  if (hashes.length > 12) errors.push('神器节点超过 12 个规划激活位')
  const known = new Set(artifact.tiers.flatMap(t => t.items.map(n => Number(n.hash))))
  if (hashes.some(h => !known.has(Number(h)))) errors.push('包含不属于所选神器的节点')
  let spent = 0
  for (const tier of [...artifact.tiers].sort((a, b) => a.tierIndex - b.tierIndex)) {
    const count = tier.items.filter(n => selected.has(Number(n.hash))).length
    if (count && spent < tier.minimumUnlockPointsUsedRequirement) errors.push(`第 ${tier.tierIndex} 层需要前置层已选 ${tier.minimumUnlockPointsUsedRequirement} 点`)
    // Invalid tiers cannot satisfy a later tier's prerequisites.
    else spent += count
  }
  return errors
}
export function switchArtifact(draft, hash) {
  draft.artifactHash = hash ? Number(hash) : null
  draft.artifactNodeHashes = []
  draft.artifactAssignments = []
}
export function classAbilityAllowed(ability, subclass) {
  if (!ability || !subclass || ability.kind !== 'classAbility' || !ability.classIds.includes(subclass.classId)) return false
  if (subclass.classAbilityIds) return subclass.classAbilityIds.includes(ability.id)
  if (ability.id === 'class-thruster') return ['arc', 'prismatic'].includes(subclass.element)
  if (ability.id === 'class-phoenix-dive') return ['solar', 'prismatic'].includes(subclass.element)
  if (ability.id === 'class-acrobats-dodge') return ['solar', 'prismatic'].includes(subclass.element)
  return true
}
export function aspectDefinition(aspect, subclass, manifestAbilities) {
  if (aspect?.manifestHashesBySubclass && subclass?.id) {
    const hash = aspect.manifestHashesBySubclass[subclass.id]
    return manifestAbilities.find(a => a.hash === hash)
  }
  return manifestAbilities.find(a => a.name === aspect?.en && /Aspect/.test(a.typeName) &&
    a.classId === subclass?.classId && Boolean(/\|.*Ability/.test(a.typeName)) === (subclass?.type === 'prismatic'))
}
export function fragmentCapacity(aspectItems, subclass, manifestAbilities) {
  const counts = aspectItems.map(a => aspectDefinition(a, subclass, manifestAbilities)?.fragmentSlots)
  return counts.some(n => !Number.isInteger(n)) ? null : counts.reduce((a, b) => a + b, 0)
}
export function migrateDraft(input, { artifacts = [], equipment = [], mods = [], plugSets = [] } = {}) {
  if (!input || !['d2hub-manual-loadout-v1', 'd2hub-manual-loadout-v2', SCHEMA].includes(input.schema)) throw new Error('不支持的配装代码版本')
  const draft = blankDraft()
  for (const key of ['name', 'classId', 'subclassId', 'manifestVersion', 'statNotes', 'farmingNotes', 'notes', 'armorNotes']) {
    if (input[key] != null && typeof input[key] !== 'string') throw new Error(`${key} 格式不正确`)
    if (typeof input[key] === 'string') draft[key] = input[key].slice(0, 10000)
  }
  for (const key of ['superId', 'classAbilityId', 'movementId', 'meleeId', 'grenadeId']) draft.abilities[key] = String(input.abilities?.[key] || '')
  for (const key of ['aspectIds', 'facetIds', 'fragmentIds']) {
    const ids = input.abilities?.[key] || []
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) throw new Error('技能列表格式不正确')
    draft.abilities[key] = [...ids]
  }
  if (!Array.isArray(input.weapons) || input.weapons.length > 3) throw new Error('武器栏位格式不正确')
  const hashValue = value => {
    if (value == null || value === '') return null
    if (!Number.isInteger(Number(value)) || Number(value) <= 0) throw new Error('装备 Hash 格式不正确')
    return Number(value)
  }
  input.weapons.forEach((row, i) => {
    draft.weapons[i].manifestHash = hashValue(row?.manifestHash)
    // v2's flat recommendations cannot establish pairings. Preserve them as one
    // group, without zipping alternatives or generating a Cartesian product.
    const combinations = input.schema === SCHEMA ? row?.perkCombinations : [{ ...row, id: 'combo-1', name: '组合 1', notes: '' }]
    if (!Array.isArray(combinations) || !combinations.length || combinations.length > MAX_PERK_COMBINATIONS) throw new Error(`Perk 组合应为 1–${MAX_PERK_COMBINATIONS} 组`)
    const ids = new Set()
    draft.weapons[i].perkCombinations = combinations.map(c => {
      if (!c || typeof c !== 'object' || Array.isArray(c) || typeof c.id !== 'string' || !/^[\w-]{1,64}$/.test(c.id) || ids.has(c.id)) throw new Error('Perk 组合标识格式不正确或重复')
      ids.add(c.id)
      if (typeof c.name !== 'string' || c.name.length > 80 || typeof c.notes !== 'string' || c.notes.length > 10000) throw new Error('Perk 组合名称或备注格式不正确')
      const combo = emptyPerkCombination(c.id, c.name)
      combo.notes = c.notes
      if (c.recommendedPerks != null && (typeof c.recommendedPerks !== 'object' || Array.isArray(c.recommendedPerks))) throw new Error('推荐词条格式不正确')
      const keys = [...new Set([...perkColumns.map(c => c.key), ...Object.keys(c.recommendedPerks || {}).filter(key => /^socket-\d{1,2}$/.test(key))])]
      for (const key of keys) combo.recommendedPerks[key] = alternatives(c.recommendedPerks?.[key])
      if (c.recommendedPerkHashes != null) {
        if (typeof c.recommendedPerkHashes !== 'object' || Array.isArray(c.recommendedPerkHashes)) throw new Error('推荐词条 Hash 格式不正确')
        combo.recommendedPerkHashes = {}
        for (const [key, hashes] of Object.entries(c.recommendedPerkHashes)) {
          if (!perkColumns.some(c => c.key === key) && !/^socket-\d{1,2}$/.test(key)) throw new Error('推荐词条栏目格式不正确')
          if (!Array.isArray(hashes) || hashes.some(h => !Number.isInteger(h) || h <= 0)) throw new Error('推荐词条 Hash 格式不正确')
          combo.recommendedPerkHashes[key] = [...new Set(hashes)]
        }
      }
      return combo
    })
    draft.weapons[i].notes = String(row?.notes || '')
    if (row?.perks?.length) draft.weapons[i].notes += `\n旧版未分栏推荐（请核对栏目）：${alternatives(row.perks).join(' / ')}`
  })
  for (const slot of Object.keys(armorLabels)) {
    const hash = hashValue(input.armor?.[slot]?.manifestHash)
    draft.armor[slot] = hash ? { manifestHash: hash } : null
    const rows = input.mods?.[slot] || []
    if (!Array.isArray(rows)) throw new Error('模组列表格式不正确')
    const sockets = armorSockets(equipment.find(e => Number(e.hash) === hash), mods, plugSets), used = new Set()
    draft.mods[slot] = rows.map(row => {
      const modHash = hashValue(row?.manifestHash)
      let index = row?.socketIndex
      if (input.schema.endsWith('-v1')) index = sockets.find(s => !used.has(s.index) && s.options.some(m => Number(m.hash) === modHash))?.index ?? -1
      if (!Number.isInteger(index)) throw new Error('模组插槽格式不正确')
      used.add(index)
      return { socketIndex: index, manifestHash: modHash }
    })
  }
  if (input.statRecommendations != null) {
    const errors = targetErrors(input.statRecommendations)
    if (errors.length) throw new Error(errors.join('；'))
    for (const key of Object.keys(statLabels)) if (input.statRecommendations[key]) draft.statRecommendations[key] = { min: input.statRecommendations[key].min ?? null, max: input.statRecommendations[key].max ?? null }
  }
  draft.artifactHash = hashValue(input.artifactHash)
  if (!Array.isArray(input.artifactNodeHashes || [])) throw new Error('神器节点格式不正确')
  draft.artifactNodeHashes = (input.artifactNodeHashes || []).map(hashValue)
  if (!Array.isArray(input.artifactAssignments || [])) throw new Error('神器插槽格式不正确')
  draft.artifactAssignments = (input.artifactAssignments || []).map(a => {
    if (!Number.isInteger(a?.socketIndex) || a.socketIndex < 0) throw new Error('神器插槽序号格式不正确')
    return { socketIndex: a.socketIndex, nodeHash: hashValue(a.nodeHash) }
  })
  if (input.schema.endsWith('-v1') && draft.artifactNodeHashes.length) {
    const candidates = artifacts.filter(a => draft.artifactNodeHashes.every(h => a.tiers.some(t => t.items.some(n => Number(n.hash) === h))))
    if (candidates.length === 1) draft.artifactHash = Number(candidates[0].hash)
  }
  draft.ghostArmorerHash = hashValue(input.ghostArmorerHash)
  return draft
}
export function encodeDraft(draft) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft))
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
}
export function decodeDraft(code, context) {
  if (code.length > 250000) throw new Error('配装代码过长')
  const json = code.trim().startsWith('{') ? code : new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(code.trim()), c => c.charCodeAt(0)))
  return migrateDraft(JSON.parse(json), context)
}
