import test from 'node:test'
import assert from 'node:assert/strict'
import { curatedBuilds } from '../content/builds/index.js'
import { validateBuild, calculateStats, calculateCombatProfile, planAcquisition, planUnlocks, scoreBuild } from '../packages/rules-engine/index.js'
import { recommendBuilds } from '../packages/recommendation-engine/index.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'
import { classesV2, subclasses } from '../content/catalog/subclasses.js'
import { gearItems, armorMods, exoticClassItemTraits } from '../content/catalog/gear.js'
import { armorSets } from '../content/catalog/sets.js'
import { activitiesV2 } from '../content/catalog/activities.js'
import { mechanics } from '../content/mechanics/index.js'
import { acquisitionPaths } from '../content/acquisition/paths.js'
import { sources } from '../content/meta.js'
import { loadNormalizedComponent, loadManifestItemIndex, loadManifestActivities, loadManifestPerks, loadManifestEquipmentRich, loadManifestMods, loadManifestAbilities, loadManifestPlugSets, loadManifestVendorInventory, loadManifestActivityRewards, loadManifestItemSets, loadManifestDropCoverage, loadCuratedManifestLinks, loadCuratedAcquisitionIndex, loadAcquisitionSources, loadCuratedModLinks, manifestCatalogSummary } from '../packages/manifest-adapter/index.js'
import { planVerifiedAcquisition } from '../packages/acquisition-engine/index.js'

test('所有发布构筑均通过合法性校验并达到声明属性', () => {
  for (const build of curatedBuilds) {
    const result = validateBuild(build)
    assert.equal(result.valid, true, `${build.id}: ${JSON.stringify(result.errors)}`)
    assert.equal(calculateStats(build).targetChecks.every(check => check.met), true, build.id)
  }
})

test('棱镜技能池阻止跨职业技能', () => {
  const illegal = structuredClone(curatedBuilds[0])
  illegal.abilities.meleeId = 'melee-combination-blow'
  const result = validateBuild(illegal)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some(error => ['ABILITY_CLASS_MISMATCH', 'PRISMATIC_POOL_VIOLATION'].includes(error.code)))
})

test('武器异域限制与槽位冲突会被拒绝', () => {
  const illegal = structuredClone(curatedBuilds[0])
  illegal.weapons = [
    { itemId: 'khvostov-7g-0x', perks: [] },
    { itemId: 'sunshot', perks: [] },
    { itemId: 'apex-predator', perks: ['Reconstruction', 'Bait and Switch'] }
  ]
  const result = validateBuild(illegal)
  assert.ok(result.errors.some(error => error.code === 'EXOTIC_WEAPON_LIMIT'))
})

test('模组超过部位容量时会被拒绝', () => {
  const illegal = structuredClone(curatedBuilds[0])
  illegal.armorMods.helmet = ['hands-on', 'heavy-ammo-finder', 'heavy-ammo-scout', 'stat-recovery']
  const result = validateBuild(illegal)
  assert.ok(result.errors.some(error => error.code === 'MOD_CAPACITY'))
})

test('推荐只返回合法且与活动匹配的方案', () => {
  const results = recommendBuilds({ classId: 'warlock', subclassType: 'prismatic', activityId: 'grandmaster', goals: ['support'] })
  assert.ok(results.length >= 1)
  assert.ok(results.every(result => result.validation.valid && result.build.classId === 'warlock'))
  assert.ok(results.every(result => result.build.activityIds.includes('grandmaster')))
})

test('推荐会把已拥有装备纳入排序并给出解释', () => {
  const results = recommendBuilds({ classId: 'hunter', ownedItemIds: ['first-ascent', 'gyrfalcons-hauberk', 'graviton-lance', 'the-call', 'edge-transit'] })
  assert.ok(results.length >= 1)
  assert.equal(results[0].ownership.ownedCount, 5)
  assert.ok(results[0].reasons.some(reason => reason.includes('已拥有 5/5')))
  assert.ok(results[0].scoreBreakdown.ownershipBonus > 0)
  assert.ok(Array.isArray(results[0].implementation.nextSteps))
  const fromZero = recommendBuilds({ classId: 'hunter', subclassId: results[0].build.subclassId })[0]
  assert.ok(fromZero.implementation.nextSteps.length >= 1)
  assert.ok(fromZero.implementation.missingItems.every(item => item.pathName && item.steps.length > 0))
})

test('推荐支持精确到普通或棱镜分支', () => {
  const results = recommendBuilds({ subclassId: 'hunter-void' })
  assert.ok(results.length >= 1)
  assert.ok(results.every(result => result.build.subclassId === 'hunter-void'))
  assert.equal(recommendBuilds({ subclassId: 'unknown-subclass' }).length, 0)
})

test('推荐结果解释活动冠军覆盖和实现准备度', () => {
  const results = recommendBuilds({ activityId: 'grandmaster' })
  assert.ok(results.length > 0)
  assert.ok(results.every(result => 'championGapPenalty' in result.scoreBreakdown))
  assert.ok(results.every(result => ['ready', 'in-progress'].includes(result.implementation.readiness)))
  assert.ok(results.every(result => Array.isArray(result.implementation.championGaps)))
})

test('获取规划为所有核心装备返回路径', () => {
  for (const build of curatedBuilds) {
    const path = planAcquisition(build)
    assert.equal(path.length, 5)
    assert.ok(path.every(item => item.steps.length > 0))
  }
})

test('构筑获取规划包含技能、星相、碎片或棱镜特性及模组路径', () => {
  for (const build of curatedBuilds) {
    const unlocks = planUnlocks(build)
    assert.ok(unlocks.some(item => item.kind === '星相'))
    assert.ok(unlocks.some(item => item.kind === '护甲模组'))
    assert.ok(unlocks.every(item => item.steps.length > 0 && item.note))
  }
})

test('活动评分在零到一百之间', () => {
  for (const build of curatedBuilds) {
    const result = scoreBuild(build, build.activityIds[0])
    assert.ok(result.score >= 0 && result.score <= 100)
  }
})

test('数值机制计算只输出已登记的基线倍率', () => {
  const build = curatedBuilds.find(item => item.mechanicIds.includes('radiant') && item.mechanicIds.includes('weaken'))
  assert.ok(build)
  const profile = calculateCombatProfile(build)
  assert.equal(profile.weaponDamageMultiplier, 1.25)
  assert.equal(profile.targetDamageMultiplier, 1.15)
  assert.ok(profile.incomingDamageMultiplier > 0 && profile.incomingDamageMultiplier <= 1)
})

test('所有内容来源与获取路径引用都存在', () => {
  const sourceIds = new Set(sources.map(item => item.id))
  const acquisitionIds = new Set(acquisitionPaths.map(item => item.id))
  for (const item of [...classesV2, ...abilities, ...aspects, ...facets, ...subclasses, ...gearItems, ...armorMods, ...activitiesV2, ...exoticClassItemTraits]) {
    for (const sourceId of item.sourceIds || []) assert.ok(sourceIds.has(sourceId), `${item.id}: ${sourceId}`)
    assert.ok(item.sourceIds?.length && item.verifiedAt, `${item.id}: missing provenance metadata`)
  }
  assert.ok(acquisitionPaths.every(path => path.sourceIds?.length && path.verifiedAt && ['A', 'B', 'C', 'D'].includes(path.confidence)))
  for (const item of gearItems) assert.ok(acquisitionIds.has(item.acquisitionId), `${item.id}: ${item.acquisitionId}`)
  for (const item of armorSets) assert.ok(acquisitionIds.has(item.acquisitionId), `${item.id}: ${item.acquisitionId}`)
})

test('棱镜池中的技能和星相实体全部存在', () => {
  const abilityIds = new Set(abilities.map(item => item.id))
  const aspectIds = new Set(aspects.map(item => item.id))
  for (const subclass of subclasses.filter(item => item.type === 'prismatic')) {
    for (const id of [...subclass.superIds, ...subclass.meleeIds, ...subclass.grenadeIds]) assert.ok(abilityIds.has(id), `${subclass.id}: ${id}`)
    for (const id of subclass.aspectIds) assert.ok(aspectIds.has(id), `${subclass.id}: ${id}`)
  }
})

test('普通十五个子职业暴露 Manifest 中当前元素的完整手雷池', () => {
  const expectedGrenadeCounts = { solar: 8, arc: 7, void: 7, stasis: 4, strand: 4 }
  const manifestGrenades = abilities.filter(item => item.kind === 'grenade' && item.manifestVerified)
  assert.equal(manifestGrenades.length, 30)
  assert.equal(new Set(manifestGrenades.map(item => item.manifestHash)).size, 30)
  assert.ok(manifestGrenades.every(item => Number.isInteger(item.manifestHash) && item.name && item.en && item.icon))
  for (const subclass of subclasses.filter(item => item.type === 'mono')) {
    assert.equal(subclass.grenadeIds?.length, expectedGrenadeCounts[subclass.element], `${subclass.id}: grenade pool incomplete`)
    assert.ok(subclass.aspectIds?.length >= 2, `${subclass.id}: aspect pool incomplete`)
    assert.ok(subclass.fragmentIds?.length >= 2, `${subclass.id}: fragment pool incomplete`)
    for (const id of [...subclass.grenadeIds, ...subclass.aspectIds, ...subclass.fragmentIds]) {
      assert.ok(abilities.some(item => item.id === id) || aspects.some(item => item.id === id) || fragments.some(item => item.id === id), `${subclass.id}: ${id}`)
    }
  }
})

test('普通子职业会拒绝不在自身池中的手雷和星相', () => {
  const illegal = structuredClone(curatedBuilds.find(build => build.subclassId === 'titan-solar'))
  illegal.abilities.grenadeId = 'grenade-flashbang'
  illegal.abilities.aspectIds = ['aspect-touch-of-thunder', 'aspect-sol-invictus']
  const result = validateBuild(illegal)
  assert.ok(result.errors.some(error => error.code === 'MONO_GRENADE_POOL_VIOLATION'))
  assert.ok(result.errors.some(error => error.code === 'MONO_ASPECT_VIOLATION' || error.code === 'MONO_ASPECT_POOL_VIOLATION'))
})

test('规则引擎拒绝技能类型、普通子职业池和重复选择错误', () => {
  const base = structuredClone(curatedBuilds.find(build => build.subclassId === 'titan-solar'))
  base.abilities.grenadeId = 'super-hammer-of-sol'
  let result = validateBuild(base)
  assert.ok(result.errors.some(error => error.code === 'ABILITY_KIND_MISMATCH'))

  const ordinary = structuredClone(curatedBuilds.find(build => build.subclassId === 'titan-solar'))
  ordinary.abilities.superId = 'super-thundercrash'
  result = validateBuild(ordinary)
  assert.ok(result.errors.some(error => error.code === 'MONO_SUPER_POOL_VIOLATION'))

  const duplicate = structuredClone(curatedBuilds[0])
  duplicate.abilities.aspectIds = [duplicate.abilities.aspectIds[0], duplicate.abilities.aspectIds[0]]
  result = validateBuild(duplicate)
  assert.ok(result.errors.some(error => error.code === 'DUPLICATE_ASPECT'))
})

test('规则引擎拒绝未知或超范围属性目标', () => {
  const build = structuredClone(curatedBuilds[0])
  build.targetStats.unknown = 10
  build.baseStats.resilience = 101
  const result = validateBuild(build)
  assert.ok(result.errors.some(error => error.code === 'UNKNOWN_TARGET_STAT'))
  assert.ok(result.errors.some(error => error.code === 'STAT_OUT_OF_RANGE'))
})

test('模组 ID 唯一且成本不超过单部位容量', () => {
  assert.equal(new Set(armorMods.map(item => item.id)).size, armorMods.length)
  assert.ok(armorMods.every(item => item.cost > 0 && item.cost <= 10))
})

test('机制 ID 唯一', () => {
  assert.equal(new Set(mechanics.map(item => item.id)).size, mechanics.length)
})

test('Manifest 快照可读取并标准化官方实体', async () => {
  const summary = await manifestCatalogSummary()
  assert.match(summary.manifestVersion, /\d/)
  assert.ok(summary.components.some(item => item.component === 'DestinyClassDefinition'))

  const classesSnapshot = await loadNormalizedComponent('DestinyClassDefinition')
  assert.equal(classesSnapshot.entities.length, 3)
  assert.ok(classesSnapshot.entities.some(item => item.name === 'Hunter'))
  assert.ok(classesSnapshot.entities.every(item => item.component === 'DestinyClassDefinition'))
})

test('官方装备轻量索引保留可追溯版本与核心字段', async () => {
  const index = await loadManifestItemIndex()
  assert.equal(index.manifestVersion, '244213.26.06.29.2000-1-bnet.65583')
  assert.ok(index.count > 30000)
  assert.ok(index.items.some(item => item.name === 'Gjallarhorn' || item.name === 'The Call'))
  assert.ok(index.items.every(item => Number.isInteger(item.hash) && item.name))
})

test('站内实体具备 Manifest 映射覆盖报告', async () => {
  const links = await loadCuratedManifestLinks()
  assert.equal(links.count, abilities.length + aspects.length + subclasses.length + gearItems.length)
  assert.ok(links.matched >= 110)
  assert.ok(links.links['super-song-of-flame'].hashes.length > 0)
  assert.equal(links.links['mataiodoxia'].matched, true)
  assert.equal(links.links['mataiodoxia'].matchReason, 'normalized-name')
  assert.equal(links.links['grenade-voidwall'].matched, true)
  assert.equal(links.links['grenade-voidwall'].matchReason, 'exact-name')
})

test('官方活动与沙盒词条轻量索引可查询', async () => {
  const activities = await loadManifestActivities()
  const perks = await loadManifestPerks()
  assert.ok(activities.count > 3000)
  assert.ok(perks.count > 3000)
  assert.ok(activities.activities.some(item => item.name === 'The Glassway'))
  assert.ok(perks.perks.some(item => item.name === 'Hot Swap'))
})

test('官方技能索引覆盖超能、近战、手雷和职业技能', async () => {
  const index = await loadManifestAbilities()
  assert.ok(index.count >= 100)
  assert.ok(index.items.some(item => item.name === 'Thundercrash' && /Super Ability/i.test(item.typeName)))
  assert.ok(index.items.some(item => item.name === 'Duskfield Grenade'))
  assert.ok(index.items.every(item => Number.isInteger(item.hash) && item.name && item.typeName))
})

test('官方装备语义索引提供武器类型、槽位和职业字段', async () => {
  const index = await loadManifestEquipmentRich()
  assert.ok(index.count >= 8000)
  assert.ok(index.items.some(item => item.name === 'Gjallarhorn' && item.weaponFamily === 'Rocket Launcher'))
  assert.ok(index.items.some(item => item.name === 'The Call' && item.perkOptions.includes('One for All')))
  assert.ok(index.items.some(item => item.armorSlot === 'helmet'))
  assert.ok(index.items.some(item => item.hash === 3413074534 && item.name === 'Polaris Lance' && item.nameZh === '极星长枪'))
  assert.ok(index.items.some(item => item.hash === 3725585710 && item.name === 'Lodestar' && item.nameZh === '北极星'))
  assert.ok(index.items.every(item => Number.isInteger(item.hash) && Array.isArray(item.categoryNames)))
})

test('异域武器中文名遵循 Manifest，不把北极星误作 Polaris Lance 别名', () => {
  const polaris = gearItems.find(item => item.id === 'polaris-lance')
  const lodestar = gearItems.find(item => item.id === 'lodestar')
  assert.equal(polaris?.en, 'Polaris Lance')
  assert.equal(polaris?.name, '极星长枪')
  assert.ok(!polaris?.aliases?.includes('北极星'))
  assert.equal(lodestar?.en, 'Lodestar')
  assert.equal(lodestar?.name, '北极星')
})

test('官方模组索引保留能量成本和 Sandbox Perk 关联', async () => {
  const index = await loadManifestMods()
  assert.ok(index.count >= 400)
  const heavyAmmo = index.items.find(item => item.name === 'Heavy Ammo Finder')
  assert.ok(heavyAmmo)
  assert.equal(heavyAmmo.slot, 'helmet')
  assert.equal(heavyAmmo.energyCost, 1)
  assert.ok(heavyAmmo.perkDetails.length >= 1)
})

test('PlugSet 与掉落覆盖报告明确记录当前 Manifest 能力边界', async () => {
  const plugSets = await loadManifestPlugSets()
  const drops = await loadManifestDropCoverage()
  assert.ok(plugSets.count > 5000)
  assert.equal(drops.status, 'activity-rewards-available-reward-mapping-empty')
  assert.equal(drops.withRewardMapping, 0)
})

test('官方供应商库存索引可提供可追溯的直接获取候选', async () => {
  const index = await loadManifestVendorInventory()
  assert.ok(index.vendorCount >= 200)
  assert.ok(index.count >= 10000)
  assert.ok(index.entries.every(item => Number.isInteger(item.vendorHash) && Number.isInteger(item.itemHash)))
})

test('官方活动奖励索引可反向定位装备来源', async () => {
  const index = await loadManifestActivityRewards()
  assert.ok(index.activityCount >= 1000)
  assert.ok(index.count >= 4000)
  assert.ok(index.entries.some(item => item.activityName === 'Warden of Nothing: Matchmade'))
  const equipment = await loadManifestEquipmentRich()
  assert.ok(equipment.items.some(item => item.activitySources.length > 0))
})

test('站内装备具备精简的官方获取候选索引', async () => {
  const index = await loadCuratedAcquisitionIndex()
  assert.equal(index.count, gearItems.length)
  assert.ok(index.matched >= gearItems.length - 2)
  const theCall = index.items.find(item => item.id === 'the-call')
  const verifiedSourceItem = index.items.find(item => item.id === 'synthoceps')
  assert.ok(theCall?.manifestHashes.length)
  assert.ok(verifiedSourceItem?.activitySources.length || verifiedSourceItem?.vendorSources.length)
})

test('官方装备套装索引保留套装部位和套装特性', async () => {
  const index = await loadManifestItemSets()
  assert.ok(index.count >= 50)
  assert.ok(index.sets.some(item => item.itemHashes.length >= 2))
  assert.ok(index.sets.some(item => item.perks.length > 0))
})

test('统一获取来源对象同时保留官方候选和编辑路径', async () => {
  const index = await loadAcquisitionSources()
  assert.equal(index.count, gearItems.length + armorSets.length)
  const theCall = index.items.find(item => item.id === 'the-call')
  assert.equal(theCall.kind, 'gear')
  assert.ok(theCall.path?.steps?.length)
  assert.ok(Array.isArray(theCall.manifestHashes))
  const set = index.items.find(item => item.id === 'first-ascent')
  assert.equal(set.kind, 'armorSet')
  assert.ok(set.path?.id)
})

test('机制组合只在所需效果同时登记时激活', () => {
  const build = curatedBuilds.find(item => item.mechanicIds.includes('radiant') && item.mechanicIds.includes('weaken'))
  const profile = calculateCombatProfile(build)
  assert.ok(profile.activeInteractions.some(item => item.id === 'radiant-weaken'))
  assert.equal(profile.combinedRegisteredMultiplier, 1.438)
  const noDebuff = calculateCombatProfile({ ...build, mechanicIds: build.mechanicIds.filter(id => id !== 'weaken'), abilities: { ...build.abilities, aspectIds: ['aspect-gunpowder-gamble', 'aspect-threaded-specter'] } })
  assert.equal(noDebuff.activeInteractions.some(item => item.id === 'radiant-weaken'), false)
})

test('战斗档案从星相、碎片和装备推导机制来源', () => {
  const build = structuredClone(curatedBuilds.find(item => item.id === 'prismatic-hunter-still-hunt'))
  build.mechanicIds = build.mechanicIds.filter(id => id !== 'radiant')
  build.abilities.facetIds = ['facet-dawn', ...build.abilities.facetIds.slice(1)]
  const profile = calculateCombatProfile(build)
  assert.ok(profile.inferredMechanicIds.includes('radiant'))
  assert.ok(profile.mechanicSources.radiant.some(source => source.startsWith('棱镜特性:')))
  assert.equal(profile.weaponDamageMultiplier, 1.25)
})

test('战斗档案支持 PvP 基线并不外推 PvE 削弱数值', () => {
  const build = curatedBuilds.find(item => item.mechanicIds.includes('radiant') && item.mechanicIds.includes('weaken'))
  const profile = calculateCombatProfile(build, { mode: 'pvp' })
  assert.equal(profile.mode, 'pvp')
  assert.equal(profile.weaponDamageMultiplier, 1.1)
  assert.equal(profile.targetDamageMultiplier, 1)
  assert.equal(profile.activeInteractions.some(item => item.id === 'radiant-weaken'), false)
})

test('站内模组能与官方模组索引对齐并报告一致性', async () => {
  const links = await loadCuratedModLinks()
  assert.equal(links.count, armorMods.length)
  assert.ok(links.matched >= 15)
  assert.ok(links.items.some(item => item.id === 'stat-mobility' && item.primaryHash))
  assert.ok(links.items.every(item => item.declared && 'energyCost' in item.declared))
})

test('验证获取规划携带 Manifest 证据和边界说明', async () => {
  const build = curatedBuilds[0]
  const plan = await planVerifiedAcquisition(build)
  assert.equal(plan.length, 5)
  assert.ok(plan.every(item => item.manifestVersion && item.evidence))
  assert.ok(plan.some(item => item.caveat))
})
