import { weaponPerkColumns } from '../loadout-planner/weapon-perks.js'
import { versionSummary } from './item-metadata.js'

// Ordered display stats, not investment stats or values after equipping perks.
const statLabels = {
  'Rounds Per Minute': '每分钟发射数', 'Charge Time': '充能时间', 'Draw Time': '拉弓时间',
  'Swing Speed': '挥舞速度', Impact: '伤害', 'Blast Radius': '爆炸范围', Velocity: '弹速',
  Range: '射程', Accuracy: '精准度', Stability: '稳定性', Handling: '操控性',
  'Reload Speed': '填装速度', Magazine: '弹匣', 'Ammo Capacity': '弹药容量',
  'Aim Assistance': '辅助瞄准', Zoom: '变焦', 'Recoil Direction': '后坐方向',
  'Airborne Effectiveness': '空中效率', 'Ammo Generation': '弹药生成',
  'Guard Resistance': '防御抗性', 'Guard Efficiency': '防御效率',
  'Charge Rate': '充能速率', 'Shield Duration': '护盾持续时间',
  'Cooling Efficiency': '冷却效率', 'Heat Generated': '热量生成', Persistence: '持续性'
}
const numericStats = new Set(['Rounds Per Minute', 'Charge Time', 'Draw Time', 'Magazine', 'Ammo Capacity', 'Recoil Direction'])

export function weaponBaseStats(weapon) {
  return Object.entries(statLabels).flatMap(([key, label]) => {
    const value = weapon?.baseStats?.[key]
    return Number.isFinite(value) ? [{ key, label, value, bar: !numericStats.has(key), percent: Math.min(100, Math.max(0, value)) }] : []
  })
}

export function weaponArchivePerks(weapon, byHash) {
  return weaponPerkColumns(weapon, byHash)
    .filter(column => column.socketIndex != null)
    .sort((a, b) => a.socketIndex - b.socketIndex)
}

export function weaponIntrinsics(weapon, byHash) {
  return (weapon?.socketPools || [])
    .filter(socket => /INTRINSIC TRAITS/i.test(socket.socketCategory || ''))
    .map(socket => byHash.get(Number(socket.initialItemHash)))
    .filter(plug => plug && !plug.placeholder && !plug.redacted && !plug.blacklisted)
}

export function weaponVersions(weapon, weapons) {
  if (!weapon) return []
  return weaponVersionGroups(weapons).get(weaponVersionKey(weapon)) || []
}

export const weaponVersionKey = weapon => JSON.stringify([weapon.name, weapon.itemSubType])

export function weaponVersionHighlights(weapon, versions, byHash) {
  if (!weapon || versions.length < 2) return []
  const otherColumns = versions.filter(item => item.hash !== weapon.hash).flatMap(item => weaponArchivePerks(item, byHash))
  return weaponArchivePerks(weapon, byHash).flatMap(column => {
    const others = new Set(otherColumns.filter(other => other.key === column.key).flatMap(other => other.options.map(option => option.hash)))
    const unique = column.options.filter(option => !others.has(option.hash))
    if (!unique.length) return []
    const names = [...new Set(unique.map(option => option.nameZh || option.name))]
    return [`${column.label}独有候选：${names.slice(0, 4).join('、')}${names.length > 4 ? `等 ${names.length} 项` : ''}`]
  })
}

export function weaponVersionGroups(weapons) {
  const groups = new Map()
  for (const weapon of weapons) {
    const key = weaponVersionKey(weapon)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(weapon)
  }
  // A stable catalog order, not a release chronology. Keep Adept/Timelost names
  // separate and never combine their stats or socket pools with the normal gun.
  for (const group of groups.values()) group.sort((a, b) => Number(Boolean(b.collectibleHash)) - Number(Boolean(a.collectibleHash)) || a.hash - b.hash)
  return groups
}

export function matchWeaponVersion(weapon, query, versions) {
  const match = query.trim().match(/^(.*?)\s*#\s*(\d+)$/)
  const text = (match ? match[1] : query).trim().toLowerCase()
  if (match && versions[Number(match[2]) - 1]?.hash !== weapon.hash) return false
  return !text || [weapon.hash, weapon.name, weapon.nameZh, weapon.weaponFamily, versionSummary(weapon),
    ...(weapon.categoryNames || []), ...(weapon.perkOptions || []), ...(weapon.perkOptionsZh || [])]
    .filter(value => value != null).join(' ').toLowerCase().includes(text)
}
