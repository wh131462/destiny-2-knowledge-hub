// Legacy recommendation examples were removed. Keep this module as a stable
// compatibility boundary for the retired tools page; only weapon guidance and
// future rule data may be added back after verification.
export const builds = []

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
    pve: ['Health 先到玩法需要的档位 → Grenade / Melee / Class 按循环分配 → Weapons / Super 按活动补足'],
    pvp: ['Health 与 Weapons 先看对局需求 → Class / Melee 支撑中立游戏 → Grenade / Super 作为补充']
  },
  slotTips: [
    '头盔：瞄准/弹药/超能力模组',
    '臂铠：近战/装填/武器拾取模组',
    '胸甲：抗性模组（对特定伤害类型减伤）',
    '腿甲：弹药储备/移动模组',
    '职业装备：技能充能/终结技模组'
  ],
  setBonusTips: [
    '套装加成的触发件数和效果以当前 Manifest 与补丁说明为准',
    '用异域件替换属性最差的部位',
    '优先比较 Health、Melee、Grenade、Class、Super、Weapons 的实际分布与套装效果；Tier 不能替代属性和机制适配'
  ]
}

export const getBuildsByFilter = (classId, element, mode) => {
  return builds.filter(b =>
    (!classId || b.classId === classId) &&
    (!element || b.element === element) &&
    (!mode || b.mode === mode)
  )
}
