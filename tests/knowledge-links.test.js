import test from 'node:test'
import assert from 'node:assert/strict'
import { entityLocation, relatedBuilds, entryHistory } from '../packages/knowledge-links/index.js'

test('encyclopedia links preserve exact variants and curated identity', () => {
  assert.equal(entityLocation({ hash: 123, name: 'Same name' }, 'plugs').params.id, '123')
  assert.notDeepEqual(entityLocation({ hash: 123, name: 'Same name' }), entityLocation({ hash: 456, name: 'Same name' }))
  assert.deepEqual(entityLocation({ id: 'radiant' }).params, { kind: 'curated', id: 'radiant' })
  assert.equal(entityLocation({ name: 'Unmapped' }), null)
  assert.equal(entityLocation({ itemHash: 123, vendorHash: 999 }, 'vendors').params.kind, 'items')
})

test('reverse references match registered identity, not names or free text', () => {
  const entities = { weapon: { manifestHash: 123 }, grenade: { manifestHash: 777 } }
  const builds = [
    { id: 'correct', weapons: [{ itemId: 'weapon' }] },
    { id: 'skill', abilities: { grenadeId: 'grenade' } },
    { id: 'wrong-version', weapons: [{ manifestHash: 456 }], notes: 'weapon 123' },
    { id: 'private', visibility: 'private', weapons: [{ itemId: 'weapon' }] },
    { id: 'template', isTemplateBaseline: true, weapons: [{ itemId: 'weapon' }] }
  ]
  assert.deepEqual(relatedBuilds({ hash: 123 }, builds, entities).map(b => b.id), ['correct'])
  assert.deepEqual(relatedBuilds({ hash: 777 }, builds, entities).map(b => b.id), ['skill'])
  assert.deepEqual(relatedBuilds({ id: 'weapon' }, builds, entities).map(b => b.id), ['correct'])
  assert.deepEqual(relatedBuilds({ name: 'weapon' }, builds, entities), [])
})

test('reverse references cover mods, artifacts and mechanics without publishing private drafts', () => {
  const build = { id: 'example', mods: { helmet: [{ manifestHash: 10 }] }, artifactNodeHashes: [20], mechanicIds: ['radiant'] }
  for (const item of [{ hash: 10 }, { hash: 20 }, { id: 'radiant' }]) assert.equal(relatedBuilds(item, [build]).length, 1)
  assert.deepEqual(relatedBuilds({ hash: 10 }, []), [])
  const withPerks = { weapons: [{ perkCombinations: [{ recommendedPerkHashes: { trait1: [30] } }] }] }
  assert.equal(relatedBuilds({ hash: 30 }, [withPerks]).length, 1)
})

test('history displays only recorded changes and does not turn sync dates into changes', () => {
  assert.deepEqual(entryHistory({ syncedAt: '2026-09-08', verifiedAt: '2026-09-08' }), [])
  const item = { history: [{ date: '2026-09-01', summary: 'Added source' }, { date: '2026-09-08', summary: 'Updated description' }, { date: '2026-09-09' }] }
  assert.equal(entryHistory(item)[0].summary, 'Updated description')
  assert.equal(item.history[0].date, '2026-09-01')
})
