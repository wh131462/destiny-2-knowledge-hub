import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { armorSlots, armorGroups, armorSetPreview, createArmorCatalog } from '../packages/manifest-catalog/armor.js'

const read = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const catalog = read('manifest-armor')
const sourceSets = read('manifest-item-sets')

test('published armor projection preserves official set thresholds, localized effects and all members', () => {
  assert.equal(catalog.manifestVersion, sourceSets.manifestVersion)
  assert.deepEqual(catalog.unresolvedSetMembers, [])
  const hashes = new Set(catalog.items.map(item => item.hash))
  for (const set of catalog.sets) {
    const source = sourceSets.sets.find(item => item.hash === set.hash)
    assert.deepEqual(set.perks, source.perks)
    for (const hash of source.itemHashes) {
      assert.ok(hashes.has(hash))
      assert.ok(catalog.items.find(item => item.hash === hash).setHashes.includes(set.hash))
    }
  }
  assert.equal(catalog.stats.length, 6)
  assert.deepEqual(JSON.parse(readFileSync(new URL('../web/public/data/manifest-armor.json', import.meta.url))), catalog)
})

const first = catalog.sets.find(set => set.name === 'AION Adapter')
const second = catalog.sets.find(set => set.name === 'AION Renewal')
const plan = ids => Object.fromEntries(armorSlots.map((slot, i) => [slot.id, ids[i]]))
const preview = ids => armorSetPreview(plan(ids), catalog.sets, catalog.items, 'titan')

test('four set pieces plus an Exotic activate both actual bonus thresholds', () => {
  const result = preview([first.hash, first.hash, first.hash, first.hash, 'exotic'])
  assert.equal(result.valid, true)
  assert.equal(result.exoticCount, 1)
  assert.equal(result.sets[0].count, 4)
  assert.ok(result.sets[0].perks.every(perk => perk.active))
  assert.equal(result.slots[4].item, undefined)
})

test('2 + 2 + Exotic activates only each two-piece bonus', () => {
  const result = preview([first.hash, first.hash, second.hash, second.hash, 'exotic'])
  assert.equal(result.valid, true)
  assert.equal(result.sets.length, 2)
  for (const set of result.sets) {
    assert.equal(set.count, 2)
    assert.deepEqual(set.perks.map(perk => [perk.requiredSetCount, perk.active]), [[2, true], [4, false]])
  }
})

test('invalid slots, incompatible classes and duplicate Exotics cannot form a valid loadout', () => {
  assert.equal(preview(['exotic', 'exotic', first.hash, first.hash, first.hash]).valid, false)
  assert.equal(preview(['', 'unknown', first.hash, first.hash, first.hash]).sets[0].count, 3)
  const result = armorSetPreview(plan(armorSlots.map(() => first.hash)), catalog.sets, catalog.items.filter(item => item.classId !== 'titan'), 'titan')
  assert.equal(result.valid, false)
  assert.equal(result.sets.length, 0)
})

test('thresholds come from definitions instead of assuming all sets use 2 / 4', () => {
  const customSet = { ...first, perks: [{ requiredSetCount: 3 }, { requiredSetCount: 5 }] }
  const result = armorSetPreview(plan([first.hash, first.hash, first.hash, '', 'exotic']), [customSet], catalog.items, 'titan')
  assert.deepEqual(result.sets[0].perks.map(perk => perk.active), [true, false])
})

test('same-name armor with different set memberships is never merged', () => {
  const member = catalog.items.find(item => item.setHashes.includes(first.hash))
  const oldVersion = { ...member, hash: -1, setHashes: [] }
  const alternate = { ...member, hash: -2 }
  const groups = armorGroups([oldVersion, member, alternate])
  assert.equal(groups.length, 2)
  assert.equal(groups.find(group => group[0].setHashes.length).length, 2)
})

test('Exotic armor retains intrinsic descriptions and class item trait columns', () => {
  const byHash = new Map(catalog.traits.map(trait => [trait.hash, trait]))
  const speaker = catalog.items.find(item => item.name === "Speaker's Sight" && item.traits.length)
  const traits = speaker.traits.flatMap(pool => pool.hashes.map(hash => byHash.get(hash)))
  assert.ok(traits.some(trait => trait.name === 'The Lost Voice' && trait.descriptionZh.includes('恢复炮台')))
  const solipsism = catalog.items.find(item => item.name === 'Solipsism')
  assert.equal(solipsism.traits.length, 2)
  assert.ok(solipsism.traits.every(pool => pool.hashes.length >= 1 && pool.hashes.every(hash => byHash.has(hash))))
  assert.ok(solipsism.traits.every(pool => pool.definitionOnly), 'default class-item traits must not masquerade as full roll pools')
  assert.ok(catalog.archetypes.every(item => /Primary Stat:/.test(item.description)))
})

test('mod effects include both Armor Charge instructions and the actual benefit', () => {
  const emergency = catalog.mods.find(mod => mod.hash === 1024379611)
  assert.ok(emergency.descriptionZh.includes('护甲充能'))
  assert.ok(emergency.descriptionZh.includes('伤害减免'))
  const inconsistent = catalog.mods.find(mod => mod.hash === 1176372075)
  assert.deepEqual(inconsistent.differingPerkNames, ['缚丝抗性'])
})

test('projection excludes cosmetics from intrinsic perks and uses perk details for mod effects', () => {
  const result = createArmorCatalog({
    equipment: { items: [{ hash: 1, name: 'Armor', itemType: 2, socketPools: [
      { socketCategory: 'ARMOR PERKS', initialItemHash: 2, socketIndex: 0 },
      { socketCategory: 'ARMOR COSMETICS', initialItemHash: 3, socketIndex: 1 }
    ] }] },
    sets: { sets: [] }, plugSets: { sets: [] }, references: { items: [] },
    plugs: { items: [{ hash: 2, name: 'Intrinsic', category: 'intrinsics' }, { hash: 3, name: 'Ornament', category: 'intrinsics' }] },
    mods: { items: [{ hash: 4, name: 'Heavy Ammo Finder', energyCost: 1, perkDetails: [{ description: 'Meter', descriptionZh: '弹药量表' }] }] }
  })
  assert.deepEqual(result.items[0].traits[0].hashes, [2])
  assert.equal(result.mods[0].descriptionZh, '弹药量表')
  assert.equal(result.mods[0].energyCost, 1)
})

test('concrete Exotic armor occupies its actual slot and never contributes to set bonuses', () => {
  for (const slot of armorSlots) {
    const exotic = catalog.items.find(item => item.classId === 'titan' && item.armorSlot === slot.id && item.tierTypeHash === 2759499571)
    assert.ok(exotic)
    const assignments = plan(armorSlots.map(() => first.hash))
    assignments[slot.id] = `exotic:${exotic.hash}`
    const result = armorSetPreview(assignments, catalog.sets, catalog.items, 'titan')
    assert.equal(result.valid, true)
    assert.equal(result.exoticCount, 1)
    assert.equal(result.sets[0].count, 4)
    assert.equal(result.slots.find(item => item.id === slot.id).item.hash, exotic.hash)
  }
})

test('concrete Exotic selections reject duplicate, wrong-class, wrong-slot and non-Exotic definitions', () => {
  const helmet = catalog.items.find(item => item.classId === 'titan' && item.armorSlot === 'helmet' && item.tierTypeHash === 2759499571)
  const arms = catalog.items.find(item => item.classId === 'titan' && item.armorSlot === 'arms' && item.tierTypeHash === 2759499571)
  const base = plan(armorSlots.map(() => first.hash))
  const check = (changes, classId = 'titan') => armorSetPreview({ ...base, ...changes }, catalog.sets, catalog.items, classId)
  assert.equal(check({ helmet: `exotic:${helmet.hash}`, arms: `exotic:${arms.hash}` }).valid, false)
  assert.equal(check({ helmet: `exotic:${helmet.hash}`, arms: 'exotic' }).valid, false)
  assert.equal(check({ arms: `exotic:${helmet.hash}` }).valid, false)
  assert.equal(check({ helmet: `exotic:${helmet.hash}` }, 'hunter').valid, false)
  assert.equal(check({ helmet: `exotic:${first.itemHashes[0]}` }).valid, false)
  assert.equal(check({ helmet: 'exotic:unknown' }).valid, false)
})
