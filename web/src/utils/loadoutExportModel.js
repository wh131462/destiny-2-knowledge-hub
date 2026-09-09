import { armorLabels, statLabels, formatTarget, assignArtifactNodes } from '../../../packages/loadout-planner/index.js'
import { resolvePerkSelections } from '../../../packages/loadout-planner/weapon-perks.js'
import { manifestText } from './manifestText.js'
import { createCatalogText } from '../i18n/catalogText.js'
import { translateUi, translateGeneratedMessage } from '../i18n/messages.js'

// A frozen presentation model: never screenshot the editor or depend on which
// combination, accordion, or picker is currently expanded.
export function createLoadoutExportModel(draft, context) {
  const { equipment = [], mods = [], artifacts = [], subclasses = [], abilities = [], aspects = [], facets = [], fragments = [], itemSets = [], classes = {}, snapshot = {}, perkByHash = new Map(), iconFor = () => '', descriptionFor = () => '', issues = [] } = context
  const locale = context.locale === 'en' ? 'en' : 'zh'
  const ui = (source, parameters) => translateUi(source, locale, parameters)
  const generated = source => translateGeneratedMessage(source, locale)
  const { versionSummary, variantName, craftingConditions, conditionSummary, weaponPerkColumns, perkLabel, localized, manifestDescription } = createCatalogText(locale)
  const byHash = (items, hash) => hash ? items.find(i => Number(i.hash) === Number(hash)) : null
  const byId = (items, id) => items.find(i => i.id === id)
  const name = (item, fallback) => localized(item) || generated(fallback)
  const card = (item, fallback, caption = '', description = false) => ({ name: item ? variantName(item) : generated(fallback), image: item ? iconFor(item) : '', caption: [generated(caption), versionSummary(item)].filter(Boolean).join(' · '), description: description && item ? manifestText(descriptionFor(item), locale) : '' })
  const subclass = byId(subclasses, draft.subclassId)
  const skill = (items, id, caption, describe = false) => card(byId(items, id), id ? `未匹配：${id}` : '未指定', caption, describe)
  const talentGroups = [
    { name: '技能', items: [['superId', '超能'], ['classAbilityId', '职业技能'], ['movementId', '跳跃'], ['meleeId', '近战'], ['grenadeId', '手雷']].map(([key, label]) => skill(abilities, draft.abilities[key], label)) },
    { name: '星相', items: draft.abilities.aspectIds.map(id => skill(aspects, id, '', true)) },
    { name: '元素碎片', items: draft.abilities.fragmentIds.map(id => skill(fragments, id, '')) },
    { name: '棱镜特性', items: draft.abilities.facetIds.map(id => skill(facets, id, '')) },
    { name: '棱镜固定能力', items: [...(subclass?.transcendenceIds || []), ...(subclass?.transcendenceGrenadeIds || [])].map(id => skill(abilities, id, '固定能力')) }
  ].filter(g => g.items.length).map(group => ({ ...group, name: ui(group.name) }))
  const weapons = draft.weapons.map((row, i) => {
    const weapon = byHash(equipment, row.manifestHash)
    const baseColumns = weaponPerkColumns(perkByHash.size ? weapon : null, perkByHash)
    return {
      ...card(weapon, row.manifestHash ? `未匹配武器 #${row.manifestHash}` : '未指定武器', ['动能栏位', '能量栏位', '威能栏位'][i]),
      hash: row.manifestHash,
      notes: row.notes,
      combinations: row.perkCombinations.map((combo, index) => {
        const columns = [...baseColumns]
        for (const key of new Set([...Object.keys(combo.recommendedPerks), ...Object.keys(combo.recommendedPerkHashes || {})])) {
          if (!columns.some(c => c.key === key)) columns.push({ key, label: `原插槽 ${Number(key.slice(7)) + 1}`, options: [] })
        }
        return { name: combo.name.trim() || ui('组合 {0}', [index + 1]), notes: combo.notes, columns: columns.map(column => {
          const { chosen, manual, unknownHashes } = resolvePerkSelections(combo, column)
          return { name: generated(column.label), items: [
            ...chosen.map(p => ({ name: [perkLabel(p), ...new Set(craftingConditions(p).map(row => row.text))].join(' · '), image: p.icon ? (/^https?:/.test(p.icon) ? p.icon : `https://www.bungie.net${p.icon}`) : '' })),
            ...manual.map(name => ({ name, image: '' })),
            ...unknownHashes.map(hash => ({ name: ui('#{0}（待核对）', [hash]), image: '' }))
          ] }
        }).filter(c => c.items.length) }
      })
    }
  })
  const artifact = byHash(artifacts, draft.artifactHash)
  const assignments = draft.artifactAssignments.length ? draft.artifactAssignments : assignArtifactNodes(artifact, draft.artifactNodeHashes) || []
  const artifactNodes = [...assignments, ...draft.artifactNodeHashes.filter(hash => !assignments.some(a => a.nodeHash === hash)).map(nodeHash => ({ nodeHash }))]
  const allNodes = artifact?.nodes || artifact?.tiers?.flatMap(t => t.items) || []
  const armor = Object.entries(armorLabels).map(([slot, label]) => ({
    ...card(byHash(equipment, draft.armor[slot]?.manifestHash), draft.armor[slot]?.manifestHash ? `未匹配 #${draft.armor[slot].manifestHash}` : '护甲未指定', label),
    mods: draft.mods[slot].map(row => {
      const mod = byHash(mods, row.manifestHash)
      return card(mod, `未匹配模组 #${row.manifestHash}`, ui('插槽 {0}{1}', [row.socketIndex + 1, mod?.energyCost != null ? ui(' {0} 能量', [mod.energyCost]) : '']))
    })
  }))
  const sets = itemSets.flatMap(set => {
    const count = Object.keys(armorLabels).filter(slot => set.itemHashes?.includes(Number(draft.armor[slot]?.manifestHash))).length
    return count && set.perks?.length ? [{ name: name(set, `套装 #${set.hash}`), count, effects: set.perks.map(p => `${p.requiredSetCount} ${ui('件')}${ui(count >= p.requiredSetCount ? '（达到建议件数）' : '（未达到）')}: ${name(p, '')} — ${manifestText(manifestDescription(p), locale)}`) }] : []
  })
  return {
    locale, title: draft.name || ui('我的配装一图流'), className: localized(classes[draft.classId]) || draft.classId,
    subclass: card(subclass, draft.subclassId), version: snapshot.manifestVersion || ui('未提供'), syncedAt: snapshot.syncedAt?.slice(0, 10) || ui('未提供'),
    sourceVersion: draft.manifestVersion,
    stats: Object.entries(statLabels).map(([key, name]) => ({ name: ui(name), value: generated(formatTarget(draft.statRecommendations[key])) })),
    talentGroups, weapons, armor, sets,
    artifact: card(artifact, draft.artifactHash ? `未匹配神器 #${draft.artifactHash}` : '未指定神器'),
    artifactNodes: artifactNodes.map(row => card(byHash(allNodes, row.nodeHash), `未匹配节点 #${row.nodeHash}`, row.socketIndex == null ? '原节点 待核对插槽' : `插槽 ${row.socketIndex + 1}`)),
    ghost: draft.ghostArmorerHash ? card(byHash(mods, draft.ghostArmorerHash), `未匹配护甲商 #${draft.ghostArmorerHash}`, '机灵护甲商', true) : null,
    statNotes: draft.statNotes, farmingNotes: draft.farmingNotes, armorNotes: draft.armorNotes, notes: draft.notes,
    warnings: [...new Set([...issues, ...Object.values(draft.mods).flat().flatMap(row => { const mod = byHash(mods, row.manifestHash); return conditionSummary(mod) ? [`${name(mod, '模组')}使用条件（账号状态未核对）：${conditionSummary(mod)}`] : [] }), ...(draft.manifestVersion && draft.manifestVersion !== snapshot.manifestVersion ? ['原配装版本与当前快照不同，请核对推荐。'] : [])])].map(generated)
  }
}
