import manifestItemSets from '../../data/catalog/manifest-item-sets.json' with { type: 'json' }
const manifestSetByName = new Map((manifestItemSets.sets || []).map(item => [String(item.name || '').toLowerCase(), item]))
const set = (id, name, en, source, bonus, stats, acquisitionId) => ({
  id, name, en, source, bonus, stats, acquisitionId,
  manifestHash: manifestSetByName.get(String(en).replace(/ Suit$/i, '').toLowerCase())?.hash || null,
  manifestVerified: Boolean(manifestSetByName.get(String(en).replace(/ Suit$/i, '').toLowerCase())?.hash),
  sourceIds: manifestSetByName.get(String(en).replace(/ Suit$/i, '').toLowerCase())?.hash ? ['bungie-manifest', 'editorial-catalog'] : ['editorial-catalog'],
  verifiedAt: '2026-08-31'
})

export const armorSets = [
  set('truth-of-rights', '权利真相', 'Truth of Rights', '叛逃者', '多部位激活递增套装加成，侧重持续作战', ['韧性', '纪律'], 'set-truth-of-rights'),
  set('aion-adapter', 'AION 适配者', 'AION Adapter Suit', '宿命边缘', '适配开普勒环境的战术护甲', ['韧性', '恢复'], 'set-aion-adapter'),
  set('aion-renewal', 'AION 复兴', 'AION Renewal Suit', '宿命边缘', '技能循环与元素协同套装', ['纪律', '智慧'], 'set-aion-renewal'),
  set('first-ascent', '初次远征', 'First Ascent Suit', '终焉之形', '稳定的高属性基础套装，适合作为首套完整构筑底盘', ['均衡'], 'set-first-ascent'),
  set('bushido', '武士道', 'Bushido Suit', '收复季', '技能循环与近战倾向套装', ['机动性', '力量'], 'set-bushido'),
  set('praxic', '普拉希克', 'Praxic Vestment', '叛逃者', '恢复与智慧倾向套装', ['恢复', '智慧'], 'set-praxic'),
  set('dungeon-equilibrium', '均衡套装', 'Equilibrium Set', '均衡地牢', '地牢专属套装，适合首领与机制位', ['均衡'], 'set-dungeon-equilibrium'),
  set('raid-desert-perpetual', '永恒荒漠套装', 'Desert Perpetual Set', '永恒荒漠突袭', '突袭专属高属性套装', ['高总值', '定向属性'], 'set-raid-desert-perpetual')
]

export const armorSetById = Object.fromEntries(armorSets.map(item => [item.id, item]))
