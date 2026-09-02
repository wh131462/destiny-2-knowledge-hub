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
    id: 'grandmaster', name: '宗师夜幕', category: 'pve', fireteam: '3',
    weights: { survivability: 30, addClear: 10, control: 20, bossDamage: 10, support: 15, ammoEconomy: 15 },
    requirements: { championTypes: ['barrier', 'overload', 'unstoppable'], range: 'mid-long', lockedLoadout: true }
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
  requirements: { championTypes: [], range, lockedLoadout: false },
  sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31'
})

const featuredRaids = [
  ['leviathan', '利维坦'], ['last-wish', '最终心愿'], ['garden-of-salvation', '救赎之园'], ['deep-stone-crypt', '深石地窖'],
  ['vault-of-glass', '玻璃穹顶'], ['vow-of-the-disciple', '信徒之誓'], ['kings-fall', '王者陨落'], ['root-of-nightmares', '噩梦之根'],
  ['crota-end', '克罗塔之末'], ['salvations-edge', '救赎之刃'], ['desert-perpetual', '永恒荒漠']
].map(([id, name]) => catalogActivity(`raid-${id}`, name, 'raid', '6', { survivability: 15, addClear: 20, control: 10, bossDamage: 25, support: 20, ammoEconomy: 10 }))

const featuredDungeons = [
  ['shattered-throne', '破碎王座'], ['pit-of-heresy', '异端之坑'], ['prophecy', '预言'], ['grasp-of-avarice', '贪婪之握'],
  ['duality', '二重性'], ['spire-of-the-watcher', '守望者尖塔'], ['ghosts-of-the-deep', '深海之影'], ['warlords-ruin', '军阀遗迹'], ['equilibrium', '均衡']
].map(([id, name]) => catalogActivity(`dungeon-${id}`, name, 'dungeon', '1–3', { survivability: 20, addClear: 15, control: 15, bossDamage: 30, support: 10, ammoEconomy: 10 }, 'boss-dependent'))

const featuredEvents = [
  ['solstice', '至日'], ['festival-of-the-lost', '邪魔节'], ['dawning', '曙光节'], ['guardian-games', '守护者运动会'], ['iron-banner', '钢铁旗']
].map(([id, name]) => catalogActivity(`event-${id}`, name, 'event', '1–6', { survivability: 15, addClear: 35, control: 15, bossDamage: 10, support: 10, ammoEconomy: 15 }))

export const activitiesV2 = [...activitiesBase, ...featuredRaids, ...featuredDungeons, ...featuredEvents].map(item => ({
  ...item,
  sourceIds: item.sourceIds || ['bungie-manifest'],
  verifiedAt: item.verifiedAt || '2026-08-31'
}))

export const activityById = Object.fromEntries(activitiesV2.map(item => [item.id, item]))
