const fragment = (id, name, en, element, description, mechanicIds = []) => ({ id, name, en, element, description, mechanicIds, sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31' })

export const fragments = [
  fragment('echo-starvation', '饥饿回声', 'Echo of Starvation', 'void', '拾取虚空缺口或能量球获得吞噬。', ['devour']),
  fragment('echo-persistence', '延续回声', 'Echo of Persistence', 'void', '延长虚空增益持续时间。', ['devour', 'invisibility']),
  fragment('echo-obscurity', '隐匿回声', 'Echo of Obscurity', 'void', '终结技最后一击使你隐身。', ['invisibility']),
  fragment('echo-cessation', '终止回声', 'Echo of Cessation', 'void', '终结技产生虚空爆发，并让击败易爆目标生成虚空缺口。', ['volatile']),
  fragment('thread-warding', '守护丝线', 'Thread of Warding', 'strand', '拾取能量球获得织造铠甲。', ['woven-mail']),
  fragment('thread-continuity', '延续丝线', 'Thread of Continuity', 'strand', '延长悬浮、拆解和割裂持续时间。', ['suspend', 'unravel', 'sever']),
  fragment('thread-generation', '生成丝线', 'Thread of Generation', 'strand', '造成伤害时产生手雷能量。'),
  fragment('thread-mind', '心智丝线', 'Thread of Mind', 'strand', '击败悬浮目标获得职业技能能量。', ['suspend']),
  fragment('ember-torches', '火炬余烬', 'Ember of Torches', 'solar', '强化近战命中使你和附近队友光耀。', ['radiant']),
  fragment('ember-solace', '慰藉余烬', 'Ember of Solace', 'solar', '延长光耀和恢复持续时间。', ['radiant', 'restoration']),
  fragment('ember-empyrean', '炽天余烬', 'Ember of Empyrean', 'solar', '炽阳武器或技能最后一击延长光耀和恢复。', ['radiant', 'restoration']),
  fragment('ember-benevolence', '仁慈余烬', 'Ember of Benevolence', 'solar', '对队友施加光耀、治愈或恢复后提高技能回复。', ['radiant', 'cure', 'restoration'])
  ,fragment('spark-resistance', '抗性火花', 'Spark of Resistance', 'arc', '被多个敌人包围时受到的伤害降低。', ['damage-resistance'])
  ,fragment('spark-beacons', '信标火花', 'Spark of Beacons', 'arc', '电弧超能充能时，电弧特殊武器击杀产生致盲爆炸。', ['blind'])
  ,fragment('spark-amplitude', '振幅火花', 'Spark of Amplitude', 'arc', '放大状态持续时间延长。', ['amplified'])
  ,fragment('spark-magnitude', '幅度火花', 'Spark of Magnitude', 'arc', '持续型电弧手雷持续时间延长。', ['jolt'])
  ,fragment('whisper-of-chains', '锁链低语', 'Whisper of Chains', 'stasis', '靠近冰冻目标或冰晶时获得伤害减免。', ['damage-resistance', 'freeze'])
  ,fragment('whisper-of-shards', '碎片低语', 'Whisper of Shards', 'stasis', '粉碎冰晶后暂时提高手雷回复。', ['shatter'])
  ,fragment('whisper-of-fissures', '裂隙低语', 'Whisper of Fissures', 'stasis', '冰晶或冻结目标破碎时提高爆炸伤害与范围。', ['shatter', 'freeze'])
  ,fragment('whisper-of-rime', '霜晶低语', 'Whisper of Rime', 'stasis', '拾取冰凝碎片获得护盾并逐渐恢复生命。', ['healing'])
]

export const fragmentById = Object.fromEntries(fragments.map(item => [item.id, item]))
