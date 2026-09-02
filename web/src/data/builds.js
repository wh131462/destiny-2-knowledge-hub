// 推荐规则库（核心！数据源：知识库提炼的推荐搭配规则）
// 结构：职业 × 元素 × 玩法 → 异域护甲、属性、套装、武器、理由

export const builds = [
  // ================= 泰坦 =================
  {
    id: 'titan-void-pve',
    classId: 'titan', element: 'void', mode: 'pve',
    name: '虚空哨兵：团队堡垒',
    exoticArmor: '幽影之心 Heart of Inmost Light',
    armorSet: '权利真相套装（或任意高韧性套装）',
    stats: ['韧性 100', '纪律 100', '智慧 80+'],
    weapons: ['动能：任意加急词条主武器', '能量：虚空融合步枪', '重型：线性融合步枪/火箭筒'],
    why: '技能循环永动机，堡垒+压制为团队提供护盾与增伤，高难PVE万金油。',
    difficulty: '入门',
    tags: ['团本', '宗师', '辅助']
  },
  {
    id: 'titan-arc-pve',
    classId: 'titan', element: 'arc', mode: 'pve',
    name: '电弧突袭：雷霆爆发',
    exoticArmor: '坠落之星胸甲 Cuirass of the Falling Star',
    armorSet: 'AION 复兴套装',
    stats: ['韧性 100', '智慧 100', '力量 80+'],
    weapons: ['动能：电弧冲锋枪', '能量：电弧追踪步枪', '重型：电弧剑'],
    why: '雷霆崩裂超能力爆发伤害极高，是泰坦最强单体DPS之一，Boss战爆发点。',
    difficulty: '入门',
    tags: ['Boss爆发', '高伤']
  },
  {
    id: 'titan-strand-pve',
    classId: 'titan', element: 'strand', mode: 'pve',
    name: '缚丝行者：压制冲锋',
    exoticArmor: '幽影之心（通用）或缚丝专属',
    armorSet: 'AION 适配者套装',
    stats: ['韧性 100', '纪律 100', '力量 80+'],
    weapons: ['动能：缚丝自动步枪', '能量：缚丝霰弹枪', '重型：缚丝剑'],
    why: '缠绕（Suspend）控制+高机动突进，攻守兼备，控场与输出兼顾。',
    difficulty: '进阶',
    tags: ['控制', '机动']
  },
  {
    id: 'titan-solar-pvp',
    classId: 'titan', element: 'solar', mode: 'pvp',
    name: '炽阳破日者：灼烧压制',
    exoticArmor: '世界之心（PVP亦可）/ 无敌颅盔',
    armorSet: '任意高韧性PVP套装',
    stats: ['韧性 100', '恢复 100', '纪律 60+'],
    weapons: ['动能：手枪（手炮）', '能量：脉冲步枪', '重型：火箭筒'],
    why: '路障+灼烧手雷封锁区域，PVP控图能力强，生存与压制兼顾。',
    difficulty: '入门',
    tags: ['PVP', '控图']
  },

  // ================= 猎人 =================
  {
    id: 'hunter-solar-pve',
    classId: 'hunter', element: 'solar', mode: 'pve',
    name: '炽阳枪手：黄金爆发',
    exoticArmor: '星云之眼 Star-Eater Scales 或 天鹰之眼 Celestial Nighthawk',
    armorSet: '初次远征套装',
    stats: ['韧性 100', '智慧 100', '机动 80+'],
    weapons: ['动能：手枪', '能量：炽阳狙击枪', '重型：火箭筒'],
    why: '黄金枪+超能力强化，Boss战单体爆发天花板之一。',
    difficulty: '入门',
    tags: ['Boss爆发', '单体']
  },
  {
    id: 'hunter-void-pve',
    classId: 'hunter', element: 'void', mode: 'pve',
    name: '虚空夜潜者：团队隐身',
    exoticArmor: '星云之眼 或 龙之影',
    armorSet: '权利真相套装',
    stats: ['韧性 100', '纪律 100', '机动 80+'],
    weapons: ['动能：任意', '能量：虚空武器', '重型：线性融合步枪'],
    why: '隐身+削弱标记（Weaken），高难副本团队增益核心，新手也容易上手。',
    difficulty: '入门',
    tags: ['团本', '辅助', '隐身']
  },
  {
    id: 'hunter-strand-pve',
    classId: 'hunter', element: 'strand', mode: 'pve',
    name: '缚丝缠丝者：爪钩机动',
    exoticArmor: '第六土狼 The Sixth Coyote',
    armorSet: 'AION 复兴套装',
    stats: ['机动 100', '韧性 100', '纪律 80+'],
    weapons: ['动能：缚丝冲锋枪', '能量：缚丝手枪', '重型：缚丝刀'],
    why: '双闪避+爪钩三段跳，机动性拉满，缠绕控制+快速收割。',
    difficulty: '进阶',
    tags: ['机动', '速刷']
  },
  {
    id: 'hunter-arc-pvp',
    classId: 'hunter', element: 'arc', mode: 'pvp',
    name: '电弧行者：闪避猎手',
    exoticArmor: '第六土狼 或 龙之影',
    armorSet: '任意高机动PVP套装',
    stats: ['机动 100', '恢复 100', '韧性 60+'],
    weapons: ['动能：手枪（手炮）', '能量：冲锋枪/脉冲步枪', '重型：火箭筒'],
    why: '闪避回充近战+电击连锁，PVP近战与身法压制。',
    difficulty: '进阶',
    tags: ['PVP', '身法']
  },

  // ================= 术士 =================
  {
    id: 'warlock-solar-pve',
    classId: 'warlock', element: 'solar', mode: 'pve',
    name: '炽阳黎明刃：团队光环',
    exoticArmor: '星界协议 Starfire Protocol',
    armorSet: 'AION 适配者套装',
    stats: ['韧性 100', '纪律 100', '恢复 80+'],
    weapons: ['动能：任意', '能量：炽阳融合步枪', '重型：火箭筒'],
    why: '裂谷增伤+手雷充能循环，团本奶妈/辅助首选，团队持续作战发动机。',
    difficulty: '入门',
    tags: ['团本', '辅助', '奶妈']
  },
  {
    id: 'warlock-strand-pve',
    classId: 'warlock', element: 'strand', mode: 'pve',
    name: '缚丝织法师：召唤大师',
    exoticArmor: '蛇之缠绕 Ophidian Aspect 或 尼欧塔瑞之刃',
    armorSet: 'AION 复兴套装',
    stats: ['韧性 100', '纪律 100', '智慧 80+'],
    weapons: ['动能：缚丝脉冲步枪', '能量：缚丝榴弹发射器', '重型：缚丝线形融合'],
    why: '缚丝使魔持续输出，最强单目标持续伤害之一，适合Boss战。',
    difficulty: '进阶',
    tags: ['Boss', '持续伤害']
  },
  {
    id: 'warlock-void-pve',
    classId: 'warlock', element: 'void', mode: 'pve',
    name: '虚空虚空行者：新星轰炸',
    exoticArmor: '风暴之冠（电弧）/ 蛇之缠绕',
    armorSet: '初次远征套装',
    stats: ['韧性 100', '智慧 100', '纪律 80+'],
    weapons: ['动能：任意', '能量：虚空武器', '重型：火箭筒/线性融合'],
    why: '新星炸弹+波动（Volatile）爆发，AOE与单体兼顾的高伤术士。',
    difficulty: '入门',
    tags: ['高伤', 'AOE']
  },
  {
    id: 'warlock-arc-pvp',
    classId: 'warlock', element: 'arc', mode: 'pvp',
    name: '电弧风暴行者：连锁压制',
    exoticArmor: '风暴之冠 Crown of Tempests',
    armorSet: '任意高恢复PVP套装',
    stats: ['恢复 100', '韧性 100', '纪律 60+'],
    weapons: ['动能：手枪', '能量：电弧武器', '重型：火箭筒'],
    why: '击杀加速技能充能，裂谷增伤+电弧连锁，PVP压制与辅助兼备。',
    difficulty: '进阶',
    tags: ['PVP', '技能循环']
  }
]

// 武器推荐规则
export const weaponRecs = [
  {
    id: 'pve-general',
    activity: 'PVE通用', mode: 'pve',
    kinetic: '脉冲步枪/自动步枪（加急+狂暴词条）',
    energy: '融合步枪/追踪步枪（对应元素）',
    heavy: '线性融合步枪（Boss）/ 火箭筒',
    why: '线性融合为Boss战主流，脉冲/自动清怪稳定，词条优先"加急(Ambitious Assassin)"“狂暴(Rampage)”。'
  },
  {
    id: 'pve-nightfall',
    activity: '宗师夜幕/高难行动', mode: 'pve-hard',
    kinetic: '屏障/超载反制武器（对应赛季神器）',
    energy: '不可阻挡反制武器',
    heavy: '火箭筒/机枪',
    why: '冠军反制是核心，选择带反冠军词条或神器模组的武器。'
  },
  {
    id: 'pve-raid',
    activity: '突袭/地牢Boss', mode: 'pve-boss',
    kinetic: '异域手枪（Ace/荆棘）或白板',
    energy: '异域追迹（神圣破碎 Divinity）',
    heavy: '异域火箭筒（金枪 Gjallarhorn）/ 线性融合',
    why: '团队中有一人带Divinity增伤，其余用Gjallarhorn或线性融合打出爆发。'
  },
  {
    id: 'pvp-crucible',
    activity: '熔炉（PVP）', mode: 'pvp',
    kinetic: '手枪（手炮）/ 脉冲步枪',
    energy: '冲锋枪/霰弹枪',
    heavy: '火箭筒/机枪',
    why: '手炮+冲锋枪是经典组合，追求ttk（击杀时间）与地图控制。'
  },
  {
    id: 'pvp-trials',
    activity: '奥西里斯试炼', mode: 'pvp-trials',
    kinetic: '异域手枪（最后之言/埃蒙之火）',
    energy: '脉冲步枪/狙击枪',
    heavy: '机枪（保命）/ 火箭筒',
    why: '试炼更重视生存与信息，狙击+手枪适合对枪，机枪防止被夺。'
  }
]

// 套装配置推荐规则
export const loadoutRules = {
  statPriority: {
    pve: ['韧性100 → 纪律/智慧100 → 恢复'],
    pvp: ['韧性100 → 恢复100 → 机动/纪律']
  },
  slotTips: [
    '头盔：瞄准/弹药/超能力模组',
    '臂铠：近战/装填/武器拾取模组',
    '胸甲：抗性模组（对特定伤害类型减伤）',
    '腿甲：弹药储备/移动模组',
    '职业装备：技能充能/终结技模组'
  ],
  setBonusTips: [
    '凑齐 2/4/6 件激活套装加成',
    '用异域件替换属性最差的部位',
    '优先选高 Tier 护甲（属性总值更高）'
  ]
}

export const getBuildsByFilter = (classId, element, mode) => {
  return builds.filter(b =>
    (!classId || b.classId === classId) &&
    (!element || b.element === element) &&
    (!mode || b.mode === mode)
  )
}
