// Read-only evidence audit. Run from any directory; JSON is written to stdout.
// Definition rules describe possible failures, not a live account's state.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { armorGroups } from '../packages/manifest-catalog/armor.js'
import { weaponVersionGroups } from '../packages/manifest-catalog/weapon-details.js'
import { armorSockets, blankDraft, modErrors } from '../packages/loadout-planner/index.js'
import { validateLoadout } from '../packages/loadout-planner/validation.js'
import { subclasses } from '../content/catalog/subclasses.js'
import { abilities } from '../content/catalog/abilities.js'
import { aspects } from '../content/catalog/aspects.js'
import { facets } from '../content/catalog/facets.js'
import { fragments } from '../content/catalog/fragments.js'

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))
const raw = read('data/manifest/DestinyInventoryItemDefinition.json')
const rawSets = read('data/manifest/DestinyPlugSetDefinition.json')
const catalogs = Object.fromEntries(['equipment-rich', 'armor', 'mods', 'plugs', 'plugsets', 'artifact', 'abilities'].map(name => [name, read(`data/catalog/manifest-${name}.json`)]))
for (const snapshot of [rawSets, ...Object.values(catalogs)]) assert.equal(snapshot.manifestVersion, raw.manifestVersion)
const inventory = raw.data
const equipment = catalogs['equipment-rich'].items
const mods = catalogs.mods.items
const plugs = catalogs.plugs.items
const plugSets = catalogs.plugsets.sets
const equipmentByHash = new Map(equipment.map(item => [item.hash, item]))
const rules = item => [...new Set([...(item?.insertionRules || []), ...(item?.enabledRules || [])].map(rule => rule.failureMessage).filter(Boolean))]
const info = item => ({ hash: item.hash, name: item.nameZh || item.name })
const differs = (group, value) => new Set(group.map(item => JSON.stringify(value(item)))).size > 1
const weaponGroups = [...weaponVersionGroups(equipment.filter(item => item.itemType === 3)).values()].filter(group => group.length > 1)
const groupedArmor = armorGroups(catalogs.armor.items).filter(group => group.length > 1)
const modSignature = item => armorSockets(equipmentByHash.get(item.hash), mods, plugSets).map(socket => socket.options.map(mod => mod.hash).sort((a, b) => a - b))
const ruleCounts = new Map()
for (const plug of plugs) for (const rule of rules(plug)) ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1)
const energyPairs = [...Map.groupBy(mods, item => item.name).values()].filter(group => group.some(item => item.energyCost === 1) && group.some(item => item.energyCost === 3))
const artifactMod = 644105
const selectable = equipment.filter(item => item.itemType === 2).flatMap(item => {
  const socket = armorSockets(item, mods, plugSets).find(socket => socket.options.some(mod => mod.hash === artifactMod))
  return socket ? [{ ...info(item), socketIndex: socket.index, errors: modErrors(item, [{ socketIndex: socket.index, manifestHash: artifactMod }], mods, plugSets) }] : []
})
const example = selectable[0]
assert.ok(example)
const armorItem = equipmentByHash.get(example.hash)
const draft = blankDraft()
draft.classId = armorItem.classId
draft.subclassId = subclasses.find(subclass => subclass.classId === draft.classId).id
draft.armor.helmet = { manifestHash: example.hash }
draft.mods.helmet = [{ socketIndex: example.socketIndex, manifestHash: artifactMod }]
const loadoutErrors = validateLoadout(draft, { subclasses, abilities, aspects, facets, fragments, equipment, mods, plugSets, artifacts: catalogs.artifact.items, manifestAbilities: catalogs.abilities.items })

const craftingRows = equipment.filter(item => item.itemType === 3).flatMap(item => item.socketPools.flatMap(socket => {
  if (!/WEAPON PERK/i.test(socket.socketCategory || '')) return []
  return [...new Set([socket.plugSetHash, socket.randomizedPlugSetHash].filter(Boolean))].flatMap(setHash => (rawSets.data[setHash]?.reusablePlugItems || []).filter(row =>
    socket.plugItemHashes.includes(row.plugItemHash) && (row.craftingRequirements?.requiredLevel || row.craftingRequirements?.unlockRequirements?.length)
  ).map(row => ({ weaponHash: item.hash, weaponName: item.nameZh || item.name, socketIndex: socket.socketIndex, setHash,
    plugHash: row.plugItemHash, plugName: inventory[row.plugItemHash]?.displayProperties?.name, requirements: row.craftingRequirements })))
}))
const weaponExample = name => equipment.filter(item => item.name === name).map(item => ({ ...info(item),
  isHolofoil: inventory[item.hash].isHolofoil, releaseTags: (inventory[item.hash].traitIds || []).filter(id => id.startsWith('releases.')),
  recipeItemHash: inventory[item.hash].inventory?.recipeItemHash || null,
  originSockets: item.socketPools.filter(socket => socket.perkColumn === 'origin').map(socket => ({ socketIndex: socket.socketIndex, candidates: socket.plugNamesZh })),
  specialSockets: item.socketPools.filter(socket => /crafting|tier5/.test(inventory[socket.initialItemHash]?.plug?.plugCategoryIdentifier || '')).map(socket => ({ socketIndex: socket.socketIndex, category: inventory[socket.initialItemHash].plug.plugCategoryIdentifier }))
}))
const output = {
  manifestVersion: raw.manifestVersion, inventorySyncedAt: raw.syncedAt,
  scope: 'Local definition snapshots and actual catalog grouping/validation functions; no live account, current availability, or browser verification.',
  counts: {
    equipment: equipment.length, weapons: equipment.filter(item => item.itemType === 3).length, armor: equipment.filter(item => item.itemType === 2).length,
    weaponGroupsWithMultipleVersions: weaponGroups.length,
    weaponGroupsWithDifferentReleaseTags: weaponGroups.filter(group => differs(group, item => (inventory[item.hash].traitIds || []).filter(id => id.startsWith('releases.')))).length,
    weaponGroupsWithDifferentHolofoilFlag: weaponGroups.filter(group => differs(group, item => inventory[item.hash].isHolofoil)).length,
    weaponGroupsWithDifferentRecipePresence: weaponGroups.filter(group => differs(group, item => Boolean(inventory[item.hash].inventory?.recipeItemHash))).length,
    weaponGroupsWithDifferentPerkPools: weaponGroups.filter(group => differs(group, item => item.socketPools.filter(socket => /WEAPON PERK/i.test(socket.socketCategory || '')).map(socket => socket.plugItemHashes))).length,
    armorGroupsWithMultipleVersions: groupedArmor.length,
    armorGroupsWithDifferentModCandidates: groupedArmor.filter(group => differs(group, modSignature)).length,
    mods: mods.length, modsWithNonemptyRules: mods.filter(item => rules(inventory[item.hash].plug).length).length,
    sameNameOneAndThreeEnergyGroups: energyPairs.length,
    oneEnergyVariantsRequiringArtifact: energyPairs.flat().filter(item => item.energyCost === 1 && rules(inventory[item.hash].plug).includes('Must Be Selected in the Seasonal Artifact')).length,
    modEnergyMismatches: mods.filter(item => item.energyCost !== (inventory[item.hash].plug?.energyCost?.energyCost ?? null)).length,
    armorDefinitionsOfferingArtifactHeavyFinder: selectable.length,
    weaponsWithPerkCraftingRequirements: new Set(craftingRows.map(row => row.weaponHash)).size,
    plugDefinitionsWithRules: plugs.filter(item => rules(item).length).length,
    sameNameNormalEnhancedWeaponModGroups: [...Map.groupBy(plugs, item => item.name).values()].filter(group => group.some(item => item.typeName === 'Weapon Mod') && group.some(item => item.typeName === 'Enhanced Weapon Mod')).length
  },
  validationReproduction: { armor: example, modHash: artifactMod, rawModRules: rules(inventory[artifactMod].plug), artifactHash: draft.artifactHash, loadoutErrors },
  examples: {
    fatebringer: weaponExample('Fatebringer'), longArm: weaponExample('Long Arm'),
    sunbracers: equipment.filter(item => item.name === 'Sunbracers').map(item => ({ ...info(item),
      modernModSockets: armorSockets(item, mods, plugSets).map(socket => socket.index),
      modSocketDefinitions: item.socketPools.filter(socket => socket.socketCategory === 'ARMOR MODS').map(socket => ({ socketIndex: socket.socketIndex, initialItemHash: socket.initialItemHash, category: inventory[socket.initialItemHash]?.plug?.plugCategoryIdentifier || null }))
    })),
    fatebringerCraftingRequirements: craftingRows.filter(row => row.weaponHash === 4184168210 && row.plugHash === 3619207468),
    restrictedPlugs: [52638289, 325500297, 299264772, 1285109625, 79833168].map(hash => { const item = plugs.find(item => item.hash === hash); return { ...info(item), typeName: item.typeName, rules: rules(item) } })
  },
  ruleCounts: Object.fromEntries([...ruleCounts].sort((a, b) => b[1] - a[1]))
}
console.log(JSON.stringify(output, null, 2))
