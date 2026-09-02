const aspect = (id, name, en, element, classId, extra = {}) => ({
  id, name, en, element, classId, sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31', ...extra
})

export const aspects = [
  // Titan Prismatic pool
  aspect('aspect-consecration', '奉献', 'Consecration', 'solar', 'titan', { mechanicIds: ['scorch', 'ignite'] }),
  aspect('aspect-knockout', '击倒', 'Knockout', 'arc', 'titan', { mechanicIds: ['amplified', 'healing'] }),
  aspect('aspect-unbreakable', '坚不可摧', 'Unbreakable', 'void', 'titan', { mechanicIds: ['void-overshield'] }),
  aspect('aspect-diamond-lance', '钻石长矛', 'Diamond Lance', 'stasis', 'titan', { mechanicIds: ['freeze', 'shatter'] }),
  aspect('aspect-drengrs-lash', '德兰格之鞭', "Drengr's Lash", 'strand', 'titan', { mechanicIds: ['suspend'] }),

  // Hunter Prismatic pool
  aspect('aspect-gunpowder-gamble', '火药博弈', 'Gunpowder Gamble', 'solar', 'hunter', { mechanicIds: ['scorch', 'ignite'] }),
  aspect('aspect-ascension', '升华', 'Ascension', 'arc', 'hunter', { mechanicIds: ['amplified', 'jolt'] }),
  aspect('aspect-stylish-executioner', '潇洒处刑者', 'Stylish Executioner', 'void', 'hunter', { mechanicIds: ['invisibility', 'weaken'] }),
  aspect('aspect-winters-shroud', '凛冬帷幕', "Winter's Shroud", 'stasis', 'hunter', { mechanicIds: ['slow', 'freeze'] }),
  aspect('aspect-threaded-specter', '丝线幽灵', 'Threaded Specter', 'strand', 'hunter', { mechanicIds: ['threadling'] }),

  // Warlock Prismatic pool
  aspect('aspect-hellion', '狱火之魂', 'Hellion', 'solar', 'warlock', { mechanicIds: ['scorch'] }),
  aspect('aspect-lightning-surge', '闪电奔涌', 'Lightning Surge', 'arc', 'warlock', { mechanicIds: ['jolt'] }),
  aspect('aspect-feed-the-void', '虚空供养', 'Feed the Void', 'void', 'warlock', { mechanicIds: ['devour'] }),
  aspect('aspect-bleak-watcher', '黯淡守望者', 'Bleak Watcher', 'stasis', 'warlock', { mechanicIds: ['slow', 'freeze'] }),
  aspect('aspect-weavers-call', '织法者召唤', "Weaver's Call", 'strand', 'warlock', { mechanicIds: ['threadling'] })
  ,aspect('aspect-vanishing-step', '隐身步法', 'Vanishing Step', 'void', 'hunter', { mechanicIds: ['invisibility'] })
  ,aspect('aspect-into-the-fray', '深入战局', 'Into the Fray', 'strand', 'titan', { mechanicIds: ['woven-mail'] })
  ,aspect('aspect-touch-of-flame', '火焰之触', 'Touch of Flame', 'solar', 'warlock', { mechanicIds: ['healing', 'restoration'] })
  // Ordinary subclass pools. These are catalogued separately from the Prismatic pool.
  ,aspect('aspect-roaring-flames', '咆哮烈焰', 'Roaring Flames', 'solar', 'titan', { mechanicIds: ['scorch', 'ignite'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-sol-invictus', '太阳至高', 'Sol Invictus', 'solar', 'titan', { mechanicIds: ['scorch', 'restoration'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-touch-of-thunder', '雷霆之触', 'Touch of Thunder', 'arc', 'titan', { mechanicIds: ['jolt'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-juggernaut', '主宰者', 'Juggernaut', 'arc', 'titan', { mechanicIds: ['amplified'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-bastion', '堡垒', 'Bastion', 'void', 'titan', { mechanicIds: ['void-overshield'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-offensive-bulwark', '进攻堡垒', 'Offensive Bulwark', 'void', 'titan', { mechanicIds: ['void-overshield', 'volatile'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-tectonic-harvest', '构造收获', 'Tectonic Harvest', 'stasis', 'titan', { mechanicIds: ['freeze', 'shatter'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-banner-of-war', '战争旗帜', 'Banner of War', 'strand', 'titan', { mechanicIds: ['woven-mail', 'healing'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-knock-em-down', '击倒他们', "Knock 'Em Down", 'solar', 'hunter', { mechanicIds: ['radiant'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-on-your-mark', '各就各位', 'On Your Mark', 'solar', 'hunter', { mechanicIds: ['radiant'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-flow-state', '流动状态', 'Flow State', 'arc', 'hunter', { mechanicIds: ['amplified'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-lethal-current', '致命电流', 'Lethal Current', 'arc', 'hunter', { mechanicIds: ['jolt'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-trappers-ambush', '陷阱猎人', "Trapper's Ambush", 'void', 'hunter', { mechanicIds: ['invisibility', 'weaken'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-shatterdive', '碎片俯冲', 'Shatterdive', 'stasis', 'hunter', { mechanicIds: ['freeze', 'shatter'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-grim-harvest', '阴郁收获', 'Grim Harvest', 'stasis', 'hunter', { mechanicIds: ['freeze', 'healing'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-widows-silk', '寡妇之丝', "Widow's Silk", 'strand', 'hunter', { mechanicIds: ['threadling'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-whirling-maelstrom', '旋转风暴', 'Whirling Maelstrom', 'strand', 'hunter', { mechanicIds: ['sever'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-icarus-dash', '伊卡洛斯冲刺', 'Icarus Dash', 'solar', 'warlock', { mechanicIds: ['radiant'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-arc-soul', '电弧之魂', 'Arc Soul', 'arc', 'warlock', { mechanicIds: ['amplified'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-electrostatic-mind', '静电心智', 'Electrostatic Mind', 'arc', 'warlock', { mechanicIds: ['jolt'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-chaos-accelerant', '混沌加速', 'Chaos Accelerant', 'void', 'warlock', { mechanicIds: ['volatile'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-child-of-old-gods', '旧神之子', 'Child of the Old Gods', 'void', 'warlock', { mechanicIds: ['weaken'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-frostpulse', '冰霜脉冲', 'Frostpulse', 'stasis', 'warlock', { mechanicIds: ['freeze'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-glacial-harvest', '冰川收获', 'Glacial Harvest', 'stasis', 'warlock', { mechanicIds: ['freeze', 'healing'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-mindspun-invocation', '心灵编织', 'Mindspun Invocation', 'strand', 'warlock', { mechanicIds: ['suspend', 'threadling'], sourceIds: ['community-baseline'] })
  ,aspect('aspect-wanderer', '漫游者', 'The Wanderer', 'strand', 'warlock', { mechanicIds: ['suspend'], sourceIds: ['community-baseline'] })
]

export const aspectById = Object.fromEntries(aspects.map(item => [item.id, item]))
