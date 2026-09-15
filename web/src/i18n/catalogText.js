import { translateUi } from './messages.js'
import * as metadata from '../../../packages/manifest-catalog/item-metadata.js'
import * as perks from '../../../packages/loadout-planner/weapon-perks.js'

// A locale is explicit so exported artifacts keep their generation language.
export function createCatalogText(language = 'zh') {
const locale = { value: language }
const ui = source => translateUi(source, language)
const manifestName = (item, fallback = '') => language === 'en' ? item?.name || item?.nameZh || fallback : item?.nameZh || item?.name || fallback
const manifestDescription = item => language === 'en' ? item?.description || item?.descriptionZh || '' : item?.descriptionZh || item?.description || ''
const localized = item => language === 'en' ? item?.nameEn || item?.en || item?.name || item?.nameZh || '' : item?.nameZh || item?.name || item?.en || ''
const armorName = item => manifestName(item, ui('未命名'))
const armorDescription = manifestDescription
function versionLabels(item) {
  return metadata.versionLabels(item).map(label => {
    if (locale.value !== 'en') return label
    const release = label.match(/^(赛季发行|年度发行|资料片发行|发行批次) (.+)$/)
    return release ? `${ui(release[1])} ${release[2]}` : ui(label)
  })
}
const versionSummary = item => versionLabels(item).join(' / ')
function variantName(item) {
  const name = localized(item) || ui('未命名')
  return `${name}${/^Enhanced\b/.test(item?.typeName || '') ? ui('（强化）') : ''}${metadata.requiresArtifact(item) ? ui(item.artifactVariant === 'discount' ? '（神器减费版）' : '（神器限定）') : ''}`
}
function itemConditions(item) {
  return metadata.itemConditions(item).map(row => ({ ...row,
    kind: row.kind.split(' / ').map(ui).join(' / '),
    text: locale.value === 'en' ? row.original : row.text
  }))
}
const conditionSummary = item => [...new Set(itemConditions(item).map(row => row.text))].join(locale.value === 'en' ? '; ' : '；')
function craftingConditions(option) {
  const rows = metadata.craftingConditions(option)
  if (locale.value !== 'en') return rows
  return rows.map(row => {
    const r = row.craftingRequirements
    const conditions = [...new Set([...(r.requiredLevel ? [`Requires Weapon Level ${r.requiredLevel}`] : []), ...(r.unlockRequirements || []).map(rule => rule.failureDescription).filter(Boolean), ...(r.materialRequirementHashes?.length ? ['Crafting materials required'] : [])])]
    return { ...row, text: `Crafting: ${conditions.join('; ')}` }
  })
}
const perkLabel = item => `${manifestName(item)}${perks.isEnhancedPerk(item) ? ui('（强化）') : ''}`
function weaponPerkColumns(weapon, byHash) {
  return perks.weaponPerkColumns(weapon, byHash).map(column => ({ ...column, label: ui(column.label) }))
}

return { armorName, armorDescription, versionLabels, versionSummary, variantName, itemConditions, conditionSummary, craftingConditions, perkLabel, weaponPerkColumns, localized, manifestDescription }
}
