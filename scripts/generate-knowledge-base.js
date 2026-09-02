import { writeFile } from 'node:fs/promises'
import { curatedBuilds } from '../content/builds/index.js'
import { gearById } from '../content/catalog/gear.js'
import { abilityById } from '../content/catalog/abilities.js'
import { aspectById } from '../content/catalog/aspects.js'
import { facetById } from '../content/catalog/facets.js'
import { fragmentById } from '../content/catalog/fragments.js'
import { activityById } from '../content/catalog/activities.js'
import { armorSetById } from '../content/catalog/sets.js'
import { calculateStats, calculateCombatProfile, validateBuild, planAcquisition, planUnlocks } from '../packages/rules-engine/index.js'

const out = []
out.push('# 15 - 已验证构筑手册（自动生成）', '', '> 本文件由 `content/builds/` 与规则引擎生成，请勿直接编辑。', '> 每套构筑均经过职业技能池、装备槽位、异域限制、词条、模组容量和属性目标校验。', '')

for (const build of curatedBuilds) {
  const validation = validateBuild(build)
  const stats = calculateStats(build)
  const acquisition = planAcquisition(build)
  const combat = calculateCombatProfile(build)
  const unlocks = planUnlocks(build)
  out.push(`## ${build.name}`, '', `- **构筑 ID**：\`${build.id}\``, `- **适用活动**：${build.activityIds.map(id => activityById[id]?.name || id).join('、')}`, `- **难度**：${build.difficulty}`, `- **可信度**：${build.confidence}`, `- **校验结果**：${validation.valid ? '通过' : '未通过'}`, `- **验证日期**：${build.verifiedAt}`, `- **Manifest 版本**：\`${build.manifestVersion}\``, '', build.goal, '')
  out.push('### 完整技能配置', '', `- 超能力：${abilityById[build.abilities.superId]?.name}`, `- 职业技能：${abilityById[build.abilities.classAbilityId]?.name}`, `- 近战：${abilityById[build.abilities.meleeId]?.name}`, `- 手雷：${abilityById[build.abilities.grenadeId]?.name}`, `- 星相：${build.abilities.aspectIds.map(id => aspectById[id]?.name).join('、')}`, build.abilities.facetIds?.length ? `- 棱镜特性：${build.abilities.facetIds.map(id => facetById[id]?.name).join('、')}` : `- 元素碎片：${build.abilities.fragmentIds.map(id => fragmentById[id]?.name).join('、')}`, '')
  out.push('### 装备', '', `- 护甲套装：${armorSetById[build.armorSetId]?.name || build.armorSetId}`, `- 异域护甲：${gearById[build.exoticArmorId]?.name}`, ...build.weapons.map(item => `- ${gearById[item.itemId]?.name}：${item.perks.join(' + ') || '固定异域特性'}；${item.purpose}`), '')
  out.push('### 最终属性', '', `| 机动 | 韧性 | 恢复 | 纪律 | 智慧 | 力量 |`, `|---:|---:|---:|---:|---:|---:|`, `| ${stats.values.mobility} | ${stats.values.resilience} | ${stats.values.recovery} | ${stats.values.discipline} | ${stats.values.intellect} | ${stats.values.strength} |`, '', `韧性 T${stats.tiers.resilience}，规则基线估算 PvE 减伤 ${stats.resilienceDamageResistancePercent}%。`, '')
  out.push('### 机制组合与基线计算', '', `- 受到伤害倍率：${combat.incomingDamageMultiplier}`, `- 武器伤害倍率：${combat.weaponDamageMultiplier}`, `- 目标承伤倍率：${combat.targetDamageMultiplier}`, `- 已登记组合倍率：${combat.combinedRegisteredMultiplier}`, ...(combat.activeInteractions.length ? combat.activeInteractions.map(item => `- **${item.name}**：${item.effect}`) : ['- 当前配置没有同时满足的登记组合']), '', '### 操作循环', '', ...build.rotation.map((step, index) => `${index + 1}. ${step}`), '', '### 获取顺序', '', ...acquisition.map(item => `- **${item.name}**：${item.pathName}（${item.deterministic ? '确定路径' : '随机刷取'}；可信度 ${item.confidence}；来源 ${item.sourceIds.join('、') || '未登记'}）`), '', '### 解锁清单', '', `共 ${unlocks.length} 项技能、星相、碎片、棱镜特性和模组解锁项。`, '', '### 已知限制', '', ...build.limitations.map(item => `- ${item}`), ...validation.warnings.map(item => `- **场景警告**：${item.message}`), '', '---', '')
}

await writeFile(new URL('../docs/knowledge-base/15-已验证构筑手册.md', import.meta.url), `${out.join('\n')}\n`, 'utf8')
console.log(`已生成 ${curatedBuilds.length} 套构筑文档。`)
