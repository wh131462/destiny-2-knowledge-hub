import { armorLabels, weaponSlots, targetErrors, modErrors, artifactErrors, fragmentCapacity } from './index.js'

// The editor and publication job use the same rules and the same catalog shape.
export function validateLoadout(d, context) {
  const { subclasses, abilities, aspects, facets, fragments, equipment, mods, artifacts, manifestAbilities, plugSets } = context
  const subclass = subclasses.find(s => s.id === d.subclassId)
  const entity = hash => equipment.find(i => Number(i.hash) === Number(hash))
  const weapon = i => entity(d.weapons[i].manifestHash)
  const armor = slot => entity(d.armor[slot]?.manifestHash)
  const exotic = item => item?.tierTypeHash === 2759499571
  const errors = [...targetErrors(d.statRecommendations)]
  const artifact = artifacts.find(a => Number(a.hash) === Number(d.artifactHash))
  if (!subclass || subclass.classId !== d.classId) errors.push('职业与子职业不匹配')
  const slots = [['superId', 'superIds', '超能'], ['classAbilityId', 'classAbilityIds', '职业技能'], ['movementId', 'movementIds', '跳跃'], ['meleeId', 'meleeIds', '近战'], ['grenadeId', 'grenadeIds', '手雷']]
  for (const [key, pool, label] of slots) {
    if (d.abilities[key] && !abilities.some(a => a.id === d.abilities[key] && subclass?.[pool]?.includes(a.id))) errors.push(`${label}不在本站收录的当前子职业池中`)
  }
  const chosen = d.abilities.aspectIds.map(id => aspects.find(a => a.id === id)).filter(Boolean)
  const capacity = chosen.length === 2 ? fragmentCapacity(chosen, subclass, manifestAbilities) : null
  const traitKey = subclass?.type === 'prismatic' ? 'facetIds' : 'fragmentIds'
  for (const [key, pool, max] of [['aspectIds', aspects, 2], [traitKey, traitKey === 'facetIds' ? facets : fragments, capacity]]) {
    const ids = d.abilities[key]
    if (new Set(ids).size !== ids.length) errors.push('星相或碎片不能重复')
    if (ids.some(id => !pool.some(a => a.id === id && subclass?.[key]?.includes(id)))) errors.push('存在不属于当前子职业的星相或碎片')
    if (max != null && ids.length > max) errors.push(`${key === 'aspectIds' ? '星相' : '碎片'}超过当前快照插槽数 ${max}`)
  }
  if (d.abilities[subclass?.type === 'prismatic' ? 'fragmentIds' : 'facetIds'].length) errors.push('普通碎片与棱镜特性不能混用')
  d.weapons.forEach((row, i) => {
    if (row.manifestHash && (!weapon(i) || weapon(i).ammoSlot !== weaponSlots[i])) errors.push(`武器栏 ${i + 1} 的实体或栏位不匹配`)
  })
  if (d.weapons.filter((_, i) => exotic(weapon(i))).length > 1) errors.push('最多推荐同时装备一把异域武器')
  if (Object.keys(armorLabels).filter(s => exotic(armor(s))).length > 1) errors.push('最多推荐同时装备一件异域护甲')
  for (const slot of Object.keys(armorLabels)) {
    const item = armor(slot)
    if (d.armor[slot] && (!item || item.classId !== d.classId || item.armorSlot !== slot)) errors.push(`${armorLabels[slot]}的职业或栏位不匹配`)
    errors.push(...modErrors(item, d.mods[slot], mods, plugSets, { artifact, artifactNodeHashes: d.artifactNodeHashes }).map(e => `${armorLabels[slot]}：${e}`))
    if (slot === 'classItem' && exotic(item) && subclass?.type !== 'prismatic') errors.push('异域职业装备的棱镜专属效果在当前子职业下不生效')
  }
  errors.push(...artifactErrors(artifact, d.artifactNodeHashes, d.artifactAssignments))
  if (d.artifactHash && !artifact) errors.push('所选神器不在当前快照中，请重新选择')
  if (d.ghostArmorerHash && !mods.some(m => m.hash === d.ghostArmorerHash && m.category === 'enhancements.ghosts_economic' && / Armorer$/.test(m.name))) errors.push('所选护甲商不在当前快照中')
  return [...new Set(errors)]
}
