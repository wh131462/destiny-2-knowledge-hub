import { MANIFEST_VERSION } from '../meta.js'

const armor = (helmet = [], arms = [], chest = [], legs = [], classItem = []) => ({ helmet, arms, chest, legs, classItem })
const weapon = (itemId, perks = [], purpose = '') => ({ itemId, perks, purpose })

const curatedBuildsBase = [
  {
    id: 'prismatic-titan-consecration',
    name: '棱镜泰坦：奉献连锁',
    classId: 'titan', subclassId: 'titan-prismatic', activityIds: ['pve-general', 'legend-campaign', 'grandmaster'],
    goal: '以三层狂乱利刃驱动奉献，利用点燃处理高密度敌群，并通过击倒维持续航。',
    abilities: {
      superId: 'super-twilight-arsenal', classAbilityId: 'class-thruster', meleeId: 'melee-frenzied-blade', grenadeId: 'grenade-shackle',
      aspectIds: ['aspect-consecration', 'aspect-knockout'],
      facetIds: ['facet-purpose', 'facet-protection', 'facet-balance', 'facet-ruin', 'facet-courage']
    },
    exoticArmorId: 'synthoceps',
    weapons: [
      weapon('the-call', ['Lead from Gold', 'One for All'], '特殊弹药经济、缚丝伤害和中距离精英处理'),
      weapon('sunshot', [], '用炽阳爆炸补足远程清怪并积累光能超越能量'),
      weapon('edge-transit', ['Envious Assassin', 'Destabilizing Rounds'], '虚空重型爆发并维持易爆弹链')
    ],
    armorMods: armor(
      ['hands-on', 'heavy-ammo-finder', 'stat-resilience'],
      ['heavy-handed', 'impact-induction', 'stat-discipline'],
      ['concussive-dampener', 'melee-damage-resistance', 'stat-resilience'],
      ['recuperation', 'void-weapon-surge', 'stat-discipline'],
      ['powerful-attraction', 'reaper', 'bomber']
    ),
    baseStats: { mobility: 20, resilience: 80, recovery: 30, discipline: 80, intellect: 30, strength: 40 },
    targetStats: { resilience: 100, discipline: 100 },
    mechanicIds: ['scorch', 'ignite', 'healing', 'damage-resistance', 'transcendence', 'suspend'],
    championCoverage: { unstoppable: ['点燃', '束缚手雷悬浮'], barrier: ['勇气之面触发拆解弹'], overload: [] },
    rotation: [
      '先用束缚手雷控制危险目标；需要保留反不可阻挡手段时不要随意消耗。',
      '滑铲后连续触发奉献上挑与砸地；优先在敌群或精英旁引爆点燃。',
      '拾取近战击杀生成的能量球，以休养生息回血并触发使命之面。',
      '光暗能量充满后进入超越，利用快速技能回复继续奉献循环。',
      '面对首领时先用两把非重型武器造成伤害，再切边缘交通触发诱导推销。'
    ],
    limitations: ['近战环境危险；宗师中必须从掩体边缘切入。', '当前配置没有稳定反超载，活动出现超载冠军时必须替换武器或由队友覆盖。'],
    alternatives: [
      { replace: 'synthoceps', with: 'hazardous-propulsion', effect: '失去近战增幅，改为推进器与火箭协同。' },
      { replace: 'sunshot', with: 'graviton-lance', effect: '改为虚空远程清怪，并释放异域槽位之外的炽阳依赖。' }
    ],
    acquisitionPriority: ['synthoceps', 'the-call', 'sunshot', 'edge-transit'],
    scoring: { survivability: 82, addClear: 95, control: 78, bossDamage: 68, support: 45, ammoEconomy: 75 },
    difficulty: '进阶', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  },
  {
    id: 'prismatic-hunter-combination-blow',
    name: '棱镜猎人：闪身拳链',
    classId: 'hunter', subclassId: 'hunter-prismatic', activityIds: ['pve-general', 'legend-campaign'],
    goal: '用赌徒闪身与组合打击形成闭环，通过凛冬帷幕减速、潇洒处刑者隐身来维持贴身作战。',
    abilities: {
      superId: 'super-golden-gun-marksman', classAbilityId: 'class-gamblers-dodge', meleeId: 'melee-combination-blow', grenadeId: 'grenade-grapple',
      aspectIds: ['aspect-stylish-executioner', 'aspect-winters-shroud'],
      facetIds: ['facet-purpose', 'facet-protection', 'facet-blessing', 'facet-ruin', 'facet-courage']
    },
    exoticArmorId: 'liars-handshake',
    weapons: [
      weapon('the-call', ['Lead from Gold', 'One for All'], '处理中距离精英与暗影能量积累'),
      weapon('graviton-lance', [], '安全距离清怪和虚空爆炸'),
      weapon('crux-termination-iv', ['Tracking Module', 'Wild Card'], '爆发输出与追踪弹体协同')
    ],
    armorMods: armor(
      ['hands-on', 'heavy-ammo-finder', 'stat-mobility'],
      ['heavy-handed', 'focusing-strike', 'stat-resilience'],
      ['concussive-dampener', 'melee-damage-resistance', 'stat-resilience'],
      ['recuperation', 'better-already', 'stat-mobility'],
      ['powerful-attraction', 'reaper', 'bomber']
    ),
    baseStats: { mobility: 80, resilience: 80, recovery: 20, discipline: 40, intellect: 30, strength: 30 },
    targetStats: { mobility: 100, resilience: 100 },
    mechanicIds: ['slow', 'freeze', 'invisibility', 'healing', 'damage-resistance', 'transcendence'],
    championCoverage: { unstoppable: ['冻结后粉碎'], barrier: ['勇气之面触发拆解弹'], overload: ['闪身施加减速'] },
    rotation: [
      '靠近敌人使用赌徒闪身，返还组合打击并由凛冬帷幕施加减速。',
      '用组合打击完成最后一击，提升近战层数并触发骗子握手的交叉反击条件。',
      '对减速或其他元素减益目标完成击杀，触发潇洒处刑者进入隐身。',
      '在隐身窗口重定位，继续闪身与近战；拾取能量球恢复生命。',
      '无法安全近身时用引力子长枪清怪，不要为了维持层数强行冲入致命区域。'
    ],
    limitations: ['依赖近战最后一击，在多人低难中可能被队友抢走循环目标。', '不推荐直接用于高压宗师；需要远程替代方案。'],
    alternatives: [{ replace: 'liars-handshake', with: 'gyrfalcons-hauberk', effect: '从近战循环改为隐身后虚空武器易爆弹循环。' }],
    acquisitionPriority: ['liars-handshake', 'graviton-lance', 'the-call', 'crux-termination-iv'],
    scoring: { survivability: 78, addClear: 92, control: 76, bossDamage: 55, support: 30, ammoEconomy: 82 },
    difficulty: '进阶', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  },
  {
    id: 'prismatic-warlock-getaway-watcher',
    name: '棱镜术士：电弧之魂冰炮台',
    classId: 'warlock', subclassId: 'warlock-prismatic', activityIds: ['pve-general', 'legend-campaign', 'grandmaster'],
    goal: '通过逃逸艺术家消耗风暴手雷生成电弧之魂，同时由黯淡守望者提供冰凝炮台，形成持续清怪与控场。',
    abilities: {
      superId: 'super-song-of-flame', classAbilityId: 'class-healing-rift', meleeId: 'melee-arcane-needle', grenadeId: 'grenade-storm',
      aspectIds: ['aspect-bleak-watcher', 'aspect-feed-the-void'],
      facetIds: ['facet-protection', 'facet-purpose', 'facet-balance', 'facet-hope', 'facet-courage']
    },
    exoticArmorId: 'getaway-artist',
    weapons: [
      weapon('lost-signal', ['Auto-Loading Holster', 'One for All'], '持续区域伤害、暗影能量与超越积累'),
      weapon('no-hesitation', ['Physic', 'Circle of Life'], '为队友提供支援并积累光能'),
      weapon('pro-memoria', ['Reconstruction', 'Bait and Switch'], '重弹清怪和中长输出窗口')
    ],
    armorMods: armor(
      ['ashes-to-assets', 'heavy-ammo-finder', 'stat-discipline'],
      ['firepower', 'impact-induction', 'stat-discipline'],
      ['concussive-dampener', 'sniper-damage-resistance', 'stat-resilience'],
      ['recuperation', 'better-already', 'stat-resilience'],
      ['powerful-attraction', 'reaper', 'bomber']
    ),
    baseStats: { mobility: 20, resilience: 80, recovery: 50, discipline: 80, intellect: 30, strength: 30 },
    targetStats: { resilience: 100, discipline: 100 },
    mechanicIds: ['amplified', 'slow', 'freeze', 'devour', 'healing', 'transcendence'],
    championCoverage: { unstoppable: ['冻结后粉碎'], barrier: ['勇气之面触发拆解弹'], overload: ['冰凝炮台持续减速'] },
    rotation: [
      '按住手雷输入消耗风暴手雷，生成强化电弧之魂；黯淡守望者会同时提供冰凝炮台协同。',
      '用技能完成最后一击触发吞噬，依靠吞噬返还手雷能量并恢复生命。',
      '使用失落信号铺设持续伤害区域，让炮台控制敌人的同时积累暗影能量。',
      '在电弧之魂即将结束或进入新战斗区域时重新消耗手雷，不要无意义覆盖持续时间。',
      '宗师中从掩体后投放炮台；超载冠军由连续减速控制，不要只依赖一次冻结。'
    ],
    limitations: ['需要控制手雷消耗时机；错误投掷普通手雷会中断双召唤节奏。', '具体交互可能随平衡补丁调整，使用前需查看版本提示。'],
    alternatives: [{ replace: 'no-hesitation', with: 'sunshot', effect: '放弃直接队伍治疗，换取更强清怪速度。' }],
    acquisitionPriority: ['getaway-artist', 'lost-signal', 'no-hesitation', 'pro-memoria'],
    scoring: { survivability: 88, addClear: 90, control: 96, bossDamage: 55, support: 76, ammoEconomy: 82 },
    difficulty: '入门', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  },
  {
    id: 'prismatic-hunter-still-hunt',
    name: '棱镜猎人：夜鹰静猎爆发',
    classId: 'hunter', subclassId: 'hunter-prismatic', activityIds: ['raid-boss'],
    goal: '利用天界夜鹰强化黄金枪，并让仍然狩猎的异域射击获得同一套爆发协同。',
    abilities: {
      superId: 'super-golden-gun-marksman', classAbilityId: 'class-marksman-dodge', meleeId: 'melee-threaded-spike', grenadeId: 'grenade-duskfield',
      aspectIds: ['aspect-stylish-executioner', 'aspect-gunpowder-gamble'],
      facetIds: ['facet-purpose', 'facet-courage', 'facet-grace', 'facet-protection', 'facet-dawn']
    },
    exoticArmorId: 'celestial-nighthawk',
    weapons: [
      weapon('the-call', ['Lead from Gold', 'Vorpal Weapon'], '机制阶段弹药经济与精英处理'),
      weapon('still-hunt', [], '与天界夜鹰协同的主要特殊武器爆发'),
      weapon('apex-predator', ['Reconstruction', 'Bait and Switch'], '输出循环中的重型火箭伤害')
    ],
    armorMods: armor(
      ['heavy-ammo-finder', 'heavy-ammo-scout', 'stat-resilience'],
      ['focusing-strike', 'stat-discipline'],
      ['concussive-dampener', 'sniper-damage-resistance', 'stat-resilience'],
      ['solar-weapon-surge', 'solar-weapon-surge', 'recuperation'],
      ['powerful-attraction', 'reaper', 'bomber']
    ),
    baseStats: { mobility: 50, resilience: 80, recovery: 30, discipline: 70, intellect: 50, strength: 30 },
    targetStats: { resilience: 100, discipline: 80 },
    mechanicIds: ['radiant', 'slow', 'weaken', 'transcendence'],
    championCoverage: { unstoppable: ['暮域手雷累计冻结后粉碎'], barrier: [], overload: ['暮域手雷减速'] },
    rotation: [
      '输出前确保仍然狩猎的凯德复仇已充能，顶级掠食者有重构弹药。',
      '获得光耀或团队增伤后释放天界夜鹰黄金枪。',
      '立即释放仍然狩猎强化射击，随后发射顶级掠食者。',
      '使用呼唤和仍然狩猎各造成一次伤害后再次切火箭，维持诱导推销。',
      '根据输出窗口长度决定是否继续火箭轮换或补充仍然狩猎精准命中。'
    ],
    limitations: ['高度依赖精准命中和首领暴击窗口。', '实际最优 DPS 会随武器补丁、团队 Buff 和首领机制改变；这里只描述稳定轮换，不承诺固定 DPS 数字。'],
    alternatives: [{ replace: 'apex-predator', with: 'edge-transit', effect: '适合无法稳定使用火箭或需要更高总弹药的场景。' }],
    acquisitionPriority: ['celestial-nighthawk', 'still-hunt', 'apex-predator', 'the-call'],
    scoring: { survivability: 58, addClear: 40, control: 35, bossDamage: 96, support: 30, ammoEconomy: 65 },
    difficulty: '高阶', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  },
  {
    id: 'prismatic-warlock-speakers-support',
    name: '棱镜术士：代言人团队续航',
    classId: 'warlock', subclassId: 'warlock-prismatic', activityIds: ['grandmaster', 'raid-mechanics'],
    goal: '使用治疗手雷与代言人之视维持团队治疗炮台，同时以虚空供养确保自身技能循环和生存。',
    abilities: {
      superId: 'super-song-of-flame', classAbilityId: 'class-phoenix-dive', meleeId: 'melee-arcane-needle', grenadeId: 'grenade-healing',
      aspectIds: ['aspect-hellion', 'aspect-feed-the-void'],
      facetIds: ['facet-purpose', 'facet-protection', 'facet-balance', 'facet-hope', 'facet-dawn']
    },
    exoticArmorId: 'speakers-sight',
    weapons: [
      weapon('the-call', ['Lead from Gold', 'Slice'], '割裂高威胁目标并维持特殊弹药'),
      weapon('no-hesitation', ['Physic', 'Circle of Life'], '直接治疗队友并获得武器收益'),
      weapon('apex-predator', ['Reconstruction', 'Bait and Switch'], '为机制阶段保留合格首领输出')
    ],
    armorMods: armor(
      ['heavy-ammo-finder', 'heavy-ammo-scout', 'stat-discipline'],
      ['impact-induction', 'focusing-strike', 'stat-discipline'],
      ['concussive-dampener', 'sniper-damage-resistance', 'stat-resilience'],
      ['recuperation', 'solar-weapon-surge', 'stat-resilience'],
      ['powerful-attraction', 'reaper', 'bomber']
    ),
    baseStats: { mobility: 20, resilience: 80, recovery: 50, discipline: 80, intellect: 30, strength: 30 },
    targetStats: { resilience: 100, discipline: 100 },
    mechanicIds: ['healing', 'restoration', 'devour', 'radiant', 'sever', 'transcendence'],
    championCoverage: { unstoppable: [], barrier: [], overload: [] },
    rotation: [
      '把治疗手雷投向队友聚集或即将承伤的位置，生成治疗炮台。',
      '用无需犹豫持续命中队友补充治疗；不要为了触发增伤让自己离开安全位置。',
      '通过技能击杀触发吞噬，自身续航稳定后把更多资源留给队友。',
      '凤凰俯冲用于快速治疗与重新定位，使用后由轰炸机返还部分手雷能量。',
      '烈焰之歌留给持续高压阶段，而不是只当作个人伤害超能力。'
    ],
    limitations: ['自身冠军反制为空，进入宗师前必须按当期活动添加反冠军武器。', '队伍不需要持续治疗时，输出价值低于纯伤害构筑。'],
    alternatives: [{ replace: 'no-hesitation', with: 'outbreak-perfected', effect: '失去直接治疗武器，换取远程主弹药输出；需要把特殊武器移到能量槽。' }],
    acquisitionPriority: ['speakers-sight', 'no-hesitation', 'the-call', 'apex-predator'],
    scoring: { survivability: 92, addClear: 60, control: 42, bossDamage: 62, support: 98, ammoEconomy: 78 },
    difficulty: '进阶', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  },
  {
    id: 'prismatic-titan-hazardous-rockets',
    name: '棱镜泰坦：危险推进火箭链',
    classId: 'titan', subclassId: 'titan-prismatic', activityIds: ['pve-general', 'raid-boss'],
    goal: '以火箭辅助框架武器积累危险推进火箭，使用推进器释放齐射并强化后续火箭类武器输出。',
    abilities: {
      superId: 'super-twilight-arsenal', classAbilityId: 'class-thruster', meleeId: 'melee-frenzied-blade', grenadeId: 'grenade-pulse',
      aspectIds: ['aspect-diamond-lance', 'aspect-knockout'],
      facetIds: ['facet-purpose', 'facet-protection', 'facet-balance', 'facet-courage', 'facet-grace']
    },
    exoticArmorId: 'hazardous-propulsion',
    weapons: [
      weapon('the-call', ['Lead from Gold', 'Vorpal Weapon'], '精准或持续命中积累危险推进火箭，并处理精英'),
      weapon('aberrant-action', ['Heal Clip', 'Incandescent'], '第二把火箭辅助武器，提供清怪和治疗弹匣'),
      weapon('apex-predator', ['Reconstruction', 'Bait and Switch'], '受危险推进增益支持的重型火箭输出')
    ],
    armorMods: armor(
      ['heavy-ammo-finder', 'heavy-ammo-scout', 'stat-resilience'],
      ['firepower', 'impact-induction', 'stat-discipline'],
      ['concussive-dampener', 'sniper-damage-resistance', 'stat-resilience'],
      ['solar-weapon-surge', 'recuperation', 'stat-discipline'],
      ['reaper', 'powerful-attraction', 'bomber']
    ),
    baseStats: { mobility: 20, resilience: 80, recovery: 30, discipline: 80, intellect: 30, strength: 40 },
    targetStats: { resilience: 100, discipline: 100 },
    mechanicIds: ['healing', 'scorch', 'ignite', 'freeze', 'transcendence'],
    championCoverage: { unstoppable: ['铝热点燃替代需换手雷；当前配置依赖队友或武器'], barrier: ['勇气之面触发拆解弹'], overload: [] },
    rotation: [
      '先用呼唤或异常行动命中敌人，积累危险推进的异域火箭。',
      '齐射准备完成后使用推进器，释放异域火箭并获得火箭类武器增益。',
      '切顶级掠食者，使用其他两把武器触发诱导推销后发射火箭。',
      '回到火箭辅助武器继续积累下一轮齐射；不要在零层时浪费推进器。',
      '清怪阶段优先使用异常行动的治疗弹匣与白炽，保留重弹给高价值目标。'
    ],
    limitations: ['需要观察危险推进层数与推进器冷却，操作比普通火箭构筑复杂。', '双特殊武器对弹药管理有要求；特殊弹药不足时把异常行动换成主弹药炽阳武器。'],
    alternatives: [{ replace: 'aberrant-action', with: 'sunshot', effect: '降低火箭积累速度，但弹药经济与清怪更稳定。' }],
    acquisitionPriority: ['hazardous-propulsion', 'the-call', 'aberrant-action', 'apex-predator'],
    scoring: { survivability: 72, addClear: 80, control: 55, bossDamage: 90, support: 35, ammoEconomy: 60 },
    difficulty: '高阶', confidence: 'B', verifiedAt: '2026-08-31', sourceIds: ['bungie-final-shape', 'editorial-baseline']
  }
  ,{
    id: 'void-hunter-gyrfalcon', name: '虚空猎人：矛隼易爆循环', classId: 'hunter', subclassId: 'hunter-void', activityIds: ['pve-general', 'legend-campaign', 'grandmaster'],
    goal: '通过闪身和潇洒处刑者反复进入隐身，利用矛隼胸甲让虚空武器获得易爆弹并产生连续爆炸。',
    abilities: { superId: 'super-shadowshot-deadfall', classAbilityId: 'class-gamblers-dodge', meleeId: 'melee-snare-bomb', grenadeId: 'grenade-vortex', aspectIds: ['aspect-stylish-executioner', 'aspect-vanishing-step'], fragmentIds: ['echo-starvation', 'echo-persistence', 'echo-obscurity', 'echo-cessation'], facetIds: [] },
    exoticArmorId: 'gyrfalcons-hauberk',
    weapons: [weapon('the-call', ['Lead from Gold', 'Slice'], '特殊弹药经济与割裂'), weapon('graviton-lance', [], '虚空主武器与易爆弹循环核心'), weapon('edge-transit', ['Envious Assassin', 'Destabilizing Rounds'], '虚空重弹输出')],
    armorMods: armor(['heavy-ammo-finder','stat-mobility','stat-resilience'],['firepower','focusing-strike','stat-discipline'],['concussive-dampener','sniper-damage-resistance'],['recuperation','void-weapon-surge','stat-mobility','stat-resilience'],['reaper','powerful-attraction','bomber']),
    baseStats:{mobility:80,resilience:80,recovery:20,discipline:70,intellect:30,strength:30},targetStats:{mobility:100,resilience:100,discipline:80},
    mechanicIds:['invisibility','volatile','devour','weaken','healing'],championCoverage:{barrier:['矛隼赋予虚空武器易爆弹'],overload:[],unstoppable:[]},
    rotation:['使用闪身触发隐身步法。','从隐身状态开火，矛隼胸甲使虚空武器获得易爆弹。','击败受虚空减益影响的目标，通过潇洒处刑者再次隐身。','拾取能量球或虚空缺口获得吞噬，依靠击杀维持续航。','宗师中先用诱捕炸弹削弱目标，再从安全距离使用引力子长枪。'],
    limitations:['对没有小怪可续隐身的单体首领阶段收益下降。','当前方案没有稳定反超载和反不可阻挡，必须按活动替换武器。'],alternatives:[{replace:'graviton-lance',with:'其他虚空主弹药武器',effect:'保留易爆循环，但失去引力爆炸。'}],acquisitionPriority:['gyrfalcons-hauberk','graviton-lance','the-call','edge-transit'],scoring:{survivability:88,addClear:94,control:70,bossDamage:64,support:62,ammoEconomy:82},difficulty:'进阶',confidence:'B',verifiedAt:'2026-08-31',sourceIds:['bungie-buildcrafting','editorial-baseline']
  }
  ,{
    id:'strand-titan-suspend',name:'缚丝泰坦：悬浮前线',classId:'titan',subclassId:'titan-strand',activityIds:['legend-campaign','grandmaster'],goal:'用德兰格之鞭与束缚手雷持续悬浮危险目标，通过深入战局和守护丝线维持织造铠甲。',
    abilities:{superId:'super-bladefury',classAbilityId:'class-rally-barricade',meleeId:'melee-frenzied-blade',grenadeId:'grenade-shackle',aspectIds:['aspect-drengrs-lash','aspect-into-the-fray'],fragmentIds:['thread-warding','thread-continuity','thread-generation','thread-mind'],facetIds:[]},exoticArmorId:'abeyant-leap',
    weapons:[weapon('the-call',['Lead from Gold','Slice'],'割裂危险目标并保持特殊弹药'),weapon('sunshot',[],'安全清怪与能量球生成链'),weapon('pro-memoria',['Reconstruction','Target Lock'],'中长距离重弹和清怪')],armorMods:armor(['heavy-ammo-finder','heavy-ammo-scout','stat-resilience'],['firepower','impact-induction','stat-discipline'],['concussive-dampener','sniper-damage-resistance','stat-resilience'],['recuperation','better-already','stat-discipline'],['reaper','powerful-attraction','bomber']),
    baseStats:{mobility:20,resilience:80,recovery:40,discipline:80,intellect:30,strength:40},targetStats:{resilience:100,discipline:100},mechanicIds:['suspend','woven-mail','sever','healing'],championCoverage:{barrier:[],overload:[],unstoppable:['德兰格之鞭与束缚手雷悬浮']},
    rotation:['在掩体边缘放置集结路障，由德兰格之鞭向前悬浮目标。','优先击败悬浮目标，触发心智丝线返还职业技能。','拾取能量球获得织造铠甲，并通过休养生息恢复生命。','路障不可用时用束缚手雷补上第二个悬浮来源。','用呼唤的割裂降低高威胁敌人输出，再推进到下一处掩体。'],limitations:['首领不受完整悬浮控制，首领输出能力有限。','屏障和超载冠军仍需武器覆盖。'],alternatives:[{replace:'abeyant-leap',with:'synthoceps',effect:'降低远程悬浮稳定性，换取近战伤害。'}],acquisitionPriority:['abeyant-leap','the-call','sunshot','pro-memoria'],scoring:{survivability:94,addClear:70,control:98,bossDamage:42,support:82,ammoEconomy:84},difficulty:'入门',confidence:'B',verifiedAt:'2026-08-31',sourceIds:['bungie-buildcrafting','editorial-baseline']
  }
  ,{
    id:'solar-warlock-speakers',name:'炽阳术士：团队恢复链',classId:'warlock',subclassId:'warlock-solar',activityIds:['grandmaster','raid-mechanics'],goal:'通过治疗炮台、无需犹豫和火焰之触维持恢复，利用仁慈余烬把治疗行为转化为技能回复。',
    abilities:{superId:'super-song-of-flame',classAbilityId:'class-phoenix-dive',meleeId:'melee-incinerator-snap',grenadeId:'grenade-healing',aspectIds:['aspect-hellion','aspect-touch-of-flame'],fragmentIds:['ember-torches','ember-solace','ember-empyrean','ember-benevolence'],facetIds:[]},exoticArmorId:'speakers-sight',
    weapons:[weapon('the-call',['Lead from Gold','Slice'],'特殊弹药与割裂'),weapon('no-hesitation',['Physic','Circle of Life'],'直接治疗队友与支援增益'),weapon('apex-predator',['Reconstruction','Bait and Switch'],'机制与首领阶段重弹')],armorMods:armor(['heavy-ammo-finder','heavy-ammo-scout','stat-discipline'],['impact-induction','stat-discipline'],['concussive-dampener','sniper-damage-resistance','stat-resilience'],['recuperation','solar-weapon-surge','stat-resilience'],['powerful-attraction','reaper','bomber']),
    baseStats:{mobility:20,resilience:80,recovery:50,discipline:80,intellect:30,strength:30},targetStats:{resilience:100,discipline:100},mechanicIds:['healing','cure','restoration','radiant','sever'],championCoverage:{barrier:['光耀武器可穿透屏障冠军护盾'],overload:[],unstoppable:['点燃可眩晕不可阻挡；需要稳定累积灼烧']},
    rotation:['把治疗手雷投向队伍承伤位置，生成代言人治疗炮台。','使用无需犹豫补充队友生命并触发仁慈余烬技能回复。','强化近战命中使队伍获得光耀。','用炽阳最后一击延长光耀与恢复，避免在没有目标时浪费技能。','持续高压阶段开启烈焰之歌，为队伍提供技能与生存窗口。'],limitations:['队伍分散时治疗炮台和无需犹豫效率下降。','对超载冠军没有内建反制。'],alternatives:[{replace:'no-hesitation',with:'sunshot',effect:'提高个人清怪，降低直接团队治疗。'}],acquisitionPriority:['speakers-sight','no-hesitation','the-call','apex-predator'],scoring:{survivability:96,addClear:68,control:45,bossDamage:60,support:100,ammoEconomy:80},difficulty:'进阶',confidence:'B',verifiedAt:'2026-08-31',sourceIds:['bungie-buildcrafting','editorial-baseline']
  }
]

// Kept solely as a validation fixture for the mono-subclass rules; marked as a template
// and excluded from the recommendation surface until every field is independently sourced.
const validationFixture = {
  ...curatedBuildsBase[0], id: 'titan-solar-template', name: '破日者（待核验）', subclassId: 'titan-solar',
  abilities: { ...curatedBuildsBase[0].abilities, superId: 'super-hammer-of-sol', classAbilityId: 'class-rally-barricade', meleeId: 'melee-hammer-strike', grenadeId: 'grenade-thermite', aspectIds: ['aspect-roaring-flames', 'aspect-sol-invictus'], facetIds: [], fragmentIds: ['ember-torches', 'ember-solace', 'ember-empyrean', 'ember-benevolence'] },
  mechanicIds: ['scorch', 'ignite', 'healing'], sourceIds: ['community-baseline'], confidence: 'D', isTemplateBaseline: true
}

export const curatedBuilds = [...curatedBuildsBase, validationFixture].map(build => ({
  armorSetId: build.armorSetId || 'first-ascent',
  manifestVersion: build.manifestVersion || MANIFEST_VERSION,
  ...build
}))
export const buildById = Object.fromEntries(curatedBuilds.map(item => [item.id, item]))
