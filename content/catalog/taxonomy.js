export const elements = {
  solar: { name: '炽阳', en: 'Solar', color: 'var(--solar)', cls: 'el-solar', tag: '灼烧/治疗' },
  arc: { name: '电弧', en: 'Arc', color: 'var(--arc)', cls: 'el-arc', tag: '移速/连锁' },
  void: { name: '虚空', en: 'Void', color: 'var(--void)', cls: 'el-void', tag: '削弱/隐身' },
  stasis: { name: '冰凝', en: 'Stasis', color: 'var(--stasis)', cls: 'el-stasis', tag: '控制/冻结' },
  strand: { name: '缚丝', en: 'Strand', color: 'var(--strand)', cls: 'el-strand', tag: '机动/召唤' },
  prismatic: { name: '棱镜', en: 'Prismatic', color: 'var(--prismatic)', cls: 'el-prismatic', tag: '光暗融合' }
}

export const stats = [
  { key: 'health', name: '生命值', en: 'Health', hash: 392767087, desc: '增加拾取能量球时获得的生命，并降低瞄准时的受击抖动。' },
  { key: 'melee', name: '近战', en: 'Melee', hash: 3493869314, desc: '降低近战技能冷却，并提高来自所有来源的近战能量。' },
  { key: 'grenade', name: '手雷', en: 'Grenade', hash: 1735777505, desc: '降低手雷技能冷却，并提高来自所有来源的手雷能量。' },
  { key: 'class', name: '职业', en: 'Class', hash: 1943323491, desc: '降低职业技能冷却，并提高来自所有来源的职业技能能量。' },
  { key: 'super', name: '超能', en: 'Super', hash: 144602215, desc: '提高来自所有来源的超能能量。' },
  { key: 'weapons', name: '武器', en: 'Weapons', hash: 2996146975, desc: '提高武器装填与操控，并提高对小型和主要战员的武器伤害。' }
]
