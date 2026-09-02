// 竞技场手炮天梯采用独立的编辑数据；武器图标、素体、框架与默认词条仍从 Manifest 读取。
// 排名用于横向比较当前常见手炮，不代表 Bungie 官方结论。
export const handCannonTierList = [
  { rank: 1, tier: 'S', hash: 882778888, name: 'Rose', nameZh: '玫瑰', source: '竞技模式聚焦', note: '轻质框架带来额外机动性，辅助瞄准出色；好用的移动决斗手炮。' },
  { rank: 2, tier: 'S', hash: 1973107014, name: 'Igneous Hammer', nameZh: '烈焰之锤', source: '奥斯里斯试炼', note: '120 射速中的顶级素体，射程与容错兼备，适合中远距离卡点。' },
  { rank: 3, tier: 'S', hash: 3856705927, name: 'Hawkmoon', nameZh: '隼月', source: '异域任务轮换', note: '高辅助瞄准配合终局子弹，连续精准命中能显著改变对枪节奏。' },
  { rank: 4, tier: 'S', hash: 347366834, name: 'Ace of Spades', nameZh: '黑桃A', source: '失落光能纪念碑', note: '雷达常驻、萤火虫与增伤弹一体，信息和击杀后的压制力都很强。' },
  { rank: 5, tier: 'S', hash: 3973202132, name: 'Thorn', nameZh: '荆棘', source: '失落光能纪念碑', note: '持续伤害会延迟恢复并暴露敌方状态，近中距离压迫感极强。' },
  { rank: 6, tier: 'S', hash: 2171478765, name: 'Fatebringer', nameZh: '命运终结者', source: '玻璃拱顶', note: '均衡的 140 素体与稳定手感，拥有适合决斗和团队压制的词条组合。' },

  { rank: 7, tier: 'A', hash: 2907129557, name: 'Sunshot', nameZh: '烈日弹丸', source: '世界异域掉落', note: '150 射速和爆炸连锁提供独特节奏；准星与后坐需要短暂适应。' },
  { rank: 8, tier: 'A', hash: 2429822977, name: 'Austringer', nameZh: '养鹰人', source: '预言家任务轮换', note: '可塑形且词条池扎实，稳定、射程和操控可按个人手感微调。' },
  { rank: 9, tier: 'A', hash: 386864872, name: 'Eyasluna', nameZh: '鹰月', source: '贪婪之握', note: '手感顺滑、辅助瞄准高，静态推进和持续移动都能保持稳定命中。' },
  { rank: 10, tier: 'A', hash: 432476743, name: 'The Palindrome', nameZh: '回文', source: '日落遗产池', note: '能量槽的经典全能选择，基础射程和稳定性让它不依赖特定玩法。' },
  { rank: 11, tier: 'A', hash: 548809020, name: 'Exalted Truth', nameZh: '崇高真理', source: '奥斯里斯试炼', note: '能量 140 中的优质素体，适合需要为动能特殊武器让位的配装。' },
  { rank: 12, tier: 'A', hash: 233423981, name: "Warden's Law", nameZh: '典狱长的规则', source: '日落打击', note: '双发点射能制造很高的瞬时压制，但对瞄准节奏与稳定性要求更高。' },
  { rank: 13, tier: 'A', hash: 372697604, name: 'Cantata-57', nameZh: '大合唱-57', source: '世界掉落', note: '容易理解的能量决斗手炮，射程词条成型后仍有可靠竞争力。' },
  { rank: 14, tier: 'A', hash: 3437746471, name: 'Crimson', nameZh: '血色浪漫', source: '世界异域掉落', note: '三连发和击杀回血降低连续交战压力，控制器环境尤其稳定。' },

  { rank: 15, tier: 'B', hash: 1875512595, name: 'Kept Confidence', nameZh: '笃信', source: '季节遗产池', note: '素体舒服但词条上限较克制，更适合作为稳定易用的备选。' },
  { rank: 16, tier: 'B', hash: 2034215657, name: 'Round Robin', nameZh: '循环赛', source: '霓虹城', note: '120 的高单发伤害配合强力词条能滚起雪球，基础操控略显笨重。' },
  { rank: 17, tier: 'B', hash: 810474118, name: 'Trust', nameZh: '信任', source: '智谋', note: '180 射速容错高、后坐温和，代价是有效距离和击杀时间较普通。' },
  { rank: 18, tier: 'B', hash: 810474119, name: 'Spare Rations', nameZh: '备用口粮', source: '智谋', note: '轻快灵活且有优秀辅助瞄准，但面对顶级射程手炮时需要主动控距。' },
  { rank: 19, tier: 'B', hash: 2907129556, name: 'Sturm', nameZh: '狂飙', source: '失落光能纪念碑', note: '出色射程让它适合远端对点；完整强度更依赖与突进的联动。' },
  { rank: 20, tier: 'B', hash: 1364093401, name: 'The Last Word', nameZh: '遗言', source: '失落光能纪念碑', note: '腰射近战极具威胁，使用场景鲜明，但地图和输入方式会放大波动。' },
  { rank: 21, tier: 'B', hash: 204878059, name: 'Malfeasance', nameZh: '渎职', source: '异域任务', note: '弹匣大且命中叠层稳定，适合团队集火；单人正面对枪爆发偏慢。' },

  { rank: 22, tier: 'C', hash: 654370424, name: 'Nation of Beasts', nameZh: '野兽国度', source: '最后一愿', note: '能量 140 的合格选择，偏向 PvE 的词条分布限制了竞技场上限。' },
  { rank: 23, tier: 'C', hash: 3281285075, name: 'Posterity', nameZh: '后代', source: '深石地窖', note: '180 框架稳定易控，可塑形是优势，但峰值击杀效率并不突出。' },
  { rank: 24, tier: 'C', hash: 120706239, name: 'Word of Crota', nameZh: '克洛塔之语', source: '克洛塔的末日', note: '虚空联动和高容错更偏构筑用途，纯决斗能力处于中游。' },
  { rank: 25, tier: 'C', hash: 431721920, name: "Zaouli's Bane", nameZh: '扎乌利的克星', source: '国王的陨落', note: 'PvE 清怪非常优秀；竞技场中操控和模型手感会拖慢首发反应。' },
  { rank: 26, tier: 'C', hash: 1123421440, name: 'Epochal Integration', nameZh: '划时代整合', source: '光陨之秋任务', note: '固定配置开箱即用，适合过渡，但无法围绕个人习惯进一步优化。' },
  { rank: 27, tier: 'C', hash: 1046651176, name: 'Bottom Dollar', nameZh: '筹码', source: '智谋', note: '词条组合丰富、伤害扎实；获取随机且操控偏慢，成型成本较高。' },

  { rank: 28, tier: 'D', hash: 575830664, name: 'D.F.A.', nameZh: '死从天降', source: '日落遗产池', note: '基础能力尚可，但同槽位有太多射程、手感和词条更完整的替代品。' },
  { rank: 29, tier: 'D', hash: 2888266564, name: 'Crisis Inverted', nameZh: '反转危机', source: '熔炉竞技场', note: '可用词条很多却难以精准获取，素体优势不足以抵消刷取成本。' },
  { rank: 30, tier: 'D', hash: 586671776, name: 'Something New', nameZh: '新玩意', source: '至日活动', note: '季节特色鲜明，但笨重的基础手感让它更依赖非常精准的配装。' },
  { rank: 31, tier: 'D', hash: 153979397, name: 'Better Devils', nameZh: '魔鬼中的天使', source: '熔炉竞技场', note: '经典外形与清晰模型仍然讨喜，当前环境下的综合上限较低。' },
  { rank: 32, tier: 'D', hash: 868076517, name: 'Loud Lullaby', nameZh: '洪亮摇篮曲', source: '月球', note: '射程潜力不错，但稳定与操控短板明显，需要投入大量属性修正。' },
  { rank: 33, tier: 'D', hash: 1622998472, name: 'Vulpecula', nameZh: '星狐座', source: '季节遗产池', note: '射击稳定且易上手，180 框架的输出节奏使它难进高强度对局。' }
]

export const tierMeta = {
  S: { label: '统治环境', summary: '素体、手感或独特机制足以定义对枪方式' },
  A: { label: '强力之选', summary: '稳定可靠，稍加适配即可进入高强度对局' },
  B: { label: '值得使用', summary: '有明确优势，也存在需要配装或控距弥补的短板' },
  C: { label: '场景可用', summary: '在特定构筑或偏好下成立，泛用性有限' },
  D: { label: '等待加强', summary: '仍可使用，但目前有更高效的同类替代' }
}
