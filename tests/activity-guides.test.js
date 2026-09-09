import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { activitiesV2, activityById } from '../content/catalog/activities.js'
import { sources } from '../content/meta.js'

const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const family = name => name.split(':')[0].replace(/ \(Epic\)$/, '')

test('完整突袭与地牢家族与官方双语目录对应，首领合集不冒充完整突袭', () => {
  const official = load('manifest-activities').activities
  for (const [category, hash] of [['raid', 2043403989], ['dungeon', 608898761]]) {
    const rows = official.filter(item => item.activityTypeHash === hash)
    // These are boss gauntlet/encore entries, not additional full raid families.
    const collections = new Set(['Pantheon', 'The Pantheon', 'Featured Encore', 'Featured Reprise'])
    const names = [...new Set(rows.map(item => family(item.name)).filter(name => !collections.has(name)))].sort()
    const guides = activitiesV2.filter(item => item.category === category)
    assert.deepEqual(guides.map(item => item.en).sort(), names)
    for (const guide of guides) assert.ok(rows.some(item => family(item.name) === guide.en && item.nameZh.split(':')[0] === guide.name), guide.id)
  }
})

test('每篇可见指南都有实质内容、适用范围和可回溯的来源修订版', () => {
  assert.equal(activitiesV2.length, 37)
  assert.equal(new Set(activitiesV2.map(item => item.id)).size, 37)
  const known = new Set(sources.map(source => source.id))
  for (const item of activitiesV2) {
    for (const key of ['intro', 'mechanics', 'scope', 'rewardNote']) assert.ok(item[key]?.length > 15, `${item.id}: ${key}`)
    assert.ok(item.encounters.length >= 3, item.id)
    assert.ok(item.preparation.length >= 2, item.id)
    for (const encounter of item.encounters) assert.ok(encounter.name && encounter.objective && encounter.caution, item.id)
    for (const source of item.sourceIds) assert.ok(known.has(source), source)
    assert.equal(item.fieldSources.weights, 'editorial-baseline')
    for (const reference of [item.reference, ...item.references]) {
      assert.equal(new URL(reference.url).hostname, 'www.destinypedia.com')
      const revision = new URL(reference.revisionUrl)
      assert.equal(revision.hostname, 'www.destinypedia.com')
      assert.ok(/^\d+$/.test(revision.searchParams.get('oldid')), item.id)
      assert.equal(decodeURIComponent(new URL(reference.url).pathname.slice(1)), revision.searchParams.get('title'), item.id)
      assert.equal(reference.checkedAt, item.verifiedAt)
    }
  }
})

test('代表奖励和官方活动证据都可在本地百科定位', () => {
  const equipment = load('manifest-equipment-rich').items
  const official = load('manifest-activities').activities
  for (const guide of activitiesV2) {
    for (const name of guide.rewards) assert.ok(equipment.some(item => item.itemType === 3 && item.name === name && !item.redacted && !item.blacklisted), `${guide.id}: ${name}`)
    for (const evidence of guide.evidence || []) assert.ok(official.some(item => item.hash === evidence.hash), `${guide.id}: ${evidence.hash}`)
  }
  assert.equal(official.find(item => item.hash === 1983194435).matchmaking.maxParty, 6)
  assert.equal(official.find(item => item.hash === 139413740).matchmaking.maxParty, 3)
})

test('历史、复刻和未完成流程不混同当前活动，任务异域保留获取差异', () => {
  const historical = activitiesV2.filter(item => item.historical)
  assert.deepEqual(historical.map(item => item.id).sort(), ['raid-leviathan', 'raid-eater-of-worlds', 'raid-spire-of-stars', 'raid-scourge-of-the-past', 'raid-crown-of-sorrow'].sort())
  for (const item of historical) assert.match(item.scope, /2020-11-10.*退役/)
  assert.match(activityById['raid-desert-perpetual'].scope, /史诗.*替换.*不适用/)
  assert.ok(activityById['raid-desert-perpetual'].gaps)
  assert.ok(activityById['dungeon-equilibrium'].gaps)
  assert.match(activityById['raid-garden-of-salvation'].rewardNote, /任务.*不是尾王随机/)
  assert.match(activityById['raid-crota-end'].rewardNote, /任务.*超灵精华/)
})

test('活动模型保留旧 ID 和别名，不把泛高难与 PvP 套成统一冠军 PvE 条件', () => {
  for (const [id, alias] of [['raid-last-wish', '最终心愿'], ['raid-crota-end', '克罗塔之末'], ['event-festival-of-the-lost', '邪魔节'], ['event-guardian-games', '守护者运动会'], ['event-iron-banner', '钢铁旗'], ['grandmaster', '宗师夜幕']]) assert.ok(activityById[id].aliases.includes(alias), id)
  const iron = activityById['event-iron-banner']
  assert.equal(iron.combatMode, 'pvp')
  assert.ok(iron.weights.neutralGame > 0)
  assert.equal(iron.weights.addClear, undefined)
  const highDifficulty = activityById.grandmaster
  assert.equal(highDifficulty.requirements.activityDependent, true)
  assert.deepEqual(highDifficulty.requirements.championTypes, [])
  assert.equal(highDifficulty.requirements.lockedLoadout, null)
})
