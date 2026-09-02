import { readFile } from 'node:fs/promises'
import { classesV2, subclasses } from '../content/catalog/subclasses.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'
import { gearItems, armorMods, exoticClassItemTraits } from '../content/catalog/gear.js'
import { armorSets } from '../content/catalog/sets.js'
import { mechanics } from '../content/mechanics/index.js'
import { activitiesV2 } from '../content/catalog/activities.js'
import { curatedBuilds } from '../content/builds/index.js'

const report = {
  generatedAt: new Date().toISOString(),
  scope: '可核验的《终焉之形》棱镜基线；非全游戏 Manifest 镜像。',
  counts: {
    classes: classesV2.length,
    monoSubclasses: subclasses.filter(item => item.type === 'mono').length,
    prismaticSubclasses: subclasses.filter(item => item.type === 'prismatic').length,
    abilities: abilities.length,
    aspects: aspects.length,
    facets: facets.length,
    fragments: fragments.length,
    mechanics: mechanics.length,
    gear: gearItems.length,
    armorSets: armorSets.length,
    exoticClassItemTraits: exoticClassItemTraits.length,
    armorMods: armorMods.length,
    activities: activitiesV2.length,
    validatedBuilds: curatedBuilds.length
  },
  manifest: null,
  gaps: [
    'Bungie Manifest 已同步职业、伤害类型、属性和活动类型组件；全量实体仍需分批导入。',
    '普通五系的可用手雷、星相与碎片入口已覆盖；逐版本变体和解锁状态仍需从 Manifest 继续补全。',
    '全量传说武器、全部异域与逐补丁沙盒数值仍需持续同步。',
    '异域职业物品特性已建模，但尚未发布经过验证的双特性构筑。',
    'DPS 只在具备可靠版本化测试数据后开放计算。'
  ]
}

try {
  const index = JSON.parse(await readFile(new URL('../data/manifest/manifest-index.json', import.meta.url), 'utf8'))
  let normalized = null
  let normalizedActivities = null
  let normalizedPerks = null
  let normalizedAbilities = null
  let links = null
  let acquisitionSources = null
  let modLinks = null
  try { normalized = JSON.parse(await readFile(new URL('../data/catalog/manifest-equipment.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { normalizedActivities = JSON.parse(await readFile(new URL('../data/catalog/manifest-activities.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { normalizedPerks = JSON.parse(await readFile(new URL('../data/catalog/manifest-perks.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { normalizedAbilities = JSON.parse(await readFile(new URL('../data/catalog/manifest-abilities.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  let normalizedMods = null
  let normalizedRich = null
  let dropCoverage = null
  let activityRewards = null
  let itemSets = null
  try { normalizedMods = JSON.parse(await readFile(new URL('../data/catalog/manifest-mods.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { normalizedRich = JSON.parse(await readFile(new URL('../data/catalog/manifest-equipment-rich.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { dropCoverage = JSON.parse(await readFile(new URL('../data/catalog/manifest-drop-coverage.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { activityRewards = JSON.parse(await readFile(new URL('../data/catalog/manifest-activity-rewards.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { itemSets = JSON.parse(await readFile(new URL('../data/catalog/manifest-item-sets.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { links = JSON.parse(await readFile(new URL('../data/catalog/curated-manifest-links.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { acquisitionSources = JSON.parse(await readFile(new URL('../data/catalog/acquisition-sources.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  try { modLinks = JSON.parse(await readFile(new URL('../data/catalog/curated-mod-links.json', import.meta.url), 'utf8')) } catch { /* optional */ }
  report.manifest = {
    version: index.manifestVersion,
    syncedAt: index.syncedAt,
    components: index.files.map(file => ({ component: file.component, count: file.count })),
    normalizedEquipment: normalized?.count || 0,
    normalizedActivities: normalizedActivities?.count || 0,
    normalizedPerks: normalizedPerks?.count || 0,
    normalizedAbilities: normalizedAbilities?.count || 0,
    normalizedEquipmentRich: normalizedRich?.count || 0,
    normalizedMods: normalizedMods?.count || 0,
    activityRewardEdges: activityRewards?.count || 0,
    itemSets: itemSets?.count || 0,
    dropMappingCoverage: dropCoverage ? `${dropCoverage.withRewardMapping}/${dropCoverage.count}` : '未生成',
    curatedLinks: links ? `${links.matched}/${links.count}` : '未生成',
    acquisitionSources: acquisitionSources ? acquisitionSources.count : 0,
    curatedModLinks: modLinks ? `${modLinks.matched}/${modLinks.count}` : '未生成',
    curatedModConsistency: modLinks ? `${modLinks.consistent}/${modLinks.count}` : '未生成'
  }
} catch {
  report.manifest = { status: '未同步' }
}

console.log(JSON.stringify(report, null, 2))
