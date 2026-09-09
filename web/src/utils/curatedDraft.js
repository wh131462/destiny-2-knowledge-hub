import { gearById, armorSetById, modById } from '@/data/v2'
import { blankDraft, emptyWeapon, emptyPerks, armorLabels, armorSockets } from '../../../packages/loadout-planner/index.js'

export function recommendedColumns(selection, equipment) {
  const columns = emptyPerks(), unassigned = []
  const gear = gearById[selection.itemId]
  const item = equipment.find(e => Number(e.hash) === Number(gear?.manifestHash))
  for (const perk of selection.perks || []) {
    const pools = item?.socketPools?.filter(s => s.perkColumn && (s.plugNames?.includes(perk) || s.plugNamesZh?.includes(perk))) || []
    const keys = [...new Set(pools.map(s => s.perkColumn))]
    if (keys.length === 1 && columns[keys[0]]) columns[keys[0]].push(perk)
    else unassigned.push(perk)
  }
  return { columns, unassigned }
}

export function curatedDraft(build, { equipment, mods, itemSets, plugSets }) {
  const draft = blankDraft()
  Object.assign(draft, { name: `${build.name} · 副本`, classId: build.classId, subclassId: build.subclassId, manifestVersion: build.manifestVersion })
  draft.abilities = { ...draft.abilities, ...structuredClone(build.abilities) }
  const exotic = gearById[build.exoticArmorId]
  const exoticEntity = equipment.find(i => Number(i.hash) === Number(exotic?.manifestHash))
  const set = itemSets.find(s => Number(s.hash) === Number(armorSetById[build.armorSetId]?.manifestHash))
  for (const slot of Object.keys(armorLabels)) {
    const piece = exoticEntity?.armorSlot === slot ? exoticEntity : equipment.find(e => e.classId === build.classId && e.armorSlot === slot && set?.itemHashes.includes(e.hash))
    if (piece) draft.armor[slot] = { manifestHash: piece.hash }
    const sockets = armorSockets(piece, mods, plugSets), used = new Set()
    for (const id of build.armorMods?.[slot] || []) {
      const curated = modById[id]
      const m = mods.find(m => Number(m.hash) === Number(curated?.manifestHash))
      const socket = sockets.find(s => !used.has(s.index) && s.options.some(option => option.hash === m?.hash))
      if (socket) { draft.mods[slot].push({ socketIndex: socket.index, manifestHash: m.hash }); used.add(socket.index) }
      else draft.armorNotes += `${armorLabels[slot]}推荐 ${curated?.name || id}（请选兼容护甲后配置）；\n`
    }
  }
  draft.armorNotes += `套装建议：${armorSetById[build.armorSetId]?.name || '未指定'}。核心异域：${exotic?.name || '未指定'}。普通护甲只是部位模板，不代表固定掉落属性。`
  draft.weapons = build.weapons.map(w => {
    const { columns, unassigned } = recommendedColumns(w, equipment)
    const weapon = emptyWeapon(gearById[w.itemId]?.manifestHash || null)
    weapon.perkCombinations[0].recommendedPerks = columns
    weapon.notes = `${w.purpose || ''}${unassigned.length ? `\n待分栏推荐：${unassigned.join(' / ')}` : ''}`
    return weapon
  })
  for (const [key, value] of Object.entries(build.targetStats || {})) draft.statRecommendations[key] = { min: value, max: null }
  draft.statNotes = build.statNotes || '目标来自该构筑的编辑建议；随机掉落可通过更换部位、属性模组与调谐调整。'
  draft.notes = [build.goal, ...(build.rotation || []), ...(build.limitations || [])].join('\n')
  return draft
}
