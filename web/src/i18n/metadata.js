// Reactive display adapters. Shared rules retain stable values and hashes.
import { useI18n } from './index.js'
import { createCatalogText } from './catalogText.js'
export * from '../../../packages/manifest-catalog/item-metadata.js'
export * from '../../../packages/loadout-planner/weapon-perks.js'
const { locale } = useI18n()
export const armorName = (...args) => createCatalogText(locale.value).armorName(...args)
export const armorDescription = (...args) => createCatalogText(locale.value).armorDescription(...args)
export const versionLabels = (...args) => createCatalogText(locale.value).versionLabels(...args)
export const versionSummary = (...args) => createCatalogText(locale.value).versionSummary(...args)
export const variantName = (...args) => createCatalogText(locale.value).variantName(...args)
export const itemConditions = (...args) => createCatalogText(locale.value).itemConditions(...args)
export const conditionSummary = (...args) => createCatalogText(locale.value).conditionSummary(...args)
export const craftingConditions = (...args) => createCatalogText(locale.value).craftingConditions(...args)
export const perkLabel = (...args) => createCatalogText(locale.value).perkLabel(...args)
export const weaponPerkColumns = (...args) => createCatalogText(locale.value).weaponPerkColumns(...args)
