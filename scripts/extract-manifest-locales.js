import { readFile, rm, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const manifestDir = new URL('data/manifest/', root)
const outputFiles = [new URL('data/catalog/manifest-locales-zh-chs.json', root), new URL('web/public/data/manifest-locales-zh-chs.json', root)]

const load = async name => JSON.parse(await readFile(new URL(name, manifestDir), 'utf8'))
const project = (data, fields) => Object.fromEntries(Object.entries(data || {}).map(([hash, item]) => [hash, Object.fromEntries(fields.map(field => [field, item.displayProperties?.[field] || null]))]))

const inventory = await load('DestinyInventoryItemDefinition.zh-chs.json')
const activities = await load('DestinyActivityDefinition.zh-chs.json')
const perks = await load('DestinySandboxPerkDefinition.zh-chs.json')
const vendors = await load('DestinyVendorDefinition.zh-chs.json')
const extraComponents = { artifacts: 'DestinyArtifactDefinition', itemSets: 'DestinyEquipableItemSetDefinition', classes: 'DestinyClassDefinition', damageTypes: 'DestinyDamageTypeDefinition', stats: 'DestinyStatDefinition', activityTypes: 'DestinyActivityTypeDefinition', itemCategories: 'DestinyItemCategoryDefinition', equipmentSlots: 'DestinyEquipmentSlotDefinition', socketCategories: 'DestinySocketCategoryDefinition', socketTypes: 'DestinySocketTypeDefinition' }
const extras = Object.fromEntries(await Promise.all(Object.entries(extraComponents).map(async ([key, component]) => [key, await load(`${component}.zh-chs.json`)])))
for (const snapshot of [activities, perks, vendors, ...Object.values(extras)]) {
  if (snapshot.manifestVersion !== inventory.manifestVersion) throw new Error('中文组件版本不一致，拒绝合并')
}
const payload = {
  manifestVersion: inventory.manifestVersion,
  locale: 'zh-chs',
  generatedAt: new Date().toISOString(),
  syncedAt: inventory.syncedAt,
  ...Object.fromEntries(Object.entries(extras).map(([key, snapshot]) => [key, project(snapshot.data, ['name', 'description'])])),
  items: Object.fromEntries(Object.entries(project(inventory.data, ['name', 'description'])).map(([hash, item]) => [hash, { ...item,
    ...(inventory.data[hash].plug ? { insertionRules: inventory.data[hash].plug.insertionRules || [], enabledRules: inventory.data[hash].plug.enabledRules || [] } : {}),
    ...(inventory.data[hash].tooltipNotifications?.length ? { tooltipNotifications: inventory.data[hash].tooltipNotifications } : {})
  }])),
  activities: project(activities.data, ['name', 'description']),
  perks: project(perks.data, ['name', 'description']),
  vendors: project(vendors.data, ['name'])
}
for (const output of outputFiles) await writeFile(output, `${JSON.stringify(payload)}\n`)
await rm(new URL('DestinyInventoryItemDefinition.zh-chs.json', manifestDir), { force: true })
await rm(new URL('DestinyActivityDefinition.zh-chs.json', manifestDir), { force: true })
await rm(new URL('DestinySandboxPerkDefinition.zh-chs.json', manifestDir), { force: true })
await rm(new URL('DestinyVendorDefinition.zh-chs.json', manifestDir), { force: true })
console.log(`已提取简体中文名称：${Object.keys(payload.items).length} 个实体；${Object.keys(payload.activities).length} 个活动`)
