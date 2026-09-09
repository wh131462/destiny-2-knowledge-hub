import { dungeonGuides } from './dungeon-guides.js'
import { raidGuides } from './raid-guides.js'
import { eventGuides } from './event-guides.js'
import { playGuides } from './play-guides.js'
import { withActivityReferences } from './activity-references.js'

const activitiesBase = [
  {
    id: 'pve-general', name: '日常 PvE / 速刷', category: 'pve', fireteam: '1–3',
    weights: { survivability: 15, addClear: 35, control: 15, bossDamage: 10, support: 5, ammoEconomy: 20 },
    requirements: { championTypes: [], range: 'mixed', lockedLoadout: false }
  },
  {
    id: 'legend-campaign', name: '传说战役 / 单人高难', category: 'pve', fireteam: '1–3',
    weights: { survivability: 30, addClear: 20, control: 20, bossDamage: 15, support: 0, ammoEconomy: 15 },
    requirements: { championTypes: [], range: 'mixed', lockedLoadout: false }
  },
  {
    id: 'grandmaster', name: '高难 PvE', category: 'pve', fireteam: '按所选活动',
    weights: { survivability: 30, addClear: 10, control: 20, bossDamage: 10, support: 15, ammoEconomy: 15 },
    requirements: { championTypes: [], range: 'mid-long', lockedLoadout: null, activityDependent: true }
  },
  {
    id: 'raid-mechanics', name: '突袭机制位', category: 'pve', fireteam: '6',
    weights: { survivability: 15, addClear: 20, control: 10, bossDamage: 20, support: 20, ammoEconomy: 15 },
    requirements: { championTypes: [], range: 'mixed', lockedLoadout: false }
  },
  {
    id: 'raid-boss', name: '突袭 / 地牢首领输出', category: 'pve', fireteam: '3–6',
    weights: { survivability: 10, addClear: 5, control: 0, bossDamage: 55, support: 15, ammoEconomy: 15 },
    requirements: { championTypes: [], range: 'boss-dependent', lockedLoadout: false }
  },
  {
    id: 'pvp-3v3', name: '竞技 / 试炼 3v3', category: 'pvp', fireteam: '3',
    weights: { survivability: 25, mobility: 25, neutralGame: 30, burst: 20 },
    requirements: { championTypes: [], range: 'map-dependent', lockedLoadout: false }
  }
]

const catalogActivity = (id, name, category, fireteam, weights, range = 'mixed') => ({
  id, name, category, fireteam, weights,
  requirements: { championTypes: [], range, lockedLoadout: null, activityDependent: true }
})

const guided = (profile, guide) => withActivityReferences({
  ...profile, ...guide, guideCategory: profile.category,
  description: guide.intro,
  sourceIds: [...(['raid', 'dungeon'].includes(profile.category) || guide.evidence?.length ? ['bungie-manifest'] : []), 'community-activity-guides', 'editorial-baseline'],
  confidence: 'C', verifiedAt: guide.reference.checkedAt,
  fieldSources: { names: ['raid', 'dungeon'].includes(profile.category) ? 'bungie-manifest' : 'editorial-baseline', gameplay: 'community-activity-guides', preparation: 'editorial-baseline', weights: 'editorial-baseline' }
})

const featuredRaids = raidGuides.map(guide => guided(
  catalogActivity(guide.id, guide.name, 'raid', '6', { survivability: 15, addClear: 20, control: 10, bossDamage: 25, support: 20, ammoEconomy: 10 }), guide
))

const featuredDungeons = dungeonGuides.map(guide => guided(
  catalogActivity(guide.id, guide.name, 'dungeon', '1–3', { survivability: 20, addClear: 15, control: 15, bossDamage: 30, support: 10, ammoEconomy: 10 }, 'boss-dependent'),
  { scope: 'Destiny 2 普通版流程概要；大师、挑战与成就目标另计。', ...guide,
    ...(guide.id === 'dungeon-equilibrium' ? { gaps: '平衡的前两段已核对；Sere 尾王的详细机制在参考资料中尚未补全，目前只提供目标概览。' } : {}) }
))

const featuredEvents = eventGuides.map(guide => guided(
  catalogActivity(guide.id, guide.name, 'event', guide.fireteam,
    guide.combatMode === 'pvp' ? { survivability: 25, mobility: 25, neutralGame: 30, burst: 20 }
      : { survivability: 15, addClear: 35, control: 15, bossDamage: 10, support: 10, ammoEconomy: 15 },
    guide.combatMode === 'pvp' ? 'map-dependent' : 'mixed'), guide
))

export const activitiesV2 = [
  ...activitiesBase.map(profile => guided(profile, playGuides.find(guide => guide.id === profile.id))),
  ...featuredRaids, ...featuredDungeons, ...featuredEvents
]

export const activityById = Object.fromEntries(activitiesV2.map(item => [item.id, item]))
