// Presentation-only fallback for Bungie's private-use font glyphs. Keep the
// original Manifest text unchanged in the catalogs. Common glyph identities:
// https://github.com/DestinyItemManager/DIM/blob/master/src/data/font/d2-font-glyphs.ts
const symbols = {
  57456: ['屏障', 'Barrier'], 57457: ['超载', 'Overload'], 57458: ['势不可挡', 'Unstoppable'],
  57497: ['弓', 'Bow'], 57600: ['自动步枪', 'Auto Rifle'], 57601: ['脉冲步枪', 'Pulse Rifle'],
  57602: ['斥候步枪', 'Scout Rifle'], 57603: ['手炮', 'Hand Cannon'], 57604: ['霰弹枪', 'Shotgun'],
  57605: ['狙击枪', 'Sniper Rifle'], 57606: ['融合步枪', 'Fusion Rifle'], 57607: ['冲锋枪', 'Submachine Gun'],
  57608: ['火箭筒', 'Rocket Launcher'], 57609: ['手枪', 'Sidearm'], 57616: ['近战', 'Melee'],
  57617: ['手雷', 'Grenade'], 57619: ['榴弹发射器', 'Grenade Launcher'], 57656: ['追踪步枪', 'Trace Rifle'],
  57657: ['冰影', 'Stasis'], 57664: ['烈日', 'Solar'], 57667: ['电弧', 'Arc'], 57668: ['虚空', 'Void'],
  57683: ['刀剑', 'Sword'], 57684: ['机枪', 'Machine Gun'], 57685: ['重型榴弹发射器', 'Heavy Grenade Launcher'],
  57686: ['偃月', 'Glaive'], 61198: ['缚丝', 'Strand']
}
export function manifestText(value, locale = 'zh') {
  return String(value || '').replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, (glyph, offset, text) => {
    const names = symbols[glyph.codePointAt(0)]
    if (!names) return `[${locale === 'zh' ? '游戏图标' : 'Game symbol'} U+${glyph.codePointAt(0).toString(16).toUpperCase()}]`
    if (names.some(name => text.slice(offset + glyph.length).startsWith(name))) return ''
    return `[${names[locale === 'en' ? 1 : 0]}]`
  })
}
