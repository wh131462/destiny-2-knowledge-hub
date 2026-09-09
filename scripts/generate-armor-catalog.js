import { readFile, writeFile } from 'node:fs/promises'
import { createArmorCatalog } from '../packages/manifest-catalog/armor.js'

export async function generateArmorCatalog() {
  const files = { equipment: 'manifest-equipment-rich', sets: 'manifest-item-sets', plugs: 'manifest-plugs', plugSets: 'manifest-plugsets', mods: 'manifest-mods', references: 'manifest-references' }
  const entries = await Promise.all(Object.entries(files).map(async ([key, file]) => [key, JSON.parse(await readFile(new URL(`../data/catalog/${file}.json`, import.meta.url), 'utf8'))]))
  const input = Object.fromEntries(entries)
  if (entries.some(([, data]) => data.manifestVersion !== input.equipment.manifestVersion)) throw new Error('Armor catalog: Manifest versions must match')
  const catalog = createArmorCatalog(input)
  const json = JSON.stringify(catalog)
  for (const dir of ['data/catalog', 'web/public/data']) await writeFile(new URL(`../${dir}/manifest-armor.json`, import.meta.url), json + '\n')
  console.log(`防具目录：${catalog.items.length} 个定义 ${catalog.sets.length} 套 ${catalog.mods.length} 个模组 ${(json.length / 1024 / 1024).toFixed(1)} MB`)
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) await generateArmorCatalog()
