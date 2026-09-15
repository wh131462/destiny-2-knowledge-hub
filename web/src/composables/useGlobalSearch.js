import { translateUi } from '../i18n/messages.js'
import { computed, ref } from 'vue'
import { classesV2, subclasses, gearItems, armorSets, activitiesV2, curatedBuilds, abilities, aspects, facets, fragments, mechanics, armorMods } from '@/data/v2'
import { weaponTypes } from '@/data/weapons'
import { exoticArmor } from '@/data/armor'
import { enemyRaces, characters, expansions, sagas } from '@/data/world'
import { glossary } from '@/data/glossary'

const text = (...values) => values.flat(Infinity).filter(Boolean).join(' ')

const makeResult = ({ id, type, title, titleEn, description, descriptionEn, route, keywords = [] }) => ({
  id,
  type,
  title,
  titleEn: titleEn || title,
  description: description || '',
  descriptionEn: descriptionEn || translateUi(description || '', 'en'),
  route,
  haystack: text(title, titleEn, description, descriptionEn, translateUi(description || '', 'en'), keywords).toLowerCase()
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
  descriptionEn: `${item.classId}: ${item.type === 'prismatic' ? 'Prismatic subclass' : item.element}`,
  route: `/classes/${item.classId}?el=${item.element}`,
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
  descriptionEn: [translateUi(item.frame, 'en'), item.element, item.rarity === 'exotic' ? 'Exotic' : ''].filter(Boolean).join(', '),
  route: `/encyclopedia/curated/${item.id}`,
  keywords: [item.slot, item.ammo, ...(item.aliases || []), ...(item.perkOptions || []), ...(item.mechanicIds || [])]
}))

const armorResults = armorSets.map(item => makeResult({
  id: `armor-set-${item.id}`,
  type: 'armor',
  title: item.name,
  titleEn: item.en,
  description: `${item.source}：${item.bonus}`,
  route: `/encyclopedia/curated/${item.id}`,
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
  description: item.intro,
  route: `/activities?entry=${item.id}`,
  keywords: [item.category, item.fireteam, ...(item.aliases || []), ...(item.tags || []), ...(item.rewards || [])]
}))

const rotationResult = makeResult({
  id: 'weekly-rotation', type: 'activities', title: '本周轮换', titleEn: 'Weekly Rotation',
  description: '查看当前周的官方活动轮换、周期和数据状态', descriptionEn: 'Browse the current official activity rotation, reset window, and data status',
  route: '/weekly-rotation', keywords: ['rotation', 'weekly', '轮换', '每周', 'milestone']
})

const loreResults = [
  ...enemyRaces.map(item => makeResult({ id: `enemy-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: item.desc, route: '/lore', keywords: [item.type, item.units] })),
  ...characters.map(item => makeResult({ id: `character-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.role}：${item.desc}`, descriptionEn: `${translateUi(item.role, 'en')}: ${translateUi(item.desc, 'en')}`, route: '/lore', keywords: [item.role] })),
  ...expansions.map(item => makeResult({ id: `expansion-${item.year}-${item.name}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.year}：${item.feature}`, descriptionEn: `${item.year}: ${translateUi(item.feature, 'en')}`, route: '/lore', keywords: [item.destination, item.saga] })),
  ...sagas.map(item => makeResult({ id: `saga-${item.id}`, type: 'lore', title: item.name, titleEn: item.en, description: `${item.years}：${item.desc}`, descriptionEn: `${item.years}: ${translateUi(item.desc, 'en')}`, route: '/lore', keywords: item.key }))
]

const glossaryResults = glossary.map(item => makeResult({
  id: `glossary-${item.term}`,
  type: 'glossary',
  title: item.term,
  titleEn: item.en,
  description: `${item.cat}：${item.desc}`, descriptionEn: `${translateUi(item.cat, 'en')}: ${translateUi(item.desc, 'en')}`,
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

const entryResults = [...abilities, ...aspects, ...facets, ...fragments, ...mechanics, ...armorMods].map(item => makeResult({
  id: `entry-${item.id}`, type: item.slot ? 'armor' : 'subclasses', title: item.name, titleEn: item.en,
  description: item.description || item.effect || item.values?.effect || '',
  route: `/encyclopedia/curated/${item.id}`, keywords: [item.manifestHash, item.aliases, item.mechanicIds]
}))

export const globalSearchIndex = [
  ...classResults,
  ...subclassResults,
  ...weaponResults,
  ...gearResults,
  ...armorResults,
  ...exoticArmorResults,
  ...activityResults,
  rotationResult,
  ...loreResults,
  ...glossaryResults,
  ...buildResults,
  ...entryResults
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
