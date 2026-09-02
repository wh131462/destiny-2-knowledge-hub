// 活动数据（数据源：知识库 07-活动与玩法、08-突袭与地牢）

export const opsTypes = [
  { id: 'solo', name: '独狼行动', en: 'Solo Ops', size: '1', time: '5-10分钟', score: '目标制', desc: '单人短任务，适合碎片时间；含挑战目标' },
  { id: 'fireteam', name: '火力队行动', en: 'Fireteam Ops', size: '1-3', time: '10-40+分钟', score: '击杀制', desc: '历代3人活动轮换；大师/宗师/终极难度可匹配' },
  { id: 'arena', name: '竞技场行动', en: 'Arena Ops', size: '1-6', time: '10-15分钟', score: '目标制', desc: '历代6人季节活动轮换' },
  { id: 'pinnacle', name: '巅峰行动', en: 'Pinnacle Ops', size: '1-3', time: '10-40+分钟', score: '目标制', desc: '高难3人（线圈、长老之墓等），奖励池独立' },
  { id: 'crucible', name: '熔炉行动', en: 'Crucible Ops', size: '1-6', time: '5-10分钟', score: '表现制', desc: 'PVP各模式，含周末奥西里斯试炼' }
]

export const raids = [
  { id: 'leviathan', name: '利维坦', en: 'Leviathan', source: '本体(2017)', desc: '卡鲁斯皇帝的飞船宴会' },
  { id: 'eater', name: '世界吞噬者', en: 'Eater of Worlds', source: '奥西里斯诅咒', desc: '利维坦巢穴行动' },
  { id: 'spire', name: '星之尖塔', en: 'Spire of Stars', source: '战争思维', desc: '利维坦巢穴行动' },
  { id: 'lastwish', name: '最终心愿', en: 'Last Wish', source: '遗落之族(2018)', desc: '梦之城、瑞文之死、许愿' },
  { id: 'scourge', name: '过往之灾', en: 'Scourge of the Past', source: '锻造季(2018)', desc: '黑色军械库、SIVA工厂' },
  { id: 'crown', name: '悲伤之冠', en: 'Crown of Sorrow', source: '富裕季(2019)', desc: '卡鲁斯与邪魔族' },
  { id: 'garden', name: '救赎之园', en: 'Garden of Salvation', source: '暗影要塞(2019)', desc: '黑花园、圣所' },
  { id: 'dsc', name: '深石地窖', en: 'Deep Stone Crypt', source: '凌光之刻(2020)', desc: '克洛维斯·布雷、Exo起源' },
  { id: 'vog', name: '玻璃穹顶', en: 'Vault of Glass', source: '2021复刻', desc: '命运1经典复刻' },
  { id: 'vow', name: '信徒之誓', en: 'Vow of the Disciple', source: '邪姬魅影(2022)', desc: '见证者信徒、其罗顿' },
  { id: 'kingsfall', name: '王者陨落', en: "King's Fall", source: '2022复刻', desc: '欧里克斯回归' },
  { id: 'root', name: '噩梦之根', en: 'Root of Nightmares', source: '光陨之秋(2023)', desc: '奈扎雷克、星光花园' },
  { id: 'crotas', name: '克罗塔之末', en: "Crota's End", source: '2023复刻', desc: '邪魔族王子克罗塔' },
  { id: 'salvation', name: '救赎之刃', en: "Salvation's Edge", source: '终焉之形(2024)', desc: '见证者终局突袭' },
  { id: 'desert', name: '永恒荒漠', en: 'The Desert Perpetual', source: '宿命边缘(2025)', desc: '命运传奇首个突袭，"跨越无限的门槛"，含史诗(Epic)版本', new: true }
]

export const dungeons = [
  { id: 'shattered-throne', name: '破碎王座', en: 'Shattered Throne', source: '遗落之族(2018)', desc: '梦之城、杜尔·因卡鲁' },
  { id: 'pit', name: '异端之坑', en: 'Pit of Heresy', source: '暗影要塞(2019)', desc: '月球异端祭坛' },
  { id: 'prophecy', name: '预言', en: 'Prophecy', source: '抵达季(2020)', desc: '九尊试炼、白色宫殿' },
  { id: 'grasp', name: '贪婪之握', en: 'Grasp of Avarice', source: '30周年(2021)', desc: '海盗宝库、被遗忘之舟' },
  { id: 'duality', name: '二重性', en: 'Duality', source: '闹鬼季(2022)', desc: '卡鲁斯内心世界' },
  { id: 'spire-watcher', name: '守望者尖塔', en: 'Spire of the Watcher', source: '炽天使季(2022)', desc: '火星Seraph设施' },
  { id: 'ghosts-deep', name: '深海之影', en: 'Ghosts of the Deep', source: '深渊季(2023)', desc: '泰坦星、希乌·阿拉斯之女' },
  { id: 'warlords', name: '军阀遗迹', en: "Warlord's Ruin", source: '祈愿季(2023)', desc: '军阀、克恩之角' },
  { id: 'equilibrium', name: '均衡', en: 'Equilibrium', source: '叛逃者(2025)', desc: '追猎德雷根·贝尔，"火与影之间"', new: true }
]

export const events = [
  { id: 'solstice', name: '至日', en: 'Solstice', time: '夏季', desc: '至日护甲升阶、事件通行证' },
  { id: 'fotl', name: '邪魔节', en: 'Festival of the Lost', time: '秋季/万圣', desc: '糖果、面具、闹鬼活动' },
  { id: 'dawning', name: '曙光节', en: 'The Dawning', time: '冬季', desc: '烘焙美食、送礼' },
  { id: 'guardian-games', name: '守护者运动会', en: 'Guardian Games', time: '春季', desc: '三职业竞速刷分' },
  { id: 'iron-banner', name: '钢铁旗', en: 'Iron Banner', time: '不定期', desc: '熔炉限时模式' }
]

export const currentStatus = {
  version: '9.7.0.3',
  versionDate: '2026-07-08',
  status: '维护运营期（持续内容更新已终止）',
  finalUpdate: '凯旋纪念碑（Monument of Triumph）— 2026-06-09',
  note: '服务器照常运行，PVE/PVP/赛季内容均可游玩；周期事件仍按惯例轮换。'
}
