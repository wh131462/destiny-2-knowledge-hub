const facet = (id, name, en, description, mechanicIds = []) => ({
  id, name, en, description, mechanicIds, sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31'
})

export const facets = [
  facet('facet-balance', '平衡之面', 'Facet of Balance', '快速造成光能或暗影伤害时分别返还近战或手雷能量。'),
  facet('facet-blessing', '祝福之面', 'Facet of Blessing', '近战最后一击开始生命恢复；超越状态下效果更强。', ['healing']),
  facet('facet-bravery', '勇气之面', 'Facet of Bravery', '手雷最后一击赋予虚空武器易爆弹；充能近战最后一击赋予缚丝武器拆解弹。', ['volatile', 'unravel']),
  facet('facet-command', '指令之面', 'Facet of Command', '冻结或压制目标会触发装填与属性收益。', ['freeze', 'suppress']),
  facet('facet-courage', '勇武之面', 'Facet of Courage', '光能技能对受暗影减益影响的目标造成更多伤害。'),
  facet('facet-dawn', '黎明之面', 'Facet of Dawn', '充能近战命中使你光耀，最后一击也使附近队友光耀。', ['radiant']),
  facet('facet-defiance', '蔑视之面', 'Facet of Defiance', '终结技依据当前超能力元素产生不同元素效果。'),
  facet('facet-devotion', '奉献之面', 'Facet of Devotion', '击败受暗影减益影响的目标获得额外光能超越能量。', ['transcendence']),
  facet('facet-dominance', '支配之面', 'Facet of Dominance', '虚空手雷获得削弱，电弧手雷获得电击。', ['weaken', 'jolt']),
  facet('facet-grace', '恩典之面', 'Facet of Grace', '动能武器最后一击提供额外超越能量；超能力最后一击使附近队友获得超越能量。', ['transcendence']),
  facet('facet-generosity', '慷慨之面', 'Facet of Generosity', '超越状态下击败目标会为队友生成能量球。', ['transcendence']),
  facet('facet-hope', '希望之面', 'Facet of Hope', '拥有元素增益时提高职业技能回复速度。'),
  facet('facet-honor', '荣誉之面', 'Facet of Honor', '拾取元素收集物或摧毁缠结获得同侧超越能量。', ['transcendence']),
  facet('facet-justice', '正义之面', 'Facet of Justice', '超越状态下技能最后一击会产生爆炸。', ['transcendence']),
  facet('facet-mending', '疗愈之面', 'Facet of Mending', '手雷最后一击治疗；超越手雷最后一击提升效果。', ['healing']),
  facet('facet-protection', '守护之面', 'Facet of Protection', '被敌人包围时获得伤害抗性；超越状态下更强。', ['damage-resistance']),
  facet('facet-purpose', '使命之面', 'Facet of Purpose', '拾取能量球后依据所装备超能力元素获得对应增益。'),
  facet('facet-ruin', '毁灭之面', 'Facet of Ruin', '扩大粉碎和炽阳点燃的影响范围及伤害。', ['shatter', 'ignite']),
  facet('facet-sacrifice', '牺牲之面', 'Facet of Sacrifice', '拥有光能增益时，技能最后一击获得额外暗影超越能量。', ['transcendence']),
  facet('facet-solitude', '孤寂之面', 'Facet of Solitude', '连续精准命中会使目标割裂。', ['sever']),
  facet('facet-awakening', '觉醒之面', 'Facet of Awakening', '快速造成元素最后一击会生成对应元素收集物。')
]

export const facetById = Object.fromEntries(facets.map(item => [item.id, item]))

