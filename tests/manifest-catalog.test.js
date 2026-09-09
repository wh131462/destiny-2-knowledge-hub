import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildArtifactCatalog, buildPlugCatalog, compareKeys, perkDetails, plugHashes } from '../packages/manifest-catalog/index.js'
import { artifactErrors, assignArtifactNodes, blankDraft, encodeDraft, decodeDraft, switchArtifact } from '../packages/loadout-planner/index.js'
import { manifestText } from '../web/src/utils/manifestText.js'
const read = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const artifacts = read('manifest-artifact').items, reprised = artifacts.filter(a => a.selectable)

test('复刻、历史物品与旧节点树分开，不借用 singleton 节点', () => {
  assert.equal(reprised.length, 7)
  for (const a of reprised) { assert.equal(a.kind, 'reprised'); assert.equal(a.sockets.length, 7); assert.equal(a.nodes.length, 21); assert.equal(a.tiers.length, 0) }
  assert.ok(artifacts.filter(a => a.kind === 'historical').every(a => !a.selectable && !a.nodes.length && !a.tiers.length))
  const legacy = artifacts.find(a => a.kind === 'legacy')
  assert.equal(legacy.nodes.length, 35)
  assert.ok(artifactErrors(legacy, [legacy.nodes[0].hash]).some(e => e.includes('旧定义')))
})

test('复刻神器的插槽候选与中文效果均完整', () => {
  for (const a of reprised) {
    assert.deepEqual(a.sockets.map(s => s.nodeHashes.length), [7, 7, 14, 14, 14, 21, 21])
    for (const n of a.nodes) { assert.ok(n.icon && n.nameZh); assert.ok(n.perkDetails.some(p => p.visibility !== 2 && p.descriptionZh)) }
  }
})

test('高阶节点只能使用兼容插槽；低阶节点可以使用高阶槽', () => {
  const a = reprised[0], top = a.nodes.filter(n => !a.sockets[2].nodeHashes.includes(n.hash)).map(n => n.hash)
  assert.deepEqual(artifactErrors(a, top.slice(0, 2)), [])
  assert.ok(artifactErrors(a, top.slice(0, 3)).length)
  const low = a.sockets[0].nodeHashes
  assert.deepEqual(artifactErrors(a, low), [])
  assert.ok(artifactErrors(a, [...low, top[0]]).length)
  assert.ok(artifactErrors(a, [low[0], low[0]]).length)
  assert.ok(artifactErrors(a, [top[0]], [{ socketIndex: 0, nodeHash: top[0] }]).length)
  assert.deepEqual(artifactErrors(a, [low[0]], [{ socketIndex: 6, nodeHash: low[0] }]), [])
  assert.ok(artifactErrors(a, [], [{ socketIndex: 0, nodeHash: low[0] }]).length)
})

test('旧 hash-only 列表匹配不依赖选择顺序；新插槽分配往返不丢失', () => {
  const a = reprised[0], hashes = a.sockets[0].nodeHashes
  const assignments = assignArtifactNodes(a, hashes)
  assert.equal(assignments.length, 7)
  assert.deepEqual(artifactErrors(a, hashes, assignments), [])
  assert.deepEqual(artifactErrors(a, [...hashes].reverse()), [])
  const d = blankDraft(); d.artifactHash = a.hash; d.artifactNodeHashes = hashes; d.artifactAssignments = assignments
  assert.deepEqual(decodeDraft(encodeDraft(d), { artifacts }), d)
  switchArtifact(d, reprised[1].hash)
  assert.deepEqual(d.artifactAssignments, []); assert.deepEqual(d.artifactNodeHashes, [])
})

test('扩展插槽匹配算法支持非嵌套候选池', () => {
  const a = { sockets: [{ socketIndex: 0, nodeHashes: [1, 2] }, { socketIndex: 1, nodeHashes: [1] }] }
  assert.deepEqual(assignArtifactNodes(a, [1, 2]), [{ socketIndex: 0, nodeHash: 2 }, { socketIndex: 1, nodeHash: 1 }])
})

test('未知 PlugSet 不静默丢弃；超过 64 项的池不截断', () => {
  assert.throws(() => plugHashes({ reusablePlugSetHash: 1 }, {}), /Missing PlugSet/)
  const items = Array.from({ length: 100 }, (_, i) => ({ plugItemHash: i + 1 }))
  assert.equal(plugHashes({ reusablePlugSetHash: 1 }, { 1: { reusablePlugItems: items } }).length, 100)
})

test('无名称和条件效果保留，未知效果明确失败', () => {
  const item = { perks: [{ perkHash: 1, perkVisibility: 1 }] }, perks = { 1: { displayProperties: { description: 'effect without name' } } }
  assert.equal(perkDetails(item, perks)[0].description, 'effect without name')
  assert.equal(perkDetails(item, perks)[0].visibility, 1)
  assert.throws(() => perkDetails(item, {}), /Missing SandboxPerk/)
})

test('标准 plug 收录不以少量增强模组类别限制全量词条', () => {
  const inventory = Object.fromEntries(['artifact_perks', 'core.gear_systems.armor_tiering.plugs.tuning.mods', 'v400.weapon.mod_guns', 'enhancements.ghosts_economic'].map((c, i) => [i + 1, { displayProperties: { name: c }, plug: { plugCategoryIdentifier: c } }]))
  assert.equal(buildPlugCatalog({ inventory, perks: {}, locales: {} }).length, 4)
})

test('复刻节点引用缺失时停止生成，绝不发布残缺候选', () => {
  const inventory = { 1: { hash: 1, displayProperties: { name: 'artifact' }, equippable: true, equippingBlock: { equipmentSlotTypeHash: 1506418338 }, preview: { screenStyle: 'screen_style_seasonal_artifact_reprise' }, sockets: { socketEntries: [{ singleInitialItemHash: 2 }] } } }
  assert.throws(() => buildArtifactCatalog({ inventory, artifacts: {}, plugSets: {}, perks: {}, locales: {} }), /Missing artifact plug/)
})

test('对账能检出缺失、多余与重复，而非只比较总数', () => {
  assert.deepEqual(compareKeys([1, 2], [1, 1, 3]), { expected: 2, actual: 2, missing: ['2'], extra: ['3'], duplicates: 1 })
})

test('私有字形有可读后备，未知符号保留编码而不猜测含义', () => {
  assert.equal(manifestText('\uE139冰影武器'), '冰影武器')
  assert.equal(manifestText('\uE140'), '[烈日]')
  assert.equal(manifestText('\uEFFF'), '[游戏图标 U+EFFF]')
  assert.equal(manifestText('Solar \uE140', 'en'), 'Solar [Solar]')
})
