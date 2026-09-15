import test from 'node:test'
import assert from 'node:assert/strict'
import {
  loreCharacters,
  loreConcepts,
  loreEras,
  loreEvents,
  loreFactions,
  loreReleases,
  loreSources
} from '../web/src/data/world.js'

const recordCollections = { concepts: loreConcepts, events: loreEvents, factions: loreFactions, characters: loreCharacters, releases: loreReleases }
const records = Object.values(recordCollections).flat()
const recordIds = new Set(records.map(item => item.id))
const sourceIds = new Set(loreSources.map(item => item.id))
const eraIds = new Set(loreEras.map(item => item.id))

test('normalized lore records use stable unique ids and paired primary copy', () => {
  assert.equal(recordIds.size, records.length)
  for (const [collection, items] of Object.entries(recordCollections)) {
    assert.ok(items.length > 0, `${collection} must not be empty`)
    for (const item of items) {
      assert.match(item.id, /^[a-z0-9-]+$/, `${collection}:${item.id} has an invalid id`)
      assert.ok(item.name?.trim(), `${item.id} is missing a Chinese name`)
      assert.ok(item.nameEn?.trim(), `${item.id} is missing an English name`)
      const primaryField = collection === 'releases' ? 'feature' : 'summary'
      assert.ok(item[primaryField]?.trim(), `${item.id} is missing ${primaryField}`)
      assert.ok(item[`${primaryField}En`]?.trim(), `${item.id} is missing ${primaryField}En`)
      assert.ok(Number.isInteger(item.spoilerLevel) && item.spoilerLevel >= 0 && item.spoilerLevel <= 2, `${item.id} has an invalid spoiler level`)
      assert.ok(eraIds.has(item.eraId), `${item.id} references unknown era ${item.eraId}`)
      assert.match(item.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${item.id} is missing a verification date`)
    }
  }
})

test('lore relationships and provenance resolve to known records', () => {
  for (const item of records) {
    for (const relatedId of item.relatedIds || []) assert.ok(recordIds.has(relatedId), `${item.id} references unknown lore record ${relatedId}`)
    assert.ok(item.sourceIds?.length, `${item.id} has no sources`)
    for (const sourceId of item.sourceIds) assert.ok(sourceIds.has(sourceId), `${item.id} references unknown source ${sourceId}`)
  }
})

test('factions distinguish political alignment from species', () => {
  for (const faction of loreFactions) {
    assert.ok(faction.species?.trim() && faction.speciesEn?.trim(), `${faction.id} is missing species context`)
    assert.ok(faction.alignment?.trim(), `${faction.id} is missing an alignment id`)
    assert.ok(faction.alignmentZh?.trim() && faction.alignmentEn?.trim(), `${faction.id} is missing localized alignment`)
  }
  assert.notEqual(loreFactions.find(item => item.id === 'imperial-cabal')?.id, loreFactions.find(item => item.id === 'witness-forces')?.id)
})

test('source registry and eras provide bilingual display metadata', () => {
  assert.equal(sourceIds.size, loreSources.length)
  for (const source of loreSources) {
    assert.ok(source.name?.trim() && source.nameEn?.trim())
    assert.ok(source.typeZh?.trim() && source.typeEn?.trim())
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/)
  }
  for (const era of loreEras) assert.ok(era.name?.trim() && era.nameEn?.trim())
})
