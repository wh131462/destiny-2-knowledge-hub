import { alternatives, perkColumns } from './index.js'

const types = {
  Barrel: ['barrel', '枪管'], 'Launcher Barrel': ['barrel', '发射器枪管'], Sight: ['barrel', '瞄具'], Scope: ['barrel', '瞄准镜'],
  Bowstring: ['barrel', '弓弦'], Blade: ['barrel', '刀身'], Haft: ['barrel', '柄杆'], Rail: ['barrel', '导轨'],
  Magazine: ['magazine', '弹匣'], Battery: ['magazine', '电池'], Arrow: ['magazine', '箭矢'],
  Guard: ['magazine', '护手'], Bolt: ['magazine', '弩箭'],
  Stock: [null, '枪托'], Grip: [null, '握把'], Grips: [null, '握把'], Handle: [null, '握柄'], Tang: [null, '刀茎'],
  'Origin Trait': ['origin', '起源特性'], Intrinsic: [null, '内在特性']
}
export const isEnhancedPerk = p => /^Enhanced\b/.test(p?.typeName || '')
export const perkLabel = p => `${p.nameZh || p.name}${isEnhancedPerk(p) ? '（强化）' : ''}`
export const perkAliases = p => isEnhancedPerk(p)
  ? [perkLabel(p), `${p.name} (Enhanced)`]
  : [...new Set([p.name, p.nameZh].filter(Boolean))]
export const matchesPerkToken = (p, token) => perkAliases(p).some(name => name.toLowerCase() === token.toLowerCase())

// Do not combine same-name weapons, recipes, or sockets. Empty/tracker plugs are
// not perks. Unknown named perk types get their own socket, never another column.
export function weaponPerkColumns(weapon, byHash = new Map()) {
  const columns = perkColumns.map(c => ({ ...c, options: [], missingHashes: [], socketIndex: null }))
  for (const socket of weapon?.socketPools || []) {
    if (!/WEAPON PERK/i.test(socket.socketCategory || '')) continue
    const hashes = socket.plugItemHashes || []
    const missingHashes = [...new Set(hashes)].filter(h => !byHash.has(Number(h)))
    const plugs = [...new Set(hashes)].map(h => byHash.get(Number(h))).filter(p => p && !p.placeholder && p.name && p.typeName && !p.redacted && !p.blacklisted)
    if (!plugs.length && !missingHashes.length) continue
    const type = plugs[0]?.typeName.replace(/^Enhanced\s+/, '')
    let [key, label] = types[type] || (type ? [null, type] : [socket.perkColumn, `插槽 ${socket.socketIndex + 1}（数据缺失）`])
    if (!type && columns.some(c => c.key === key)) label = columns.find(c => c.key === key).label
    if (type === 'Trait') {
      key = ['trait1', 'trait2'].includes(socket.perkColumn) ? socket.perkColumn : null
      label = key === 'trait1' ? '特性一' : key === 'trait2' ? '特性二' : '武器特性'
    }
    if (!key || columns.find(c => c.key === key)?.socketIndex != null) key = `socket-${socket.socketIndex}`
    const column = { key, label, socketIndex: socket.socketIndex, options: plugs,
      missingHashes, randomizedPlugSetHash: socket.randomizedPlugSetHash || null }
    const at = columns.findIndex(c => c.key === key)
    if (at >= 0) columns[at] = column
    else columns.splice(columns.length - 1, 0, column)
  }
  return columns
}

export function resolvePerkSelections(row, column) {
  const values = alternatives(row.recommendedPerks?.[column.key])
  const hashes = row.recommendedPerkHashes?.[column.key] || []
  const chosen = column.options.filter(p => hashes.includes(p.hash))
  const unknownHashes = hashes.filter(h => !column.options.some(p => p.hash === h))
  const manual = []
  for (const token of values) {
    const matches = column.options.filter(p => matchesPerkToken(p, token))
    if (chosen.some(p => matchesPerkToken(p, token))) continue
    // An obsolete explicit Hash must not silently bind to a same-name replacement.
    // Keep unmatched text for review until the user explicitly chooses a new perk.
    if (!unknownHashes.length && matches.length === 1) { if (!chosen.includes(matches[0])) chosen.push(matches[0]) }
    else manual.push(token)
  }
  return { chosen, manual, unknownHashes }
}

export function togglePerkRecommendation(row, column, option) {
  if (!column.options.some(p => p.hash === option.hash)) throw new Error('词条不属于本武器的所选插槽')
  const { chosen, manual, unknownHashes } = resolvePerkSelections(row, column)
  const next = chosen.some(p => p.hash === option.hash) ? chosen.filter(p => p.hash !== option.hash) : [...chosen, option]
  return {
    recommendedPerks: { ...row.recommendedPerks, [column.key]: alternatives([...next.map(perkLabel), ...manual]) },
    recommendedPerkHashes: { ...row.recommendedPerkHashes, [column.key]: [...new Set([...next.map(p => p.hash), ...unknownHashes])] }
  }
}

export function manualPerkRecommendation(row, key, text) {
  const values = alternatives(text)
  if (JSON.stringify(values) === JSON.stringify(alternatives(row.recommendedPerks?.[key]))) return {}
  return { recommendedPerks: { ...row.recommendedPerks, [key]: values },
    recommendedPerkHashes: { ...row.recommendedPerkHashes, [key]: [] } }
}
