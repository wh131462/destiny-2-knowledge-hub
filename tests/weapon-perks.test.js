import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blankDraft, encodeDraft, decodeDraft } from '../packages/loadout-planner/index.js'
import { weaponPerkColumns, perkLabel, isEnhancedPerk, resolvePerkSelections, togglePerkRecommendation, manualPerkRecommendation } from '../packages/loadout-planner/weapon-perks.js'

const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const equipment = load('manifest-equipment-rich').items
const plugs = new Map(load('manifest-plugs').items.map(p => [p.hash, p]))
const columns = hash => weaponPerkColumns(equipment.find(w => w.hash === hash), plugs)
const call = columns(3947966653)
const trait1 = call.find(c => c.key === 'trait1')
const normal = trait1.options.find(p => p.hash === 923806249)
const enhanced = trait1.options.find(p => p.hash === 3422796781)
const row = () => blankDraft().weapons[0].perkCombinations[0]

test('呼唤按真实栏目完整展开，排除空位和追踪器，不将通用大师插槽当掉落池', () => {
  assert.deepEqual(call.map(c => [c.key, c.options.length]), [['barrel', 14], ['magazine', 16], ['trait1', 18], ['trait2', 18], ['origin', 2], ['masterwork', 0]])
  assert.equal(call[0].label, '发射器枪管')
  assert.equal(trait1.options.filter(isEnhancedPerk).length, 9)
  assert.ok(trait1.randomizedPlugSetHash)
  assert.ok(call.every(c => c.options.every(p => !p.placeholder && p.typeName)))
})

test('全目录候选必须来自该 Hash 的同一插槽，所有现有插槽类型都有中文栏目', () => {
  for (const weapon of equipment.filter(w => w.itemType === 3)) {
    for (const column of weaponPerkColumns(weapon, plugs)) {
      if (column.socketIndex == null) continue
      const socket = weapon.socketPools.find(s => s.socketIndex === column.socketIndex)
      assert.ok(column.options.every(p => socket.plugItemHashes.includes(p.hash)), `${weapon.hash}: ${column.key}`)
      assert.ok(!/[A-Za-z]/.test(column.label), `${weapon.hash}: ${column.label}`)
    }
  }
})

test('同名不同 Hash 的武器及多个同类型插槽绝不合池', () => {
  const socket = (socketIndex, plugItemHashes) => ({ socketCategory: 'WEAPON PERKS', socketIndex, perkColumn: 'trait1', plugItemHashes })
  const a = { hash: 1, name: 'Same', socketPools: [socket(3, [normal.hash]), socket(4, [enhanced.hash])] }
  const b = { hash: 2, name: 'Same', socketPools: [socket(3, [enhanced.hash])] }
  const ac = weaponPerkColumns(a, plugs), bc = weaponPerkColumns(b, plugs)
  assert.deepEqual(ac.find(c => c.key === 'trait1').options.map(p => p.hash), [normal.hash])
  assert.deepEqual(ac.find(c => c.key === 'socket-4').options.map(p => p.hash), [enhanced.hash])
  assert.deepEqual(bc.find(c => c.key === 'trait1').options.map(p => p.hash), [enhanced.hash])
  assert.throws(() => togglePerkRecommendation(row(), ac.find(c => c.key === 'trait1'), enhanced), /不属于/)
})

test('同名普通与强化独立多选，用 / 表示备选并按 Hash 取消', () => {
  const r = row()
  assert.equal(normal.nameZh, enhanced.nameZh)
  assert.notEqual(perkLabel(normal), perkLabel(enhanced))
  Object.assign(r, togglePerkRecommendation(r, trait1, normal))
  Object.assign(r, togglePerkRecommendation(r, trait1, enhanced))
  assert.deepEqual(r.recommendedPerkHashes.trait1, [normal.hash, enhanced.hash])
  assert.equal(r.recommendedPerks.trait1.join(' / '), '切割 / 切割（强化）')
  assert.equal(resolvePerkSelections(r, trait1).chosen.length, 2)
  Object.assign(r, togglePerkRecommendation(r, trait1, normal))
  assert.deepEqual(r.recommendedPerkHashes.trait1, [enhanced.hash])
  assert.deepEqual(r.recommendedPerks.trait1, ['切割（强化）'])
})

test('旧文本唯一匹配普通词条，强化必须明确标记，同名歧义保留手填', () => {
  const r = row(); r.recommendedPerks.trait1 = ['Slice', '自定义触发说明']
  assert.deepEqual(resolvePerkSelections(r, trait1).chosen.map(p => p.hash), [normal.hash])
  r.recommendedPerks.trait1 = ['Slice (Enhanced)']
  assert.deepEqual(resolvePerkSelections(r, trait1).chosen.map(p => p.hash), [enhanced.hash])
  r.recommendedPerks.trait1 = ['Slice']
  const ambiguous = { ...trait1, options: [normal, { ...normal, hash: 42 }] }
  assert.deepEqual(resolvePerkSelections(r, ambiguous).manual, ['Slice'])
  assert.equal(resolvePerkSelections(r, ambiguous).chosen.length, 0)
})

test('旧 Hash 失效时不按同名重绑，选择候选不删除手填和旧引用', () => {
  const r = row(); r.recommendedPerks.trait1 = ['切割', '按需替换']; r.recommendedPerkHashes = { trait1: [42] }
  const selected = resolvePerkSelections(r, trait1)
  assert.deepEqual(selected.chosen, [])
  assert.deepEqual(selected.manual, ['切割', '按需替换'])
  assert.deepEqual(selected.unknownHashes, [42])
  Object.assign(r, togglePerkRecommendation(r, trait1, enhanced))
  assert.deepEqual(r.recommendedPerks.trait1, ['切割（强化）', '切割', '按需替换'])
  assert.deepEqual(r.recommendedPerkHashes.trait1, [enhanced.hash, 42])
})

test('手动编辑只清当前栏的绑定，未更改的失焦不破坏 Hash', () => {
  const r = row(); Object.assign(r, togglePerkRecommendation(r, trait1, normal))
  r.recommendedPerkHashes.trait2 = [100]; r.recommendedPerks.trait2 = ['独立推荐']
  assert.deepEqual(manualPerkRecommendation(r, 'trait1', ' 切割 '), {})
  Object.assign(r, manualPerkRecommendation(r, 'trait1', 'Slice／自定义 / Slice'))
  assert.deepEqual(r.recommendedPerks.trait1, ['Slice', '自定义'])
  assert.deepEqual(r.recommendedPerkHashes, { trait1: [], trait2: [100] })
  assert.deepEqual(r.recommendedPerks.trait2, ['独立推荐'])
})

test('额外枪托栏目及普通/强化 Hash 可以导出再导入，旧版无 Hash 草稿不变', () => {
  const draft = blankDraft(); draft.weapons[0].manifestHash = 3947966653
  const combo = draft.weapons[0].perkCombinations[0]
  Object.assign(combo, togglePerkRecommendation(combo, trait1, enhanced))
  combo.recommendedPerks['socket-4'] = ['枪托推荐']
  combo.recommendedPerkHashes['socket-4'] = [1234]
  assert.deepEqual(decodeDraft(encodeDraft(draft), {}), draft)
  assert.deepEqual(decodeDraft(encodeDraft(blankDraft()), {}), blankDraft())
})

test('拒绝格式错误的推荐 Hash 元数据，合法重复 Hash 去重', () => {
  for (const invalid of [[], 'text', { trait1: '42' }, { trait1: [0] }, { trait1: [-2] }, { trait1: [1.5] }, { trait1: ['42'] }, { wrongColumn: [42] }]) {
    const draft = blankDraft(); draft.weapons[0].perkCombinations[0].recommendedPerkHashes = invalid
    assert.throws(() => decodeDraft(encodeDraft(draft), {}), /推荐词条/)
  }
  const draft = blankDraft(); draft.weapons[0].perkCombinations[0].recommendedPerkHashes = { trait1: [42, 42] }
  assert.deepEqual(decodeDraft(encodeDraft(draft), {}).weapons[0].perkCombinations[0].recommendedPerkHashes.trait1, [42])
})

test('特殊武器使用电池、枪托、导轨、刀茎等真实栏目，固定词条只有一项', () => {
  const lens = columns(19024058)
  assert.equal(lens.find(c => c.key === 'magazine').label, '电池')
  assert.equal(lens.find(c => c.key === 'socket-4').label, '枪托')
  assert.equal(lens.find(c => c.key === 'trait1').options.length, 1)
  assert.equal(columns(649691506).find(c => c.key === 'barrel').label, '导轨')
  assert.equal(columns(649691506).find(c => c.key === 'magazine').label, '弩箭')
  assert.equal(columns(14194600).find(c => c.key === 'barrel').label, '柄杆')
  assert.equal(columns(3049715579).find(c => c.key === 'socket-1').label, '刀茎')
  assert.equal(columns(1753923263).find(c => c.key === 'socket-2').label, '刀身')
})

test('缺失详情保留诊断，整栏缺失也不伪装成没有候选', () => {
  const weapon = { socketPools: [{ socketCategory: 'WEAPON PERKS', socketIndex: 3, perkColumn: 'trait1', plugItemHashes: [42, 42] }] }
  const missing = weaponPerkColumns(weapon, plugs).find(c => c.key === 'trait1')
  assert.deepEqual(missing.options, [])
  assert.deepEqual(missing.missingHashes, [42])
})
