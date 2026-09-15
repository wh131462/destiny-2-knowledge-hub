import test from 'node:test'
import assert from 'node:assert/strict'
import { translateUi, translateGeneratedMessage } from '../web/src/i18n/messages.js'
import { createCatalogText } from '../web/src/i18n/catalogText.js'
import { activitiesV2 } from '../content/catalog/activities.js'
import * as world from '../web/src/data/world.js'
import { glossary } from '../web/src/data/glossary.js'
import { handCannonTierList, tierMeta } from '../web/src/data/weaponTierList.js'
import { blankDraft } from '../packages/loadout-planner/index.js'
import { createLoadoutExportModel } from '../web/src/utils/loadoutExportModel.js'
import { renderLoadoutHtml } from '../packages/loadout-export/index.js'

const han = /[\u3400-\u9fff]/
function assertTranslated(value, path) {
  if (Array.isArray(value)) return value.forEach((item, index) => assertTranslated(item, `${path}[${index}]`))
  if (value && typeof value === 'object') return Object.entries(value).forEach(([key, item]) => assertTranslated(item, `${path}.${key}`))
  if (typeof value === 'string' && han.test(value)) assert.ok(!han.test(translateUi(value, 'en')), `${path}: ${value}`)
}

test('UI interpolation preserves author text and literal replacement characters', () => {
  const name = '我的配装 $& $1 {0} <script>'
  assert.equal(translateUi('{0} 副本', 'en', [name]), `${name} copy`)
  assert.equal(translateUi('{0} 副本', 'zh', [name]), `${name} 副本`)
  assert.equal(translateGeneratedMessage(`${name} 副本`, 'en'), `${name} copy`)
  assert.equal(translateUi('unregistered text', 'en'), 'unregistered text')
  assert.equal(translateGeneratedMessage('作者原文：我的配装', 'en'), '作者原文：我的配装')
})

test('official display adapters select language without changing hashes or conditions', () => {
  const item = { hash: 42, name: 'Test weapon', nameZh: '测试武器', description: 'English effect', descriptionZh: '中文效果', insertionRules: [{ failureMessage: 'Requires Adept Weapon', failureMessageZh: '仅限专家武器' }] }
  const before = structuredClone(item)
  const en = createCatalogText('en'), zh = createCatalogText('zh')
  assert.equal(en.variantName(item), 'Test weapon')
  assert.equal(zh.variantName(item), '测试武器')
  assert.equal(en.manifestDescription(item), 'English effect')
  assert.equal(zh.manifestDescription(item), '中文效果')
  assert.equal(en.itemConditions(item)[0].text, 'Requires Adept Weapon')
  assert.equal(zh.itemConditions(item)[0].text, '仅限专家武器')
  assert.deepEqual(item, before)
})

test('activity guide display fields have complete English resources, including expanded encounters', () => {
  for (const item of activitiesV2) for (const key of ['intent', 'fireteam', 'destination', 'release', 'tags', 'intro', 'mechanics', 'gaps', 'encounters', 'preparation', 'rewardNote', 'scope', 'reference', 'references', 'evidence']) assertTranslated(item[key], `${item.id}.${key}`)
})

test('lore, glossary and tier-list editorial fields have English resources', () => {
  const legacyWorld = { enemyRaces: world.enemyRaces, characters: world.characters, expansions: world.expansions, sagas: world.sagas }
  for (const [group, items] of Object.entries(legacyWorld)) for (const item of items) for (const key of ['type', 'desc', 'units', 'role', 'feature', 'destination', 'saga', 'key']) assertTranslated(item[key], `${group}.${item.id || item.name}.${key}`)
  glossary.forEach(item => assertTranslated([item.cat, item.desc], item.term))
  handCannonTierList.forEach(item => assertTranslated([item.source, item.note], item.name))
  assertTranslated(tierMeta, 'tierMeta')
})

test('export freezes its language and preserves mixed-language author content', () => {
  const draft = blankDraft()
  draft.name = '作者标题 <script> $&'
  draft.notes = '中文 notes & <tag>'
  draft.weapons[0].manifestHash = 42
  draft.weapons[0].perkCombinations[0].name = '组合 authored'
  draft.weapons[0].perkCombinations[0].recommendedPerks.trait1 = ['手动推荐 perk']
  draft.mods.helmet = [{ socketIndex: 1, manifestHash: 99 }]
  const context = { locale: 'en', equipment: [{ hash: 42, name: 'English weapon', nameZh: '中文武器' }], mods: [{ hash: 99, name: 'English mod', nameZh: '中文模组', energyCost: 3 }] }
  const model = createLoadoutExportModel(draft, context)
  context.locale = 'zh'
  assert.equal(model.weapons[0].hash, 42)
  assert.equal(model.weapons[0].name, 'English weapon')
  assert.equal(model.armor[0].mods[0].caption, 'Socket 2 3 energy')
  assert.equal(model.weapons[0].combinations[0].name, '组合 authored')
  const html = renderLoadoutHtml(model)
  assert.match(html, /lang="en"/)
  assert.match(html, /作者标题 &lt;script&gt; \$&amp;/)
  assert.ok(html.includes('中文 notes &amp; &lt;tag&gt;'))
  assert.ok(html.includes('手动推荐 perk'))
  assert.doesNotMatch(html, /<script>/)
  assert.equal(createLoadoutExportModel(draft, context).weapons[0].name, '中文武器')
})
