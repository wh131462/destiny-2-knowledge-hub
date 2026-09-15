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

// Current weapons bind one Anti-Champion marker to their intrinsic frame.
// The marker often lives in perkDetails with an empty description, so scanning
// only the visible frame description misses normal legendary weapons.
export const championCounters = [
  { id: 'barrier', zh: '屏障', en: 'Barrier', counterZh: '反屏障', counterEn: 'Anti-Barrier', breakerTypeHash: 485622768, icon: '/common/destiny2_content/icons/DestinyBreakerTypeDefinition_07b9ba0194e85e46b258b04783e93d5d.png' },
  { id: 'overload', zh: '过载', en: 'Overload', counterZh: '反过载', counterEn: 'Anti-Overload', breakerTypeHash: 2611060930, icon: '/common/destiny2_content/icons/DestinyBreakerTypeDefinition_da558352b624d799cf50de14d7cb9565.png' },
  { id: 'unstoppable', zh: '势不可挡', en: 'Unstoppable', counterZh: '反势不可挡', counterEn: 'Anti-Unstoppable', breakerTypeHash: 3178805705, icon: '/common/destiny2_content/icons/DestinyBreakerTypeDefinition_825a438c85404efd6472ff9e97fc7251.png' }
]

const championPatterns = {
  barrier: /\[Shield-Piercing\]\s*Barrier|Barrier Champions?|屏障勇士/i,
  overload: /\[Disruption\]\s*Overload|Overload Champions?|过载勇士/i,
  unstoppable: /\[Stagger\]\s*Unstoppable|Unstoppable Champions?|势不可挡勇士/i
}

function intrinsicChampionText(plug) {
  return [plug?.name, plug?.nameZh, plug?.description, plug?.descriptionZh,
    ...(plug?.perkDetails || []).flatMap(perk => [perk.name, perk.nameZh, perk.description, perk.descriptionZh])]
    .filter(Boolean).join(' ')
}

function directWeaponChampionCounters(weapon, byHash) {
  const found = new Map()
  for (const plug of weaponIntrinsics(weapon, byHash)) {
    const text = intrinsicChampionText(plug)
    for (const counter of championCounters) {
      if (championPatterns[counter.id].test(text) && !found.has(counter.id)) {
        found.set(counter.id, { ...counter, frameHash: plug.hash, frameName: plug.name, frameNameZh: plug.nameZh })
      }
    }
  }
  return championCounters.flatMap(counter => found.get(counter.id) || [])
}

export function weaponChampionCounters(weapon, byHash, versions = []) {
  const direct = directWeaponChampionCounters(weapon, byHash)
  if (direct.length || !weapon) return direct
  for (const version of versions) {
    if (version?.hash === weapon.hash || weaponVersionKey(version) !== weaponVersionKey(weapon)) continue
    const fallback = directWeaponChampionCounters(version, byHash)
    if (fallback.length) return fallback.map(counter => ({ ...counter, inheritedFromHash: version.hash }))
  }
  return []
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

export function matchWeaponVersion(weapon, query, versions, aliases = []) {
  const match = query.trim().match(/^(.*?)\s*#\s*(\d+)$/)
  const text = (match ? match[1] : query).trim().toLowerCase()
  if (match && versions[Number(match[2]) - 1]?.hash !== weapon.hash) return false
  return !text || [weapon.hash, weapon.name, weapon.nameZh, weapon.weaponFamily, versionSummary(weapon),
    ...(weapon.categoryNames || []), ...(weapon.perkOptions || []), ...(weapon.perkOptionsZh || []), ...aliases]
    .filter(value => value != null).join(' ').toLowerCase().includes(text)
}
