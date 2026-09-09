import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blankDraft, alternatives, formatTarget, targetErrors, armorSockets, modErrors, artifactErrors, switchArtifact, classAbilityAllowed, fragmentCapacity, encodeDraft, decodeDraft } from '../packages/loadout-planner/index.js'
import { curatedBuilds } from './fixtures/curated-builds.js'
import { validateBuild } from '../packages/rules-engine/index.js'
const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const equipment = load('manifest-equipment-rich').items
const mods = load('manifest-mods').items
const artifacts = load('manifest-artifact').items
const abilities = load('manifest-abilities').items
const plugSets = load('manifest-plugsets').sets
const context = { equipment, mods, artifacts, plugSets }

test('推荐区间包含 150–200、至少与无要求，不用掉落属性做判断', () => {
  assert.equal(formatTarget({ min: 150, max: 200 }), '150–200')
  assert.equal(formatTarget({ min: 80, max: null }), '≥ 80')
  assert.equal(formatTarget({ min: null, max: null }), '无要求')
  assert.equal(targetErrors({ weapons: { min: 150, max: 200 } }).length, 0)
  assert.ok(targetErrors({ weapons: { min: 201 } }).length)
  assert.ok(targetErrors({ health: { min: 80, max: 60 } }).length)
})

test('中文、分栏备选、神器与所有备注完整往返', () => {
  const d = blankDraft()
  d.name = '近战 / 副武器 🛡️'
  d.statRecommendations.weapons = { min: 150, max: 200 }
  d.weapons[0].perkCombinations[0].recommendedPerks.barrel = alternatives('箭头制退器 / 小口径 / 箭头制退器')
  d.weapons[0].perkCombinations[0].recommendedPerks.trait1 = alternatives('Lead from Gold／Slice')
  d.weapons[0].notes = '武器推荐，不检查是否拥有'
  d.statNotes = '近战优先'; d.farmingNotes = '机灵护甲商倾向，不保证掉落'; d.armorNotes = '核心异域替换手部'; d.notes = '循环\n保留护盾'
  d.ghostArmorerHash = 2479815754
  d.artifactHash = artifacts[0].hash; d.artifactNodeHashes = [artifacts[0].tiers[0].items[0].hash]
  assert.deepEqual(decodeDraft(encodeDraft(d), context), d)
})

test('旧版导入保留未分栏词条备注，跨版本不丢失草稿', () => {
  const legacy = { ...blankDraft(), schema: 'd2hub-manual-loadout-v1', manifestVersion: 'old-version', weapons: [{ manifestHash: 3947966653, perks: ['Lead from Gold', 'Slice'] }], artifactNodeHashes: [artifacts[0].tiers[0].items[0].hash] }
  const migrated = decodeDraft(encodeDraft(legacy), context)
  assert.equal(migrated.manifestVersion, 'old-version')
  assert.match(migrated.weapons[0].notes, /旧版未分栏推荐/)
  assert.deepEqual(migrated.weapons[0].perkCombinations[0].recommendedPerks.trait1, [])
  assert.equal(migrated.artifactHash, artifacts[0].hash)
})

test('护甲选择按真实模组插槽，重复模组允许但不能重复占同一插槽', () => {
  const item = equipment.find(e => e.itemType === 2 && armorSockets(e, mods, plugSets).filter(s => s.options.some(m => m.name === 'Heavy Handed')).length >= 2)
  assert.ok(item)
  const slots = armorSockets(item, mods, plugSets).filter(s => s.options.some(m => m.name === 'Heavy Handed'))
  const hash = slots[0].options.find(m => m.name === 'Heavy Handed').hash
  const assignments = slots.slice(0, 2).map(s => ({ socketIndex: s.index, manifestHash: hash }))
  assert.deepEqual(modErrors(item, assignments, mods, plugSets), [])
  assert.ok(modErrors(item, [assignments[0], assignments[0]], mods, plugSets).length)
  assert.ok(modErrors(item, [{ socketIndex: -1, manifestHash: hash }], mods, plugSets).length)
  assert.ok(modErrors(item, [{ socketIndex: slots[0].index, manifestHash: 2479815754 }], mods, plugSets).length)
  assert.ok(armorSockets(item, mods, plugSets).flatMap(s => s.options).every(m => Number.isFinite(m.energyCost) && !/^Empty|^Locked/.test(m.name)))
})

test('神器必须有本体，层级不得循环满足前置，变更清空节点', () => {
  const a = artifacts[0], early = a.tiers[0].items.slice(0, 3).map(n => n.hash), later = a.tiers[1].items[0].hash
  assert.ok(artifactErrors(null, [later]).length)
  assert.ok(artifactErrors(a, [later]).length)
  assert.ok(artifactErrors(a, [...early, later]).some(e => e.includes('旧定义')))
  assert.deepEqual(artifactErrors({ ...a, selectable: true }, [...early, later]), [])
  assert.ok(artifactErrors(a, [early[0], early[0]]).length)
  assert.ok(artifactErrors(a, [...early.slice(0, 2), later]).length)
  assert.ok(artifactErrors(a, [9999999999]).length)
  const d = blankDraft(); d.artifactHash = a.hash; d.artifactNodeHashes = early
  switchArtifact(d, 42)
  assert.equal(d.artifactHash, 42); assert.deepEqual(d.artifactNodeHashes, [])
})

test('星相区分棱镜与普通变体并使用快照容量，不固定 5/4', () => {
  const items = [{ en: 'Stylish Executioner' }, { en: "Winter's Shroud" }]
  assert.equal(fragmentCapacity(items, { classId: 'hunter', type: 'prismatic' }, abilities), 4)
  assert.equal(fragmentCapacity(items, { classId: 'hunter', type: 'mono' }, abilities), 5)
  assert.equal(fragmentCapacity([{ en: 'unknown' }], { classId: 'hunter', type: 'mono' }, abilities), null)
})

test('同名装备不混用 perk 池，随机栏位元数据保留', () => {
  const call = equipment.find(e => e.hash === 3947966653)
  assert.ok(equipment.filter(e => e.name === 'Mythos Hack 4.1').length > 1)
  const trait = call.socketPools.find(s => s.perkColumn === 'trait1')
  assert.ok(trait.randomizedPlugSetHash)
  assert.ok(trait.plugNames.includes('Lead from Gold'))
  assert.ok(trait.plugNames.includes('Slice'))
  assert.equal(trait.plugNames.length, trait.plugNamesZh.length)
})

test('职业技能限制、属性单插槽与 200 范围回归', () => {
  const thruster = { id: 'class-thruster', kind: 'classAbility', classIds: ['titan'] }
  assert.equal(classAbilityAllowed(thruster, { classId: 'titan', element: 'solar' }), false)
  assert.equal(classAbilityAllowed(thruster, { classId: 'titan', element: 'prismatic' }), true)
  const b = structuredClone(curatedBuilds[0]); b.baseStats.weapons = 200; b.targetStats.weapons = 200
  assert.equal(validateBuild(b).valid, true)
  b.armorMods.helmet = ['stat-health', 'stat-weapons']
  assert.ok(validateBuild(b).errors.some(e => e.code === 'MOD_STAT_SOCKET'))
})

test('损坏导入被拒绝，非法数值和模组插槽不会进入响应式状态', () => {
  assert.throws(() => decodeDraft('not a build', context))
  const d = blankDraft(); d.mods.helmet = [{ socketIndex: 'abc', manifestHash: 1 }]
  assert.throws(() => decodeDraft(encodeDraft(d), context), /插槽/)
  d.mods.helmet = []; d.statRecommendations.health = { min: -1, max: null }
  assert.throws(() => decodeDraft(encodeDraft(d), context), /0–200/)
})
