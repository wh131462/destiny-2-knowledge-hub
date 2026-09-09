import test from 'node:test'
import assert from 'node:assert/strict'
import { blankDraft, emptyWeapon, emptyPerks, emptyPerkCombination, addPerkCombination, updatePerkCombination, removePerkCombination, encodeDraft, decodeDraft, MAX_PERK_COMBINATIONS } from '../packages/loadout-planner/index.js'
import { togglePerkRecommendation, manualPerkRecommendation } from '../packages/loadout-planner/weapon-perks.js'

const hatchlingHash = 831391274
const roundtrip = draft => decodeDraft(encodeDraft(draft))
test('两组推荐各自保留配对、名称、用途、额外插槽和普通强化 Hash', () => {
  const draft = blankDraft()
  let weapon = addPerkCombination(emptyWeapon(3947966653))
  weapon = updatePerkCombination(weapon, 'combo-1', { name: '回弹续航', notes: '多目标场景', recommendedPerks: { ...emptyPerks(), trait1: ['金中藏弹'], trait2: ['我为人人'], 'socket-4': ['枪托'] }, recommendedPerkHashes: { trait1: [1556840489], trait2: [4049631843], 'socket-4': [42] } })
  weapon = updatePerkCombination(weapon, 'combo-2', { name: '手雷循环', notes: '切割（强化）也可单独备注', recommendedPerks: { ...emptyPerks(), trait1: ['爆破专家（强化）'], trait2: ['幼雏'] }, recommendedPerkHashes: { trait1: [1906147653], trait2: [hatchlingHash] } })
  draft.weapons[0] = weapon
  const restored = roundtrip(draft)
  assert.deepEqual(restored, draft)
  assert.equal(restored.weapons[0].perkCombinations.length, 2)
  assert.equal(Object.hasOwn(restored.weapons[0], 'recommendedPerks'), false)
})

test('v2 不推断配对，不展开笛卡尔积；旧文本和 Hash 整体保留为第一组', () => {
  const legacy = { ...blankDraft(), schema: 'd2hub-manual-loadout-v2', weapons: [{ manifestHash: 3947966653, recommendedPerks: { ...emptyPerks(), trait1: ['金中藏弹', '爆破专家'], trait2: ['我为人人', '幼雏'] }, recommendedPerkHashes: { trait1: [1556840489, 3523296417] }, notes: '原武器备注' }] }
  const result = roundtrip(legacy)
  assert.equal(result.schema, 'd2hub-manual-loadout-v3')
  const weapon = result.weapons[0]
  assert.equal(weapon.perkCombinations.length, 1)
  assert.deepEqual(weapon.perkCombinations[0].recommendedPerks, legacy.weapons[0].recommendedPerks)
  assert.deepEqual(weapon.perkCombinations[0].recommendedPerkHashes, legacy.weapons[0].recommendedPerkHashes)
  assert.equal(weapon.notes, '原武器备注')
  assert.equal(weapon.perkCombinations[0].notes, '')
  assert.deepEqual(roundtrip(result), result)
})

test('复制组合深拷贝各栏数组，编辑副本不串改原组，新增空白不继承', () => {
  let weapon = emptyWeapon(42)
  weapon.perkCombinations[0].recommendedPerks.trait1 = ['切割（强化）']
  weapon.perkCombinations[0].recommendedPerkHashes = { trait1: [3422796781] }
  weapon.perkCombinations[0].notes = '原备注'
  weapon = addPerkCombination(weapon, 'combo-1')
  const copied = weapon.perkCombinations[1]
  assert.equal(copied.notes, '原备注')
  copied.recommendedPerks.trait1.push('金中藏弹')
  copied.recommendedPerkHashes.trait1.push(1556840489)
  assert.deepEqual(weapon.perkCombinations[0].recommendedPerks.trait1, ['切割（强化）'])
  assert.deepEqual(weapon.perkCombinations[0].recommendedPerkHashes.trait1, [3422796781])
  const blank = addPerkCombination(weapon).perkCombinations[2]
  assert.deepEqual(blank.recommendedPerks, emptyPerks())
  assert.equal(blank.notes, '')
})

test('图标选择、手填和清空仅修改指定组合，其他组合与武器备注不变', () => {
  const p = { hash: 123, name: 'Perk', nameZh: '词条', typeName: 'Trait' }, column = { key: 'trait1', options: [p] }
  let weapon = addPerkCombination(emptyWeapon(42)); weapon.notes = '共同职责'
  const first = structuredClone(weapon.perkCombinations[0])
  weapon = updatePerkCombination(weapon, 'combo-2', togglePerkRecommendation(weapon.perkCombinations[1], column, p))
  assert.deepEqual(weapon.perkCombinations[0], first)
  assert.deepEqual(weapon.perkCombinations[1].recommendedPerks.trait1, ['词条'])
  weapon = updatePerkCombination(weapon, 'combo-2', manualPerkRecommendation(weapon.perkCombinations[1], 'trait1', ''))
  assert.deepEqual(weapon.perkCombinations[0], first)
  assert.deepEqual(weapon.perkCombinations[1].recommendedPerks.trait1, [])
  assert.equal(weapon.notes, '共同职责')
})

test('删除中间组合不重编号绑定，新增不会复用现有标识，最后一组不可删除', () => {
  let weapon = addPerkCombination(addPerkCombination(emptyWeapon()))
  weapon.perkCombinations[2].notes = '第三组'
  weapon = removePerkCombination(weapon, 'combo-2')
  assert.deepEqual(weapon.perkCombinations.map(c => c.id), ['combo-1', 'combo-3'])
  weapon = addPerkCombination(weapon)
  assert.equal(new Set(weapon.perkCombinations.map(c => c.id)).size, 3)
  assert.equal(weapon.perkCombinations[1].notes, '第三组')
  const single = emptyWeapon()
  assert.deepEqual(removePerkCombination(single, 'combo-1'), single)
})

test('拒绝空、重复标识、超量、损坏的组合结构及非法词条 Hash', () => {
  for (const combinations of [null, [], {}, [null], [emptyPerkCombination(), emptyPerkCombination()], Array.from({ length: MAX_PERK_COMBINATIONS + 1 }, (_, i) => emptyPerkCombination(`combo-${i}`)), [{ ...emptyPerkCombination(), id: '../bad' }], [{ ...emptyPerkCombination(), notes: [] }], [{ ...emptyPerkCombination(), name: 42 }], [{ ...emptyPerkCombination(), recommendedPerkHashes: { trait1: [-1] } }]]) {
    const draft = blankDraft(); draft.weapons[0].perkCombinations = combinations
    assert.throws(() => roundtrip(draft), /组合|推荐词条/)
  }
  let weapon = emptyWeapon()
  for (let i = 1; i < MAX_PERK_COMBINATIONS; i++) weapon = addPerkCombination(weapon)
  assert.throws(() => addPerkCombination(weapon), /最多/)
})

test('更换武器的新行只带空白第一组，不留下上一武器推荐', () => {
  const old = addPerkCombination(emptyWeapon(42))
  old.perkCombinations[0].recommendedPerks.trait1 = ['旧词条']
  const next = emptyWeapon(99)
  assert.equal(next.perkCombinations.length, 1)
  assert.deepEqual(next.perkCombinations[0].recommendedPerks, emptyPerks())
  assert.equal(old.perkCombinations.length, 2)
})
