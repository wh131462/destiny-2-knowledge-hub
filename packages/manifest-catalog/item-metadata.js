// Shared definition metadata. A failure message is a prerequisite, never proof
// that a particular account/item is currently disabled, expired or unlocked.
const ruleTranslations = {
  'Preorder Exclusive': '预购专属，需核对资格',
  'Must Be Selected in the Seasonal Artifact': '需在赛季神器中选中对应解锁项',
  'Requires Shaped or Enhanced Weapon': '仅限已塑形或已强化的武器',
  'Requires Adept Weapon': '仅限专家武器',
  'This mod only works in specific activities.': '仅在指定活动中生效',
  'This weapon mod is no longer active.': '存在失效限制，需核对当前活动与实物状态',
  'Expired. Destination Mod cannot be equipped.': '过期后不可安装',
  'Expired. Destination Mod effects are no longer active.': '过期后效果不再生效',
  'Not Yet Unlocked': '需要先解锁', 'Requires Mod Item': '需要拥有对应模组',
  'Complete objectives to unlock': '完成目标后解锁', 'Complete Objectives to Unlock': '完成目标后解锁',
  'Duplicate artifact mod already equipped.': '不能重复装备同类神器模组',
  'Similar mod already applied.': '不能同时安装同类模组',
  'Only 1 Augmentation mod allowed.': '最多安装一个增幅模组',
  'Content Temporarily Disabled\nSee help.bungie.net for more info': '存在临时禁用条件；当前状态需在游戏中核对',
  'Mod Disabled': '存在禁用条件；当前状态需在游戏中核对'
}
export function ruleText(message) {
  if (ruleTranslations[message]) return ruleTranslations[message]
  const rank = message.match(/^Requires Guardian Rank (\d+)(?:: (.+))?$/)
  if (rank) return `需要守护者等级 ${rank[1]}${rank[2] ? `（${({ 'Vendor Challenges': '商人挑战', 'Modify Armor': '修改护甲', 'Threats and Surges': '威胁与激涌', 'Masterwork Weapons': '大师武器' })[rank[2]] || rank[2]}）` : ''}`
  const level = message.match(/^Requires Weapon Level:? (.+)$/)
  if (level) return `需要武器等级 ${level[1]}`
  const area = message.match(/^Only Active (?:in|on) (.+)$/)
  if (area) return `仅在${({ 'the Dreaming City': '幽梦之城', Nessus: '涅索斯', 'the EDZ': '欧洲无人区', 'the Tangled Shore': '纷争海岸', 'the Moon': '月球', Crucible: '熔炉竞技场', Strikes: '打击', Gambit: '智谋' })[area[1]] || area[1]}生效`
  return message
}
export const requiresArtifact = item => [...(item?.insertionRules || []), ...(item?.enabledRules || [])].some(rule => /Must Be Selected in the Seasonal Artifact/i.test(rule.failureMessage || ''))
const ordinaryCosts = new WeakMap()
const modEffectKey = item => JSON.stringify([item.displayProperties?.name, item.plug?.plugCategoryIdentifier, (item.perks || []).map(perk => perk.perkHash).sort()])
function artifactVariant(item, inventory) {
  if (!requiresArtifact(item.plug)) return undefined
  if (!ordinaryCosts.has(inventory)) {
    const costs = new Map()
    for (const candidate of Object.values(inventory)) {
      const cost = candidate.plug?.energyCost?.energyCost
      if (Number.isFinite(cost) && !candidate.redacted && !candidate.blacklisted && !requiresArtifact(candidate.plug)) {
        const key = modEffectKey(candidate)
        costs.set(key, Math.max(costs.get(key) ?? -1, cost))
      }
    }
    ordinaryCosts.set(inventory, costs)
  }
  return ordinaryCosts.get(inventory).get(modEffectKey(item)) > item.plug?.energyCost?.energyCost ? 'discount' : 'restricted'
}
export function itemConditions(item) {
  const entries = [...(item?.equipRequirements || []).map(text => ({ failureMessage: text, kind: '装备' })), ...(item?.insertionRules || []).map(rule => ({ ...rule, kind: '安装' })), ...(item?.enabledRules || []).map(rule => ({ ...rule, kind: '生效' }))]
  const unique = new Map()
  for (const rule of entries.filter(rule => rule.failureMessage?.trim())) {
    const existing = unique.get(rule.failureMessage)
    if (existing && !existing.kind.includes(rule.kind)) existing.kind += ` / ${rule.kind}`
    else if (!existing) unique.set(rule.failureMessage, { kind: rule.kind, text: rule.failureMessageZh || ruleText(rule.failureMessage), original: rule.failureMessage })
  }
  return [...unique.values()]
}
export function definitionMetadata(item, inventory = {}, localized = {}) {
  const localizedRules = key => (item.plug?.[key] || []).map((rule, index) => ({ ...rule,
    ...(localized[key]?.[index]?.failureMessage ? { failureMessageZh: localized[key][index].failureMessage } : {}) }))
  const result = { insertionRules: localizedRules('insertionRules'), enabledRules: localizedRules('enabledRules'),
    ...(requiresArtifact(item.plug) ? { artifactVariant: artifactVariant(item, inventory) } : {}),
    ...((item.equippingBlock?.displayStrings || []).some(Boolean) ? { equipRequirements: item.equippingBlock.displayStrings.filter(Boolean) } : {}),
    typeName: item.itemTypeDisplayName || '',
    definitionState: item.plug?.isDummyPlug ? 'placeholder' : /deprecated|no longer functions/i.test(item.displayProperties?.description || '') ? 'deprecated' : 'definition',
    tooltipNotifications: (item.tooltipNotifications || []).map((entry, index) => ({ ...entry,
      ...(localized.tooltipNotifications?.[index]?.displayString ? { displayStringZh: localized.tooltipNotifications[index].displayString } : {}) })) }
  for (const key of ['insertionRules', 'enabledRules', 'tooltipNotifications']) if (!result[key].length) delete result[key]
  if (result.definitionState === 'definition') delete result.definitionState
  if (![2, 3].includes(item.itemType)) return result
  const socketFeatures = (item.sockets?.socketEntries || []).flatMap((socket, index) => {
    const plug = inventory[socket.singleInitialItemHash]
    const category = plug?.plug?.plugCategoryIdentifier || ''
    const kind = /tuning\.mods/.test(category) ? 'tuning' : /artifice/.test(category) ? 'artifice'
      : /enhancements\.v2_/.test(category) ? 'energy' : /enhancements\.universal/.test(category) ? 'legacy'
      : /crafting.*enhancers/.test(category) ? 'enhancement' : /enhancements\.(raid|activity)|raid/.test(category) ? 'activity' : null
    return kind ? [{ kind, socketIndex: index, initialItemHash: socket.singleInitialItemHash, category, lockedByDefault: /^Locked\b/.test(plug?.displayProperties?.name || '') }] : []
  })
  result.versionInfo = { isAdept: Boolean(item.isAdept), isHolofoil: Boolean(item.isHolofoil),
    releaseTags: (item.traitIds || []).filter(id => id.startsWith('releases.')),
    recipeItemHash: item.inventory?.recipeItemHash || null, socketFeatures }
  const hasLegacyOnly = socketFeatures.length > 0 && socketFeatures.every(feature => feature.kind === 'legacy')
  result.availabilityStatus = item.collectibleHash || item.acquireRewardSiteHash ? 'source-confirmed' : hasLegacyOnly ? 'historical' : 'current-system-source-unconfirmed'
  return result
}

// Keep candidate-specific conditions, without copying empty crafting objects
// or zero roll weights into every weapon socket. No probability is inferred.
export function plugOptionMetadata(entry) {
  const requirements = entry.craftingRequirements
  return { plugItemHash: entry.plugItemHash,
    ...(entry.currentlyCanRoll != null ? { currentlyCanRoll: entry.currentlyCanRoll } : {}),
    ...(requirements && (requirements.requiredLevel || requirements.unlockRequirements?.length || requirements.materialRequirementHashes?.length) ? { craftingRequirements: requirements } : {}) }
}
export function versionLabels(item) {
  if (!item) return []
  const v = item.versionInfo, labels = []
  if (item.definitionState === 'deprecated') labels.push('已废弃定义')
  if (item.availabilityStatus === 'historical') labels.push('历史定义 · 当前不再获取')
  else if (item.availabilityStatus === 'current-system-source-unconfirmed') labels.push('当前系统 · 获取来源未确认')
  else if (item.availabilityStatus === 'source-confirmed') labels.push('来源已登记')
  if (item.definitionState === 'placeholder' || item.placeholder) labels.push('占位定义')
  if (requiresArtifact(item)) labels.push(item.artifactVariant === 'discount' ? '神器减费版 · 需解锁' : '神器限定 · 需解锁')
  if (/^Enhanced\b/.test(item.typeName || '')) labels.push(/Weapon Mod/.test(item.typeName) ? '强化武器模组' : '强化词条')
  else if (item.typeName === 'Weapon Mod') labels.push('普通武器模组')
  if (!v) return labels
  if (v.isAdept) labels.push('专家版')
  if (item.itemType === 3) labels.push(v.isHolofoil ? 'Holofoil 特殊版' : '普通外观版')
  if (v.recipeItemHash) labels.push('有锻造配方')
  else if (item.itemType === 3) labels.push('未登记锻造配方')
  const kinds = new Set(v.socketFeatures.map(feature => feature.kind))
  if (kinds.has('enhancement')) labels.push('有强化插槽')
  if (kinds.has('legacy') && !kinds.has('energy')) labels.push('旧式护甲插槽')
  if (kinds.has('energy')) labels.push('能量模组插槽')
  if (kinds.has('tuning')) labels.push('调谐槽')
  if (kinds.has('artifice')) labels.push(v.socketFeatures.some(f => f.kind === 'artifice' && f.lockedByDefault) ? '巧匠槽 · 含锁定定义' : '巧匠相关槽')
  if (kinds.has('activity')) labels.push('活动专属槽')
  for (const tag of v.releaseTags) {
    const [, release, kind] = tag.split('.')
    labels.push(`${({ season: '赛季发行', annual: '年度发行', dlc: '资料片发行' })[kind] || '发行批次'} ${release}`)
  }
  return labels
}
export const versionSummary = item => versionLabels(item).join(' · ')
export const variantName = item => `${item?.nameZh || item?.name || '未命名'}${/^Enhanced\b/.test(item?.typeName || '') ? '（强化）' : ''}${requiresArtifact(item) ? (item.artifactVariant === 'discount' ? '（神器减费版）' : '（神器限定）') : ''}`
export function conditionSummary(item) {
  return [...new Set(itemConditions(item).map(rule => rule.text))].join('；')
}
export function craftingConditions(option) {
  return (option?.craftingOptions || []).filter(row => row.craftingRequirements && (row.craftingRequirements.requiredLevel || row.craftingRequirements.unlockRequirements?.length || row.craftingRequirements.materialRequirementHashes?.length)).map(row => {
    const r = row.craftingRequirements
    const conditions = [...new Set([...(r.requiredLevel ? [`需要武器等级 ${r.requiredLevel}`] : []), ...(r.unlockRequirements || []).map(rule => ruleText(rule.failureDescription || '')).filter(Boolean)])]
    return { ...row, text: `锻造${conditions.length ? `：${conditions.join('；')}` : ''}${r.materialRequirementHashes?.length ? `${conditions.length ? '；' : '：'}需要锻造材料` : ''}` }
  })
}
// Do not turn an unknown artifact-to-discount relationship into permission.
// A matching node hash is the only direct relationship exposed by this schema.
export function modConditionErrors(mod, { artifact, artifactNodeHashes = [] } = {}) {
  if (!requiresArtifact(mod)) return []
  const name = `${mod.nameZh || mod.name}为${mod.artifactVariant === 'discount' ? '神器减费版' : '神器限定模组'}`
  if (!artifact) return [`${name}：需先配置对应神器与解锁项`]
  const selected = artifact.selectable && artifactNodeHashes.includes(mod.hash) && artifact.nodes?.some(node => node.hash === mod.hash)
  return selected ? [] : [`${name}：尚无所选神器已解锁该模组的对应证据，请核对解锁项或更换非神器限定模组`]
}
