import { gearItems, armorMods, exoticClassItemTraits, abilities, aspects, facets, fragments, armorSets, mechanics, subclasses, activitiesV2 } from './v2'

export const editorialEntries = [...gearItems, ...armorMods, ...exoticClassItemTraits, ...abilities, ...aspects, ...facets, ...fragments, ...armorSets, ...mechanics, ...subclasses, ...activitiesV2]
export const editorialById = Object.fromEntries(editorialEntries.map(item => [item.id, item]))
