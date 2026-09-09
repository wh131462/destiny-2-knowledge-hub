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
out.push('# 15 - 公开构筑手册（自动生成）', '', '> 本文件由 `content/builds/` 与规则引擎生成，请勿直接编辑。', '> 当前暂无公开构筑；后续仅收录经过来源登记与实机验证的社区方案。', '')

for (const build of curatedBuilds) {
  const validation = validateBuild(build)
  const stats = calculateStats(build)
  const acquisition = planAcquisition(build)
  const combat = calculateCombatProfile(build)
  const unlocks = planUnlocks(build)
  out.push(`## ${build.name}`, '', `- **构筑 ID**：\`${build.id}\``, `- **适用活动**：${build.activityIds.map(id => activityById[id]?.name || id).join('、')}`, `- **难度**：${build.difficulty}`, `- **可信度**：${build.confidence}`, `- **校验结果**：${validation.valid ? '通过' : '未通过'}`, `- **验证日期**：${build.verifiedAt}`, `- **Manifest 版本**：\`${build.manifestVersion}\``, '', build.goal, '')
  out.push('### 完整技能配置', '', `- 超能力：${abilityById[build.abilities.superId]?.name}`, `- 职业技能：${abilityById[build.abilities.classAbilityId]?.name}`, `- 近战：${abilityById[build.abilities.meleeId]?.name}`, `- 手雷：${abilityById[build.abilities.grenadeId]?.name}`, `- 星相：${build.abilities.aspectIds.map(id => aspectById[id]?.name).join('、')}`, build.abilities.facetIds?.length ? `- 棱镜特性：${build.abilities.facetIds.map(id => facetById[id]?.name).join('、')}` : `- 元素碎片：${build.abilities.fragmentIds.map(id => fragmentById[id]?.name).join('、')}`, '')
  out.push('### 装备', '', `- 护甲套装：${armorSetById[build.armorSetId]?.name || build.armorSetId}`, `- 异域护甲：${gearById[build.exoticArmorId]?.name}`, ...build.weapons.map(item => `- ${gearById[item.itemId]?.name}：${item.perks.join(' + ') || '固定异域特性'}；${item.purpose}`), '')
  out.push('### 最终属性', '', `| 生命值 | 近战 | 手雷 | 职业 | 超能 | 武器 |`, `|---:|---:|---:|---:|---:|---:|`, `| ${stats.values.health} | ${stats.values.melee} | ${stats.values.grenade} | ${stats.values.class} | ${stats.values.super} | ${stats.values.weapons} |`, '', '属性按当前 Armor 3.0 六项体系计算；Health 不等同于旧版韧性减伤。', '')
  out.push('### 机制组合与基线计算', '', '- 属性推导承伤倍率：不适用（Health 不直接换算固定减伤；请按胸甲抗性模组、增益、护盾和活动规则核验）', `- 武器伤害倍率：${combat.weaponDamageMultiplier}`, `- 目标承伤倍率：${combat.targetDamageMultiplier}`, `- 已登记组合倍率：${combat.combinedRegisteredMultiplier}`, ...(combat.activeInteractions.length ? combat.activeInteractions.map(item => `- **${item.name}**：${item.effect}`) : ['- 当前配置没有同时满足的登记组合']), '', '### 操作循环', '', ...build.rotation.map((step, index) => `${index + 1}. ${step}`), '', '### 获取顺序', '', ...acquisition.map(item => `- **${item.name}**：${item.pathName}（${item.deterministic ? '确定路径' : '随机刷取'}；可信度 ${item.confidence}；来源 ${item.sourceIds.join('、') || '未登记'}）`), '', '### 解锁清单', '', `共 ${unlocks.length} 项技能、星相、碎片、棱镜特性和模组解锁项。`, '', '### 已知限制', '', ...build.limitations.map(item => `- ${item}`), ...validation.warnings.map(item => `- **场景警告**：${item.message}`), '', '---', '')
}

await writeFile(new URL('../docs/knowledge-base/15-已验证构筑手册.md', import.meta.url), `${out.join('\n').trimEnd()}\n`, 'utf8')
console.log(`已生成 ${curatedBuilds.length} 套构筑文档。`)
