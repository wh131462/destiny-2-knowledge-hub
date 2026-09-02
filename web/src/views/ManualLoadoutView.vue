<script setup>
import { computed, ref, watch } from 'vue'
import { abilities, aspects, facets, fragments, subclasses, classById, MANIFEST_VERSION } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'

const {
  weaponItems,
  equipmentItems,
  manifestMods,
  manifestPerks,
  artifacts,
  iconFor
} = useManifestAssets()

const classes = Object.values(classById)
const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
const armorLabels = {
  helmet: '头盔 / Helmet',
  arms: '臂铠 / Arms',
  chest: '胸甲 / Chest',
  legs: '腿甲 / Legs',
  classItem: '职业装备 / Class Item'
}
const weaponSlots = ['kinetic', 'energy', 'power']
const weaponLabels = ['动能武器 / Kinetic', '能量武器 / Energy', '重型武器 / Power']
const emptyWeaponRows = () => [{ hash: '', perks: [] }, { hash: '', perks: [] }, { hash: '', perks: [] }]
const emptyArmor = () => ({ helmet: '', arms: '', chest: '', legs: '', classItem: '' })
const emptyMods = () => ({ helmet: [], arms: [], chest: [], legs: [], classItem: [] })

const classId = ref('hunter')
const subclassId = ref('hunter-arc')
const buildName = ref('我的手动配装')
const selected = ref({
  superId: '',
  classAbilityId: '',
  meleeId: '',
  grenadeId: '',
  aspectIds: [],
  facetIds: [],
  fragmentIds: [],
  weapons: emptyWeaponRows(),
  armor: emptyArmor(),
  mods: emptyMods(),
  artifactNodeHashes: []
})

const pickerOpen = ref(false)
const pickerKind = ref('')
const pickerKey = ref('')
const pickerIndex = ref(-1)
const pickerSearch = ref('')
const pickerPage = ref(1)
const pickerPageSize = 48
const transferOpen = ref(false)
const transferMode = ref('import')
const codeText = ref('')
const statusMessage = ref('')
const importError = ref('')

const subclass = computed(() => subclasses.find(item => item.id === subclassId.value) || null)
const classSubclasses = computed(() => subclasses.filter(item => item.classId === classId.value))
const abilityPool = computed(() => {
  const current = subclass.value
  if (!current) return { supers: [], classAbilities: [], melees: [], grenades: [] }
  const byIds = ids => (ids || []).map(id => abilities.find(item => item.id === id)).filter(Boolean)
  return {
    supers: byIds(current.superIds),
    classAbilities: abilities.filter(item => item.kind === 'classAbility' && item.classIds.includes(classId.value)),
    melees: byIds(current.meleeIds),
    grenades: byIds(current.grenadeIds)
  }
})
const abilitySlots = computed(() => [
  { key: 'superId', pool: 'supers', zh: '超能', en: 'Super' },
  { key: 'classAbilityId', pool: 'classAbilities', zh: '职业技能', en: 'Class ability' },
  { key: 'meleeId', pool: 'melees', zh: '近战', en: 'Melee' },
  { key: 'grenadeId', pool: 'grenades', zh: '手雷', en: 'Grenade' }
])
const aspectPool = computed(() => (subclass.value?.aspectIds || []).map(id => aspects.find(item => item.id === id)).filter(Boolean))
const traitPool = computed(() => subclass.value?.type === 'prismatic'
  ? facets
  : fragments.filter(item => item.element === subclass.value?.element))
const traitLimit = computed(() => subclass.value?.type === 'prismatic' ? 5 : 4)
const selectedTraitIds = computed(() => subclass.value?.type === 'prismatic' ? selected.value.facetIds : selected.value.fragmentIds)
const selectedWeapons = computed(() => selected.value.weapons.map(row => manifestWeapon(row.hash)).filter(Boolean))
const armorCandidates = computed(() => equipmentItems.value.filter(item => item.itemType === 2 && item.classId === classId.value && item.icon))
const artifact = computed(() => artifacts.value?.[0] || null)
const allNodes = computed(() => artifact.value?.tiers?.flatMap(tier => (tier.items || []).map(item => ({ ...item, tierIndex: tier.tierIndex }))) || [])
const manifestPerkMap = computed(() => new Map(manifestPerks.value.flatMap(item => [item.name, item.nameZh].filter(Boolean).map(name => [name, item]))))

function label(item) {
  return item?.nameZh || item?.name || item?.en || '未命名实体'
}
function english(item) {
  return item?.en || (item?.nameZh ? item?.name : '') || item?.name || item?.nameZh || 'Unnamed entity'
}
function icon(item) {
  return iconFor(item) || (item?.icon ? `https://www.bungie.net${item.icon}` : '')
}
function matches(item, term) {
  if (!term) return true
  return `${item?.name || ''} ${item?.nameZh || ''} ${item?.en || ''} ${item?.weaponFamily || ''} ${item?.description || ''} ${item?.descriptionZh || ''}`
    .toLowerCase()
    .includes(term.toLowerCase())
}
function abilityAt(key) {
  return abilities.find(item => item.id === selected.value[key]) || null
}
function aspectAt(index) {
  return aspects.find(item => item.id === selected.value.aspectIds[index]) || null
}
function traitAt(index) {
  const collection = subclass.value?.type === 'prismatic' ? facets : fragments
  return collection.find(item => item.id === selectedTraitIds.value[index]) || null
}
function manifestWeapon(hash) {
  return weaponItems.value.find(item => String(item.hash) === String(hash)) || null
}
function weaponAt(index) {
  return manifestWeapon(selected.value.weapons[index]?.hash)
}
function armorAt(slot) {
  return equipmentItems.value.find(item => String(item.hash) === String(selected.value.armor[slot])) || null
}
function modAt(hash) {
  return manifestMods.value.find(item => Number(item.hash) === Number(hash)) || null
}
function artifactNodeAt(hash) {
  return allNodes.value.find(item => Number(item.hash) === Number(hash)) || null
}
function isExotic(item) {
  return item?.tierTypeHash === 2759499571
}
function perkPoolFor(index) {
  const weapon = weaponAt(index)
  if (!weapon) return []
  const options = weapon.perkOptions || []
  const optionsZh = weapon.perkOptionsZh || []
  const seen = new Set()
  return options.map((name, optionIndex) => {
    const nameZh = optionsZh[optionIndex] || ''
    const manifestItem = manifestPerkMap.value.get(name) || manifestPerkMap.value.get(nameZh)
    return {
      id: name || nameZh,
      name,
      nameZh,
      icon: manifestItem?.icon || '',
      description: manifestItem?.description || '',
      descriptionZh: manifestItem?.descriptionZh || ''
    }
  }).filter(item => item.id && !seen.has(item.id) && seen.add(item.id))
}
function selectedPerkAt(weaponIndex, perkIndex) {
  const id = selected.value.weapons[weaponIndex]?.perks?.[perkIndex]
  return perkPoolFor(weaponIndex).find(item => item.id === id || item.nameZh === id) || null
}
function modEnergy(slot) {
  return selected.value.mods[slot].reduce((sum, hash) => sum + Number(modAt(hash)?.energyCost || 0), 0)
}

function setClass(id) {
  classId.value = id
  subclassId.value = subclasses.find(item => item.classId === id)?.id || ''
  selected.value.armor = emptyArmor()
  selected.value.mods = emptyMods()
  resetSubclassSelections()
}
function setSubclass(id) {
  subclassId.value = id
  resetSubclassSelections()
}
function resetSubclassSelections() {
  selected.value.superId = ''
  selected.value.classAbilityId = ''
  selected.value.meleeId = ''
  selected.value.grenadeId = ''
  selected.value.aspectIds = []
  selected.value.facetIds = []
  selected.value.fragmentIds = []
}
function toggleList(key, id, max) {
  const list = selected.value[key]
  const at = list.indexOf(id)
  if (at >= 0) list.splice(at, 1)
  else if (list.length < max) list.push(id)
}
function setWeapon(index, hash) {
  selected.value.weapons[index] = { hash: String(hash || ''), perks: [] }
}
function selectArmor(slot, hash) {
  selected.value.armor[slot] = String(hash || '')
}
function toggleMod(slot, hash) {
  const list = selected.value.mods[slot]
  const numericHash = Number(hash)
  const at = list.indexOf(numericHash)
  if (at >= 0) list.splice(at, 1)
  else if (list.length < 4) list.push(numericHash)
}
function togglePerk(index, id) {
  const list = selected.value.weapons[index].perks
  const at = list.indexOf(id)
  if (at >= 0) list.splice(at, 1)
  else if (list.length < 2) list.push(id)
}

const selectionChecks = computed(() => {
  const errors = []
  if (!subclass.value || subclass.value.classId !== classId.value) errors.push('职业与子职业不匹配。')
  for (const slot of abilitySlots.value) {
    if (!selected.value[slot.key]) errors.push(`${slot.zh}尚未选择。`)
    else if (!abilityPool.value[slot.pool].some(item => item.id === selected.value[slot.key])) errors.push(`${slot.zh}不在当前子职业池中。`)
  }
  if (selected.value.aspectIds.length !== 2) errors.push(`星相需要选择 2 个，当前 ${selected.value.aspectIds.length} 个。`)
  for (const slot of armorSlots) if (!selected.value.armor[slot]) errors.push(`${armorLabels[slot]} 尚未选择。`)
  selected.value.weapons.forEach((row, index) => {
    const item = weaponAt(index)
    if (!item) errors.push(`${weaponLabels[index]} 尚未选择。`)
    else if (item.ammoSlot !== weaponSlots[index]) errors.push(`${label(item)} 不属于${weaponLabels[index]}。`)
    for (const perk of row.perks) if (!perkPoolFor(index).some(item => item.id === perk || item.nameZh === perk)) errors.push(`${label(item)} 的 Perk 不在官方池中。`)
  })
  const weaponHashes = selected.value.weapons.map(row => row.hash).filter(Boolean)
  if (new Set(weaponHashes).size !== weaponHashes.length) errors.push('三把武器不能重复。')
  if (selectedWeapons.value.filter(isExotic).length > 1) errors.push('最多装备一把异域武器。')
  const armorItems = armorSlots.map(armorAt).filter(Boolean)
  if (armorItems.filter(isExotic).length > 1) errors.push('异域护甲最多装备 1 件。')
  for (const slot of armorSlots) if (modEnergy(slot) > 10) errors.push(`${armorLabels[slot]} 模组能量超过 10。`)
  return errors
})
const isReady = computed(() => selectionChecks.value.length === 0)

const pickerMeta = computed(() => {
  if (pickerKind.value === 'ability') {
    const slot = abilitySlots.value.find(item => item.key === pickerKey.value)
    return { title: `选择${slot?.zh || '技能'}`, subtitle: `${abilityPool.value[slot?.pool]?.length || 0} 个可选` }
  }
  if (pickerKind.value === 'aspect') return { title: '选择星相', subtitle: `Aspects · 已选 ${selected.value.aspectIds.length}/2` }
  if (pickerKind.value === 'trait') return { title: subclass.value?.type === 'prismatic' ? '选择棱镜特性' : '选择元素碎片', subtitle: `已选 ${selectedTraitIds.value.length}/${traitLimit.value}` }
  if (pickerKind.value === 'weapon') return { title: `选择${weaponLabels[pickerIndex.value]}`, subtitle: `${rawPickerItems.value.length} 件可选` }
  if (pickerKind.value === 'perk') return { title: `${label(weaponAt(pickerIndex.value))} · Perk`, subtitle: `已选 ${selected.value.weapons[pickerIndex.value]?.perks.length || 0}/2` }
  if (pickerKind.value === 'armor') return { title: `选择${armorLabels[pickerKey.value]}`, subtitle: `${rawPickerItems.value.length} 件可选` }
  if (pickerKind.value === 'mod') return { title: `${armorLabels[pickerKey.value]} 模组`, subtitle: `已选 ${selected.value.mods[pickerKey.value]?.length || 0}/4 · 能量 ${modEnergy(pickerKey.value)}/10` }
  return { title: '选择神器节点', subtitle: `Artifact · 已选 ${selected.value.artifactNodeHashes.length}/12` }
})
const rawPickerItems = computed(() => {
  if (pickerKind.value === 'ability') {
    const slot = abilitySlots.value.find(item => item.key === pickerKey.value)
    return slot ? abilityPool.value[slot.pool] : []
  }
  if (pickerKind.value === 'aspect') return aspectPool.value
  if (pickerKind.value === 'trait') return traitPool.value
  if (pickerKind.value === 'weapon') return weaponItems.value.filter(item => item.ammoSlot === weaponSlots[pickerIndex.value] && item.icon)
  if (pickerKind.value === 'perk') return perkPoolFor(pickerIndex.value)
  if (pickerKind.value === 'armor') return armorCandidates.value.filter(item => item.armorSlot === pickerKey.value)
  if (pickerKind.value === 'mod') return manifestMods.value.filter(item => item.icon && (item.slot === pickerKey.value || item.slot === 'any'))
  return allNodes.value
})
const filteredPickerItems = computed(() => rawPickerItems.value.filter(item => matches(item, pickerSearch.value)))
const pagedPickerItems = computed(() => {
  const start = (pickerPage.value - 1) * pickerPageSize
  return filteredPickerItems.value.slice(start, start + pickerPageSize)
})
const pickerIsMulti = computed(() => ['aspect', 'trait', 'perk', 'mod', 'artifact'].includes(pickerKind.value))
const pickerCanClear = computed(() => ['ability', 'weapon', 'armor'].includes(pickerKind.value))

function openPicker(kind, options = {}) {
  pickerKind.value = kind
  pickerKey.value = options.key || ''
  pickerIndex.value = options.index ?? -1
  pickerSearch.value = ''
  pickerPage.value = 1
  pickerOpen.value = true
}
function pickerItemSelected(item) {
  if (pickerKind.value === 'ability') return selected.value[pickerKey.value] === item.id
  if (pickerKind.value === 'aspect') return selected.value.aspectIds.includes(item.id)
  if (pickerKind.value === 'trait') return selectedTraitIds.value.includes(item.id)
  if (pickerKind.value === 'weapon') return String(selected.value.weapons[pickerIndex.value]?.hash) === String(item.hash)
  if (pickerKind.value === 'perk') return selected.value.weapons[pickerIndex.value]?.perks.includes(item.id)
  if (pickerKind.value === 'armor') return String(selected.value.armor[pickerKey.value]) === String(item.hash)
  if (pickerKind.value === 'mod') return selected.value.mods[pickerKey.value]?.includes(Number(item.hash))
  return selected.value.artifactNodeHashes.includes(Number(item.hash))
}
function pickerDisabledReason(item) {
  if (pickerItemSelected(item)) return ''
  if (pickerKind.value === 'weapon') {
    if (selected.value.weapons.some((row, index) => index !== pickerIndex.value && String(row.hash) === String(item.hash))) return '该武器已装备在其他栏位'
    const otherExotic = selected.value.weapons.some((row, index) => index !== pickerIndex.value && isExotic(manifestWeapon(row.hash)))
    if (otherExotic && isExotic(item)) return '已装备一把异域武器'
  }
  if (pickerKind.value === 'armor') {
    const otherExotic = armorSlots.some(slot => slot !== pickerKey.value && isExotic(armorAt(slot)))
    if (otherExotic && isExotic(item)) return '已装备一件异域护甲'
  }
  if (pickerKind.value === 'aspect' && selected.value.aspectIds.length >= 2) return '星相已达上限'
  if (pickerKind.value === 'trait' && selectedTraitIds.value.length >= traitLimit.value) return '碎片或特性已达上限'
  if (pickerKind.value === 'perk' && selected.value.weapons[pickerIndex.value].perks.length >= 2) return 'Perk 已达上限'
  if (pickerKind.value === 'mod') {
    if (selected.value.mods[pickerKey.value].length >= 4) return '模组数量已达上限'
    if (modEnergy(pickerKey.value) + Number(item.energyCost || 0) > 10) return '加入后会超过 10 点能量'
  }
  if (pickerKind.value === 'artifact' && selected.value.artifactNodeHashes.length >= 12) return '神器节点已达上限'
  return ''
}
function selectPickerItem(item) {
  if (pickerDisabledReason(item)) return
  if (pickerKind.value === 'ability') selected.value[pickerKey.value] = item.id
  else if (pickerKind.value === 'aspect') toggleList('aspectIds', item.id, 2)
  else if (pickerKind.value === 'trait') toggleList(subclass.value.type === 'prismatic' ? 'facetIds' : 'fragmentIds', item.id, traitLimit.value)
  else if (pickerKind.value === 'weapon') setWeapon(pickerIndex.value, item.hash)
  else if (pickerKind.value === 'perk') togglePerk(pickerIndex.value, item.id)
  else if (pickerKind.value === 'armor') selectArmor(pickerKey.value, item.hash)
  else if (pickerKind.value === 'mod') toggleMod(pickerKey.value, item.hash)
  else toggleList('artifactNodeHashes', Number(item.hash), 12)
  if (!pickerIsMulti.value) pickerOpen.value = false
}
function clearPickerSelection() {
  if (pickerKind.value === 'ability') selected.value[pickerKey.value] = ''
  if (pickerKind.value === 'weapon') setWeapon(pickerIndex.value, '')
  if (pickerKind.value === 'armor') selectArmor(pickerKey.value, '')
  pickerOpen.value = false
}

function payload() {
  return {
    schema: 'd2hub-manual-loadout-v1',
    manifestVersion: MANIFEST_VERSION,
    name: buildName.value || '我的手动配装',
    classId: classId.value,
    subclassId: subclassId.value,
    abilities: {
      superId: selected.value.superId,
      classAbilityId: selected.value.classAbilityId,
      meleeId: selected.value.meleeId,
      grenadeId: selected.value.grenadeId,
      grenadeManifestHash: abilityAt('grenadeId')?.manifestHash || null,
      grenadeManifestName: abilityAt('grenadeId')?.en || null,
      grenadeManifestNameZh: abilityAt('grenadeId')?.name || null,
      aspectIds: [...selected.value.aspectIds],
      facetIds: [...selected.value.facetIds],
      fragmentIds: [...selected.value.fragmentIds]
    },
    weapons: selected.value.weapons.map(row => ({
      manifestHash: row.hash ? Number(row.hash) : null,
      manifestName: manifestWeapon(row.hash)?.name || null,
      manifestNameZh: manifestWeapon(row.hash)?.nameZh || null,
      perks: [...row.perks]
    })),
    armor: Object.fromEntries(armorSlots.map(slot => [slot, selected.value.armor[slot] ? {
      manifestHash: Number(selected.value.armor[slot]),
      manifestName: armorAt(slot)?.name || null,
      manifestNameZh: armorAt(slot)?.nameZh || null
    } : null])),
    mods: Object.fromEntries(armorSlots.map(slot => [slot, selected.value.mods[slot].map(hash => ({
      manifestHash: Number(hash),
      manifestName: modAt(hash)?.name || null
    }))])),
    artifactNodeHashes: [...selected.value.artifactNodeHashes]
  }
}
function encode(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
}
function decode(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))))
}
function openTransfer(mode) {
  transferMode.value = mode
  importError.value = ''
  statusMessage.value = ''
  codeText.value = mode === 'export' ? encode(payload()) : ''
  transferOpen.value = true
}
async function copyCode() {
  if (!codeText.value) codeText.value = encode(payload())
  try {
    await navigator.clipboard.writeText(codeText.value)
    statusMessage.value = '配装代码已复制。'
  } catch {
    statusMessage.value = '浏览器未授权剪贴板，请手动复制。'
  }
}
function importCode() {
  try {
    const data = decode(codeText.value.trim())
    if (data.schema !== 'd2hub-manual-loadout-v1') throw new Error('代码版本不兼容')
    if (data.manifestVersion !== MANIFEST_VERSION) throw new Error(`Manifest 版本不一致：${data.manifestVersion} ≠ ${MANIFEST_VERSION}`)
    const targetSubclass = subclasses.find(item => item.id === data.subclassId)
    if (!targetSubclass || !classById[data.classId]) throw new Error('职业或子职业不在当前规则目录中')
    if (targetSubclass.classId !== data.classId) throw new Error('子职业不属于导入代码中的职业')

    const importedAbilities = data.abilities && typeof data.abilities === 'object' ? data.abilities : {}
    const abilityRules = [
      ['superId', targetSubclass.superIds || [], '超能'],
      ['classAbilityId', abilities.filter(item => item.kind === 'classAbility' && item.classIds.includes(data.classId)).map(item => item.id), '职业技能'],
      ['meleeId', targetSubclass.meleeIds || [], '近战'],
      ['grenadeId', targetSubclass.grenadeIds || [], '手雷']
    ]
    for (const [key, pool, name] of abilityRules) if (importedAbilities[key] && !pool.includes(importedAbilities[key])) throw new Error(`${name}不在该子职业的官方选择池中`)
    const importedGrenade = abilities.find(item => item.id === importedAbilities.grenadeId)
    if (importedAbilities.grenadeManifestHash != null && Number(importedAbilities.grenadeManifestHash) !== Number(importedGrenade?.manifestHash)) throw new Error('手雷 Manifest Hash 与当前官方实体不匹配')

    const importedAspects = Array.isArray(importedAbilities.aspectIds) ? importedAbilities.aspectIds : []
    const importedFacets = Array.isArray(importedAbilities.facetIds) ? importedAbilities.facetIds : []
    const importedFragments = Array.isArray(importedAbilities.fragmentIds) ? importedAbilities.fragmentIds : []
    if (importedAspects.length > 2 || importedAspects.some(id => !(targetSubclass.aspectIds || []).includes(id))) throw new Error('星相数量或子职业归属不正确')
    if (targetSubclass.type === 'prismatic') {
      if (importedFacets.length > 5 || importedFacets.some(id => !facets.some(item => item.id === id))) throw new Error('棱镜特性数量或实体不正确')
      if (importedFragments.length) throw new Error('棱镜子职业不能导入普通元素碎片')
    } else {
      const allowedFragments = fragments.filter(item => item.element === targetSubclass.element).map(item => item.id)
      if (importedFragments.length > 4 || importedFragments.some(id => !allowedFragments.includes(id))) throw new Error('元素碎片数量或子职业归属不正确')
      if (importedFacets.length) throw new Error('普通子职业不能导入棱镜特性')
    }

    if (!Array.isArray(data.weapons) || data.weapons.length > 3) throw new Error('武器必须使用三个固定栏位')
    const importedWeapons = data.weapons.map(row => ({ hash: row?.manifestHash || '', perks: Array.isArray(row?.perks) ? row.perks : [] }))
      .concat(emptyWeaponRows()).slice(0, 3)
    importedWeapons.forEach((row, index) => {
      if (!row.hash) return
      const entity = weaponItems.value.find(item => String(item.hash) === String(row.hash))
      if (!entity) throw new Error(`第 ${index + 1} 把武器不在当前 Manifest 中`)
      if (entity.ammoSlot !== weaponSlots[index]) throw new Error(`${label(entity)} 不属于${weaponLabels[index]}`)
      const pool = new Set([...(entity.perkOptions || []), ...(entity.perkOptionsZh || [])])
      if (row.perks.length > 2 || row.perks.some(perk => !pool.has(perk))) throw new Error(`${label(entity)} 的 Perk 数量或官方词条池不匹配`)
    })
    const importedWeaponEntities = importedWeapons.map(row => weaponItems.value.find(item => String(item.hash) === String(row.hash))).filter(Boolean)
    if (new Set(importedWeapons.map(row => String(row.hash)).filter(Boolean)).size !== importedWeapons.filter(row => row.hash).length) throw new Error('三把武器不能重复')
    if (importedWeaponEntities.filter(isExotic).length > 1) throw new Error('最多导入一把异域武器')

    const importedArmor = Object.fromEntries(armorSlots.map(slot => [slot, data.armor?.[slot]?.manifestHash || '']))
    const importedArmorEntities = []
    for (const [slot, hash] of Object.entries(importedArmor)) {
      if (!hash) continue
      const entity = equipmentItems.value.find(item => String(item.hash) === String(hash))
      if (!entity || entity.itemType !== 2) throw new Error(`${armorLabels[slot]} 不在当前护甲 Manifest 中`)
      if (entity.classId !== data.classId || entity.armorSlot !== slot) throw new Error(`${label(entity)} 的职业或护甲栏位不匹配`)
      importedArmorEntities.push(entity)
    }
    if (importedArmorEntities.filter(isExotic).length > 1) throw new Error('异域护甲最多导入 1 件')

    const importedMods = {}
    for (const slot of armorSlots) {
      const rows = data.mods?.[slot] || []
      if (!Array.isArray(rows) || rows.length > 4) throw new Error(`${armorLabels[slot]} 最多导入四个模组`)
      importedMods[slot] = rows.map(item => Number(item?.manifestHash)).filter(Boolean)
      const entities = importedMods[slot].map(hash => manifestMods.value.find(mod => Number(mod.hash) === hash))
      if (entities.some(item => !item)) throw new Error(`${armorLabels[slot]} 包含当前 Manifest 不存在的模组`)
      if (entities.some(item => item.slot !== 'any' && item.slot !== slot)) throw new Error(`${armorLabels[slot]} 包含不属于该部位的模组`)
      if (entities.reduce((sum, item) => sum + Number(item.energyCost || 0), 0) > 10) throw new Error(`${armorLabels[slot]} 模组能量超过 10`)
    }
    const importedArtifactNodes = Array.isArray(data.artifactNodeHashes) ? data.artifactNodeHashes.map(Number) : []
    if (importedArtifactNodes.length > 12 || importedArtifactNodes.some(hash => !allNodes.value.some(node => Number(node.hash) === hash))) throw new Error('神器节点数量或 Manifest 实体不正确')

    classId.value = data.classId
    subclassId.value = data.subclassId
    buildName.value = data.name || '我的手动配装'
    selected.value = {
      superId: importedAbilities.superId || '',
      classAbilityId: importedAbilities.classAbilityId || '',
      meleeId: importedAbilities.meleeId || '',
      grenadeId: importedAbilities.grenadeId || '',
      aspectIds: importedAspects,
      facetIds: importedFacets,
      fragmentIds: importedFragments,
      weapons: importedWeapons,
      armor: importedArmor,
      mods: importedMods,
      artifactNodeHashes: importedArtifactNodes
    }
    importError.value = ''
    statusMessage.value = '已导入配装代码，所有栏位已按当前 Manifest 恢复。'
    transferOpen.value = false
  } catch (error) {
    importError.value = `导入失败：${error.message}`
  }
}
function clearAll() {
  selected.value = {
    superId: '', classAbilityId: '', meleeId: '', grenadeId: '',
    aspectIds: [], facetIds: [], fragmentIds: [],
    weapons: emptyWeaponRows(), armor: emptyArmor(), mods: emptyMods(), artifactNodeHashes: []
  }
  statusMessage.value = '已清空所有配装栏位。'
}

watch(pickerSearch, () => { pickerPage.value = 1 })
watch(classId, () => {
  if (!classSubclasses.value.some(item => item.id === subclassId.value)) subclassId.value = classSubclasses.value[0]?.id || ''
})
</script>

<template>
  <div class="manual-page">
    <h1 class="visually-hidden">手动配装</h1>
    <header class="command-bar" aria-label="配装工具栏">
      <div class="command-fields">
        <div class="field build-field">
          <label>构筑名称</label>
          <a-input v-model:value="buildName" :maxlength="40" />
        </div>
        <div class="field class-field">
          <label>职业</label>
          <a-radio-group v-model:value="classId" button-style="solid">
            <a-radio-button v-for="item in classes" :key="item.id" :value="item.id" @click="setClass(item.id)">{{ item.name }}</a-radio-button>
          </a-radio-group>
        </div>
        <div class="field subclass-field">
          <label>子职业</label>
          <a-select v-model:value="subclassId" @change="setSubclass">
            <a-select-option v-for="item in classSubclasses" :key="item.id" :value="item.id">{{ item.name }} / {{ item.en }}</a-select-option>
          </a-select>
        </div>
      </div>
      <div class="command-actions">
        <a-button @click="openTransfer('import')">导入</a-button>
        <a-button type="primary" :disabled="!isReady" @click="openTransfer('export')">导出</a-button>
        <a-popconfirm title="清空当前所有栏位？" ok-text="清空" cancel-text="取消" @confirm="clearAll">
          <a-button danger>清空</a-button>
        </a-popconfirm>
      </div>
    </header>

    <div v-if="statusMessage" class="page-status">{{ statusMessage }}</div>

    <main class="loadout-sheet">
      <header class="sheet-header">
        <div>
          <span>{{ subclass?.name }} / {{ subclass?.en }}</span>
          <h2>{{ buildName || '我的手动配装' }}</h2>
        </div>
        <div class="sheet-state" :class="{ ready: isReady }">
          <i></i>
          <span>{{ isReady ? '已完成' : `待补全 ${selectionChecks.length} 项` }}</span>
        </div>
      </header>

      <div class="sheet-grid">
        <section class="sheet-section talent-section">
          <div class="section-label"><b>01</b><span>天赋与技能<small>ABILITIES</small></span></div>
          <div class="ability-slot-grid">
            <button v-for="slot in abilitySlots" :key="slot.key" type="button" class="icon-slot ability-slot" :class="{ filled: abilityAt(slot.key) }" @click="openPicker('ability', { key: slot.key })">
              <img v-if="abilityAt(slot.key) && icon(abilityAt(slot.key))" :src="icon(abilityAt(slot.key))" :alt="`${label(abilityAt(slot.key))} / ${english(abilityAt(slot.key))}`" />
              <span v-else class="slot-plus">+</span>
              <strong>{{ abilityAt(slot.key) ? label(abilityAt(slot.key)) : slot.zh }}</strong>
              <small>{{ abilityAt(slot.key) ? english(abilityAt(slot.key)) : slot.en }}</small>
            </button>
          </div>

          <div class="subgroup-head"><span>星相 / Aspects</span><b>{{ selected.aspectIds.length }}/2</b></div>
          <div class="aspect-slots">
            <button v-for="index in 2" :key="`aspect-${index}`" type="button" class="wide-slot" :class="{ filled: aspectAt(index - 1) }" @click="openPicker('aspect')">
              <img v-if="aspectAt(index - 1) && icon(aspectAt(index - 1))" :src="icon(aspectAt(index - 1))" :alt="label(aspectAt(index - 1))" />
              <span v-else class="slot-plus">+</span>
              <span><strong>{{ aspectAt(index - 1) ? label(aspectAt(index - 1)) : `星相 ${index}` }}</strong><small>{{ aspectAt(index - 1) ? english(aspectAt(index - 1)) : 'Click to select' }}</small></span>
            </button>
          </div>

          <div class="subgroup-head"><span>{{ subclass?.type === 'prismatic' ? '棱镜特性 / Facets' : '元素碎片 / Fragments' }}</span><b>{{ selectedTraitIds.length }}/{{ traitLimit }}</b></div>
          <div class="trait-slots" :class="{ five: traitLimit === 5 }">
            <button v-for="index in traitLimit" :key="`trait-${index}`" type="button" class="mini-slot" :class="{ filled: traitAt(index - 1) }" @click="openPicker('trait')">
              <img v-if="traitAt(index - 1) && icon(traitAt(index - 1))" :src="icon(traitAt(index - 1))" :alt="label(traitAt(index - 1))" />
              <span v-else>+</span>
              <small>{{ traitAt(index - 1) ? label(traitAt(index - 1)) : index }}</small>
            </button>
          </div>
        </section>

        <section class="sheet-section weapon-section">
          <div class="section-label"><b>02</b><span>武器<small>WEAPONS</small></span></div>
          <article v-for="(row, index) in selected.weapons" :key="`weapon-${index}`" class="weapon-row" :class="{ exotic: isExotic(weaponAt(index)) }">
            <button type="button" class="weapon-main" @click="openPicker('weapon', { index })">
              <span class="slot-code">{{ ['K', 'E', 'P'][index] }}</span>
              <img v-if="weaponAt(index) && icon(weaponAt(index))" :src="icon(weaponAt(index))" :alt="`${label(weaponAt(index))} / ${english(weaponAt(index))}`" />
              <span v-else class="weapon-placeholder">+</span>
              <span class="weapon-copy">
                <strong>{{ weaponAt(index) ? label(weaponAt(index)) : weaponLabels[index].split(' / ')[0] }}</strong>
                <small>{{ weaponAt(index) ? `${english(weaponAt(index))} · ${weaponAt(index).weaponFamily || ''}` : 'Click to select' }}</small>
              </span>
            </button>
            <button type="button" class="perk-strip" :disabled="!weaponAt(index)" @click="openPicker('perk', { index })">
              <span v-for="perkIndex in 2" :key="perkIndex" class="perk-cell" :class="{ filled: selectedPerkAt(index, perkIndex - 1) }">
                <img v-if="selectedPerkAt(index, perkIndex - 1) && icon(selectedPerkAt(index, perkIndex - 1))" :src="icon(selectedPerkAt(index, perkIndex - 1))" :alt="label(selectedPerkAt(index, perkIndex - 1))" />
                <i v-else>+</i>
                <small>{{ selectedPerkAt(index, perkIndex - 1) ? label(selectedPerkAt(index, perkIndex - 1)) : `Perk ${perkIndex}` }}</small>
              </span>
            </button>
          </article>
        </section>

        <section class="sheet-section armor-section">
          <div class="section-label"><b>03</b><span>护甲与模组<small>ARMOR & MODS</small></span></div>
          <article v-for="slot in armorSlots" :key="slot" class="armor-row" :class="{ exotic: isExotic(armorAt(slot)) }">
            <button type="button" class="armor-main" @click="openPicker('armor', { key: slot })">
              <img v-if="armorAt(slot) && icon(armorAt(slot))" :src="icon(armorAt(slot))" :alt="`${label(armorAt(slot))} / ${english(armorAt(slot))}`" />
              <span v-else class="armor-placeholder">+</span>
              <span><strong>{{ armorAt(slot) ? label(armorAt(slot)) : armorLabels[slot].split(' / ')[0] }}</strong><small>{{ armorAt(slot) ? english(armorAt(slot)) : armorLabels[slot].split(' / ')[1] }}</small></span>
            </button>
            <button type="button" class="mod-strip" @click="openPicker('mod', { key: slot })">
              <span v-for="modIndex in 4" :key="modIndex" class="mod-cell" :class="{ filled: modAt(selected.mods[slot][modIndex - 1]) }">
                <img v-if="modAt(selected.mods[slot][modIndex - 1]) && icon(modAt(selected.mods[slot][modIndex - 1]))" :src="icon(modAt(selected.mods[slot][modIndex - 1]))" :alt="label(modAt(selected.mods[slot][modIndex - 1]))" />
                <i v-else>+</i>
              </span>
              <small>{{ modEnergy(slot) }}/10</small>
            </button>
          </article>
        </section>

        <section class="sheet-section utility-section">
          <div class="section-label"><b>04</b><span>神器<small>ARTIFACT</small></span></div>
          <button type="button" class="artifact-slot" @click="openPicker('artifact')">
            <span class="artifact-count"><b>{{ selected.artifactNodeHashes.length }}</b><small>/ 12</small></span>
            <span class="artifact-icons">
              <img v-for="hash in selected.artifactNodeHashes.slice(0, 12)" :key="hash" :src="icon(artifactNodeAt(hash))" :alt="label(artifactNodeAt(hash))" />
              <i v-if="!selected.artifactNodeHashes.length">+</i>
            </span>
            <strong>{{ artifact?.nameZh || artifact?.name || '赛季神器' }}</strong>
            <small>{{ artifact?.name || 'Seasonal Artifact' }}</small>
          </button>

          <div class="completion-block">
            <div><span>技能</span><b>{{ abilitySlots.filter(slot => selected[slot.key]).length }}/4</b></div>
            <div><span>武器</span><b>{{ selectedWeapons.length }}/3</b></div>
            <div><span>护甲</span><b>{{ armorSlots.filter(slot => selected.armor[slot]).length }}/5</b></div>
            <div><span>模组</span><b>{{ Object.values(selected.mods).flat().length }}</b></div>
          </div>
          <a-popover placement="leftTop" trigger="click">
            <template #content><div class="error-popover"><p v-for="error in selectionChecks" :key="error">{{ error }}</p><p v-if="!selectionChecks.length">当前配装已通过规则检查。</p></div></template>
            <a-button block>{{ isReady ? '查看校验结果' : `查看 ${selectionChecks.length} 项待补全` }}</a-button>
          </a-popover>
        </section>
      </div>
    </main>

    <a-modal v-model:open="pickerOpen" wrap-class-name="manual-picker-modal" :width="980" :footer="null" :destroy-on-close="false">
      <template #title>
        <div class="picker-title"><span>{{ pickerMeta.title }}</span><small>{{ pickerMeta.subtitle }}</small></div>
      </template>
      <div class="picker-toolbar">
        <a-input-search v-model:value="pickerSearch" allow-clear placeholder="搜索中文或英文名称" />
        <a-button v-if="pickerCanClear" @click="clearPickerSelection">移此栏</a-button>
      </div>
      <div v-if="pagedPickerItems.length" class="picker-grid">
        <button v-for="item in pagedPickerItems" :key="item.id || item.hash" type="button" class="picker-card" :class="{ selected: pickerItemSelected(item), exotic: isExotic(item) }" :disabled="Boolean(pickerDisabledReason(item))" :title="pickerDisabledReason(item)" @click="selectPickerItem(item)">
          <img v-if="icon(item)" :src="icon(item)" :alt="`${label(item)} / ${english(item)}`" />
          <span v-else class="picker-no-image">无官方图像</span>
          <span class="picker-card-copy">
            <strong>{{ label(item) }}</strong>
            <small>{{ english(item) }}</small>
            <em v-if="pickerKind === 'weapon'">{{ item.weaponFamily || item.equipmentSlotName }}</em>
            <em v-else-if="pickerKind === 'mod'">{{ item.energyCost }} 能量 · {{ item.slot }}</em>
            <em v-else-if="pickerKind === 'artifact'">Tier {{ item.tierIndex }}</em>
            <em v-else-if="item.descriptionZh || item.description">{{ item.descriptionZh || item.description }}</em>
          </span>
          <b v-if="pickerItemSelected(item)" class="selected-mark">已选</b>
        </button>
      </div>
      <a-empty v-else description="没有可选内容" />
      <footer class="picker-footer">
        <span>共 {{ filteredPickerItems.length }} 项</span>
        <a-pagination v-if="filteredPickerItems.length > pickerPageSize" v-model:current="pickerPage" :page-size="pickerPageSize" :total="filteredPickerItems.length" :show-size-changer="false" size="small" />
        <a-button v-if="pickerIsMulti" type="primary" @click="pickerOpen = false">完成</a-button>
      </footer>
    </a-modal>

    <a-modal v-model:open="transferOpen" wrap-class-name="transfer-modal" :title="transferMode === 'import' ? '导入配装' : '导出配装'" :footer="null" :width="680">
      <div class="transfer-head">
        <strong>{{ transferMode === 'import' ? '粘贴配装代码' : '保存或分享这段代码' }}</strong>
      </div>
      <a-textarea v-model:value="codeText" :readonly="transferMode === 'export'" :auto-size="{ minRows: 7, maxRows: 12 }" :placeholder="transferMode === 'import' ? '在此粘贴 d2hub-manual-loadout-v1 配装代码' : ''" />
      <a-alert v-if="importError" type="error" :message="importError" show-icon />
      <div class="transfer-actions">
        <a-button @click="transferOpen = false">取消</a-button>
        <a-button v-if="transferMode === 'import'" type="primary" :disabled="!codeText.trim()" @click="importCode">校验并导入</a-button>
        <a-button v-else type="primary" @click="copyCode">复制代码</a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.manual-page{padding:1rem 0 4rem;color:var(--text-main)}
.visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.command-bar{position:sticky;top:4.2rem;z-index:20;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.8rem;align-items:end;padding:.8rem .9rem;background:rgba(10,14,22,.96);border:1px solid var(--line-soft);box-shadow:0 16px 36px rgba(3,7,13,.3);backdrop-filter:blur(14px)}
.command-fields{display:grid;grid-template-columns:minmax(10rem,1fr) auto minmax(12rem,1fr);gap:.8rem;align-items:end}.field label{display:block;margin-bottom:.35rem;color:var(--text-dim);font-size:.58rem}.field .ant-select{width:100%}.class-field .ant-radio-group{display:flex}.class-field .ant-radio-button-wrapper{padding-inline:.65rem}.command-actions{display:flex;gap:.45rem}.page-status{margin:.65rem 0 0;padding:.55rem .75rem;color:var(--ok);font-size:.65rem;border-left:2px solid var(--ok);background:rgba(86,182,139,.07)}
.loadout-sheet{margin-top:1rem;border:1px solid var(--line-soft);background:#10141b;box-shadow:0 26px 70px rgba(2,6,12,.32)}.sheet-header{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.4rem;border-bottom:1px solid var(--line-soft);background:rgba(255,255,255,.018)}.sheet-header>div:first-child>span{color:var(--gold-dim);font-size:.62rem}.sheet-header h2{margin:.2rem 0 .05rem;font-size:1.35rem;line-height:1.2}.sheet-header small{color:var(--text-dim);font:.58rem var(--font-en)}.sheet-state{display:flex;align-items:center;gap:.45rem;color:var(--warn);font-size:.67rem}.sheet-state i{width:.48rem;height:.48rem;background:currentColor;box-shadow:0 0 0 4px rgba(255,180,84,.1)}.sheet-state.ready{color:var(--ok)}
.sheet-grid{display:grid;grid-template-columns:1.05fr 1.28fr 1.35fr .75fr;min-height:39rem}.sheet-section{min-width:0;padding:1.15rem;border-right:1px solid var(--line-soft)}.sheet-section:last-child{border-right:0}.section-label{display:flex;align-items:center;gap:.55rem;margin-bottom:1rem}.section-label>b{color:var(--gold);font:500 .62rem var(--font-en)}.section-label>span{font-size:.7rem;font-weight:600}.section-label small{display:block;margin-top:.1rem;color:var(--text-dim);font:.48rem var(--font-en)}
.ability-slot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.icon-slot,.wide-slot,.mini-slot,.weapon-main,.perk-strip,.armor-main,.mod-strip,.artifact-slot{border:1px solid rgba(255,255,255,.08);background:#161b23;color:var(--text-sub);cursor:pointer;transition:border-color .2s,background .2s,transform .2s}.icon-slot:hover,.wide-slot:hover,.mini-slot:hover,.weapon-main:hover,.perk-strip:hover,.armor-main:hover,.mod-strip:hover,.artifact-slot:hover{border-color:var(--gold-dim);background:#1a2029}.icon-slot:active,.wide-slot:active,.mini-slot:active,.weapon-main:active,.perk-strip:active,.armor-main:active,.mod-strip:active,.artifact-slot:active{transform:translateY(1px)}.icon-slot:focus-visible,.wide-slot:focus-visible,.mini-slot:focus-visible,.weapon-main:focus-visible,.perk-strip:focus-visible,.armor-main:focus-visible,.mod-strip:focus-visible,.artifact-slot:focus-visible,.picker-card:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.ability-slot{min-height:8.4rem;padding:.5rem;text-align:left}.ability-slot img{display:block;width:100%;aspect-ratio:1.55;object-fit:cover;margin-bottom:.45rem;background:#090c11}.ability-slot strong,.ability-slot small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ability-slot strong{font-size:.66rem;color:var(--text-main)}.ability-slot small{margin-top:.12rem;color:var(--text-dim);font-size:.5rem}.slot-plus{display:grid;place-items:center;width:100%;aspect-ratio:1.55;margin-bottom:.45rem;color:var(--text-dim);font:300 1.5rem var(--font-en);border:1px dashed rgba(255,255,255,.12)}.filled{border-color:rgba(232,193,90,.24)}
.subgroup-head{display:flex;justify-content:space-between;align-items:center;margin:1rem 0 .45rem;color:var(--gold-dim);font-size:.58rem}.subgroup-head b{color:var(--text-dim);font:500 .55rem var(--font-en)}.aspect-slots{display:grid;gap:.4rem}.wide-slot{display:grid;grid-template-columns:2.65rem 1fr;gap:.55rem;align-items:center;padding:.38rem;text-align:left}.wide-slot img,.wide-slot>.slot-plus{width:2.65rem;height:2.65rem;aspect-ratio:1;object-fit:cover;margin:0}.wide-slot strong,.wide-slot small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wide-slot strong{color:var(--text-main);font-size:.61rem}.wide-slot small{margin-top:.12rem;color:var(--text-dim);font-size:.48rem}.trait-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.35rem}.trait-slots.five{grid-template-columns:repeat(5,minmax(0,1fr))}.mini-slot{min-width:0;padding:.3rem;text-align:center}.mini-slot img{display:block;width:100%;aspect-ratio:1;object-fit:cover}.mini-slot>span{display:grid;place-items:center;width:100%;aspect-ratio:1;color:var(--text-dim);font:300 1rem var(--font-en);border:1px dashed rgba(255,255,255,.1)}.mini-slot small{display:block;margin-top:.22rem;overflow:hidden;color:var(--text-dim);font-size:.44rem;text-overflow:ellipsis;white-space:nowrap}
.weapon-section,.armor-section{background:rgba(255,255,255,.01)}.weapon-row{margin-bottom:.7rem;border:1px solid rgba(255,255,255,.07);background:#131820}.weapon-row.exotic,.armor-row.exotic{border-color:rgba(232,193,90,.45);background:rgba(232,193,90,.045)}.weapon-main{display:grid;grid-template-columns:1.2rem 4.3rem 1fr;gap:.6rem;align-items:center;width:100%;padding:.55rem;border:0;border-bottom:1px solid rgba(255,255,255,.06);text-align:left}.slot-code{color:var(--gold);font:600 .58rem var(--font-en)}.weapon-main img,.weapon-placeholder{width:4.3rem;height:4.3rem;object-fit:cover;background:#090c11}.weapon-placeholder{display:grid;place-items:center;color:var(--text-dim);font:300 1.4rem var(--font-en);border:1px dashed rgba(255,255,255,.12)}.weapon-copy{min-width:0}.weapon-copy strong,.weapon-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.weapon-copy strong{color:var(--text-main);font-size:.68rem}.weapon-copy small{margin-top:.22rem;color:var(--text-dim);font-size:.5rem}.perk-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem;width:100%;padding:.45rem;border:0}.perk-strip:disabled{cursor:not-allowed;opacity:.45}.perk-cell{display:grid;grid-template-columns:1.7rem 1fr;gap:.35rem;align-items:center;min-width:0;padding:.25rem;background:rgba(255,255,255,.025)}.perk-cell img,.perk-cell i{width:1.7rem;height:1.7rem;object-fit:cover}.perk-cell i{display:grid;place-items:center;color:var(--text-dim);font-style:normal;border:1px dashed rgba(255,255,255,.12)}.perk-cell small{overflow:hidden;color:var(--text-dim);font-size:.45rem;text-overflow:ellipsis;white-space:nowrap}
.armor-row{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(8.6rem,.85fr);margin-bottom:.5rem;border:1px solid rgba(255,255,255,.07);background:#131820}.armor-main{display:grid;grid-template-columns:3.2rem 1fr;gap:.5rem;align-items:center;padding:.4rem;border:0;border-right:1px solid rgba(255,255,255,.06);text-align:left}.armor-main img,.armor-placeholder{width:3.2rem;height:3.2rem;object-fit:cover;background:#090c11}.armor-placeholder{display:grid;place-items:center;color:var(--text-dim);font:300 1.2rem var(--font-en);border:1px dashed rgba(255,255,255,.12)}.armor-main strong,.armor-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.armor-main strong{color:var(--text-main);font-size:.62rem}.armor-main small{margin-top:.15rem;color:var(--text-dim);font-size:.47rem}.mod-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.22rem;align-content:center;padding:.38rem;border:0}.mod-cell{min-width:0}.mod-cell img,.mod-cell i{display:grid;place-items:center;width:100%;aspect-ratio:1;object-fit:cover}.mod-cell i{color:var(--text-dim);font-size:.65rem;font-style:normal;border:1px dashed rgba(255,255,255,.1)}.mod-strip>small{grid-column:1/-1;color:var(--text-dim);font:.44rem var(--font-en);text-align:right}
.utility-section{display:flex;flex-direction:column}.artifact-slot{display:block;width:100%;padding:.7rem;text-align:left}.artifact-count{display:flex;align-items:baseline;gap:.25rem;margin-bottom:.6rem}.artifact-count b{color:var(--gold-bright);font:600 1.8rem var(--font-en)}.artifact-count small{color:var(--text-dim);font:.58rem var(--font-en)}.artifact-icons{display:grid;grid-template-columns:repeat(4,1fr);gap:.22rem;min-height:5rem;margin-bottom:.65rem}.artifact-icons img{width:100%;aspect-ratio:1;object-fit:cover}.artifact-icons i{grid-column:1/-1;display:grid;place-items:center;color:var(--text-dim);font:300 1.5rem var(--font-en);font-style:normal;border:1px dashed rgba(255,255,255,.12)}.artifact-slot>strong,.artifact-slot>small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.artifact-slot>strong{color:var(--text-main);font-size:.64rem}.artifact-slot>small{margin-top:.15rem;color:var(--text-dim);font-size:.48rem}.completion-block{display:grid;gap:.45rem;margin:auto 0 1rem;padding-top:1rem;border-top:1px solid var(--line-soft)}.completion-block div{display:flex;justify-content:space-between;color:var(--text-dim);font-size:.56rem}.completion-block b{color:var(--text-main);font:600 .57rem var(--font-en);font-variant-numeric:tabular-nums}.error-popover{max-width:22rem}.error-popover p{margin:.25rem 0;color:var(--text-sub);font-size:.64rem}
.picker-title span,.picker-title small{display:block}.picker-title span{font-weight:600}.picker-title small{margin-top:.15rem;color:rgba(255,255,255,.45);font-size:.62rem;font-weight:400}.picker-toolbar{display:grid;grid-template-columns:1fr auto;gap:.6rem;margin-bottom:.8rem}.picker-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.5rem;max-height:31rem;padding:.1rem .15rem .2rem;overflow:auto}.picker-card{position:relative;min-width:0;padding:.38rem;border:1px solid rgba(255,255,255,.09);background:#151a22;color:var(--text-sub);cursor:pointer;text-align:left;transition:border-color .2s,background .2s,transform .2s}.picker-card:hover{border-color:var(--gold-dim);transform:translateY(-1px)}.picker-card.selected{border-color:var(--gold);background:rgba(232,193,90,.09)}.picker-card.exotic{box-shadow:inset 0 2px 0 rgba(232,193,90,.65)}.picker-card:disabled{cursor:not-allowed;filter:saturate(.25);opacity:.38;transform:none}.picker-card>img,.picker-no-image{display:grid;place-items:center;width:100%;aspect-ratio:1.25;object-fit:cover;margin-bottom:.4rem;background:#090c11}.picker-no-image{color:var(--text-dim);font-size:.5rem;border:1px dashed rgba(255,255,255,.12)}.picker-card-copy strong,.picker-card-copy small,.picker-card-copy em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.picker-card-copy strong{color:var(--text-main);font-size:.6rem}.picker-card-copy small{margin-top:.14rem;color:var(--text-dim);font-size:.46rem}.picker-card-copy em{margin-top:.3rem;color:var(--gold-dim);font-size:.45rem;font-style:normal}.selected-mark{position:absolute;top:.28rem;right:.28rem;padding:.16rem .28rem;background:var(--gold);color:#17130a;font-size:.43rem}.picker-footer{display:grid;grid-template-columns:1fr auto auto;gap:.8rem;align-items:center;margin-top:.85rem;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.08)}.picker-footer>span{color:var(--text-dim);font-size:.58rem}.transfer-head{display:flex;justify-content:space-between;margin-bottom:.75rem;color:var(--text-sub);font-size:.68rem}.transfer-head span{color:var(--text-dim);font:500 .55rem var(--font-en)}.transfer-modal :deep(textarea){font:500 .62rem/1.6 var(--font-en)}.transfer-modal :deep(.ant-alert){margin-top:.7rem}.transfer-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}
@media(max-width:1180px){.command-bar{position:static;grid-template-columns:1fr auto;align-items:start}.command-fields{grid-column:1/-1;grid-row:2}.sheet-grid{grid-template-columns:1fr 1.2fr}.sheet-section:nth-child(2){border-right:0}.sheet-section:nth-child(n+3){border-top:1px solid var(--line-soft)}.utility-section{min-height:25rem}.picker-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:760px){.command-bar{display:block}.command-fields{grid-template-columns:1fr;margin-top:1rem}.command-actions{margin-top:.8rem}.sheet-header{align-items:flex-start;gap:1rem}.sheet-grid{grid-template-columns:1fr}.sheet-section{border-right:0;border-top:1px solid var(--line-soft)}.sheet-section:first-child{border-top:0}.utility-section{min-height:0}.picker-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:480px){.manual-page{padding-top:.65rem}.command-actions .ant-btn{flex:1}.ability-slot-grid{grid-template-columns:1fr 1fr}.armor-row{grid-template-columns:1fr}.armor-main{border-right:0;border-bottom:1px solid rgba(255,255,255,.06)}.picker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.picker-footer{grid-template-columns:1fr auto}.picker-footer .ant-pagination{grid-column:1/-1;grid-row:2}.sheet-header h2{font-size:1.05rem}}
</style>
