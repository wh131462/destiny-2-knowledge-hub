import manifestAbilities from '../../data/catalog/manifest-abilities.json' with { type: 'json' }

const ability = (id, name, en, element, kind, classIds, extra = {}) => ({
  id, name, en, element, kind, classIds, sourceIds: ['bungie-manifest'], verifiedAt: '2026-08-31', ...extra
})

const grenadeIdOverrides = { 'Void Wall': 'grenade-voidwall' }
const grenadeId = name => grenadeIdOverrides[name] || `grenade-${String(name).replace(/ Grenade$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`
const officialGrenades = (manifestAbilities.items || [])
  .filter(item => item.itemType === 19 && /^(Solar|Arc|Void|Stasis|Strand) Grenade$/.test(item.typeName) && item.icon && !item.redacted && !item.blacklisted)
  .map(item => ability(grenadeId(item.name), item.nameZh || item.name, item.name, item.element, 'grenade', ['titan', 'hunter', 'warlock'], {
    manifestHash: item.hash,
    icon: item.icon,
    description: item.description,
    descriptionZh: item.descriptionZh,
    manifestVerified: true
  }))

export const abilities = [
  // Titan supers and abilities
  ability('super-hammer-of-sol', '烈阳之锤', 'Hammer of Sol', 'solar', 'super', ['titan']),
  ability('super-thundercrash', '雷霆冲击', 'Thundercrash', 'arc', 'super', ['titan']),
  ability('super-twilight-arsenal', '暮光军火', 'Twilight Arsenal', 'void', 'super', ['titan']),
  ability('super-glacial-quake', '冰川震击', 'Glacial Quake', 'stasis', 'super', ['titan']),
  ability('super-bladefury', '利刃狂怒', 'Bladefury', 'strand', 'super', ['titan']),
  ability('melee-hammer-strike', '锤击', 'Hammer Strike', 'solar', 'melee', ['titan']),
  ability('melee-thunderclap', '雷霆一击', 'Thunderclap', 'arc', 'melee', ['titan']),
  ability('melee-shield-throw', '盾牌投掷', 'Shield Throw', 'void', 'melee', ['titan']),
  ability('melee-shiver-strike', '颤栗打击', 'Shiver Strike', 'stasis', 'melee', ['titan']),
  ability('melee-frenzied-blade', '狂乱利刃', 'Frenzied Blade', 'strand', 'melee', ['titan']),

  // Hunter supers and abilities
  ability('super-golden-gun-marksman', '黄金枪：神射手', 'Golden Gun: Marksman', 'solar', 'super', ['hunter']),
  ability('super-storms-edge', '风暴边缘', "Storm's Edge", 'arc', 'super', ['hunter']),
  ability('super-shadowshot-deadfall', '暗影箭：陷阱', 'Shadowshot: Deadfall', 'void', 'super', ['hunter']),
  ability('super-silence-squall', '沉默与狂啸', 'Silence and Squall', 'stasis', 'super', ['hunter']),
  ability('super-silkstrike', '丝线打击', 'Silkstrike', 'strand', 'super', ['hunter']),
  ability('melee-knife-trick', '飞刀戏法', 'Knife Trick', 'solar', 'melee', ['hunter']),
  ability('melee-combination-blow', '组合打击', 'Combination Blow', 'arc', 'melee', ['hunter']),
  ability('melee-snare-bomb', '诱捕炸弹', 'Snare Bomb', 'void', 'melee', ['hunter']),
  ability('melee-withering-blade', '枯萎之刃', 'Withering Blade', 'stasis', 'melee', ['hunter']),
  ability('melee-threaded-spike', '丝线尖刺', 'Threaded Spike', 'strand', 'melee', ['hunter']),

  // Warlock supers and abilities
  ability('super-song-of-flame', '烈焰之歌', 'Song of Flame', 'solar', 'super', ['warlock']),
  ability('super-stormtrance', '风暴之舞', 'Stormtrance', 'arc', 'super', ['warlock']),
  ability('super-nova-bomb-cataclysm', '新星炸弹：灾变', 'Nova Bomb: Cataclysm', 'void', 'super', ['warlock']),
  ability('super-winters-wrath', '凛冬之怒', "Winter's Wrath", 'stasis', 'super', ['warlock']),
  ability('super-needlestorm', '针暴', 'Needlestorm', 'strand', 'super', ['warlock']),
  ability('melee-incinerator-snap', '焚烧者响指', 'Incinerator Snap', 'solar', 'melee', ['warlock']),
  ability('melee-chain-lightning', '连锁闪电', 'Chain Lightning', 'arc', 'melee', ['warlock']),
  ability('melee-pocket-singularity', '袖珍奇点', 'Pocket Singularity', 'void', 'melee', ['warlock']),
  ability('melee-penumbral-blast', '半影冲击', 'Penumbral Blast', 'stasis', 'melee', ['warlock']),
  ability('melee-arcane-needle', '奥术针刺', 'Arcane Needle', 'strand', 'melee', ['warlock']),

  ...officialGrenades,

  // Class abilities used by curated builds
  ability('class-thruster', '推进器', 'Thruster', 'neutral', 'classAbility', ['titan']),
  ability('class-rally-barricade', '集结路障', 'Rally Barricade', 'neutral', 'classAbility', ['titan']),
  ability('class-gamblers-dodge', '赌徒闪身', "Gambler's Dodge", 'neutral', 'classAbility', ['hunter']),
  ability('class-marksman-dodge', '射手闪身', "Marksman's Dodge", 'neutral', 'classAbility', ['hunter']),
  ability('class-phoenix-dive', '凤凰俯冲', 'Phoenix Dive', 'solar', 'classAbility', ['warlock']),
  ability('class-healing-rift', '治愈裂隙', 'Healing Rift', 'neutral', 'classAbility', ['warlock'])
]

export const abilityById = Object.fromEntries(abilities.map(item => [item.id, item]))
