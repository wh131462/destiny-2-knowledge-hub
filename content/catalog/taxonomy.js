export const elements = {
  solar: { name: '炽阳', en: 'Solar', color: 'var(--solar)', cls: 'el-solar', tag: '灼烧/治疗' },
  arc: { name: '电弧', en: 'Arc', color: 'var(--arc)', cls: 'el-arc', tag: '移速/连锁' },
  void: { name: '虚空', en: 'Void', color: 'var(--void)', cls: 'el-void', tag: '削弱/隐身' },
  stasis: { name: '冰凝', en: 'Stasis', color: 'var(--stasis)', cls: 'el-stasis', tag: '控制/冻结' },
  strand: { name: '缚丝', en: 'Strand', color: 'var(--strand)', cls: 'el-strand', tag: '机动/召唤' },
  prismatic: { name: '棱镜', en: 'Prismatic', color: 'var(--prismatic)', cls: 'el-prismatic', tag: '光暗融合' }
}

export const stats = [
  { key: 'mobility', name: '机动性', en: 'Mobility', desc: '移速/跳跃高度；猎人职业技能冷却' },
  { key: 'resilience', name: '韧性', en: 'Resilience', desc: '减伤；泰坦职业技能冷却' },
  { key: 'recovery', name: '恢复', en: 'Recovery', desc: '生命回复速度；术士职业技能冷却' },
  { key: 'discipline', name: '纪律', en: 'Discipline', desc: '手雷冷却' },
  { key: 'intellect', name: '智慧', en: 'Intellect', desc: '超能力冷却' },
  { key: 'strength', name: '力量', en: 'Strength', desc: '近战冷却' }
]
