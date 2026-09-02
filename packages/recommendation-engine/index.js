import { curatedBuilds } from '../../content/builds/index.js'
import { subclassById } from '../../content/catalog/subclasses.js'
import { activityById } from '../../content/catalog/activities.js'
import { gearById, modById } from '../../content/catalog/gear.js'
import { calculateStats, validateBuild, scoreBuild, planAcquisition, planUnlocks } from '../rules-engine/index.js'

export function auditRecommendationData(build) {
  const issues = []
  const coreGearIds = [build.exoticArmorId, ...(build.weapons || []).map(item => item.itemId)]
  for (const id of coreGearIds) {
    const item = gearById[id]
    if (!item?.manifestVerified || !Number.isInteger(item.manifestHash)) issues.push({ code: 'UNVERIFIED_GEAR', id })
  }
  for (const id of Object.values(build.armorMods || {}).flat()) {
    const mod = modById[id]
    // Stat-boost mods have no exact-name entity in this Manifest snapshot. Keep the
    // build usable, but report them as unresolved so the UI never presents them as official.
    if (!mod?.manifestVerified || !Number.isInteger(mod.manifestHash)) issues.push({ code: mod?.stat ? 'UNVERIFIED_STAT_MOD' : 'UNVERIFIED_MOD', id })
  }
  if (build.sourceIds?.some(id => ['community-baseline'].includes(id))) issues.push({ code: 'GENERATED_OR_COMMUNITY_BUILD', id: build.id })
  return {
    // Stat enhancement names differ between curated labels and this snapshot. They are
    // retained as an explicit editorial caveat; all other unresolved entities block strict mode.
    verified: issues.length === 0,
    recommendable: !issues.some(issue => ['UNVERIFIED_GEAR', 'UNVERIFIED_MOD', 'GENERATED_OR_COMMUNITY_BUILD'].includes(issue.code)),
    issues
  }
}

export function recommendBuilds({ classId, subclassId, subclassType, activityId, goals = [], ownedItemIds = [], strict = false }) {
  const owned = new Set(ownedItemIds)
  return curatedBuilds
    .filter(build => !build.isTemplateBaseline && (!strict || auditRecommendationData(build).recommendable))
    .filter(build => !classId || build.classId === classId)
    .filter(build => !subclassId || build.subclassId === subclassId)
    .filter(build => {
      if (!subclassType) return true
      const subclass = subclassById[build.subclassId]
      return subclassType === 'prismatic' ? subclass?.type === 'prismatic' : subclass?.type === 'mono'
    })
    .filter(build => !activityId || build.activityIds.includes(activityId))
    .map(build => {
      const validation = validateBuild(build)
      const dataAudit = auditRecommendationData(build)
      const activityResult = activityId ? scoreBuild(build, activityId) : null
      const activityScore = activityResult?.score ?? Math.round(Object.values(build.scoring || {}).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(build.scoring || {}).length))
      const goalBonus = goals.reduce((sum, goal) => sum + Math.round((build.scoring?.[goal] || 0) / 8), 0)
      const requiredItems = [build.armorSetId, build.exoticArmorId, ...(build.weapons || []).map(item => item.itemId)]
      const ownedCount = requiredItems.filter(id => owned.has(id)).length
      const ownershipBonus = ownedItemIds.length ? Math.round((ownedCount / requiredItems.length) * 12) : 0
      const stats = calculateStats(build)
      const targetCount = stats.targetChecks.filter(check => check.met).length
      const targetBonus = targetCount * 2
      const acquisition = planAcquisition(build, ownedItemIds)
      const missingAcquisition = acquisition.filter(item => !item.owned)
      const unlockCount = planUnlocks(build).length
      const activity = activityId ? activityById[activityId] : null
      const championTypes = activity?.requirements?.championTypes || []
      const championGaps = championTypes.filter(type => !(build.championCoverage?.[type] || []).length)
      const championCoverageScore = championTypes.length ? Math.round(((championTypes.length - championGaps.length) / championTypes.length) * 10) : 10
      const readinessPenalty = Math.min(12, missingAcquisition.length * 2)
      const warningPenalty = validation.warnings.length
      const reasons = []
      if (activityId) reasons.push(`${activityResult.score} 场景分`)
      if (goals.length) reasons.push(`目标匹配 ${goals.map(goal => build.scoring?.[goal] || 0).join('/')}%`)
      if (ownedItemIds.length) reasons.push(`已拥有 ${ownedCount}/${requiredItems.length} 件核心装备`)
      reasons.push(`属性目标 ${targetCount}/${stats.targetChecks.length} 达成`)
      if (missingAcquisition.length) reasons.push(`实现路径还缺 ${missingAcquisition.length} 件核心装备`)
      if (championTypes.length) reasons.push(`冠军覆盖 ${championTypes.length - championGaps.length}/${championTypes.length}`)
      reasons.push(`技能、星相与模组解锁项 ${unlockCount} 个`)
      if (warningPenalty) reasons.push(`${warningPenalty} 条场景警告`)
      return {
        build,
        validation,
        dataAudit,
        recommendationScore: Math.max(0, activityScore + goalBonus + ownershipBonus + targetBonus + championCoverageScore - warningPenalty * 2 - championGaps.length * 6 - readinessPenalty),
        reasons,
        ownership: { ownedCount, total: requiredItems.length },
        scoreBreakdown: { activityScore, goalBonus, ownershipBonus, targetBonus, championCoverageScore, championGapPenalty: championGaps.length * 6, readinessPenalty, warningPenalty },
        implementation: {
          missingItems: missingAcquisition.map(item => ({ itemId: item.itemId, name: item.name, pathName: item.pathName, deterministic: item.deterministic, confidence: item.confidence, sourceIds: item.sourceIds, steps: item.steps })),
          nextSteps: missingAcquisition.slice(0, 3).map(item => `${item.name}：${item.pathName}`),
          unlockCount,
          readiness: missingAcquisition.length ? 'in-progress' : 'ready',
          coreMissingCount: missingAcquisition.length,
          deterministicMissingCount: missingAcquisition.filter(item => item.deterministic).length,
          championGaps
        }
      }
    })
    .filter(result => result.validation.valid)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
}
