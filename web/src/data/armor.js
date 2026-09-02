// 防具与套装数据（数据源：知识库 06-防具与构筑）

export const armorSlots = [
  { key: 'helmet', name: '头盔' },
  { key: 'gauntlets', name: '臂铠/手套' },
  { key: 'chest', name: '胸甲' },
  { key: 'legs', name: '腿甲' },
  { key: 'class', name: '职业装备' }
]

export const armorSets = [
  {
    id: 'truth-of-rights',
    name: '权利真相',
    en: 'Truth of Rights',
    source: '叛逃者（Renegades）',
    classAll: true,
    bonus: '套装加成：多部位可激活额外加成（2026-06-17 更新修复其加成问题）',
    desc: '《叛逃者》时代的主题套装，与"权利与秩序"叙事关联，具备套装加成机制。',
    stats: ['韧性倾向', '纪律倾向'],
    element: null
  },
  {
    id: 'aion-adapter',
    name: 'AION 适配者',
    en: 'AION Adapter Suit',
    source: '宿命边缘（Edge of Fate）',
    classAll: true,
    bonus: '适配开普勒环境的战术护甲',
    desc: '为开普勒（Kepler）任务设计的战术套装，AION 主题，侧重生存与机动。',
    stats: ['韧性倾向', '恢复倾向'],
    element: null
  },
  {
    id: 'aion-renewal',
    name: 'AION 复兴',
    en: 'AION Renewal Suit',
    source: '宿命边缘（Edge of Fate）',
    classAll: true,
    bonus: '复兴者科技护甲',
    desc: '与 AION 适配者同系列的进阶版，强调技能循环与元素协同。',
    stats: ['纪律倾向', '智慧倾向'],
    element: null
  },
  {
    id: 'first-ascent',
    name: '初次远征',
    en: 'First Ascent Suit',
    source: '终焉之形（The Final Shape）',
    classAll: true,
    bonus: '终焉之形主打套装',
    desc: '苍白之心战役主题套装，代表守护者踏入终焉的第一次远征。',
    stats: ['均衡属性'],
    element: null
  },
  {
    id: 'bushido',
    name: '武士道',
    en: 'Bushido Suit',
    source: '收复季（Reclamation）',
    classAll: true,
    bonus: '赛季活动套装',
    desc: '收复季主题护甲，日式装甲风格，适合技能循环构筑。',
    stats: ['机动倾向', '力量倾向'],
    element: null
  },
  {
    id: 'praxic',
    name: '普拉希克',
    en: 'Praxic Vestment',
    source: '叛逃者（Renegades）',
    classAll: true,
    bonus: '普拉希克教团主题',
    desc: '普拉希克教团（Praxic Order）主题护甲，与阿诺尔·玛哈尔剧情关联。',
    stats: ['恢复倾向', '智慧倾向'],
    element: null
  },
  {
    id: 'dungeon-equilibrium',
    name: '均衡套装',
    en: 'Equilibrium Set',
    source: '地牢：均衡（Equilibrium）',
    classAll: true,
    bonus: '地牢专属套装',
    desc: '地牢《均衡》通关奖励套装，"行走于火与影之间的平衡之道"。',
    stats: ['均衡属性'],
    element: null
  },
  {
    id: 'raid-desert-perpetual',
    name: '永恒荒漠套装',
    en: 'Desert Perpetual Set',
    source: '突袭：永恒荒漠',
    classAll: true,
    bonus: '突袭专属套装',
    desc: '突袭《永恒荒漠》通关奖励套装，机制向高属性护甲。',
    stats: ['高总值', '定向属性'],
    element: null
  }
]

export const exoticArmor = [
  {
    id: 'inmost-light', classId: 'titan', name: '幽影之心/世界之心', en: 'Heart of Inmost Light',
    desc: '使用任意技能强化其余技能，技能循环永动机，泰坦万金油。', element: null
  },
  {
    id: 'cuirass', classId: 'titan', name: '坠落之星胸甲', en: 'Cuirass of the Falling Star',
    desc: '大幅强化雷霆崩裂（Fist of Havoc）伤害，电弧泰坦爆发核心。', element: 'arc'
  },
  {
    id: 'helm-saint14', classId: 'titan', name: '圣14之盔', en: 'Helm of Saint-14',
    desc: '强化哨兵盾与压制，虚空泰坦辅助流。', element: 'void'
  },
  {
    id: 'star-eater', classId: 'hunter', name: '星云之眼', en: 'Star-Eater Scales',
    desc: '拾取光球强化超能力伤害，猎人超能力爆发核心。', element: null
  },
  {
    id: 'dragon-shadow', classId: 'hunter', name: '龙之影', en: 'The Dragon\'s Shadow',
    desc: '闪避后获得全属性强化与换弹加成，PVP热门。', element: null
  },
  {
    id: 'celestial', classId: 'hunter', name: '天鹰之眼', en: 'Celestial Nighthawk',
    desc: '黄金枪单发巨型伤害，Boss战爆发利器。', element: 'solar'
  },
  {
    id: 'starfire', classId: 'warlock', name: '星界协议', en: 'Starfire Protocol',
    desc: '裂谷内手雷增伤+充能，炽阳术士技能永动。', element: 'solar'
  },
  {
    id: 'necrotic', classId: 'warlock', name: '尼欧塔瑞之刃', en: 'Necrotic Grips',
    desc: '近战附加毒素扩散，配合荆棘（Thorn）联动。', element: null
  },
  {
    id: 'crown-tempests', classId: 'warlock', name: '风暴之冠', en: 'Crown of Tempests',
    desc: '电弧击杀加速技能充能，风暴行者清怪核心。', element: 'arc'
  },
  {
    id: 'skullfort', classId: 'titan', name: '无敌颅盔', en: 'An Insurmountable Skullfort',
    desc: '近战击杀回充近战与治疗，电弧泰坦近战流。', element: 'arc'
  },
  {
    id: 'sixth-coyote', classId: 'hunter', name: '第六土狼', en: 'The Sixth Coyote',
    desc: '双段闪避，机动流猎人核心。', element: null
  },
  {
    id: 'ophidian', classId: 'warlock', name: '蛇之缠绕', en: 'Ophidian Aspect',
    desc: '换弹与武器操控强化，万金油术士。', element: null
  }
]

export const setBonusGuide = `
套装加成（Set Bonuses）是护甲3.0引入的机制：
- 同一套装的多个部位可激活额外加成（通常 2件/4件/6件 递增）。
- 用异域件替换套装中属性最差的一件，最大化收益。
- 优先装备层级（Tier）高的护甲，属性总值更高。
`

export const transmogGuide = `
幻化（Transmog）：
- 通过"合成织物（Synthweave）"将任何护甲外观解锁为装扮。
- 解锁进度来自每周限定数量的护甲合成任务。
`
