import { planAcquisition as planEditorialAcquisition } from '../rules-engine/index.js'
import { loadAcquisitionSources } from '../manifest-adapter/index.js'

export { planEditorialAcquisition as planAcquisition }

export async function planVerifiedAcquisition(build, ownedItemIds = []) {
  const editorial = planEditorialAcquisition(build, ownedItemIds)
  const sourceIndex = await loadAcquisitionSources()
  const byId = new Map((sourceIndex.items || []).map(item => [item.id, item]))
  return editorial.map(item => {
    const source = byId.get(item.itemId)
    return {
      ...item,
      manifestVersion: sourceIndex.manifestVersion,
      official: source ? {
        matched: source.matched,
        manifestHashes: source.manifestHashes || [],
        primaryHash: source.primaryHash || null,
        vendorCandidates: source.vendorSources || [],
        activityRewardCandidates: source.activitySources || []
      } : { matched: false, manifestHashes: [], primaryHash: null, vendorCandidates: [], activityRewardCandidates: [] },
      evidence: source?.matched ? 'manifest-candidate-plus-editorial-path' : 'editorial-path-only',
      caveat: source?.matched ? 'Manifest 只证明实体与官方候选来源的关系；活动奖励不代表精确遭遇战、轮换或掉率。' : '当前没有匹配的官方实体，按编辑路径执行并在游戏内复核。'
    }
  })
}
