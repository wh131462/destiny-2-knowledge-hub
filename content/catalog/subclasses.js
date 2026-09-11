import { abilityById } from './abilities.js'
import { officialSubclasses } from './official-subclasses.js'

export const subclasses = officialSubclasses.map(item => ({
  // The normalized subclass catalog is generated from Bungie's zh-chs fields.
  // Keep it as the sole display source so legacy editorial aliases cannot leak
  // into selectors or build exports.
  ...item, name: item.name,
  transcendenceGrenade: abilityById[item.transcendenceGrenadeIds[0]] || null
}))
export const subclassById = Object.fromEntries(subclasses.map(item => [item.id, item]))

const classDefinitions = [
  {
    id: 'titan', name: '泰坦', en: 'Titan', role: '前线承伤、近战爆发、控场',
    classAbility: '路障 Barricade', traits: ['冲撞近战', '厚甲', '团队辅助'],
    desc: '以钢铁之躯捍卫战线，依靠路障、护盾与近战能力稳定推进。', stats: ['生命值', '近战', '职业'], color: '#e8c15a'
  },
  {
    id: 'hunter', name: '猎人', en: 'Hunter', role: '机动、精准爆发、减益链',
    classAbility: '闪避 Dodge', traits: ['高机动', '精准爆发', '隐身战术'],
    desc: '通过闪避、精准射击和元素减益控制战场距离。', stats: ['武器', '近战', '职业'], color: '#4db8ff'
  },
  {
    id: 'warlock', name: '术士', en: 'Warlock', role: '技能循环、召唤、团队续航',
    classAbility: '裂谷 Rift', traits: ['技能循环', '召唤物', '团队续航'],
    desc: '把光暗技能转化为持续控制、治疗和范围输出。', stats: ['生命值', '手雷', '超能'], color: '#b46bff'
  }
]

export const classesV2 = classDefinitions.map(item => ({
  ...item,
  sourceIds: item.sourceIds || ['bungie-manifest'],
  verifiedAt: item.verifiedAt || '2026-08-31'
}))

export const classById = Object.fromEntries(classesV2.map(item => [item.id, item]))
