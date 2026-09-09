import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dungeonGuides } from '../content/catalog/dungeon-guides.js'
import { activitiesV2 } from '../content/catalog/activities.js'

const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))

test('地牢指南覆盖 Manifest 的全部地牢家族，难度变体不重复计数', () => {
  const official = load('manifest-activities').activities.filter(item => item.activityTypeHash === 608898761)
  const names = [...new Set(official.map(item => item.name.split(':')[0]))].sort()
  assert.deepEqual(dungeonGuides.map(item => item.en).sort(), names)
  assert.equal(dungeonGuides.length, 11)
  for (const guide of dungeonGuides) {
    assert.ok(official.some(item => item.name.split(':')[0] === guide.en && item.nameZh.split(':')[0] === guide.name), guide.name)
    assert.equal(activitiesV2.filter(item => item.id === guide.id).length, 1)
  }
})

test('奖励可在武器百科定位，异域任务不描述为尾王随机掉落', () => {
  const equipment = load('manifest-equipment-rich').items
  for (const guide of dungeonGuides) {
    for (const reward of guide.rewards) assert.ok(equipment.some(item => item.itemType === 3 && item.name === reward), reward)
  }
  assert.match(dungeonGuides.find(item => item.id === 'dungeon-shattered-throne').rewardNote, /不是尾王随机掉落/)
  assert.match(dungeonGuides.find(item => item.id === 'dungeon-grasp-of-avarice').rewardNote, /异域任务/)
})

test('旧目录 ID 和中文别名保留，已有构筑和搜索仍可定位', () => {
  for (const [id, alias] of [['pit-of-heresy', '异端之坑'], ['duality', '二重性'], ['ghosts-of-the-deep', '深海之影'], ['warlords-ruin', '军阀遗迹'], ['equilibrium', '均衡']]) {
    const activity = activitiesV2.find(item => item.id === `dungeon-${id}`)
    assert.ok(activity.aliases.includes(alias))
  }
})
