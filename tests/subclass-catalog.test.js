import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildSubclassCatalog, auditSubclassCoverage, skillPoolKeys } from '../packages/subclass-catalog/index.js'
import { subclasses, subclassById } from '../content/catalog/subclasses.js'
import { abilities, abilityById } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'
import { classAbilityAllowed, blankDraft, encodeDraft, decodeDraft } from '../packages/loadout-planner/index.js'
import { validateBuild } from '../packages/rules-engine/index.js'
import { curatedBuilds } from './fixtures/curated-builds.js'
const load = name => JSON.parse(readFileSync(new URL('../data/catalog/' + name + '.json', import.meta.url)))
const source = load('manifest-subclasses')
const definitions = load('manifest-abilities').items
const inventoryItems = load('manifest-items').items
const plugSets = load('manifest-plugsets').sets
const skills = [...abilities, ...aspects, ...facets, ...fragments]
const context = { subclasses, skills, definitions, inventoryItems, plugSets }

test('全部 18 个子职业的 UI 可选池逐 Hash 覆盖源 PlugSet，无漏项和越界', () => {
  const audit = auditSubclassCoverage(context)
  assert.deepEqual(audit.errors, [])
  assert.equal(subclasses.length, 18)
  assert.equal(audit.definitions, definitions.length)
  for (const sub of subclasses) {
    for (const key of ['superIds', 'classAbilityIds', 'movementIds', 'meleeIds', 'grenadeIds', 'aspectIds', sub.type === 'prismatic' ? 'facetIds' : 'fragmentIds']) {
      assert.ok(sub[key].length > 0, sub.id + ':' + key)
    }
  }
})

test('覆盖检查能够识别选择器池删项，而非只检查数据非空', () => {
  const broken = structuredClone(subclasses)
  broken.find(s => s.id === 'warlock-solar').superIds.pop()
  assert.ok(auditSubclassCoverage({ ...context, subclasses: broken }).errors.some(e => /missing selectable super/.test(e)))
  assert.ok(auditSubclassCoverage({ ...context, definitions: definitions.slice(1) }).errors.some(e => /missing normalized/.test(e)))
})

test('补齐普通职业超能、近战、星相与全部元素碎片', () => {
  assert.ok(subclassById['warlock-solar'].superIds.includes('super-well-of-radiance'))
  assert.ok(subclassById['warlock-solar'].superIds.includes('super-daybreak'))
  assert.ok(subclassById['titan-solar'].meleeIds.includes('melee-throwing-hammer'))
  assert.ok(subclassById['hunter-solar'].meleeIds.includes('melee-weighted-throwing-knife'))
  assert.ok(subclassById['warlock-solar'].aspectIds.includes('aspect-heat-rises'))
  assert.ok(subclassById['warlock-strand'].aspectIds.includes('aspect-weavewalk'))
  assert.equal(aspects.length, 60)
  assert.equal(fragments.length, 78)
  assert.equal(facets.length, 21)
})

test('职业技能及跳跃遵循实际子职业限制，包括棱镜杂技闪身与闪现', () => {
  const acrobat = abilityById['class-acrobats-dodge']
  assert.equal(classAbilityAllowed(acrobat, subclassById['hunter-prismatic']), true)
  assert.equal(classAbilityAllowed(acrobat, subclassById['hunter-solar']), true)
  assert.equal(classAbilityAllowed(acrobat, subclassById['hunter-void']), false)
  assert.ok(subclassById['hunter-arc'].movementIds.includes('movement-blink'))
  assert.ok(!subclassById['hunter-solar'].movementIds.includes('movement-blink'))
  assert.ok(subclassById['warlock-prismatic'].movementIds.includes('movement-blink'))
})

test('固定超越手雷不混入普通手雷池，棱镜不扩大到普通分支的全部技能', () => {
  for (const sub of subclasses.filter(s => s.type === 'prismatic')) {
    assert.equal(sub.transcendenceIds.length, 1)
    assert.equal(sub.transcendenceGrenadeIds.length, 1)
    assert.ok(sub.transcendenceGrenadeIds.every(id => !sub.grenadeIds.includes(id)))
    assert.equal(sub.grenadeIds.length, 5)
  }
  assert.ok(!subclassById['warlock-prismatic'].superIds.includes('super-well-of-radiance'))
})

test('跳跃选项兼容旧版草稿，可导出往返，规则拒绝跨职业移动能力', () => {
  const d = blankDraft()
  d.abilities.movementId = 'movement-blink'
  assert.equal(decodeDraft(encodeDraft(d)).abilities.movementId, 'movement-blink')
  delete d.abilities.movementId
  assert.equal(decodeDraft(encodeDraft(d)).abilities.movementId, '')
  const build = structuredClone(curatedBuilds[0])
  build.abilities.movementId = 'movement-blink'
  assert.equal(validateBuild(build).valid, false)
})

test('同名技能所有分支 Hash 都能解析且具备图标和中文；公开数据与生成源完全一致', () => {
  for (const skill of skills) for (const [subclassId, hash] of Object.entries(skill.manifestHashesBySubclass)) {
    const definition = definitions.find(d => d.hash === hash)
    assert.equal(definition?.name, skill.en, subclassId + ':' + skill.id)
    assert.ok(definition.icon && definition.nameZh, skill.id)
    assert.ok(subclassById[subclassId][skillPoolKeys[skill.kind]].includes(skill.id))
  }
  const publicSource = JSON.parse(readFileSync(new URL('../web/public/data/manifest-subclasses.json', import.meta.url)))
  assert.deepEqual(publicSource, source)
  for (const file of ['manifest-subclasses', 'manifest-abilities', 'manifest-items', 'manifest-plugsets']) assert.equal(load(file).manifestVersion, source.manifestVersion)
})

test('条件显示的星相效果仍完整收录，不能把 Visibility 1 当成隐藏', () => {
  for (const hash of [262821317, 668903196, 2835214902, 3066103997]) {
    const definition = definitions.find(d => d.hash === hash)
    assert.ok(definition.perkDetails.some(p => p.visibility === 1 && p.descriptionZh), definition.name)
  }
  assert.ok(definitions.every(d => d.perkDetails.every(p => p.visibility !== 2)))
})

function fixture() {
  const inventory = {}, plugSets = {}
  const names = ['class_abilities', 'movement', 'supers', 'melee', 'grenades', 'aspects', 'fragments']
  const socketEntries = names.map((kind, i) => {
    const hash = i + 10
    inventory[hash] = { hash, itemType: 19, displayProperties: { name: 'Example ' + kind, icon: '/test.png' }, plug: { plugCategoryIdentifier: 'titan.solar.' + kind } }
    plugSets[hash] = { reusablePlugItems: [{ plugItemHash: hash, currentlyCanRoll: false }] }
    return { singleInitialItemHash: hash, reusablePlugSetHash: hash }
  })
  inventory[1] = { hash: 1, itemType: 16, classType: 0, equippable: true, displayProperties: { name: 'Sunbreaker' }, sockets: { socketEntries } }
  inventory[99] = { ...inventory[12], hash: 99, displayProperties: { name: 'Unreachable retired super', icon: '/old.png' } }
  return { inventory, plugSets }
}
test('生成器依赖可装备子职业链接，排除未关联旧技能，不按 currentlyCanRoll 隐藏技能', () => {
  const result = buildSubclassCatalog(fixture())
  assert.equal(result.definitions.length, 7)
  assert.ok(!result.definitions.some(d => d.hash === 99))
  assert.equal(result.subclasses[0].superIds.length, 1)
})
test('源插槽缺失、未分类新技能会直接中止生成，不能静默遗漏', () => {
  const missing = fixture()
  delete missing.plugSets[12]
  assert.throws(() => buildSubclassCatalog(missing), /Missing plug set/)
  const unknown = fixture()
  unknown.inventory[12].plug.plugCategoryIdentifier = 'titan.solar.unknown_new_kind'
  assert.throws(() => buildSubclassCatalog(unknown), /Unclassified subclass plug/)
})
