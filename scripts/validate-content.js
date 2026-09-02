import { curatedBuilds } from '../content/builds/index.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { gearItems } from '../content/catalog/gear.js'
import { armorSets } from '../content/catalog/sets.js'
import { activitiesV2 } from '../content/catalog/activities.js'
import { mechanics } from '../content/mechanics/index.js'
import { acquisitionPaths } from '../content/acquisition/paths.js'
import { requiredBuildFields, validateShape, findDuplicateIds } from '../packages/schema/index.js'
import { validateBuild, calculateStats } from '../packages/rules-engine/index.js'
import { MANIFEST_VERSION } from '../content/meta.js'
import { readFile } from 'node:fs/promises'

const collections = { abilities, aspects, facets, subclasses, gearItems, armorSets, activitiesV2, mechanics, acquisitionPaths, curatedBuilds }
const errors = []
const warnings = []

for (const [name, collection] of Object.entries(collections)) {
  for (const id of findDuplicateIds(collection)) errors.push(`${name} 存在重复 id：${id}`)
}

for (const build of curatedBuilds) {
  errors.push(...validateShape(build, requiredBuildFields, `build:${build.id}`))
  const validation = validateBuild(build)
  errors.push(...validation.errors.map(item => `${build.id}: ${item.message}`))
  warnings.push(...validation.warnings.map(item => `${build.id}: ${item.message}`))
  const stats = calculateStats(build)
  for (const check of stats.targetChecks) {
    if (!check.met) errors.push(`${build.id}: ${check.stat} 目标 ${check.target}，实际只有 ${check.actual}`)
  }
}

for (const set of armorSets) {
  if (!acquisitionPaths.some(path => path.id === set.acquisitionId)) errors.push(`${set.id}: ${set.acquisitionId}`)
}

for (const build of curatedBuilds) {
  if (build.manifestVersion !== MANIFEST_VERSION) errors.push(`${build.id}: Manifest 版本 ${build.manifestVersion} != ${MANIFEST_VERSION}`)
}
try {
  const index = JSON.parse(await readFile(new URL('../data/manifest/manifest-index.json', import.meta.url), 'utf8'))
  if (index.manifestVersion !== MANIFEST_VERSION) errors.push(`Manifest 快照版本 ${index.manifestVersion} != 内容版本 ${MANIFEST_VERSION}`)
  for (const fileName of ['curated-acquisition-index.json', 'acquisition-sources.json', 'curated-mod-links.json']) {
    const payload = JSON.parse(await readFile(new URL(`../data/catalog/${fileName}`, import.meta.url), 'utf8'))
    if (payload.manifestVersion !== MANIFEST_VERSION) errors.push(`${fileName}: Manifest 版本不一致`)
  }
} catch (error) {
  warnings.push(`版本一致性检查跳过：${error.message}`)
}

console.log(`内容实体：${Object.values(collections).reduce((sum, list) => sum + list.length, 0)}`)
console.log(`已校验构筑：${curatedBuilds.length}`)
for (const warning of warnings) console.warn(`警告：${warning}`)
if (errors.length) {
  for (const error of errors) console.error(`错误：${error}`)
  process.exitCode = 1
} else {
  console.log(`校验通过；${warnings.length} 条场景警告会在网站中明确展示。`)
}
