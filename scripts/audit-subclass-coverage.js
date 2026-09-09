import { readFileSync } from 'node:fs'
import { auditSubclassCoverage } from '../packages/subclass-catalog/index.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { fragments } from '../content/catalog/fragments.js'
import { facets } from '../content/catalog/facets.js'
const load = name => JSON.parse(readFileSync(new URL('../data/catalog/' + name + '.json', import.meta.url)))
const source = load('manifest-subclasses'), definitions = load('manifest-abilities')
const inventory = load('manifest-items'), plugSets = load('manifest-plugsets')
const result = auditSubclassCoverage({ subclasses, skills: [...abilities, ...aspects, ...fragments, ...facets], definitions: definitions.items, inventoryItems: inventory.items, plugSets: plugSets.sets })
for (const [name, payload] of Object.entries({ definitions, inventory, plugSets })) {
  if (payload.manifestVersion !== source.manifestVersion) result.errors.push('Mixed Manifest version: ' + name)
}
result.status = result.errors.length ? 'failed' : 'passed'
console.log(JSON.stringify({ manifestVersion: source.manifestVersion, syncedAt: source.syncedAt, ...result }, null, 2))
if (result.errors.length) process.exitCode = 1
