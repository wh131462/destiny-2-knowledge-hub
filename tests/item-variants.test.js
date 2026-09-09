import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { definitionMetadata, itemConditions, requiresArtifact, versionLabels, craftingConditions, modConditionErrors } from '../packages/manifest-catalog/item-metadata.js'
import { weaponPerkColumns } from '../packages/loadout-planner/weapon-perks.js'
import { weaponVersionHighlights } from '../packages/manifest-catalog/weapon-details.js'
import { blankDraft } from '../packages/loadout-planner/index.js'
import { validateLoadout } from '../packages/loadout-planner/validation.js'
import { createLoadoutExportModel } from '../web/src/utils/loadoutExportModel.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'
const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/manifest-${name}.json`, import.meta.url)))
const equipment = load('equipment-rich').items, mods = load('mods').items, plugs = load('plugs').items
const plugSets = load('plugsets').sets, artifacts = load('artifact').items, manifestAbilities = load('abilities').items
const context = { equipment, mods, plugSets, artifacts, manifestAbilities, subclasses, abilities, aspects, facets, fragments }
const byHash = new Map(plugs.map(item => [item.hash, item]))

test('神器减费版不可凭能量或任意神器通过整套配装校验，普通版仍可用', () => {
  const d = blankDraft(), armor = equipment.find(item => item.hash === 26254737)
  d.classId = armor.classId; d.subclassId = subclasses.find(s => s.classId === d.classId).id
  d.armor.helmet = { manifestHash: armor.hash }; d.mods.helmet = [{ socketIndex: 1, manifestHash: 644105 }]
  assert.ok(validateLoadout(d, context).some(message => message.includes('神器减费版')))
  d.artifactHash = artifacts.find(a => a.selectable).hash
  assert.ok(validateLoadout(d, context).some(message => message.includes('对应证据')))
  d.mods.helmet[0].manifestHash = 554409585
  assert.deepEqual(validateLoadout(d, context), [])
  const discount = mods.find(item => item.hash === 644105)
  assert.equal(requiresArtifact(discount), true)
  assert.ok(modConditionErrors(discount, { artifact: { selectable: false, nodes: [{ hash: discount.hash }] }, artifactNodeHashes: [discount.hash] }).length)
})

test('同名炎阳护腕的旧式、调谐、含锁定巧匠定义在页面投影仍可区分', () => {
  const armor = load('armor').items
  assert.ok(versionLabels(armor.find(item => item.hash === 1862800747)).includes('旧式护甲插槽'))
  assert.ok(versionLabels(armor.find(item => item.hash === 950745251)).includes('调谐槽'))
  assert.ok(versionLabels(armor.find(item => item.hash === 3787517196)).includes('巧匠槽 · 含锁定定义'))
  assert.ok(versionLabels(armor.find(item => item.hash === 1862800747)).includes('历史定义 · 当前不再获取'))
  assert.ok(versionLabels(armor.find(item => item.hash === 950745251)).includes('来源已登记'))
  assert.ok(versionLabels(armor.find(item => item.hash === 3787517196)).includes('当前系统 · 获取来源未确认'))
})

test('命运终结者的配方与发行差异、长臂特殊版在所有装备投影保留', () => {
  for (const name of ['items', 'equipment', 'equipment-catalog', 'equipment-rich']) {
    const items = load(name).items
    assert.equal(items.find(item => item.hash === 2171478765).versionInfo.recipeItemHash, null)
    assert.equal(items.find(item => item.hash === 4184168210).versionInfo.recipeItemHash, 1718491554)
    assert.equal(items.find(item => item.hash === 14929251).versionInfo.isHolofoil, true)
    assert.equal(items.find(item => item.hash === 8293111).versionInfo.isHolofoil, false)
  }
})

test('锻造等级保留在具体武器插槽候选上，不污染共享同名词条或旧武器', () => {
  const current = equipment.find(item => item.hash === 4184168210), old = equipment.find(item => item.hash === 2171478765)
  const keepAway = weaponPerkColumns(current, byHash).find(column => column.key === 'trait1').options.find(item => item.hash === 3619207468)
  assert.ok(craftingConditions(keepAway).some(row => row.text.includes('武器等级 4')))
  assert.equal(byHash.get(3619207468).craftingOptions, undefined)
  assert.ok(weaponPerkColumns(old, byHash).flatMap(column => column.options).every(option => !craftingConditions(option).length))
  assert.ok(weaponVersionHighlights(current, [old, current], byHash).some(text => text.includes('独有候选')))
})

test('过期和禁用失败提示不等于当前已过期，未知规则保留原文', () => {
  const raw = { displayProperties: { name: 'Conditional mod' }, plug: { enabledRules: [{ failureMessage: 'Expired. Destination Mod effects are no longer active.' }, { failureMessage: 'Unknown future condition' }] } }
  const item = definitionMetadata(raw)
  assert.notEqual(item.definitionState, 'deprecated')
  assert.deepEqual(itemConditions(item).map(rule => rule.text), ['过期后效果不再生效', 'Unknown future condition'])
  assert.equal(definitionMetadata({ displayProperties: { description: 'This mod has been deprecated and no longer functions.' } }).definitionState, 'deprecated')
})

test('受限武器模组保留具体条件；安装与生效同一规则去重，普通与强化仍独立', () => {
  assert.ok(itemConditions(byHash.get(299264772)).some(rule => rule.text === '仅限专家武器'))
  assert.ok(itemConditions(byHash.get(52638289)).some(rule => rule.text === '仅限已塑形或已强化的武器'))
  assert.ok(itemConditions(byHash.get(1285109625)).some(rule => rule.text === '仅在指定活动中生效'))
  const finder = mods.find(item => item.hash === 644105)
  assert.equal(itemConditions(finder).filter(rule => rule.original.includes('Seasonal Artifact')).length, 1)
  assert.ok(versionLabels(byHash.get(139132552)).includes('强化武器模组'))
  assert.ok(versionLabels(byHash.get(1334978104)).includes('普通武器模组'))
  assert.equal(mods.find(item => item.hash === 644105).artifactVariant, 'discount')
  assert.equal(mods.find(item => item.hash === 110793779).artifactVariant, 'restricted')
  assert.ok(versionLabels(mods.find(item => item.hash === 110793779)).includes('神器限定 · 需解锁'))
})

test('分享与导出继续保留版本特征、神器条件及选定词条的锻造等级', () => {
  const draft = blankDraft()
  draft.weapons[0].manifestHash = 4184168210
  draft.weapons[0].perkCombinations[0].recommendedPerkHashes = { trait1: [3619207468] }
  draft.armor.arms = { manifestHash: 950745251 }
  draft.mods.helmet = [{ socketIndex: 1, manifestHash: 644105 }]
  const model = createLoadoutExportModel(draft, { ...context, perkByHash: byHash })
  assert.match(model.weapons[0].caption, /有锻造配方/)
  assert.match(model.armor.find(item => item.name === '炎阳护腕').caption, /调谐槽/)
  assert.ok(model.weapons[0].combinations[0].columns.flatMap(column => column.items).some(item => item.name.includes('武器等级 4')))
  assert.ok(model.warnings.some(text => text.includes('需在赛季神器中选中')))
})
