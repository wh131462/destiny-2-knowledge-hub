// Backwards-compatible view model. Canonical records live under content/catalog.
import { classesV2, subclasses, abilities, aspects } from './v2'
import { elements, stats } from './v2'

const abilityById = Object.fromEntries(abilities.map(item => [item.id, item]))
const aspectById = Object.fromEntries(aspects.map(item => [item.id, item]))

const focusByElement = {
  solar: '灼烧与治疗循环',
  arc: '电弧连锁与机动',
  void: '削弱、隐身与控场',
  stasis: '减速、冻结与粉碎',
  strand: '缚丝机动与悬浮',
  prismatic: '光暗状态融合与超越'
}

const classDescriptions = {
  titan: '以钢铁之躯捍卫战线，依靠路障、护盾与近战能力稳定推进。',
  hunter: '通过闪避、精准射击和元素减益控制战场距离。',
  warlock: '把光暗技能转化为持续控制、治疗和范围输出。'
}

const classAbilityByClass = {
  titan: '路障 Barricade',
  hunter: '闪避 Dodge',
  warlock: '裂谷 Rift'
}

const viewSubclasses = (classId) => subclasses
  .filter(item => item.classId === classId)
  .map(item => {
    const superAbility = abilityById[item.superIds?.[0]]
    const aspectNames = (item.aspectIds || []).map(id => aspectById[id]?.name || id)
    return {
      ...item,
      branch: `${item.name} ${item.en}`,
      super: superAbility ? `${superAbility.name} ${superAbility.en}` : '按当前装备选择超能力',
      focus: focusByElement[item.element] || '元素技能协同',
      aspects: aspectNames,
      build: item.type === 'prismatic'
        ? '跨元素技能池构筑：围绕两种状态、超越能量与活动反冠军需求选择星相和碎片。'
        : `${focusByElement[item.element] || '元素技能协同'}：先确定技能循环，再用异域和模组补齐生存与弹药。`
    }
  })

export const classes = classesV2.map(item => ({
  ...item,
  desc: item.desc || classDescriptions[item.id],
  classAbility: item.classAbility || classAbilityByClass[item.id],
  traits: item.traits || [],
  stats: item.stats || [],
  subclasses: viewSubclasses(item.id)
}))

export { elements, stats }
