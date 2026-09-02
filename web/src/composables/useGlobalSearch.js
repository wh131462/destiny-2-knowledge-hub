import { computed, ref } from 'vue'
import { classesV2, subclasses, gearItems, armorSets, activitiesV2, curatedBuilds } from '@/data/v2'
import { weaponTypes } from '@/data/weapons'
import { exoticArmor } from '@/data/armor'
import { enemyRaces, characters, expansions, sagas } from '@/data/world'
import { glossary } from '@/data/glossary'

const text = (...values) => values.flat(Infinity).filter(Boolean).join(' ')

const makeResult = ({ id, type, title, titleEn, description, route, keywords = [] }) => ({
  id,
  type,
  title,
  titleEn: titleEn || title,
  description: description || '',
  route,
  haystack: text(title, titleEn, description, keywords).toLowerCase()
})

const classResults = classesV2.map(item => makeResult({
  id: `class-${item.id}`,
  type: 'classes',
  title: item.name,
  titleEn: item.en,
  description: item.desc,
  route: `/classes/${item.id}`,
  keywords: [item.role, ...(item.traits || [])]
}))

const subclassResults = subclasses.map(item => makeResult({
  id: `subclass-${item.id}`,
  type: 'subclasses',
  title: item.name,
  titleEn: item.en,
  description: `${item.classId}：${item.type === 'prismatic' ? '棱镜职业' : item.element}`,
  route: item.type === 'prismatic' ? '/prismatic' : `/classes/${item.classId}?el=${item.element}`,
  keywords: [item.classId, item.element, ...(item.aspectIds || [])]
}))

const weaponResults = weaponTypes.map(item => makeResult({
  id: `weapon-type-${item.id}`,
  type: 'weapons',
  title: item.name,
  titleEn: item.en,
  description: item.desc,
  route: '/weapons',
  keywords: [item.slot, item.range]
}))

const gearResults = gearItems.map(item => makeResult({
  id: `gear-${item.id}`,
  type: item.type === 'armor' || item.type === 'exoticClassItem' ? 'armor' : 'weapons',
  title: item.name,
  titleEn: item.en,
  description: [item.frame, item.element, item.rarity === 'exotic' ? '异域' : ''].filter(Boolean).join('、'),
  route: item.type === 'armor' || item.type === 'exoticClassItem' ? '/armor' : '/weapons',
  keywords: [item.slot, item.ammo, ...(item.aliases || []), ...(item.perkOptions || []), ...(item.mechanicIds || [])]
}))

const armorResults = armorSets.map(item => makeResult({
  id: `armor-set-${item.id}`,
  type: 'armor',
  title: item.name,
  titleEn: item.en,
  description: `${item.source}：${item.bonus}`,
  route: '/armor',
  keywords: item.stats
}))

const exoticArmorResults = exoticArmor.map(item => makeResult({
  id: `exotic-armor-${item.id}`,
  type: 'armor',
  title: item.name,
  titleEn: item.en,
  description: item.desc,
  route: '/armor',
  keywords: [item.classId, item.element]
}))

const activityResults = activitiesV2.map(item => makeResult({
  id: `activity-${item.id}`,
  type: 'activities',
  title: item.name,
  titleEn: item.en,
  description: `${item.category || ''}：${item.fireteam || ''}`,
  route: '/activities',
  keywords: [item.category, item.fireteam]
}))

const loreResults = [
  ...enemyRaces.map(item => makeResult({ id: `enemy-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: item.desc, route: '/lore', keywords: [item.type, item.units] })),
  ...characters.map(item => makeResult({ id: `character-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.role}：${item.desc}`, route: '/lore', keywords: [item.role] })),
  ...expansions.map(item => makeResult({ id: `expansion-${item.year}-${item.name}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.year}：${item.feature}`, route: '/lore', keywords: [item.destination, item.saga] })),
  ...sagas.map(item => makeResult({ id: `saga-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.years}：${item.desc}`, route: '/lore', keywords: item.key }))
]

const glossaryResults = glossary.map(item => makeResult({
  id: `glossary-${item.term}`,
  type: 'glossary',
  title: item.term,
  titleEn: item.en,
  description: `${item.cat}：${item.desc}`,
  route: '/glossary',
  keywords: [item.cat]
}))

const buildResults = curatedBuilds.map(item => makeResult({
  id: `build-${item.id}`,
  type: 'builds',
  title: item.name,
  titleEn: item.name,
  description: item.goal,
  route: `/builds/${item.id}`,
  keywords: [item.classId, item.subclassId, item.difficulty, item.tags, item.mechanicIds]
}))

export const globalSearchIndex = [
  ...classResults,
  ...subclassResults,
  ...weaponResults,
  ...gearResults,
  ...armorResults,
  ...exoticArmorResults,
  ...activityResults,
  ...loreResults,
  ...glossaryResults,
  ...buildResults
]

export function useGlobalSearch() {
  const query = ref('')
  const results = computed(() => {
    const normalized = query.value.trim().toLowerCase()
    if (!normalized) return []
    return globalSearchIndex
      .filter(item => item.haystack.includes(normalized))
      .slice(0, 8)
  })

  return { query, results }
}
