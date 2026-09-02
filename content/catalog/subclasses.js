import { abilities } from './abilities.js'

const mono = (id, classId, element, name, en, superIds, meleeIds) => ({
  id, classId, type: 'mono', element, name, en, superIds, meleeIds,
  sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31'
})

const rawSubclasses = [
  mono('titan-solar', 'titan', 'solar', '破日者', 'Sunbreaker', ['super-hammer-of-sol'], ['melee-hammer-strike']),
  mono('titan-arc', 'titan', 'arc', '突袭者', 'Striker', ['super-thundercrash'], ['melee-thunderclap']),
  mono('titan-void', 'titan', 'void', '哨兵', 'Sentinel', ['super-twilight-arsenal'], ['melee-shield-throw']),
  mono('titan-stasis', 'titan', 'stasis', '巨兽', 'Behemoth', ['super-glacial-quake'], ['melee-shiver-strike']),
  mono('titan-strand', 'titan', 'strand', '狂战士', 'Berserker', ['super-bladefury'], ['melee-frenzied-blade']),
  mono('hunter-solar', 'hunter', 'solar', '枪手', 'Gunslinger', ['super-golden-gun-marksman'], ['melee-knife-trick']),
  mono('hunter-arc', 'hunter', 'arc', '电弧行者', 'Arcstrider', ['super-storms-edge'], ['melee-combination-blow']),
  mono('hunter-void', 'hunter', 'void', '夜潜者', 'Nightstalker', ['super-shadowshot-deadfall'], ['melee-snare-bomb']),
  mono('hunter-stasis', 'hunter', 'stasis', '亡魂', 'Revenant', ['super-silence-squall'], ['melee-withering-blade']),
  mono('hunter-strand', 'hunter', 'strand', '丝线行者', 'Threadrunner', ['super-silkstrike'], ['melee-threaded-spike']),
  mono('warlock-solar', 'warlock', 'solar', '黎明之刃', 'Dawnblade', ['super-song-of-flame'], ['melee-incinerator-snap']),
  mono('warlock-arc', 'warlock', 'arc', '风暴召唤者', 'Stormcaller', ['super-stormtrance'], ['melee-chain-lightning']),
  mono('warlock-void', 'warlock', 'void', '虚空行者', 'Voidwalker', ['super-nova-bomb-cataclysm'], ['melee-pocket-singularity']),
  mono('warlock-stasis', 'warlock', 'stasis', '暗影术士', 'Shadebinder', ['super-winters-wrath'], ['melee-penumbral-blast']),
  mono('warlock-strand', 'warlock', 'strand', '织巢者', 'Broodweaver', ['super-needlestorm'], ['melee-arcane-needle']),
  {
    id: 'titan-prismatic', classId: 'titan', type: 'prismatic', element: 'prismatic', name: '棱镜泰坦', en: 'Prismatic Titan',
    superIds: ['super-hammer-of-sol', 'super-thundercrash', 'super-twilight-arsenal', 'super-glacial-quake', 'super-bladefury'],
    meleeIds: ['melee-hammer-strike', 'melee-thunderclap', 'melee-shield-throw', 'melee-shiver-strike', 'melee-frenzied-blade'],
    grenadeIds: ['grenade-thermite', 'grenade-pulse', 'grenade-suppressor', 'grenade-glacier', 'grenade-shackle'],
    aspectIds: ['aspect-consecration', 'aspect-knockout', 'aspect-unbreakable', 'aspect-diamond-lance', 'aspect-drengrs-lash'],
    transcendenceGrenade: { name: '电浆震荡手雷', en: 'Electrified Snare' }, sourceIds: ['bungie-final-shape'], verifiedAt: '2026-08-31'
  },
  {
    id: 'hunter-prismatic', classId: 'hunter', type: 'prismatic', element: 'prismatic', name: '棱镜猎人', en: 'Prismatic Hunter',
    superIds: ['super-golden-gun-marksman', 'super-storms-edge', 'super-shadowshot-deadfall', 'super-silence-squall', 'super-silkstrike'],
    meleeIds: ['melee-knife-trick', 'melee-combination-blow', 'melee-snare-bomb', 'melee-withering-blade', 'melee-threaded-spike'],
    grenadeIds: ['grenade-swarm', 'grenade-arcbolt', 'grenade-magnetic', 'grenade-duskfield', 'grenade-grapple'],
    aspectIds: ['aspect-gunpowder-gamble', 'aspect-ascension', 'aspect-stylish-executioner', 'aspect-winters-shroud', 'aspect-threaded-specter'],
    transcendenceGrenade: { name: '冰火尖刺', en: 'Hailfire Spike' }, sourceIds: ['bungie-final-shape'], verifiedAt: '2026-08-31'
  },
  {
    id: 'warlock-prismatic', classId: 'warlock', type: 'prismatic', element: 'prismatic', name: '棱镜术士', en: 'Prismatic Warlock',
    superIds: ['super-song-of-flame', 'super-stormtrance', 'super-nova-bomb-cataclysm', 'super-winters-wrath', 'super-needlestorm'],
    meleeIds: ['melee-incinerator-snap', 'melee-chain-lightning', 'melee-pocket-singularity', 'melee-penumbral-blast', 'melee-arcane-needle'],
    grenadeIds: ['grenade-healing', 'grenade-storm', 'grenade-vortex', 'grenade-coldsnap', 'grenade-threadling'],
    aspectIds: ['aspect-hellion', 'aspect-lightning-surge', 'aspect-feed-the-void', 'aspect-bleak-watcher', 'aspect-weavers-call'],
    transcendenceGrenade: { name: '冰冻奇点', en: 'Freezing Singularity' }, sourceIds: ['bungie-final-shape'], verifiedAt: '2026-08-31'
  }
]

const monoLoadoutPools = {
  'titan-solar': { aspectIds: ['aspect-roaring-flames', 'aspect-sol-invictus'], fragmentIds: ['ember-torches', 'ember-solace', 'ember-empyrean', 'ember-benevolence'] },
  'titan-arc': { aspectIds: ['aspect-touch-of-thunder', 'aspect-juggernaut'], fragmentIds: ['spark-resistance', 'spark-beacons', 'spark-amplitude', 'spark-magnitude'] },
  'titan-void': { aspectIds: ['aspect-bastion', 'aspect-offensive-bulwark'], fragmentIds: ['echo-starvation', 'echo-persistence', 'echo-obscurity', 'echo-cessation'] },
  'titan-stasis': { aspectIds: ['aspect-diamond-lance', 'aspect-tectonic-harvest'], fragmentIds: ['whisper-of-chains', 'whisper-of-shards', 'whisper-of-fissures', 'whisper-of-rime'] },
  'titan-strand': { aspectIds: ['aspect-drengrs-lash', 'aspect-into-the-fray', 'aspect-banner-of-war'], fragmentIds: ['thread-warding', 'thread-continuity', 'thread-generation', 'thread-mind'] },
  'hunter-solar': { aspectIds: ['aspect-knock-em-down', 'aspect-on-your-mark'], fragmentIds: ['ember-torches', 'ember-solace', 'ember-empyrean', 'ember-benevolence'] },
  'hunter-arc': { aspectIds: ['aspect-flow-state', 'aspect-lethal-current'], fragmentIds: ['spark-resistance', 'spark-beacons', 'spark-amplitude', 'spark-magnitude'] },
  'hunter-void': { aspectIds: ['aspect-stylish-executioner', 'aspect-vanishing-step', 'aspect-trappers-ambush'], fragmentIds: ['echo-starvation', 'echo-persistence', 'echo-obscurity', 'echo-cessation'] },
  'hunter-stasis': { aspectIds: ['aspect-shatterdive', 'aspect-grim-harvest'], fragmentIds: ['whisper-of-chains', 'whisper-of-shards', 'whisper-of-fissures', 'whisper-of-rime'] },
  'hunter-strand': { aspectIds: ['aspect-widows-silk', 'aspect-whirling-maelstrom'], fragmentIds: ['thread-warding', 'thread-continuity', 'thread-generation', 'thread-mind'] },
  'warlock-solar': { aspectIds: ['aspect-hellion', 'aspect-touch-of-flame', 'aspect-icarus-dash'], fragmentIds: ['ember-torches', 'ember-solace', 'ember-empyrean', 'ember-benevolence'] },
  'warlock-arc': { aspectIds: ['aspect-arc-soul', 'aspect-electrostatic-mind'], fragmentIds: ['spark-resistance', 'spark-beacons', 'spark-amplitude', 'spark-magnitude'] },
  'warlock-void': { aspectIds: ['aspect-chaos-accelerant', 'aspect-child-of-old-gods'], fragmentIds: ['echo-starvation', 'echo-persistence', 'echo-obscurity', 'echo-cessation'] },
  'warlock-stasis': { aspectIds: ['aspect-frostpulse', 'aspect-glacial-harvest'], fragmentIds: ['whisper-of-chains', 'whisper-of-shards', 'whisper-of-fissures', 'whisper-of-rime'] },
  'warlock-strand': { aspectIds: ['aspect-mindspun-invocation', 'aspect-wanderer'], fragmentIds: ['thread-warding', 'thread-continuity', 'thread-generation', 'thread-mind'] }
}

const grenadeIdsByElement = Object.fromEntries(['solar', 'arc', 'void', 'stasis', 'strand'].map(element => [
  element,
  abilities.filter(item => item.kind === 'grenade' && item.element === element && item.manifestVerified).map(item => item.id)
]))

export const subclasses = rawSubclasses.map(item => item.type === 'mono'
  ? { ...item, ...monoLoadoutPools[item.id], grenadeIds: grenadeIdsByElement[item.element] || [] }
  : item
)

export const subclassById = Object.fromEntries(subclasses.map(item => [item.id, item]))

const classDefinitions = [
  {
    id: 'titan', name: '泰坦', en: 'Titan', role: '前线承伤、近战爆发、控场',
    classAbility: '路障 Barricade', traits: ['冲撞近战', '厚甲', '团队辅助'],
    desc: '以钢铁之躯捍卫战线，依靠路障、护盾与近战能力稳定推进。', stats: ['韧性', '纪律', '力量'], color: '#e8c15a'
  },
  {
    id: 'hunter', name: '猎人', en: 'Hunter', role: '机动、精准爆发、减益链',
    classAbility: '闪避 Dodge', traits: ['高机动', '精准爆发', '隐身战术'],
    desc: '通过闪避、精准射击和元素减益控制战场距离。', stats: ['机动性', '韧性', '纪律'], color: '#4db8ff'
  },
  {
    id: 'warlock', name: '术士', en: 'Warlock', role: '技能循环、召唤、团队续航',
    classAbility: '裂谷 Rift', traits: ['技能循环', '召唤物', '团队续航'],
    desc: '把光暗技能转化为持续控制、治疗和范围输出。', stats: ['恢复', '纪律', '智慧'], color: '#b46bff'
  }
]

export const classesV2 = classDefinitions.map(item => ({
  ...item,
  sourceIds: item.sourceIds || ['bungie-manifest'],
  verifiedAt: item.verifiedAt || '2026-08-31'
}))

export const classById = Object.fromEntries(classesV2.map(item => [item.id, item]))
