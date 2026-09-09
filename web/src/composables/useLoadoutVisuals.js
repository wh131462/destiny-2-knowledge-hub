import { computed } from 'vue'
import { aspectDefinition } from '../../../packages/loadout-planner/index.js'
import { manifestText } from '../utils/manifestText.js'

// Resolve art from the appropriate definition type. Display fallback must never
// pick a same-name collectible, bounty or the other subclass's aspect variant.
export function useLoadoutVisuals({ subclassAssets, fragmentAssets, manifestAbilities, assetFor, iconFor }, subclass) {
  const subclassByName = computed(() => new Map(subclassAssets.value.map(item => [item.name, item])))
  const fragmentByName = computed(() => new Map(fragmentAssets.value.map(item => [item.name, item])))
  const visualAsset = item => {
    if (!item) return null
    if (item.manifestHashesBySubclass && subclass?.value?.id) {
      const hash = item.manifestHashesBySubclass[subclass.value.id]
      return manifestAbilities.value.find(a => a.hash === hash) || null
    }
    if (item.id?.startsWith('aspect-')) return aspectDefinition(item, subclass?.value, manifestAbilities.value) || null
    if (item.superIds) return subclassAssets.value.find(s => s.hash === item.manifestHash) || subclassByName.value.get(item.en) || null
    if (item.id?.startsWith('facet-') || /^(echo-|ember-|spark-|thread-|whisper-)/.test(item.id || '')) return fragmentByName.value.get(item.en) || item
    return assetFor(item) || item
  }
  const visualIcon = item => {
    const asset = visualAsset(item)
    // Aspect lookup may intentionally fail closed while data is loading.
    return asset?.hash || asset?.icon ? iconFor(asset) : ''
  }
  const visualDescription = item => {
    const asset = visualAsset(item)
    return manifestText(asset?.perkDetails?.filter(p => p.visibility !== 2).map(p => p.descriptionZh || p.description).filter(Boolean).join('\n\n') || asset?.descriptionZh || asset?.description || item?.description || '')
  }
  return { visualIcon, visualDescription, visualAsset }
}
