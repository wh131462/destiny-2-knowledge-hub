// 武器数据（数据源：知识库 05-武器系统）

export const weaponTypes = [
  { id: 'auto', name: '自动步枪', en: 'Auto Rifle', slot: '动能/能量', range: '中近', desc: '中近距离持续输出，新手友好' },
  { id: 'pulse', name: '脉冲步枪', en: 'Pulse Rifle', slot: '动能/能量', range: '中远', desc: '三点/五点连射，稳定压制' },
  { id: 'scout', name: '斥候步枪', en: 'Scout Rifle', slot: '动能/能量', range: '远', desc: '远距离精准射击' },
  { id: 'handcannon', name: '手炮', en: 'Hand Cannon', slot: '动能/能量', range: '中近', desc: '高伤点射，适合中近距离精准输出' },
  { id: 'smg', name: '冲锋枪', en: 'Submachine Gun', slot: '动能/能量', range: '近', desc: '近距离高射速爆发' },
  { id: 'sidearm', name: '手枪', en: 'Sidearm', slot: '动能/能量', range: '近', desc: '快射速灵活副手' },
  { id: 'shotgun', name: '霰弹枪', en: 'Shotgun', slot: '能量/重型', range: '近', desc: '近身一击爆发' },
  { id: 'sniper', name: '狙击枪', en: 'Sniper Rifle', slot: '能量/重型', range: '远', desc: '远距离致命一击' },
  { id: 'fusion', name: '融合步枪', en: 'Fusion Rifle', slot: '能量/重型', range: '中', desc: '充能后散射爆发' },
  { id: 'linear', name: '线性融合步枪', en: 'Linear Fusion Rifle', slot: '重型', range: '远', desc: '充能激光精准，Boss战热门' },
  { id: 'grenade', name: '榴弹发射器', en: 'Grenade Launcher', slot: '能量/重型', range: '中', desc: '抛物线爆炸' },
  { id: 'rocket', name: '火箭筒', en: 'Rocket Launcher', slot: '重型', range: '中', desc: '高伤AOE，Boss战常客' },
  { id: 'machinegun', name: '机枪', en: 'Machine Gun', slot: '重型', range: '中', desc: '持续扫射压场' },
  { id: 'sword', name: '剑', en: 'Sword', slot: '重型', range: '近', desc: '近战高伤' },
  { id: 'trace', name: '追踪步枪', en: 'Trace Rifle', slot: '能量', range: '中', desc: '激光持续伤害' },
  { id: 'bow', name: '弓', en: 'Combat Bow', slot: '动能/能量', range: '远', desc: '拉弓精准' },
  { id: 'glaive', name: '长戟', en: 'Glaive', slot: '动能/能量', range: '近中', desc: '近战与射击混合的特殊武器' }
]

// Exotic weapons are rendered from the Bungie Manifest in WeaponsView.
// Keep recommendations and translations in the canonical catalog instead of maintaining a second, drifting list here.

// 厂商
export const foundries = [
  { name: 'SUROS', style: '高稳定性自动步枪' },
  { name: 'Omolon', style: '液态弹药、能量武器' },
  { name: 'Häkke', style: '实弹、高后坐高伤害' },
  { name: 'Veist', style: '轻量化、快速装填' },
  { name: 'Tex Mechanica', style: '西部风格、左轮与杠杆枪' },
  { name: 'Nadir', style: '稀有科技武器' }
]

export const rarities = [
  { level: 'common', name: '普通', cn: '白装' },
  { level: 'uncommon', name: '优秀', cn: '绿装' },
  { level: 'rare', name: '稀有', cn: '蓝装' },
  { level: 'legendary', name: '传说', cn: '紫装，可自定义词条' },
  { level: 'exotic', name: '异域', cn: '金装，唯一特效，全游戏仅可装备1件武器+1件护甲' }
]
