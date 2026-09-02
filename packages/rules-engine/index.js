import { subclassById } from '../../content/catalog/subclasses.js'
import { abilityById } from '../../content/catalog/abilities.js'
import { aspectById } from '../../content/catalog/aspects.js'
import { facetById } from '../../content/catalog/facets.js'
import { fragmentById } from '../../content/catalog/fragments.js'
import { gearById, modById } from '../../content/catalog/gear.js'
import { activityById } from '../../content/catalog/activities.js'
import { acquisitionById } from '../../content/acquisition/paths.js'
import { mechanicById, mechanicInteractions, statModel } from '../../content/mechanics/index.js'
import { MANIFEST_VERSION } from '../../content/meta.js'
import { armorSetById } from '../../content/catalog/sets.js'

export const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
export const stats = ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength']

const addError = (errors, code, message, path) => errors.push({ code, message, path })
const checkUnique = (errors, values, code, message, path) => {
  const seen = new Set()
  for (const [index, value] of (values || []).entries()) {
    if (seen.has(value)) addError(errors, code, `${message}：${value}`, `${path}.${index}`)
    seen.add(value)
  }
}

export function validateBuild(build) {
  const errors = []
  const warnings = []
  const subclass = subclassById[build.subclassId]

  if (build.manifestVersion && build.manifestVersion !== MANIFEST_VERSION) {
    addError(errors, 'MANIFEST_VERSION_MISMATCH', `构筑使用的 Manifest ${build.manifestVersion} 与当前 ${MANIFEST_VERSION} 不一致。`, 'manifestVersion')
  }

  if (!subclass) addError(errors, 'UNKNOWN_SUBCLASS', `未知子职业：${build.subclassId}`, 'subclassId')
  if (subclass && subclass.classId !== build.classId) addError(errors, 'CLASS_SUBCLASS_MISMATCH', '子职业不属于所选职业。', 'subclassId')

  const abilityKinds = { superId: 'super', classAbilityId: 'classAbility', meleeId: 'melee', grenadeId: 'grenade' }
  for (const [key, expectedKind] of Object.entries(abilityKinds)) {
    const id = build.abilities?.[key]
    const item = abilityById[id]
    if (!item) addError(errors, 'UNKNOWN_ABILITY', `未知技能：${id}`, 'abilities')
    else if (!item.classIds.includes(build.classId)) addError(errors, 'ABILITY_CLASS_MISMATCH', `${item.name} 不属于 ${build.classId}。`, 'abilities')
    else if (item.kind !== expectedKind) addError(errors, 'ABILITY_KIND_MISMATCH', `${item.name} 不是${expectedKind}类型技能。`, `abilities.${key}`)
  }

  checkUnique(errors, build.abilities?.aspectIds, 'DUPLICATE_ASPECT', '星相不能重复', 'abilities.aspectIds')
  checkUnique(errors, build.abilities?.facetIds, 'DUPLICATE_FACET', '棱镜特性不能重复', 'abilities.facetIds')
  checkUnique(errors, build.abilities?.fragmentIds, 'DUPLICATE_FRAGMENT', '元素碎片不能重复', 'abilities.fragmentIds')

  if (subclass?.type === 'prismatic') {
    const poolChecks = [
      ['superId', subclass.superIds], ['meleeId', subclass.meleeIds], ['grenadeId', subclass.grenadeIds]
    ]
    for (const [key, pool] of poolChecks) {
      const id = build.abilities?.[key]
      if (id && !pool.includes(id)) addError(errors, 'PRISMATIC_POOL_VIOLATION', `${id} 不在该职业棱镜技能池中。`, `abilities.${key}`)
    }
    for (const id of build.abilities?.aspectIds || []) {
      if (!subclass.aspectIds.includes(id)) addError(errors, 'PRISMATIC_ASPECT_VIOLATION', `${id} 不在该职业棱镜星相池中。`, 'abilities.aspectIds')
    }
    if ((build.abilities?.facetIds || []).length > 5) addError(errors, 'FACET_LIMIT', '当前基准构筑最多配置 5 个棱镜特性。', 'abilities.facetIds')
    if ((build.abilities?.fragmentIds || []).length) addError(errors, 'PRISMATIC_FRAGMENT_MISMATCH', '棱镜构筑应使用棱镜特性，而不是普通元素碎片。', 'abilities.fragmentIds')
  } else if (subclass?.type === 'mono') {
    const selected = [build.abilities?.superId, build.abilities?.meleeId, build.abilities?.grenadeId]
    for (const id of selected) {
      const item = abilityById[id]
      if (item && item.element !== subclass.element) addError(errors, 'MONO_ELEMENT_VIOLATION', `${item.name} 不属于 ${subclass.element} 子职业。`, 'abilities')
    }
    for (const id of build.abilities?.aspectIds || []) {
      const item = aspectById[id]
      if (item && (item.classId !== build.classId || item.element !== subclass.element)) addError(errors, 'MONO_ASPECT_VIOLATION', `${item.name} 不属于该普通子职业。`, 'abilities.aspectIds')
      if (subclass.aspectIds?.length && !subclass.aspectIds.includes(id)) addError(errors, 'MONO_ASPECT_POOL_VIOLATION', `${id} 不在该普通子职业星相池中。`, 'abilities.aspectIds')
    }
    if (subclass.superIds?.length && build.abilities?.superId && !subclass.superIds.includes(build.abilities.superId)) addError(errors, 'MONO_SUPER_POOL_VIOLATION', `${build.abilities.superId} 不在该普通子职业超能池中。`, 'abilities.superId')
    if (subclass.meleeIds?.length && build.abilities?.meleeId && !subclass.meleeIds.includes(build.abilities.meleeId)) addError(errors, 'MONO_MELEE_POOL_VIOLATION', `${build.abilities.meleeId} 不在该普通子职业近战池中。`, 'abilities.meleeId')
    if ((build.abilities?.facetIds || []).length) addError(errors, 'MONO_FACET_MISMATCH', '普通子职业不能装备棱镜特性。', 'abilities.facetIds')
    for (const id of build.abilities?.fragmentIds || []) {
      const item = fragmentById[id]
      if (!item) addError(errors, 'UNKNOWN_FRAGMENT', `未知碎片：${id}`, 'abilities.fragmentIds')
      else if (item.element !== subclass.element) addError(errors, 'MONO_FRAGMENT_VIOLATION', `${item.name} 不属于 ${subclass.element}。`, 'abilities.fragmentIds')
      if (subclass.fragmentIds?.length && !subclass.fragmentIds.includes(id)) addError(errors, 'MONO_FRAGMENT_POOL_VIOLATION', `${id} 不在该普通子职业碎片池中。`, 'abilities.fragmentIds')
    }
    if (subclass.grenadeIds?.length && build.abilities?.grenadeId && !subclass.grenadeIds.includes(build.abilities.grenadeId)) addError(errors, 'MONO_GRENADE_POOL_VIOLATION', `${build.abilities.grenadeId} 不在该普通子职业手雷池中。`, 'abilities.grenadeId')
  }

  if ((build.abilities?.aspectIds || []).length !== 2) addError(errors, 'ASPECT_COUNT', '构筑必须选择两个星相。', 'abilities.aspectIds')
  for (const id of build.abilities?.aspectIds || []) if (!aspectById[id]) addError(errors, 'UNKNOWN_ASPECT', `未知星相：${id}`, 'abilities.aspectIds')
  for (const id of build.abilities?.facetIds || []) if (!facetById[id]) addError(errors, 'UNKNOWN_FACET', `未知棱镜特性：${id}`, 'abilities.facetIds')

  for (const [stat, value] of Object.entries(build.baseStats || {})) {
    if (!stats.includes(stat)) addError(errors, 'UNKNOWN_STAT', `未知属性：${stat}`, `baseStats.${stat}`)
    else if (!Number.isFinite(value) || value < statModel.min || value > statModel.max) addError(errors, 'STAT_OUT_OF_RANGE', `${stat} 基础值必须在 ${statModel.min}-${statModel.max}。`, `baseStats.${stat}`)
  }
  for (const [stat, target] of Object.entries(build.targetStats || {})) {
    if (!stats.includes(stat)) addError(errors, 'UNKNOWN_TARGET_STAT', `未知目标属性：${stat}`, `targetStats.${stat}`)
    else if (!Number.isFinite(target) || target < statModel.min || target > statModel.max) addError(errors, 'TARGET_STAT_OUT_OF_RANGE', `${stat} 目标必须在 ${statModel.min}-${statModel.max}。`, `targetStats.${stat}`)
  }

  const exoticArmor = gearById[build.exoticArmorId]
  if (!exoticArmor) addError(errors, 'UNKNOWN_EXOTIC_ARMOR', `未知异域护甲：${build.exoticArmorId}`, 'exoticArmorId')
  else {
    if (exoticArmor.type !== 'armor' || exoticArmor.rarity !== 'exotic') addError(errors, 'NOT_EXOTIC_ARMOR', `${exoticArmor.name} 不是异域护甲。`, 'exoticArmorId')
    if (exoticArmor.classId !== build.classId) addError(errors, 'EXOTIC_CLASS_MISMATCH', `${exoticArmor.name} 不属于所选职业。`, 'exoticArmorId')
  }

  const armorSet = armorSetById[build.armorSetId]
  if (!armorSet) addError(errors, 'UNKNOWN_ARMOR_SET', `未知护甲套装：${build.armorSetId}`, 'armorSetId')

  if ((build.weapons || []).length !== 3) addError(errors, 'WEAPON_COUNT', '构筑必须恰好装备三把武器。', 'weapons')
  const occupiedSlots = new Set()
  let exoticWeapons = 0
  for (const [index, selection] of (build.weapons || []).entries()) {
    const item = gearById[selection.itemId]
    if (!item || item.type !== 'weapon') {
      addError(errors, 'UNKNOWN_WEAPON', `未知武器：${selection.itemId}`, `weapons.${index}`)
      continue
    }
    if (occupiedSlots.has(item.slot)) addError(errors, 'WEAPON_SLOT_CONFLICT', `武器槽位重复：${item.slot}`, `weapons.${index}`)
    occupiedSlots.add(item.slot)
    if (item.rarity === 'exotic') exoticWeapons += 1
    for (const perk of selection.perks || []) {
      if (!(item.perkOptions || []).includes(perk)) addError(errors, 'INVALID_PERK', `${item.name} 不支持词条 ${perk}。`, `weapons.${index}.perks`)
    }
  }
  if (exoticWeapons > 1) addError(errors, 'EXOTIC_WEAPON_LIMIT', '最多装备一把异域武器；异域护甲拥有独立限额。', 'weapons')

  for (const slot of armorSlots) {
    const selections = build.armorMods?.[slot] || []
    let cost = 0
    for (const id of selections) {
      const mod = modById[id]
      if (!mod) {
        addError(errors, 'UNKNOWN_MOD', `未知模组：${id}`, `armorMods.${slot}`)
        continue
      }
      if (mod.slot !== 'any' && mod.slot !== slot) addError(errors, 'MOD_SLOT_MISMATCH', `${mod.name} 不能装在 ${slot}。`, `armorMods.${slot}`)
      cost += mod.cost
    }
    if (cost > 10) addError(errors, 'MOD_CAPACITY', `${slot} 模组能量 ${cost}/10，超出容量。`, `armorMods.${slot}`)
  }

  for (const id of build.activityIds || []) if (!activityById[id]) addError(errors, 'UNKNOWN_ACTIVITY', `未知活动：${id}`, 'activityIds')
  for (const id of build.mechanicIds || []) if (!mechanicById[id]) addError(errors, 'UNKNOWN_MECHANIC', `未知机制：${id}`, 'mechanicIds')

  const requiredChampionTypes = new Set((build.activityIds || []).flatMap(id => activityById[id]?.requirements?.championTypes || []))
  for (const type of requiredChampionTypes) {
    if (!(build.championCoverage?.[type] || []).length) warnings.push({ code: 'CHAMPION_GAP', message: `活动可能出现 ${type} 冠军，但当前构筑未提供稳定反制。` })
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function calculateStats(build) {
  const result = Object.fromEntries(stats.map(stat => [stat, build.baseStats?.[stat] || 0]))
  for (const slot of armorSlots) {
    for (const id of build.armorMods?.[slot] || []) {
      const mod = modById[id]
      if (mod?.stat) result[mod.stat] = Math.min(statModel.max, result[mod.stat] + mod.value)
    }
  }
  const tiers = Object.fromEntries(stats.map(stat => [stat, Math.floor(result[stat] / statModel.tierSize)]))
  const resilienceDR = statModel.resiliencePveDamageResistanceByTier[tiers.resilience]
  const targetChecks = Object.entries(build.targetStats || {}).map(([stat, target]) => ({ stat, target, actual: result[stat], met: result[stat] >= target }))
  return { values: result, tiers, resilienceDamageResistancePercent: resilienceDR, targetChecks }
}

export function calculateCombatProfile(build, options = {}) {
  const mode = options.mode === 'pvp' ? 'pvp' : 'pve'
  const statResult = calculateStats(build)
  const mechanicSources = new Map()
  const registerMechanics = (source, ids = []) => {
    for (const id of ids) {
      if (!mechanicById[id]) continue
      const sources = mechanicSources.get(id) || []
      if (!sources.includes(source)) sources.push(source)
      mechanicSources.set(id, sources)
    }
  }
  registerMechanics('构筑声明', build.mechanicIds)
  for (const id of build.abilities?.aspectIds || []) registerMechanics(`星相:${aspectById[id]?.name || id}`, aspectById[id]?.mechanicIds)
  for (const id of build.abilities?.facetIds || []) registerMechanics(`棱镜特性:${facetById[id]?.name || id}`, facetById[id]?.mechanicIds)
  for (const id of build.abilities?.fragmentIds || []) registerMechanics(`元素碎片:${fragmentById[id]?.name || id}`, fragmentById[id]?.mechanicIds)
  for (const id of [build.exoticArmorId, ...(build.weapons || []).map(item => item.itemId)]) registerMechanics(`装备:${gearById[id]?.name || id}`, gearById[id]?.mechanicIds)
  const ids = new Set(mechanicSources.keys())
  const radiant = mechanicById.radiant?.values?.[`${mode}WeaponDamagePercent`]
  const weaken = mode === 'pve' ? mechanicById.weaken?.values?.standardPvePercent : null
  const activeInteractions = mechanicInteractions.filter(interaction => interaction.requires.every(id => ids.has(id)) && !(mode === 'pvp' && interaction.requires.includes('weaken')))
  const weaponDamageSources = [ids.has('radiant') && radiant ? radiant : 0].filter(Boolean)
  const targetDebuffSources = [ids.has('weaken') && weaken ? weaken : 0].filter(Boolean)
  const weaponDamagePercent = weaponDamageSources.length ? Math.max(...weaponDamageSources) : 0
  const targetDebuffPercent = targetDebuffSources.length ? Math.max(...targetDebuffSources) : 0
  return {
    manifestVersion: build.manifestVersion || MANIFEST_VERSION,
    mode,
    inferredMechanicIds: [...ids],
    mechanicSources: Object.fromEntries([...mechanicSources.entries()]),
    resilienceDamageResistancePercent: statResult.resilienceDamageResistancePercent,
    incomingDamageMultiplier: Number((1 - statResult.resilienceDamageResistancePercent / 100).toFixed(3)),
    weaponDamageMultiplier: Number((1 + weaponDamagePercent / 100).toFixed(3)),
    targetDamageMultiplier: Number((1 + targetDebuffPercent / 100).toFixed(3)),
    combinedRegisteredMultiplier: Number(((1 + weaponDamagePercent / 100) * (1 + targetDebuffPercent / 100)).toFixed(3)),
    activeInteractions: activeInteractions.map(interaction => ({ id: interaction.id, name: interaction.name, effect: interaction.effect, confidence: interaction.confidence })),
    knownEffects: [
      ids.has('radiant') && radiant ? `光耀：PvE 武器伤害 +${radiant}%` : null,
      ids.has('weaken') && weaken ? `削弱：目标承受伤害基线 +${targetDebuffPercent}%` : null,
      ...activeInteractions.map(interaction => `${interaction.name}：${interaction.effect}`),
      statResult.resilienceDamageResistancePercent ? `韧性：PvE 受到伤害降低 ${statResult.resilienceDamageResistancePercent}%` : null
    ].filter(Boolean),
    note: `${mode === 'pve' ? 'PvE' : 'PvP'} 模式仅计算已登记的基线数值；武器词条、首领抗性和补丁例外不在此处外推。`
  }
}

export function scoreBuild(build, activityId) {
  const activity = activityById[activityId]
  if (!activity) return { score: 0, contributions: [], error: '未知活动' }
  const weights = activity.weights || {}
  let weighted = 0
  let weightTotal = 0
  const contributions = []
  for (const [axis, weight] of Object.entries(weights)) {
    const value = build.scoring?.[axis] || 0
    weighted += value * weight
    weightTotal += weight
    contributions.push({ axis, value, weight, points: Math.round(value * weight / 100) })
  }
  return { score: weightTotal ? Math.round(weighted / weightTotal) : 0, contributions }
}

export function planAcquisition(build, ownedItemIds = []) {
  const owned = new Set(ownedItemIds)
  const coreIds = [build.armorSetId, build.exoticArmorId, ...(build.weapons || []).map(item => item.itemId)]
  const priority = new Map((build.acquisitionPriority || []).map((id, index) => [id, index]))
  const itemIds = [...coreIds].sort((a, b) => {
    const aPriority = priority.has(a) ? priority.get(a) : Number.MAX_SAFE_INTEGER
    const bPriority = priority.has(b) ? priority.get(b) : Number.MAX_SAFE_INTEGER
    return aPriority - bPriority || coreIds.indexOf(a) - coreIds.indexOf(b)
  })
  return itemIds.map((itemId, index) => {
    const item = gearById[itemId] || armorSetById[itemId]
    const path = item ? acquisitionById[item.acquisitionId] : null
    return {
      order: index + 1,
      itemId,
      name: item?.name || itemId,
      owned: owned.has(itemId),
      access: path?.access || 'unknown',
      deterministic: path?.deterministic ?? false,
      confidence: path?.confidence || 'D',
      sourceIds: path?.sourceIds || [],
      pathName: path?.name || '待补充',
      steps: owned.has(itemId) ? ['已拥有，无需重复获取。'] : (path?.steps || ['当前尚无经过核验的获取路径。'])
    }
  })
}

export function planUnlocks(build) {
  const subclass = subclassById[build.subclassId]
  const selected = build.abilities || {}
  const unlocks = []
  const add = (kind, id, name, steps, note) => unlocks.push({ kind, id, name: name || id, steps, note })
  if (selected.superId) add('超能力', selected.superId, abilityById[selected.superId]?.name, ['解锁对应子职业', '在职业界面选择该超能力并完成训练节点'], '超能力名称和所属职业由 Manifest 映射校验。')
  if (selected.classAbilityId) add('职业技能', selected.classAbilityId, abilityById[selected.classAbilityId]?.name, ['在角色界面选择职业技能', '按职业任务或训练节点解锁'], '职业技能不占异域装备槽位。')
  if (selected.meleeId) add('近战', selected.meleeId, abilityById[selected.meleeId]?.name, ['解锁对应子职业', '完成近战技能节点或训练任务'], '普通与棱镜技能池由规则引擎检查。')
  if (selected.grenadeId) add('手雷', selected.grenadeId, abilityById[selected.grenadeId]?.name, ['解锁对应子职业', '完成手雷技能节点或训练任务'], '进入构筑前确认该手雷属于当前分支池。')
  for (const id of selected.aspectIds || []) add('星相', id, aspectById[id]?.name, ['解锁对应子职业', '完成该星相任务或冥想解锁节点'], '星相池和职业归属会在校验中强制检查。')
  for (const id of selected.fragmentIds || []) add('元素碎片', id, fragmentById[id]?.name, ['解锁对应元素子职业', '使用冥想或碎片货币购买并装备'], '碎片必须与普通子职业元素一致。')
  for (const id of selected.facetIds || []) add('棱镜特性', id, facetById[id]?.name, ['完成《终焉之形》战役并解锁棱镜', '在棱镜界面购买并装备该特性'], '棱镜特性不能用于普通子职业。')
  for (const id of Object.values(build.armorMods || {}).flat()) add('护甲模组', id, modById[id]?.name, ['从模组收藏或供应商解锁', '将模组装入对应部位并确认能量容量'], '最终能量成本由规则引擎逐部位计算。')
  return unlocks.map(item => ({ ...item, subclassId: subclass?.id || null }))
}

export function explainBuild(build, activityId) {
  const validation = validateBuild(build)
  const statResult = calculateStats(build)
  const score = scoreBuild(build, activityId)
  const mechanics = (build.mechanicIds || []).map(id => mechanicById[id]).filter(Boolean)
  return { validation, statResult, score, mechanics }
}
