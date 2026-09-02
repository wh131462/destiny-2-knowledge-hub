// Names and strategy metadata in this file remain editorial. Only an explicit manifestHash
// is treated as an exact Manifest mapping by the strict recommendation layer.
import curatedManifestLinks from '../../data/catalog/curated-manifest-links.json' with { type: 'json' }
import curatedModLinks from '../../data/catalog/curated-mod-links.json' with { type: 'json' }
const manifestHashById = Object.fromEntries(Object.entries(curatedManifestLinks.links || {})
  .filter(([, link]) => link.matchReason === 'exact-name' && Number.isInteger(link.manifest?.hash))
  .map(([id, link]) => [id, link.manifest.hash]))
const gear = (id, name, en, type, extra = {}) => ({
  id, name, en, type,
  manifestHash: extra.manifestHash || manifestHashById[id] || null,
  sourceIds: (extra.manifestHash || manifestHashById[id]) ? ['bungie-manifest'] : ['editorial-catalog'],
  manifestVerified: Boolean(extra.manifestHash || manifestHashById[id]), verifiedAt: '2026-08-31', ...extra
})

export const gearItems = [
  // Exotic armor
  gear('synthoceps', '合成感受器', 'Synthoceps', 'armor', { classId: 'titan', slot: 'arms', rarity: 'exotic', mechanicIds: [], acquisitionId: 'exotic-engram' }),
  gear('hazardous-propulsion', '危险推进', 'Hazardous Propulsion', 'armor', { classId: 'titan', slot: 'chest', rarity: 'exotic', mechanicIds: [], acquisitionId: 'rahool-focusing-tfs' }),
  gear('abeyant-leap', '悬停跃步', 'Abeyant Leap', 'armor', { classId: 'titan', slot: 'legs', rarity: 'exotic', mechanicIds: ['suspend', 'woven-mail'], acquisitionId: 'rahool-focusing-lightfall' }),
  gear('liars-handshake', '骗子握手', "Liar's Handshake", 'armor', { classId: 'hunter', slot: 'arms', rarity: 'exotic', mechanicIds: ['healing'], acquisitionId: 'exotic-engram' }),
  gear('celestial-nighthawk', '天界夜鹰', 'Celestial Nighthawk', 'armor', { classId: 'hunter', slot: 'helmet', rarity: 'exotic', mechanicIds: [], acquisitionId: 'exotic-engram' }),
  gear('gyrfalcons-hauberk', '矛隼胸甲', "Gyrfalcon's Hauberk", 'armor', { classId: 'hunter', slot: 'chest', rarity: 'exotic', mechanicIds: ['invisibility', 'volatile'], acquisitionId: 'rahool-focusing-witch-queen' }),
  gear('getaway-artist', '逃逸艺术家', 'Getaway Artist', 'armor', { classId: 'warlock', slot: 'arms', rarity: 'exotic', mechanicIds: ['amplified'], acquisitionId: 'exotic-engram' }),
  gear('mataiodoxia', '马泰奥多西亚', 'Mataiodoxia', 'armor', { classId: 'warlock', slot: 'chest', rarity: 'exotic', mechanicIds: ['suspend'], acquisitionId: 'rahool-focusing-tfs' }),
  gear('speakers-sight', '代言人之视', "Speaker's Sight", 'armor', { classId: 'warlock', slot: 'helmet', rarity: 'exotic', mechanicIds: ['healing', 'restoration'], acquisitionId: 'rahool-focusing-tfs' }),
  gear('stoicism', '坚忍', 'Stoicism', 'exoticClassItem', { classId: 'titan', slot: 'classItem', rarity: 'exotic', subclassType: 'prismatic', acquisitionId: 'dual-destiny', traitColumns: [['spirit-assassin', 'spirit-inmost-light', 'spirit-eternal-warrior', 'spirit-hoarfrost', 'spirit-severance', 'spirit-ophidian', 'spirit-bear', 'spirit-abeyant'], ['spirit-star-eater', 'spirit-synthoceps', 'spirit-contact', 'spirit-scars', 'spirit-horn', 'spirit-armamentarium', 'spirit-alpha-lupi', 'spirit-verities']] }),
  gear('relativism', '相对主义', 'Relativism', 'exoticClassItem', { classId: 'hunter', slot: 'classItem', rarity: 'exotic', subclassType: 'prismatic', acquisitionId: 'dual-destiny', traitColumns: [['spirit-assassin', 'spirit-inmost-light', 'spirit-dragon', 'spirit-galanor', 'spirit-foetracer', 'spirit-caliban', 'spirit-renewal', 'spirit-ophidian'], ['spirit-star-eater', 'spirit-synthoceps', 'spirit-verities', 'spirit-cyrtarachne', 'spirit-gyrfalcon', 'spirit-liar', 'spirit-wormhusk', 'spirit-coyote']] }),
  gear('solipsism', '唯我论', 'Solipsism', 'exoticClassItem', { classId: 'warlock', slot: 'classItem', rarity: 'exotic', subclassType: 'prismatic', acquisitionId: 'dual-destiny', traitColumns: [['spirit-assassin', 'spirit-inmost-light', 'spirit-osmiomancy', 'spirit-apotheosis', 'spirit-necrotic', 'spirit-filaments', 'spirit-ophidian', 'spirit-stag'], ['spirit-star-eater', 'spirit-synthoceps', 'spirit-verities', 'spirit-harmony', 'spirit-starfire', 'spirit-swarm', 'spirit-vesper', 'spirit-claw']] }),

  // Weapons — curated, concrete and obtainable in the baseline
  gear('the-call', '呼唤', 'The Call', 'weapon', { slot: 'kinetic', ammo: 'special', element: 'strand', frame: 'Rocket-Assisted Sidearm', craftable: true, acquisitionId: 'pale-heart-engram', perkOptions: ['Lead from Gold', 'Slice', 'One for All', 'Desperate Measures', 'Vorpal Weapon'] }),
  gear('lost-signal', '失落信号', 'Lost Signal', 'weapon', { slot: 'kinetic', ammo: 'special', element: 'stasis', frame: 'Area Denial Grenade Launcher', craftable: true, acquisitionId: 'episode-echoes', perkOptions: ['Auto-Loading Holster', 'Demolitionist', 'One for All'] }),
  gear('khvostov-7g-0x', '赫沃斯托夫 7G-0X', 'Khvostov 7G-0X', 'weapon', { slot: 'kinetic', ammo: 'primary', element: 'kinetic', rarity: 'exotic', acquisitionId: 'khvostov-quest', perkOptions: ['The Right Choice', 'Eyes Up, Guardian'] }),
  gear('outbreak-perfected', '全面爆发', 'Outbreak Perfected', 'weapon', { slot: 'kinetic', ammo: 'primary', element: 'kinetic', rarity: 'exotic', craftable: true, acquisitionId: 'zero-hour', champion: null, perkOptions: ['Rewind Rounds', 'Rapid Hit', 'Headseeker'] }),
  gear('sunshot', '烈日弹丸', 'Sunshot', 'weapon', { slot: 'energy', ammo: 'primary', element: 'solar', rarity: 'exotic', acquisitionId: 'exotic-engram', mechanicIds: ['scorch'] }),
  gear('graviton-lance', '引力子长枪', 'Graviton Lance', 'weapon', { slot: 'energy', ammo: 'primary', element: 'void', rarity: 'exotic', acquisitionId: 'exotic-engram', mechanicIds: ['volatile'] }),
  gear('aberrant-action', '异常行动', 'Aberrant Action', 'weapon', { slot: 'energy', ammo: 'special', element: 'solar', frame: 'Rocket-Assisted Sidearm', craftable: true, acquisitionId: 'episode-echoes', perkOptions: ['Heal Clip', 'Beacon Rounds', 'Incandescent'] }),
  gear('no-hesitation', '无需犹豫', 'No Hesitation', 'weapon', { slot: 'energy', ammo: 'primary', element: 'solar', frame: 'Support Frame Auto Rifle', craftable: true, acquisitionId: 'pale-heart-engram', perkOptions: ['Physic', 'Demolitionist', 'Circle of Life', 'Incandescent'] }),
  gear('indebted-kindness', '负债善意', 'Indebted Kindness', 'weapon', { slot: 'energy', ammo: 'special', element: 'arc', frame: 'Rocket-Assisted Sidearm', craftable: false, acquisitionId: 'warlords-ruin', perkOptions: ['Lead from Gold', 'Impulse Amplifier', 'Voltshot', 'Beacon Rounds', 'Attrition Orbs', 'Adagio'] }),
  gear('still-hunt', '仍然狩猎', 'Still Hunt', 'weapon', { slot: 'energy', ammo: 'special', element: 'solar', rarity: 'exotic', acquisitionId: 'wild-card-quest', perkOptions: ['Cayde’s Retribution'] }),
  gear('polaris-lance', '极星长枪', 'Polaris Lance', 'weapon', { slot: 'energy', ammo: 'primary', element: 'solar', rarity: 'exotic', manifestHash: 3413074534, acquisitionId: 'exotic-archive-red-war', mechanicIds: ['scorch', 'ignite'] }),
  gear('lodestar', '北极星', 'Lodestar', 'weapon', { slot: 'energy', ammo: 'primary', element: 'arc', rarity: 'exotic', manifestHash: 3725585710, acquisitionId: 'exotic-archive-final-shape', mechanicIds: ['jolt'] }),
  gear('apex-predator', '顶级掠食者', 'Apex Predator', 'weapon', { slot: 'power', ammo: 'heavy', element: 'solar', frame: 'Adaptive Rocket Launcher', craftable: true, acquisitionId: 'last-wish', perkOptions: ['Reconstruction', 'Tracking Module', 'Bait and Switch', 'Explosive Light'] }),
  gear('edge-transit', '边缘交通', 'Edge Transit', 'weapon', { slot: 'power', ammo: 'heavy', element: 'void', frame: 'Adaptive Grenade Launcher', craftable: false, acquisitionId: 'onslaught', perkOptions: ['Envious Assassin', 'Auto-Loading Holster', 'Destabilizing Rounds', 'Bait and Switch', 'Explosive Light'] }),
  gear('pro-memoria', '为纪念', 'Pro Memoria', 'weapon', { slot: 'power', ammo: 'heavy', element: 'strand', frame: 'Aggressive Machine Gun', craftable: true, acquisitionId: 'pale-heart-engram', perkOptions: ['Reconstruction', 'Demolitionist', 'Bait and Switch', 'Target Lock'] }),
  gear('crux-termination-iv', '终止危机 IV', 'Crux Termination IV', 'weapon', { slot: 'power', ammo: 'heavy', element: 'arc', frame: 'Aggressive Rocket Launcher', craftable: false, acquisitionId: 'world-drop', perkOptions: ['Reconstruction', 'Clown Cartridge', 'Tracking Module', 'Wild Card', 'Explosive Light', 'Bipod'] })
]

export const gearById = Object.fromEntries(gearItems.map(item => [item.id, item]))

const armorModDefinitions = [
  { id: 'stat-resilience', name: '韧性模组', slot: 'any', cost: 3, stat: 'resilience', value: 10 },
  { id: 'stat-discipline', name: '纪律模组', slot: 'any', cost: 3, stat: 'discipline', value: 10 },
  { id: 'stat-mobility', name: '机动模组', slot: 'any', cost: 3, stat: 'mobility', value: 10 },
  { id: 'stat-recovery', name: '恢复模组', slot: 'any', cost: 4, stat: 'recovery', value: 10 },
  { id: 'hands-on', name: '拳到力来', slot: 'helmet', cost: 3, effect: '近战最后一击提供额外超能力能量' },
  { id: 'ashes-to-assets', name: '点尸成金', slot: 'helmet', cost: 3, effect: '手雷最后一击提供额外超能力能量' },
  { id: 'heavy-ammo-finder', name: '重型弹药搜寻', slot: 'helmet', cost: 3, effect: '使用主武器击杀累积重弹搜寻进度' },
  { id: 'heavy-ammo-scout', name: '重型弹药侦察', slot: 'helmet', cost: 1, effect: '搜寻砖也为队友生成重弹' },
  { id: 'heavy-handed', name: '重拳出击', slot: 'arms', cost: 3, effect: '充能近战最后一击生成能量球' },
  { id: 'firepower', name: '火力', slot: 'arms', cost: 3, effect: '手雷最后一击生成能量球' },
  { id: 'impact-induction', name: '冲击感应', slot: 'arms', cost: 2, effect: '近战造成伤害时返还手雷能量' },
  { id: 'focusing-strike', name: '聚焦打击', slot: 'arms', cost: 2, effect: '近战造成伤害时返还职业技能能量' },
  { id: 'concussive-dampener', name: '震荡阻尼器', slot: 'chest', cost: 3, effect: '降低范围伤害' },
  { id: 'melee-damage-resistance', name: '近战伤害抗性', slot: 'chest', cost: 3, effect: '降低近距离战员伤害' },
  { id: 'sniper-damage-resistance', name: '狙击伤害抗性', slot: 'chest', cost: 3, effect: '降低远距离战员伤害' },
  { id: 'recuperation', name: '休养生息', slot: 'legs', cost: 1, effect: '拾取能量球回复生命' },
  { id: 'better-already', name: '活力充沛', slot: 'legs', cost: 1, effect: '拾取能量球开始生命恢复' },
  { id: 'solar-weapon-surge', name: '炽阳武器激涌', slot: 'legs', cost: 3, effect: '拥有护甲充能时提高炽阳武器伤害' },
  { id: 'void-weapon-surge', name: '虚空武器激涌', slot: 'legs', cost: 3, effect: '拥有护甲充能时提高虚空武器伤害' },
  { id: 'special-finisher', name: '特殊终结技', slot: 'classItem', cost: 3, effect: '消耗护甲充能生成特殊弹药' },
  { id: 'powerful-attraction', name: '强力吸引', slot: 'classItem', cost: 2, effect: '使用职业技能时拾取附近能量球' },
  { id: 'reaper', name: '收割者', slot: 'classItem', cost: 3, effect: '使用职业技能后下一次武器最后一击生成能量球' },
  { id: 'bomber', name: '轰炸机', slot: 'classItem', cost: 1, effect: '使用职业技能返还手雷能量' }
]

export const armorMods = armorModDefinitions.map(item => ({
  ...item,
  manifestHash: item.manifestHash || curatedModLinks.items?.find(link => link.id === item.id && link.matched && link.consistent)?.primaryHash || null,
  sourceIds: item.manifestHash || curatedModLinks.items?.some(link => link.id === item.id && link.matched && link.consistent) ? ['bungie-manifest'] : ['editorial-catalog'],
  manifestVerified: Boolean(item.manifestHash || curatedModLinks.items?.some(link => link.id === item.id && link.matched && link.consistent)),
  verifiedAt: item.verifiedAt || '2026-08-31'
}))

const exoticClassItemTraitDefinitions = [
  { id: 'spirit-assassin', name: '刺客之魂', en: 'Spirit of the Assassin' },
  { id: 'spirit-inmost-light', name: '至纯光能之魂', en: 'Spirit of Inmost Light' },
  { id: 'spirit-star-eater', name: '噬星者之魂', en: 'Spirit of the Star-Eater' },
  { id: 'spirit-synthoceps', name: '合成感受器之魂', en: 'Spirit of Synthoceps' },
  { id: 'spirit-ophidian', name: '蛇手之魂', en: 'Spirit of Ophidian' },
  { id: 'spirit-verities', name: '真理之魂', en: "Spirit of Verity" },
  { id: 'spirit-eternal-warrior', name: '永恒战士之魂', en: 'Spirit of the Eternal Warrior' },
  { id: 'spirit-hoarfrost', name: '白霜之魂', en: 'Spirit of Hoarfrost' },
  { id: 'spirit-severance', name: '断绝之魂', en: 'Spirit of Severance' },
  { id: 'spirit-bear', name: '巨熊之魂', en: 'Spirit of the Bear' },
  { id: 'spirit-abeyant', name: '悬停之魂', en: 'Spirit of the Abeyant' },
  { id: 'spirit-contact', name: '接触之魂', en: 'Spirit of Contact' },
  { id: 'spirit-scars', name: '珍贵伤痕之魂', en: 'Spirit of Scars' },
  { id: 'spirit-horn', name: '科赫斯坦之角之魂', en: 'Spirit of the Horn' },
  { id: 'spirit-armamentarium', name: '军械库之魂', en: 'Spirit of the Armamentarium' },
  { id: 'spirit-alpha-lupi', name: '阿尔法鲁皮之魂', en: 'Spirit of Alpha Lupi' },
  { id: 'spirit-dragon', name: '龙影之魂', en: 'Spirit of the Dragon' },
  { id: 'spirit-galanor', name: '加拉诺之魂', en: 'Spirit of Galanor' },
  { id: 'spirit-foetracer', name: '觅敌者之魂', en: 'Spirit of the Foetracer' },
  { id: 'spirit-caliban', name: '卡利班之魂', en: 'Spirit of Caliban' },
  { id: 'spirit-renewal', name: '复兴之魂', en: 'Spirit of Renewal' },
  { id: 'spirit-cyrtarachne', name: '塞塔拉克妮之魂', en: 'Spirit of Cyrtarachne' },
  { id: 'spirit-gyrfalcon', name: '矛隼之魂', en: 'Spirit of the Gyrfalcon' },
  { id: 'spirit-liar', name: '骗子之魂', en: 'Spirit of the Liar' },
  { id: 'spirit-wormhusk', name: '虫骸之魂', en: 'Spirit of the Wormhusk' },
  { id: 'spirit-coyote', name: '郊狼之魂', en: 'Spirit of the Coyote' },
  { id: 'spirit-osmiomancy', name: '渗透术之魂', en: 'Spirit of Osmiomancy' },
  { id: 'spirit-apotheosis', name: '神化之魂', en: 'Spirit of Apotheosis' },
  { id: 'spirit-necrotic', name: '死灵之魂', en: 'Spirit of the Necrotic' },
  { id: 'spirit-filaments', name: '细丝之魂', en: 'Spirit of the Filaments' },
  { id: 'spirit-stag', name: '雄鹿之魂', en: 'Spirit of the Stag' },
  { id: 'spirit-harmony', name: '战斗和谐之魂', en: 'Spirit of Harmony' },
  { id: 'spirit-starfire', name: '星火之魂', en: 'Spirit of Starfire' },
  { id: 'spirit-swarm', name: '虫群之魂', en: 'Spirit of the Swarm' },
  { id: 'spirit-vesper', name: '维斯帕之魂', en: 'Spirit of Vesper' },
  { id: 'spirit-claw', name: '阿罕卡拉之爪之魂', en: 'Spirit of the Claw' }
]

export const exoticClassItemTraits = exoticClassItemTraitDefinitions.map(item => ({
  ...item,
  sourceIds: item.sourceIds || ['bungie-final-shape'],
  verifiedAt: item.verifiedAt || '2026-08-31'
}))

export const exoticTraitById = Object.fromEntries(exoticClassItemTraits.map(item => [item.id, item]))

export const modById = Object.fromEntries(armorMods.map(item => [item.id, item]))
