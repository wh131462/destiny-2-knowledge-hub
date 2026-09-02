import { readFile } from 'node:fs/promises'
import { curatedBuilds } from '../content/builds/index.js'
import { gearById } from '../content/catalog/gear.js'

const rich = JSON.parse(await readFile(new URL('../data/catalog/manifest-equipment-rich.json', import.meta.url), 'utf8'))
const byName = new Map()
for (const item of rich.items || []) {
  const variants = byName.get(item.name) || []
  variants.push(item)
  byName.set(item.name, variants)
}

const errors = []
const warnings = []
let selections = 0
for (const build of curatedBuilds) {
  for (const selection of build.weapons || []) {
    const gear = gearById[selection.itemId]
    const variants = gear ? (byName.get(gear.en) || []) : []
    if (!variants.length) {
      warnings.push(`${build.id}: ${selection.itemId} 没有匹配的 Manifest 装备实体`)
      continue
    }
    const officialPerks = new Set(variants.flatMap(item => item.perkOptions || []))
    for (const perk of selection.perks || []) {
      selections += 1
      if (!officialPerks.has(perk)) errors.push(`${build.id}: ${gear.en} 的词条 ${perk} 不在当前 Manifest/配方候选中`)
    }
  }
}

console.log(JSON.stringify({
  manifestVersion: rich.manifestVersion,
  builds: curatedBuilds.length,
  weaponPerkSelections: selections,
  errors,
  warnings,
  status: errors.length ? 'failed' : 'passed'
}, null, 2))
if (errors.length) process.exitCode = 1
