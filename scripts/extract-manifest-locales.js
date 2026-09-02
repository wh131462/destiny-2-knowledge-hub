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
const payload = {
  manifestVersion: inventory.manifestVersion,
  locale: 'zh-chs',
  generatedAt: new Date().toISOString(),
  items: project(inventory.data, ['name', 'description']),
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
