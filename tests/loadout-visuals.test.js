import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { useLoadoutVisuals } from '../web/src/composables/useLoadoutVisuals.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'

const load = name => JSON.parse(readFileSync(new URL('../data/catalog/' + name + '.json', import.meta.url))).items
const abilities = load('manifest-abilities')
const catalog = load('manifest-items')
const wrap = value => ({ value })
function visuals(subclass, overrides = {}) {
  return useLoadoutVisuals({
    subclassAssets: wrap(catalog.filter(a => a.itemType === 16)),
    fragmentAssets: wrap(abilities.filter(a => /Fragment/.test(a.typeName))),
    manifestAbilities: wrap(abilities),
    assetFor: item => item?.hash ? catalog.find(a => a.hash === item.hash) : null,
    iconFor: item => item?.icon ? 'https://www.bungie.net' + item.icon : '',
    ...overrides
  }, wrap(subclass))
}

test('每个子职业与已收录碎片都使用实际游戏定义的配图', () => {
  const { visualIcon, visualAsset } = visuals()
  for (const item of [...subclasses, ...facets, ...fragments]) {
    assert.ok(visualAsset(item)?.hash, item.id)
    assert.match(visualIcon(item), /^https:\/\/www\.bungie\.net\/common\//, item.id)
  }
})

test('同名星相按普通/棱镜职业分别解析，槽位与说明不串用', () => {
  const aspect = aspects.find(a => a.id === 'aspect-consecration')
  const prism = visuals({ classId: 'titan', type: 'prismatic' })
  const solar = visuals({ classId: 'titan', type: 'monochromatic' })
  assert.equal(prism.visualAsset(aspect).hash, 1262901520)
  assert.equal(solar.visualAsset(aspect).hash, 2984351206)
  assert.equal(prism.visualAsset(aspect).fragmentSlots, 2)
  assert.equal(solar.visualAsset(aspect).fragmentSlots, 3)
  assert.match(prism.visualDescription(aspect), /近战/)
  assert.ok(prism.visualAsset(aspect).perkDetails.some(p => p.hash === 410180492))
})

test('棱镜特性显示关联效果，而非空说明或仅物品风味文字', () => {
  const purpose = facets.find(f => f.id === 'facet-purpose')
  const { visualAsset, visualDescription } = visuals()
  assert.equal(visualAsset(purpose).hash, 124726498)
  assert.ok(visualAsset(purpose).perkDetails.some(p => p.hash === 3595322695))
  assert.match(visualDescription(purpose), /能量球/)
})

test('缺少匹配职业的星相定义时不借用同名异职业图标', () => {
  const aspect = aspects.find(a => a.id === 'aspect-consecration')
  const { visualIcon } = visuals({ classId: 'hunter', type: 'prismatic' })
  assert.equal(visualIcon(aspect), '')
  const empty = visuals(null, { subclassAssets: wrap([]), fragmentAssets: wrap([]), manifestAbilities: wrap([]) })
  assert.equal(empty.visualIcon(subclasses[0]), '')
  assert.equal(empty.visualIcon(null), '')
})
