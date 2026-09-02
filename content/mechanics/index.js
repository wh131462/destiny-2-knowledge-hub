export const mechanics = [
  { id: 'radiant', name: '光耀', en: 'Radiant', category: 'buff', values: { pveWeaponDamagePercent: 25, pvpWeaponDamagePercent: 10 }, champion: 'barrier', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'restoration', name: '恢复', en: 'Restoration', category: 'buff', values: { effect: '持续生命回复' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'cure', name: '治愈', en: 'Cure', category: 'buff', values: { effect: '立即恢复生命' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'amplified', name: '增幅', en: 'Amplified', category: 'buff', values: { effect: '强化移动并启用部分电弧协同' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'devour', name: '吞噬', en: 'Devour', category: 'buff', values: { effect: '最后一击恢复生命并返还手雷能量' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'void-overshield', name: '虚空覆盖护盾', en: 'Void Overshield', category: 'buff', values: { effect: '额外护盾与对战员减伤' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'woven-mail', name: '织造铠甲', en: 'Woven Mail', category: 'buff', values: { effect: '降低来自非精准 PvE 伤害' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'invisibility', name: '隐身', en: 'Invisibility', category: 'buff', values: { effect: '降低敌人锁定并支持脱战与救援' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'scorch', name: '灼烧', en: 'Scorch', category: 'debuff', values: { stacksToIgnite: 100 }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'ignite', name: '点燃', en: 'Ignition', category: 'damage', values: { effect: '达到灼烧阈值后的范围爆炸' }, champion: 'unstoppable', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'jolt', name: '电击', en: 'Jolt', category: 'debuff', values: { effect: '受到后续伤害时释放连锁电击' }, champion: 'overload', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'blind', name: '致盲', en: 'Blind', category: 'debuff', values: { effect: '限制非首领敌人行动' }, champion: 'unstoppable', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'volatile', name: '易爆', en: 'Volatile', category: 'debuff', values: { effect: '累计伤害后触发虚空爆炸' }, champion: 'barrier', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'weaken', name: '削弱', en: 'Weaken', category: 'debuff', values: { standardPvePercent: 15 }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'suppress', name: '压制', en: 'Suppress', category: 'debuff', values: { effect: '关闭目标能力' }, champion: 'overload', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'slow', name: '减速', en: 'Slow', category: 'debuff', values: { stacksToFreeze: 100 }, champion: 'overload', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'freeze', name: '冻结', en: 'Freeze', category: 'debuff', values: { effect: '冻结战员；打破后粉碎' }, champion: 'unstoppable', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'shatter', name: '粉碎', en: 'Shatter', category: 'damage', values: { effect: '打破冻结目标或冰晶造成范围伤害' }, champion: 'unstoppable', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'suspend', name: '悬浮', en: 'Suspend', category: 'debuff', values: { effect: '将非首领目标悬浮并中断行动' }, champion: 'unstoppable', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'unravel', name: '拆解', en: 'Unravel', category: 'debuff', values: { effect: '受击时产生追踪缚丝投射物' }, champion: 'barrier', sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'sever', name: '割裂', en: 'Sever', category: 'debuff', values: { effect: '降低目标对玩家造成的伤害' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'threadling', name: '线虫', en: 'Threadling', category: 'summon', values: { effect: '追踪目标并造成缚丝伤害' }, sourceIds: ['bungie-buildcrafting'], confidence: 'B' },
  { id: 'healing', name: '生命恢复', en: 'Healing', category: 'survival', values: { effect: '治愈、恢复、吞噬或其他生命回复' }, sourceIds: ['editorial-baseline'], confidence: 'D' },
  { id: 'damage-resistance', name: '伤害抗性', en: 'Damage Resistance', category: 'survival', values: { effect: '来自韧性、元素增益和模组的减伤分别计算' }, sourceIds: ['editorial-baseline'], confidence: 'D' },
  { id: 'transcendence', name: '超越', en: 'Transcendence', category: 'prismatic', values: { effect: '分别积累光暗能量后进入强化状态，获得专属手雷与技能回复' }, sourceIds: ['bungie-final-shape'], confidence: 'A' }
]

export const mechanicById = Object.fromEntries(mechanics.map(item => [item.id, item]))

export const statModel = {
  version: 'tfs-prismatic-baseline',
  min: 0,
  max: 100,
  tierSize: 10,
  resiliencePveDamageResistanceByTier: [0, 1, 2, 3, 4, 8, 14, 20, 24, 27, 30],
  note: '韧性减伤表用于终焉之形基线的可解释估算；页面必须显示版本，不外推到未核验补丁。',
  sourceIds: ['bungie-buildcrafting'],
  confidence: 'B'
}

export const stackingRules = {
  weaponEmpowerment: { mode: 'highest-only', examples: ['radiant', 'well', 'weapon-surge'] },
  targetDebuff: { mode: 'highest-only', examples: ['weaken', 'tractor-cannon', 'tether'] },
  resistance: { mode: 'multiplicative', formula: '1 - Π(1 - reduction)' },
  note: '具体例外应在对应实体中覆盖，不能简单相加。'
}

// These are explainable interaction edges, not a damage simulator. They describe
// when a build's registered effects form a usable loop and deliberately avoid
// inventing patch-sensitive percentages.
export const mechanicInteractions = [
  { id: 'radiant-weaken', requires: ['radiant', 'weaken'], name: '光耀 + 削弱', effect: '武器获得光耀增伤，同时目标承受削弱后的伤害；两者按不同增益层分别计算。', confidence: 'B' },
  { id: 'scorch-ignite', requires: ['scorch', 'ignite'], name: '灼烧 → 点燃', effect: '持续叠加灼烧达到阈值后触发点燃范围爆炸。', confidence: 'B' },
  { id: 'slow-freeze-shatter', requires: ['slow', 'freeze', 'shatter'], name: '减速 → 冻结 → 粉碎', effect: '先用减速控制目标，达到冻结后通过破冰或冰晶触发粉碎。', confidence: 'B' },
  { id: 'invisibility-volatile', requires: ['invisibility', 'volatile'], name: '隐身 → 易爆', effect: '隐身重定位后从安全角度施加易爆，击杀可再次进入隐身循环。', confidence: 'C' },
  { id: 'suspend-woven-mail', requires: ['suspend', 'woven-mail'], name: '悬浮 + 织造铠甲', effect: '悬浮控制推进窗口，织造铠甲覆盖非精准伤害的承伤风险。', confidence: 'C' },
  { id: 'transcendence-dual-energy', requires: ['transcendence'], name: '光暗双能量 → 超越', effect: '分别使用光能与暗影技能积累两侧能量，满足条件后进入职业专属超越状态。', confidence: 'A' }
]
