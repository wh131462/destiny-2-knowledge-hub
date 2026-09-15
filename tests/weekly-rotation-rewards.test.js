import test from 'node:test'
import assert from 'node:assert/strict'
import { createRewardResolver } from '../packages/weekly-rotation/rewards.js'
import { normalizeMilestones } from '../packages/weekly-rotation/index.js'

const items = [
  { hash: 10, name: 'Raid Gear', nameZh: '突袭装备', descriptionZh: '包含3阶装备。', itemType: 20 },
  { hash: 11, name: 'Raid Gear', nameZh: '突袭装备', descriptionZh: '包含5阶装备。', itemType: 20 },
  { hash: 12, name: 'Touch of Malice', nameZh: '恶意触碰', icon: '/weapon.jpg', itemType: 3 },
  { hash: 13, name: 'Touch of Malice', nameZh: '恶意触碰催化', icon: '/catalyst.png', itemType: 19 },
  { hash: 14, name: "Zaouli's Bane", nameZh: '扎乌利之灾', itemType: 3 },
  { hash: 15, name: "Zaouli's Bane", nameZh: '扎乌利之灾', itemType: 3 },
  { hash: 16, name: 'Hidden Reward', nameZh: '保密', itemType: 3, redacted: true }
]
const entries = [
  { activityHash: 1, itemHash: 10, quantity: 0, conditional: false },
  { activityHash: 1, itemHash: 10, quantity: 0, conditional: false },
  { activityHash: 2, itemHash: 11, quantity: 1, conditional: true },
  { activityHash: 1, itemHash: 999, quantity: 0 },
  { activityHash: 1, itemHash: 16, quantity: 1 }
]
const guide = { id: 'raid-kings-fall', category: 'raid', en: "King's Fall", rewards: ['Touch of Malice', "Zaouli’s Bane", 'Unknown Weapon'], rewardNote: '尾王异域奖励。' }

test('reward types use exact activity hashes and keep master rewards separate', () => {
  const resolve = createRewardResolver({ items, entries })
  const standard = resolve(1, guide)
  const master = resolve(2, guide)
  assert.deepEqual(standard.official.map(item => item.itemHash), [10])
  assert.deepEqual(master.official.map(item => item.itemHash), [11])
  assert.equal(standard.official[0].quantity, null)
  assert.equal(master.official[0].conditional, true)
  assert.equal(master.official[0].quantity, 1)
  assert.deepEqual(resolve(null, null).official, [])
})

test('guide examples resolve bilingual equipment names, exclude catalysts and preserve multiple variants', () => {
  const result = createRewardResolver({ items, entries })(1, guide)
  assert.equal(result.examples[0].nameZh, '恶意触碰')
  assert.equal(result.examples[0].icon, '/weapon.jpg')
  assert.deepEqual(result.examples[0].itemHashes, [12])
  assert.deepEqual(result.examples[1].itemHashes, [14, 15])
  assert.equal(result.examples[1].url, undefined)
  assert.equal(result.examples[2].name, 'Unknown Weapon')
  assert.equal(result.examples[2].url, undefined)
  assert.equal(result.note, guide.rewardNote)
  assert.equal(result.examples[0].source, 'editorial-guide')
  assert.equal(result.official[0].source, 'activity-definition')
})

test('normalization enriches reward references without inventing live rewards', () => {
  const snapshot = normalizeMilestones({ Response: { raid: {
    milestoneHash: 7, startDate: '2026-09-08T17:00:00Z', endDate: '2026-09-15T17:00:00Z', activities: [{ activityHash: 1 }]
  } } }, { manifestActivities: [{ hash: 1, name: "King's Fall: Standard", activityTypeHash: 2043403989 }], editorialActivities: [guide], rewardCatalog: { items, entries } })
  const activity = snapshot.activities[0]
  assert.deepEqual(activity.rewards, [])
  assert.equal(activity.rewardDetails.official[0].nameZh, '突袭装备')
  assert.equal(activity.rewardDetails.examples[0].nameZh, '恶意触碰')
})
