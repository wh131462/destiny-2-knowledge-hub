// 敌人、角色、资料片数据（数据源：知识库 09/10/11）

export const enemyRaces = [
  {
    id: 'cabal', name: '卡巴尔', en: 'Cabal', type: '重装军团',
    desc: '星际帝国，军事化重甲。派系：红军团、帝国军团、暗影军团、Barant帝国。',
    units: ['盾兵 Phalanx', '百夫长 Centurion', '巨人 Colossus', '灵能者 Psion', '战争猎犬 War Beast']
  },
  {
    id: 'fallen', name: '埃尔克斯尼（堕落者）', en: 'Fallen / Eliksni', type: '海盗/掠夺',
    desc: '多足类海盗种族，依赖以太存活。部落：狼之屋、国王之屋、救赎之屋、放逐之屋、光之屋（盟友）。',
    units: ['杂兵 Dreg', '强盗 Vandal', '船长 Captain', '伺服器 Servitor', '大祭司 Archon']
  },
  {
    id: 'hive', name: '邪魔族', en: 'Hive', type: '黑暗生物',
    desc: '崇拜黑暗的古老种族，拥有王座世界机制。神系：欧里克斯、萨瓦图恩、希乌·阿拉斯。光之邪魔族（Lucent Hive）获得光能。',
    units: ['虫群 Thrall', '侍从 Acolyte', '骑士 Knight', '巫师 Wizard', '食人魔 Ogre', '尖叫者 Shrieker']
  },
  {
    id: 'taken', name: '被夺者', en: 'Taken', type: '转化生物',
    desc: '被黑暗"夺取"转化的各族生物，黑雾包裹，具有传送与免疫机制。',
    units: ['被夺系各类兵种']
  },
  {
    id: 'vex', name: '维克司', en: 'Vex', type: '机械军团',
    desc: '时间旅行的机械蜂群，模拟并改造现实。拥有无穷森林与黑花园。',
    units: ['哥布林 Goblin', '霍布哥布林 Hobgoblin', '弥诺陶洛斯 Minotaur', '九头蛇 Hydra', '独眼 Cyclops', '飞龙 Wyvern']
  },
  {
    id: 'scorn', name: '蔑视者', en: 'Scorn', type: '亡灵堕落者',
    desc: '被黑暗复活的堕落者，半机械半亡灵。',
    units: ['自爆者 Screeb', '袭击者 Raider', '酋长 Chieftain', '憎恶 Abomination']
  },
  {
    id: 'dread', name: '终焉', en: 'Dread', type: '黑暗军队',
    desc: '见证者的直属军队（终焉之形），融合多种黑暗造物。',
    units: ['压制者 Subjugator', '群鸦 Grim', '先驱者 Harbinger', '缚丝系 Threadlings']
  },
  {
    id: 'barant', name: 'Barant', en: 'Barant', type: '卡巴尔系：新阵营',
    desc: '《叛逃者》新增的卡巴尔敌人阵营（Barant帝国），全新卡巴尔兵种，首次引入。',
    units: ['全新卡巴尔兵种', '帝国执政官', '战争载具']
  },
  {
    id: 'aionian', name: '艾欧尼安人', en: 'Aionians', type: '神秘存在',
    desc: '《宿命边缘》中开普勒（Kepler）的关联文明。',
    units: ['开普勒相关敌人']
  }
]

export const characters = [
  { id: 'zavala', name: '萨瓦拉', en: 'Zavala', role: '先锋指挥官（泰坦）', desc: '泰坦先锋，先锋最高指挥官；《宿命边缘》揭示觉醒者血统伏笔。' },
  { id: 'cayde', name: '凯德-6', en: 'Cayde-6', role: '猎人先锋（前）', desc: '深受喜爱的幽默角色，遗落之族中牺牲，终焉之形回归。' },
  { id: 'ikora', name: '伊科拉·蕾', en: 'Ikora Rey', role: '术士先锋', desc: '智慧导师，领导"隐藏"情报组织。' },
  { id: 'osiris', name: '欧西里斯', en: 'Osiris', role: '传奇术士', desc: '见证者剧情关键人物。' },
  { id: 'eris', name: '埃里斯·莫恩', en: 'Eris Morn', role: '守望者/猎人', desc: '光与暗传奇核心智者。' },
  { id: 'saint14', name: '圣-14', en: 'Saint-14', role: '泰坦传奇', desc: '曾与维克司作战的传奇泰坦。' },
  { id: 'saladin', name: '萨拉丁·福吉', en: 'Lord Saladin', role: '铁旗之主', desc: '钢铁领主，铁旗活动负责人。' },
  { id: 'mithrax', name: '米斯拉克斯', en: 'Mithrax', role: '光之屋领袖', desc: '与人类结盟的埃尔克斯尼领袖。' },
  { id: 'eido', name: '达姆', en: 'Eido', role: '埃尔克斯尼学者', desc: '光之屋学者，米斯拉克斯之女。' },
  { id: 'spider', name: '蜘蛛', en: 'Spider', role: '犯罪头目', desc: '纷乱海岸/叛逃者中的情报贩子。' },
  { id: 'mara', name: '玛拉·索夫', en: 'Mara Sov', role: '觉醒者女王', desc: '梦之城之主。' },
  { id: 'crow', name: '阿尔登·索夫/渡鸦', en: 'Uldren Sov / Crow', role: '猎人先锋候选人', desc: '杀死凯德-6后复活为守护者"渡鸦"。' },
  { id: 'xur', name: 'Xûr（休尔）', en: "Xûr, Agent of the Nine", role: '九尊代理人', desc: '每周出售异域装备的商人。' },
  { id: 'drifter', name: '漂泊者', en: 'The Drifter', role: '智谋主持人', desc: '亦正亦邪的智谋主人。' },
  { id: 'shaxx', name: '沙克斯', en: 'Lord Shaxx', role: '熔炉主持人', desc: 'PVP主持人。' },
  { id: 'rasputin', name: '拉斯普京', en: 'Rasputin', role: '战争思维AI', desc: '黄金时代遗留的Warmind AI。' },
  { id: 'clovis', name: '克洛维斯·布雷一世', en: 'Clovis Bray I', role: '科学家', desc: '深石地窖主谋。' },
  { id: 'aunor', name: '阿诺尔·玛哈尔', en: 'Aunor Mahal', role: '术士（普拉希克教团）', desc: '《叛逃者》地牢"均衡"队友。' },
  { id: 'ghaul', name: '盖欧', en: 'Dominus Ghaul', role: '红军团指挥官', desc: '红战争最终Boss。', villain: true },
  { id: 'calus', name: '卡鲁斯', en: 'Emperor Calus', role: '前卡巴尔皇帝', desc: '利维坦主人，见证者信徒。', villain: true },
  { id: 'savathun', name: '萨瓦图恩', en: 'Savathûn', role: '诡计之神', desc: '邪姬魅影主角，邪魔族三姐妹之一。', villain: true },
  { id: 'oryx', name: '欧里克斯', en: 'Oryx', role: '被夺之王', desc: '命运1《被夺之王》Boss。', villain: true },
  { id: 'witness', name: '见证者', en: 'The Witness', role: '终极大反派', desc: '光与暗传奇最终反派，终焉之形被击败。', villain: true },
  { id: 'nezarec', name: '奈扎雷克', en: 'Nezarec', role: '最终痛苦之神', desc: '光陨之秋突袭Boss。', villain: true },
  { id: 'dredgen-bael', name: '德雷根·贝尔', en: 'Dredgen Bael', role: '影之狂信者', desc: '《叛逃者》地牢"均衡"追猎目标。', villain: true },
  { id: 'maya', name: '玛雅·桑达雷什', en: 'Maya Sundaresh', role: '科学家', desc: '《宿命边缘》主要角色之一。' },
  { id: 'orin', name: '奥琳', en: 'Orin', role: '九尊使者', desc: '《宿命边缘》核心角色。' }
]

export const expansions = [
  { year: '2017', name: '红战争（本体）', en: 'Red War', feature: '基础', destination: 'EDZ/泰坦/奈瑟斯等' },
  { year: '2017', name: '奥西里斯诅咒', en: 'Curse of Osiris', feature: '—', destination: '水星' },
  { year: '2018', name: '战争思维', en: 'Warmind', feature: '战争思维', destination: '火星' },
  { year: '2018', name: '遗落之族', en: 'Forsaken', feature: '赛季制', destination: '纷乱海岸/梦之城' },
  { year: '2019', name: '暗影要塞', en: 'Shadowkeep', feature: '艺术神器', destination: '月球' },
  { year: '2020', name: '凌光之刻', en: 'Beyond Light', feature: '冰凝 Stasis', destination: '欧罗巴' },
  { year: '2022', name: '邪姬魅影', en: 'The Witch Queen', feature: '武器锻造', destination: '王座世界' },
  { year: '2023', name: '光陨之秋', en: 'Lightfall', feature: '缚丝 Strand', destination: '奈奥姆那' },
  { year: '2024', name: '终焉之形', en: 'The Final Shape', feature: '章节制、棱镜', destination: '苍白之心' },
  { year: '2025', name: '宿命边缘', en: 'The Edge of Fate', feature: '护甲3.0、装备分层、门户', destination: '开普勒 Kepler', saga: '命运传奇' },
  { year: '2025', name: '叛逃者', en: 'Renegades', feature: '爆能枪、十字弓、Barant', destination: '法外边境/火星/欧罗巴', saga: '命运传奇' }
]

export const sagas = [
  {
    id: 'light-darkness',
    name: '光与暗传奇',
    en: 'The Light and Darkness Saga',
    years: '2014–2024',
    desc: '覆盖《命运1》到《命运2：终焉之形》的十年主线。见证者、旅者、光与暗的史诗对抗，以终焉之形击败见证者收官。',
    key: ['命运1五部内容', '红战争', '遗落之族', '暗影要塞', '凌光之刻', '邪姬魅影', '光陨之秋', '终焉之形']
  },
  {
    id: 'fate',
    name: '命运传奇',
    en: 'The Fate Saga',
    years: '2025–2026',
    desc: '第二个十年，采用每年两部资料片的新模式（预言之年）。以《宿命边缘》开篇、随《凯旋纪念碑》收官；后续《碎裂循环》《炼金术士》被取消。',
    key: ['宿命边缘(2025.7)', '叛逃者(2025.12)', '凯旋纪念碑(2026.6)', '原计划:碎裂循环/炼金术士(取消)']
  }
]
