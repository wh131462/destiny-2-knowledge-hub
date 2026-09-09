import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { weaponBaseStats, weaponArchivePerks, weaponIntrinsics, weaponVersions, weaponVersionGroups, matchWeaponVersion } from '../packages/manifest-catalog/weapon-details.js'

const load = name => JSON.parse(readFileSync(new URL(`../data/catalog/${name}.json`, import.meta.url)))
const weapons = load('manifest-equipment-rich').items.filter(item => item.itemType === 3)
const plugs = new Map(load('manifest-plugs').items.map(plug => [plug.hash, plug]))
const acrius = weapons.find(item => item.hash === 3580904580)

test('阿克瑞斯传说素体完整匹配参考图，包含零值且不叠加配件加成', () => {
  const stats = weaponBaseStats(acrius)
  assert.deepEqual(stats.map(stat => [stat.key, stat.value]), [
    ['Rounds Per Minute', 55], ['Impact', 85], ['Range', 100], ['Stability', 80],
    ['Handling', 10], ['Reload Speed', 20], ['Magazine', 4], ['Aim Assistance', 90],
    ['Zoom', 12], ['Recoil Direction', 60], ['Airborne Effectiveness', 3], ['Ammo Generation', 0]
  ])
  assert.deepEqual(stats.filter(stat => !stat.bar).map(stat => stat.key), ['Rounds Per Minute', 'Magazine', 'Recoil Direction'])
})

test('固定 Perk 仅有四列，固有特性独立显示且不混入击杀记录器', () => {
  const columns = weaponArchivePerks(acrius, plugs)
  assert.deepEqual(columns.map(column => [column.label, column.options.map(plug => plug.nameZh)]), [
    ['枪管', ['全口径枪膛']], ['弹匣', ['精确弹药']], ['特性一', ['千里眼']], ['枪托', ['适配枪托']]
  ])
  const intrinsic = weaponIntrinsics(acrius, plugs)
  assert.equal(intrinsic.length, 1)
  assert.equal(intrinsic[0].nameZh, '透体电光')
  assert.equal(intrinsic[0].descriptionZh, '可发射贯穿敌人的高伤害电弧冲击能量。')
})

test('同名旧实体保持独立素体和空池，不借用收藏品版本的词条', () => {
  const versions = weaponVersions(acrius, weapons)
  assert.deepEqual(versions.map(item => item.hash), [3580904580, 1744115122])
  assert.equal(weaponBaseStats(versions[1]).find(stat => stat.key === 'Handling').value, 5)
  assert.deepEqual(weaponArchivePerks(versions[1], plugs), [])
})

test('随机武器保留普通和强化 Hash，排除编辑器的空白大师栏目', () => {
  const columns = weaponArchivePerks(weapons.find(item => item.hash === 3947966653), plugs)
  assert.deepEqual(columns.map(column => column.options.length), [14, 16, 18, 18, 2])
  assert.ok(columns[2].options.some(plug => plug.hash === 923806249))
  assert.ok(columns[2].options.some(plug => plug.hash === 3422796781))
})

test('不同武器保留自身专用属性，不把时间或射速画成百分比', () => {
  const stats = weaponBaseStats({ baseStats: { 'Charge Time': 960, 'Blast Radius': 0, Attack: 5, 1885944937: 0 } })
  assert.deepEqual(stats.map(stat => [stat.key, stat.value, stat.bar]), [['Charge Time', 960, false], ['Blast Radius', 0, true]])
  assert.deepEqual(weaponBaseStats(null), [])
})

test('多次发行的武器完整归组，每个 Hash 恰好出现一次，专家版保持独立', () => {
  const groups = weaponVersionGroups(weapons)
  const entries = [...groups.values()].flat()
  assert.equal(entries.length, weapons.length)
  assert.equal(new Set(entries.map(item => item.hash)).size, weapons.length)
  for (const [name, count] of [['Spare Rations', 3], ['The Recluse', 4], ['Igneous Hammer', 3]]) {
    const versions = weaponVersions(weapons.find(item => item.name === name), weapons)
    assert.equal(versions.length, count)
    assert.ok(versions.every(item => item.name === name))
  }
  const adept = weapons.find(item => item.name === 'Igneous Hammer (Adept)')
  assert.ok(weaponVersions(adept, weapons).every(item => item.name === adept.name))
})

test('版本号查询使用完整分组的稳定编号，支持中文、英文和 Hash 精确定位', () => {
  const versions = weaponVersions(weapons.find(item => item.name === 'Spare Rations'), weapons)
  const query = text => versions.filter(item => matchWeaponVersion(item, text, versions)).map(item => item.hash)
  assert.deepEqual(query('备用口粮#2'), [versions[1].hash])
  assert.deepEqual(query('Spare Rations # 3'), [versions[2].hash])
  assert.deepEqual(query(String(versions[0].hash)), [versions[0].hash])
  assert.deepEqual(query('备用口粮#99'), [])
  assert.deepEqual(query('备用口粮#0'), [])
  assert.equal(query('备用口粮').length, 3)
  assert.deepEqual(weaponVersionGroups([...versions].reverse()), weaponVersionGroups(versions))
})

test('多版本发行标记保留在可访问的网页目录中', () => {
  const publicItems = JSON.parse(readFileSync(new URL('../web/public/data/manifest-equipment-rich.json', import.meta.url))).items
  const versions = weapons.filter(item => item.name === 'Spare Rations')
  assert.equal(new Set(versions.map(item => item.iconWatermark)).size, 3)
  for (const item of versions) {
    assert.ok(item.iconWatermark?.startsWith('/common/destiny2_content/icons/'))
    assert.equal(publicItems.find(entry => entry.hash === item.hash).iconWatermark, item.iconWatermark)
  }
})
