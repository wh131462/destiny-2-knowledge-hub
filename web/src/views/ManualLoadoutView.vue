<script setup>
import CommunitySubmission from '@/components/CommunitySubmission.vue'
import CommunityPublishGuide from '@/components/CommunityPublishGuide.vue'
import { usePublicBuilds } from '@/composables/usePublicBuilds'
import { parseSubmission, assertSubmission, issueUrl } from '../../../packages/community-builds/index.js'
import EntityLink from '@/components/EntityLink.vue'
import { computed, ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { abilities, aspects, facets, fragments, subclasses, classById, buildById, elements, activitiesV2 } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import StatRecommendations from '@/components/StatRecommendations.vue'
import WeaponPerkCombinations from '@/components/WeaponPerkCombinations.vue'
import { blankDraft, armorLabels, weaponSlots, emptyWeapon, armorSockets, assignArtifactNodes, switchArtifact, fragmentCapacity, aspectDefinition, encodeDraft, decodeDraft } from '../../../packages/loadout-planner/index.js'
import { validateLoadout } from '../../../packages/loadout-planner/validation.js'
import { curatedDraft } from '@/utils/curatedDraft'
import LoadoutTile from '@/components/LoadoutTile.vue'
import ClassEmblem from '@/components/ClassEmblem.vue'
import { useLoadoutVisuals } from '@/composables/useLoadoutVisuals'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import LoadoutImageExport from '@/components/LoadoutImageExport.vue'
import { createLoadoutExportModel } from '@/utils/loadoutExportModel'

const manifest = useManifestAssets()
const { equipmentItems, weaponItems, manifestMods, artifacts, manifestAbilities, itemSets, plugSets, snapshot, status } = manifest
const draft = ref(blankDraft())
const armorTransfer = ref(null), armorTransferOpen = ref(false)
const route = useRoute()
const community = usePublicBuilds()
const submissionOpen = ref(false), submissionOrigin = ref(null), submissionMetadata = ref(null), communityImportError = ref('')
const sourceWarning = computed(() => {
  if (!submissionOrigin.value) return ''
  const latest = community.snapshot.value?.builds.find(b => b.number === submissionOrigin.value.number)
  if (community.error.value) return '无法核对投稿最新状态，请在 GitHub 检查原稿后再提交。'
  if (!latest) return '原投稿已不在公开快照中，请在 GitHub 检查下架、屏蔽或校验状态。'
  return latest.updatedAt !== submissionOrigin.value.updatedAt ? '原投稿在你开始编辑后有更新，请核对 GitHub 最新正文，避免覆盖他人的修改。' : ''
})
function openSubmission() { submissionOpen.value = true; if (submissionOrigin.value) community.refresh() }
function resetCommunitySource() { submissionOrigin.value = null; submissionMetadata.value = null }

const message = ref(''), transferOpen = ref(false), transferMode = ref('export'), code = ref(''), transferError = ref('')
const picker = ref(null), search = ref(''), page = ref(1), preview = ref(null)
const imageExportOpen = ref(false), imageExportModel = shallowRef(null), imageExportLoading = ref(false), imageExportError = ref('')
const exportPerks = useWeaponPerks()
let imageExportRequest = 0
const label = item => item?.nameZh || item?.name || '未选择'
const entity = hash => equipmentItems.value.find(i => Number(i.hash) === Number(hash))
const weapon = i => entity(draft.value.weapons[i].manifestHash)
const armor = slot => entity(draft.value.armor[slot]?.manifestHash)
const mod = hash => manifestMods.value.find(i => Number(i.hash) === Number(hash))
const subclass = computed(() => subclasses.find(i => i.id === draft.value.subclassId))
const { visualIcon, visualDescription } = useLoadoutVisuals(manifest, subclass)
const english = item => item?.en || (item?.nameZh ? item.name : '') || ''
const accent = computed(() => elements[subclass.value?.element]?.color || 'var(--gold)')
const abilityAt = key => abilities.find(a => a.id === draft.value.abilities[key])
const traitAt = index => traitPool.value.find(a => a.id === draft.value.abilities[traitKey.value][index])
const classSubclasses = computed(() => subclasses.filter(i => i.classId === draft.value.classId))
const abilitySlots = [{ key: 'superId', pool: 'superIds', label: '超能' }, { key: 'classAbilityId', pool: 'classAbilityIds', label: '职业技能' }, { key: 'movementId', pool: 'movementIds', label: '跳跃' }, { key: 'meleeId', pool: 'meleeIds', label: '近战' }, { key: 'grenadeId', pool: 'grenadeIds', label: '手雷' }]
const abilityPool = slot => abilities.filter(a => subclass.value?.[slot.pool]?.includes(a.id))
const intrinsicAbilities = computed(() => abilities.filter(a => [...(subclass.value?.transcendenceIds || []), ...(subclass.value?.transcendenceGrenadeIds || [])].includes(a.id)))
const aspectPool = computed(() => aspects.filter(a => subclass.value?.aspectIds?.includes(a.id)))
const chosenAspects = computed(() => draft.value.abilities.aspectIds.map(id => aspects.find(a => a.id === id)).filter(Boolean))
const capacity = computed(() => chosenAspects.value.length === 2 ? fragmentCapacity(chosenAspects.value, subclass.value, manifestAbilities.value) : null)
const traitKey = computed(() => subclass.value?.type === 'prismatic' ? 'facetIds' : 'fragmentIds')
const traitPool = computed(() => (subclass.value?.type === 'prismatic' ? facets : fragments).filter(a => subclass.value?.[traitKey.value]?.includes(a.id)))
const artifact = computed(() => artifacts.value.find(a => Number(a.hash) === Number(draft.value.artifactHash)))
const artifactRows = computed(() => draft.value.artifactAssignments.length ? draft.value.artifactAssignments : assignArtifactNodes(artifact.value, draft.value.artifactNodeHashes) || [])
const nodeAt = index => artifact.value?.nodes.find(n => n.hash === artifactRows.value.find(a => a.socketIndex === index)?.nodeHash)
function assignNode(index, hash) {
  draft.value.artifactAssignments = artifactRows.value.filter(a => a.socketIndex !== index)
  if (hash) draft.value.artifactAssignments.push({ socketIndex: index, nodeHash: hash })
  draft.value.artifactNodeHashes = draft.value.artifactAssignments.map(a => a.nodeHash)
}
const ghostOptions = computed(() => manifestMods.value.filter(m => m.category === 'enhancements.ghosts_economic' && / Armorer$/.test(m.name)))
const ghost = computed(() => ghostOptions.value.find(m => Number(m.hash) === Number(draft.value.ghostArmorerHash)))
const sockets = slot => armorSockets(armor(slot), manifestMods.value, plugSets.value)
const assigned = (slot, index) => draft.value.mods[slot].find(m => m.socketIndex === index)?.manifestHash
const energy = slot => draft.value.mods[slot].reduce((total, row) => total + (mod(row.manifestHash)?.energyCost ?? 0), 0)
const description = item => item?.descriptionZh || item?.description || item?.perkDetails?.map(p => p.descriptionZh || p.description).filter(Boolean).join('\n') || ''
const exotic = item => item?.tierTypeHash === 2759499571
const setEffects = computed(() => itemSets.value.map(set => {
  const count = Object.keys(armorLabels).filter(slot => set.itemHashes?.includes(Number(draft.value.armor[slot]?.manifestHash))).length
  return { ...set, count }
}).filter(set => set.count && set.perks?.length))

const knowledgeGroups = computed(() => [
  { label: '天赋与技能', kind: 'abilities', items: [...abilitySlots.map(slot => abilityAt(slot.key)), ...chosenAspects.value, ...draft.value.abilities[traitKey.value].map((_, i) => traitAt(i)), ...intrinsicAbilities.value].filter(Boolean) },
  { label: '武器与护甲', kind: 'equipment', items: [...draft.value.weapons.map((_, i) => weapon(i)), ...Object.keys(armorLabels).map(armor)].filter(Boolean) },
  { label: '模组与神器', kind: 'items', items: [...Object.values(draft.value.mods).flat().map(m => mod(m.manifestHash)), artifact.value, ...artifactRows.value.map(row => nodeAt(row.socketIndex)), ghost.value].filter(Boolean) }
].map(group => ({ ...group, items: [...new Map(group.items.map(item => [item.id || item.hash, item])).values()] })).filter(group => group.items.length))

const validationContext = computed(() => ({
  subclasses, abilities, aspects, facets, fragments, activities: activitiesV2,
  equipment: equipmentItems.value, mods: manifestMods.value, artifacts: artifacts.value,
  manifestAbilities: manifestAbilities.value, plugSets: plugSets.value, manifestVersion: snapshot.value.manifestVersion
}))
const issues = computed(() => status.value === 'ready' ? validateLoadout(draft.value, validationContext.value) : [])

function applyArmorTransfer() {
  const transfer = armorTransfer.value
  if (!transfer) return
  if (transfer.classId !== draft.value.classId) changeClass(transfer.classId)
  for (const slot of Object.keys(armorLabels)) selectArmor(slot, transfer.armor?.[slot] || null)
  armorTransferOpen.value = false; armorTransfer.value = null
  message.value = `已带入${transfer.setName || '套装'}${transfer.exoticName ? `（异域：${transfer.exoticName}）` : ''}，并覆盖原防具配置。`
}
function cancelArmorTransfer() { armorTransferOpen.value = false; armorTransfer.value = null }
function changeClass(id) {
  if (id === draft.value.classId) return
  draft.value.classId = id
  draft.value.subclassId = classSubclasses.value[0]?.id || ''
  draft.value.armor = blankDraft().armor; draft.value.mods = blankDraft().mods
  draft.value.abilities = blankDraft().abilities
}
function changeSubclass(id) {
  if (id === draft.value.subclassId) return
  draft.value.subclassId = id
  draft.value.abilities = blankDraft().abilities
}
function selectArmor(slot, hash) {
  draft.value.armor[slot] = hash ? { manifestHash: Number(hash) } : null
  draft.value.mods[slot] = []
}
function selectWeapon(index, hash) { draft.value.weapons[index] = emptyWeapon(hash ? Number(hash) : null) }
function assignMod(slot, socketIndex, hash) {
  draft.value.mods[slot] = draft.value.mods[slot].filter(m => m.socketIndex !== socketIndex)
  if (hash) draft.value.mods[slot].push({ socketIndex, manifestHash: Number(hash) })
}
function openPicker(kind, key, socketIndex) {
  picker.value = { kind, key, socketIndex }; search.value = ''; page.value = 1; preview.value = null
}
const pickerPool = computed(() => {
  if (!picker.value) return []
  const { kind, key, socketIndex } = picker.value
  if (kind === 'weapon') return weaponItems.value.filter(i => i.ammoSlot === weaponSlots[key])
  if (kind === 'armor') return equipmentItems.value.filter(i => i.itemType === 2 && i.classId === draft.value.classId && i.armorSlot === key)
  if (kind === 'ability') return abilityPool(abilitySlots.find(s => s.key === key))
  if (kind === 'aspect') return aspectPool.value
  if (kind === 'trait') return traitPool.value
  if (kind === 'mod') return sockets(key).find(s => s.index === socketIndex)?.options || []
  if (kind === 'artifact') return artifacts.value.filter(a => a.selectable)
  if (kind === 'artifactNode') return artifact.value?.nodes.filter(n => artifact.value.sockets.find(s => s.socketIndex === socketIndex)?.nodeHashes.includes(n.hash)) || []
  if (kind === 'ghost') return ghostOptions.value
  return []
})
const pickerItems = computed(() => {
  return pickerPool.value.filter(i => `${i.name} ${i.nameZh || ''} ${i.en || ''} ${i.hash || ''} ${i.weaponFamily || ''}`.toLowerCase().includes(search.value.trim().toLowerCase()))
})
const pickerPageSize = 24
const pickerPage = computed(() => pickerItems.value.slice((page.value - 1) * pickerPageSize, page.value * pickerPageSize))
const multiPick = computed(() => ['aspect', 'trait'].includes(picker.value?.kind))
const pickerTitle = computed(() => {
  const p = picker.value
  if (!p) return ''
  return { weapon: `选择${['动能栏位', '能量栏位', '威能栏位'][p.key] || '武器'}`, armor: `选择${armorLabels[p.key] || '护甲'}`,
    ability: `选择${abilitySlots.find(s => s.key === p.key)?.label || '技能'}`, aspect: '选择星相', trait: subclass.value?.type === 'prismatic' ? '选择棱镜特性' : '选择元素碎片',
    mod: `${armorLabels[p.key] || ''} 模组插槽 ${(p.socketIndex ?? 0) + 1}`, artifact: '选择神器', artifactNode: `神器插槽 ${(p.socketIndex ?? 0) + 1} 选择节点`, ghost: '选择机灵护甲商' }[p.kind]
})
function itemSelected(item) {
  if (!picker.value || !item) return false
  const { kind, key, socketIndex } = picker.value, d = draft.value
  if (kind === 'ability') return d.abilities[key] === item.id
  if (kind === 'aspect') return d.abilities.aspectIds.includes(item.id)
  if (kind === 'trait') return d.abilities[traitKey.value].includes(item.id)
  if (kind === 'artifactNode') return nodeAt(socketIndex)?.hash === item.hash
  const hash = kind === 'weapon' ? d.weapons[key].manifestHash : kind === 'armor' ? d.armor[key]?.manifestHash : kind === 'mod' ? assigned(key, socketIndex) : kind === 'artifact' ? d.artifactHash : d.ghostArmorerHash
  return Number(hash) === Number(item.hash)
}
const pickerSelected = computed(() => pickerPool.value.filter(itemSelected))
const pickerLimit = computed(() => picker.value?.kind === 'aspect' ? 2 : picker.value?.kind === 'trait' ? capacity.value : 1)
const previewItem = computed(() => pickerPage.value.includes(preview.value) ? preview.value : pickerPage.value.find(itemSelected) || pickerPage.value[0])
function disabledReason(item) {
  if (status.value !== 'ready') return '装备数据加载中'
  if (!picker.value || itemSelected(item)) return ''
  const { kind, key } = picker.value, d = draft.value
  if (kind === 'artifactNode' && artifactRows.value.some(a => a.socketIndex !== picker.value.socketIndex && a.nodeHash === item.hash)) return '此节点已配置到另一插槽，不能重复'
  if (kind === 'aspect' && d.abilities.aspectIds.length >= 2) return '已选 2 个星相，先取消一个再替换'
  if (kind === 'trait') {
    if (capacity.value == null) return '请先选择两个星相'
    if (d.abilities[traitKey.value].length >= capacity.value) return `已达 ${capacity.value} 个碎片插槽上限`
  }
  if (kind === 'weapon' && exotic(item) && d.weapons.some((w, i) => i !== key && exotic(weapon(i)))) return '已有另一把异域武器'
  if (kind === 'armor' && exotic(item) && Object.keys(armorLabels).some(s => s !== key && exotic(armor(s)))) return '已有另一件异域护甲'
  if (kind === 'mod') {
    const oldCost = mod(assigned(key, picker.value.socketIndex))?.energyCost || 0
    if (energy(key) - oldCost + item.energyCost > 10) return '替换后超过 10 点规划能量'
  }
  return ''
}
function pickerBadge(item) {
  if (disabledReason(item)) return disabledReason(item)
  if (picker.value?.kind === 'aspect') return `提供 ${aspectDefinition(item, subclass.value, manifestAbilities.value)?.fragmentSlots ?? '?'} 个碎片槽`
  if (Number.isFinite(item?.energyCost)) return `${item.energyCost} 点能量${itemSelected(item) ? ' 已选' : ''}`
  return [itemSelected(item) ? '已选' : '', item?.hash ? `#${item.hash}` : ''].filter(Boolean).join(' ')
}
function clearChoice() {
  const { kind, key, socketIndex } = picker.value
  if (kind === 'ability') draft.value.abilities[key] = ''
  else if (kind === 'aspect') draft.value.abilities.aspectIds = []
  else if (kind === 'trait') draft.value.abilities[traitKey.value] = []
  else if (kind === 'weapon') selectWeapon(key, null)
  else if (kind === 'armor') selectArmor(key, null)
  else if (kind === 'mod') assignMod(key, socketIndex, null)
  else if (kind === 'artifact') switchArtifact(draft.value, null)
  else if (kind === 'artifactNode') assignNode(socketIndex, null)
  else if (kind === 'ghost') draft.value.ghostArmorerHash = null
  if (!multiPick.value) picker.value = null
}
function pick(item) {
  if (disabledReason(item)) return
  const { kind, key, socketIndex } = picker.value
  if (multiPick.value) {
    const ids = draft.value.abilities[kind === 'aspect' ? 'aspectIds' : traitKey.value]
    const at = ids.indexOf(item.id)
    if (at >= 0) ids.splice(at, 1)
    else ids.push(item.id)
    preview.value = item
    return
  }
  // Reopening a selected card must not erase its perks, mods or artifact nodes.
  if (!itemSelected(item)) {
    if (kind === 'weapon') selectWeapon(key, item.hash)
    else if (kind === 'armor') selectArmor(key, item.hash)
    else if (kind === 'ability') draft.value.abilities[key] = item.id
    else if (kind === 'mod') assignMod(key, socketIndex, item.hash)
    else if (kind === 'artifact') switchArtifact(draft.value, item.hash)
    else if (kind === 'artifactNode') assignNode(socketIndex, item.hash)
    else if (kind === 'ghost') draft.value.ghostArmorerHash = item.hash
  }
  picker.value = null
}
function transfer(mode) { transferMode.value = mode; code.value = mode === 'export' ? encodeDraft(draft.value) : ''; transferError.value = ''; transferOpen.value = true }
function importCode() {
  try {
    let input = code.value
    let metadata = null
    if (input.includes('```json')) { metadata = parseSubmission(input); input = JSON.stringify(metadata.loadout) }
    else if (input.trim().startsWith('{')) {
      const parsed = JSON.parse(input)
      if (parsed.schema === 'd2hub-community-build-v1') { metadata = assertSubmission(parsed); input = JSON.stringify(metadata.loadout) }
    }
    const next = decodeDraft(input, { artifacts: artifacts.value, equipment: equipmentItems.value, mods: manifestMods.value, plugSets: plugSets.value })
    if (!classById[next.classId] || !subclasses.some(s => s.id === next.subclassId && s.classId === next.classId)) throw new Error('职业与子职业不匹配')
    draft.value = next; resetCommunitySource(); if (metadata) submissionMetadata.value = metadata; transferOpen.value = false; message.value = '已导入推荐草稿。请查看配置提示；跨版本数据会保留，不会自动认证为可装备。'
  } catch (e) { transferError.value = e.message }
}
async function copy() {
  try { await navigator.clipboard.writeText(code.value); message.value = '配装代码已复制，包含目标、备选词条和全部备注。' }
  catch { transferError.value = '无法访问剪贴板，请手动复制。' }
}
function save() {
  try { localStorage.setItem('d2hub-recommendation-draft-v3', encodeDraft(draft.value)); message.value = '推荐草稿已保存在此浏览器，包含各个 Perk 组合。' }
  catch { message.value = '本地保存失败，请导出配装代码备份。' }
}
function restore() {
  try { const saved = localStorage.getItem('d2hub-recommendation-draft-v3') || localStorage.getItem('d2hub-recommendation-draft-v2'); if (!saved) { message.value = '此浏览器没有已保存的推荐草稿。'; return }; code.value = saved; importCode() }
  catch { message.value = '无法读取本地草稿，请使用导入功能。' }
}
async function exportImage() {
  const request = ++imageExportRequest
  imageExportOpen.value = true; imageExportLoading.value = true; imageExportModel.value = null; imageExportError.value = ''
  try {
    await exportPerks.load()
    if (request !== imageExportRequest || !imageExportOpen.value) return
    const perksReady = exportPerks.state.value === 'ready' && exportPerks.version.value === snapshot.value.manifestVersion
    const model = createLoadoutExportModel(draft.value, {
      equipment: equipmentItems.value, mods: manifestMods.value, artifacts: artifacts.value, itemSets: itemSets.value,
      subclasses, abilities, aspects, facets, fragments, classes: classById, snapshot: snapshot.value,
      perkByHash: perksReady ? exportPerks.byHash.value : new Map(), iconFor: visualIcon, descriptionFor: visualDescription,
      issues: issues.value
    })
    if (!perksReady) model.warnings.push('Perk 图标数据未就绪或版本不一致，已保留原推荐文字与 Hash，请核对。')
    imageExportModel.value = model
  } catch (e) { if (request === imageExportRequest) imageExportError.value = e.message || '准备一图流失败，请重试。' }
  finally { if (request === imageExportRequest) imageExportLoading.value = false }
}
function closeImageExport() { imageExportRequest++; imageExportOpen.value = false; imageExportLoading.value = false }
onBeforeUnmount(() => { imageExportRequest++ })
let initialCopied = false
watch(status, state => {
  if (state !== 'ready' || initialCopied) return
  initialCopied = true
  const build = buildById[route.query.build]
  if (build) { draft.value = curatedDraft(build, { equipment: equipmentItems.value, mods: manifestMods.value, itemSets: itemSets.value, plugSets: plugSets.value }); message.value = '已创建推荐副本，可以修改目标、分栏词条与备注。' }
  draft.value.manifestVersion ||= snapshot.value.manifestVersion || ''
  try { const raw = sessionStorage.getItem('d2hub-armor-transfer-v1'); if (raw) { armorTransfer.value = JSON.parse(raw); sessionStorage.removeItem('d2hub-armor-transfer-v1'); armorTransferOpen.value = true } } catch { /* ignore malformed handoff */ }
}, { immediate: true })
let communityImported = ''
watch(() => [status.value, community.status.value, route.query.community, route.query.mode], () => {
  const number = Number(route.query.community), key = `${number}:${route.query.mode || 'copy'}`
  if (!route.query.community || status.value !== 'ready' || communityImported === key) return
  if (!Number.isSafeInteger(number) || number <= 0) { communityImportError.value = '构筑编号无效。'; return }
  if (community.status.value === 'error') { communityImportError.value = '社区构筑读取失败，请重试。'; return }
  if (community.status.value === 'unconfigured') { communityImportError.value = '当前页面尚未启用列表同步，暂时无法读取这份社区构筑。'; return }
  if (community.status.value !== 'ready') return
  const source = community.snapshot.value?.builds.find(b => b.number === number)
  if (!source) { communityImportError.value = '这份构筑暂不可用，可能尚未同步、已下架或被屏蔽。'; return }
  draft.value = JSON.parse(JSON.stringify(source.submission.loadout))
  submissionMetadata.value = JSON.parse(JSON.stringify(source.submission))
  submissionOrigin.value = route.query.mode === 'edit' ? { number, updatedAt: source.updatedAt } : null
  communityImported = key; communityImportError.value = ''
  message.value = submissionOrigin.value ? `已导入原投稿 #${number}，生成更新内容后请在 GitHub 编辑原 Issue。` : '已创建社区构筑副本，发布时将创建新的投稿。'
}, { immediate: true })
watch(search, () => { page.value = 1 })
</script>

<template>
  <div class="manual-page">
    <header class="command-bar">
      <div><span class="eyebrow">BUILD CREATOR / 手动构筑</span><h1>创建构筑</h1></div>
      <nav><router-link to="/builds" class="gallery-link">浏览公开方案</router-link><a-button @click="save">保存草稿</a-button><a-button @click="restore" :disabled="status !== 'ready'">恢复草稿</a-button><a-button @click="transfer('import')" :disabled="status !== 'ready'">导入</a-button><a-button @click="transfer('export')">导出代码</a-button><a-button :disabled="status !== 'ready'" @click="exportImage">导出一图流</a-button><a-button type="primary" :disabled="status !== 'ready'" @click="openSubmission">{{ submissionOrigin ? '更新投稿' : '发布构筑' }}</a-button></nav>
    </header>
    <CommunityPublishGuide :editing="Boolean(submissionOrigin)" />
    <p v-if="communityImportError" class="community-alert" role="alert">{{ communityImportError }} <button v-if="community.config.enabled" class="btn" @click="community.refresh">重新读取</button></p>
    <p v-if="submissionOrigin" class="community-origin">正在编辑原投稿 #{{ submissionOrigin.number }} <a :href="issueUrl(community.config.repository, submissionOrigin.number)" target="_blank" rel="noopener noreferrer">前往 GitHub 管理</a> <button type="button" class="btn" @click="resetCommunitySource">改为发布新投稿</button></p>
    <CommunitySubmission :open="submissionOpen" :draft="draft" :context="validationContext" :ready="status === 'ready'" :origin="submissionOrigin" :metadata="submissionMetadata" :source-warning="sourceWarning" @close="submissionOpen = false" />
    <p class="snapshot">装备快照：{{ snapshot.syncedAt?.slice(0, 10) || '加载中' }} {{ snapshot.manifestVersion || '—' }}。这是一份推荐清单，不读取账号或判断是否拥有装备。</p>
    <a-alert v-if="status === 'error'" type="error" show-icon message="装备数据加载失败，请刷新重试。未加载时不能核验配置。" />
    <a-modal v-model:open="armorTransferOpen" title="带入套装配置？" ok-text="确定并覆盖" cancel-text="取消" @ok="applyArmorTransfer" @cancel="cancelArmorTransfer"><p v-if="armorTransfer">将带入 {{ armorTransfer.setName || '已选套装' }} 的五个部位{{ armorTransfer.exoticName ? `，包含异域 ${armorTransfer.exoticName}` : '' }}。</p><p>确定后会覆盖当前防具选择和防具模组；武器、技能、神器等其他配置不会改变。</p></a-modal>
    <a-alert v-if="message" type="info" :message="message" closable @close="message = ''" />
    <article class="loadout-sheet">
      <header class="sheet-title">
        <label>构筑名称<a-input v-model:value="draft.name" aria-label="构筑名称" :maxlength="100" /></label>
        <div class="class-choices" role="group" aria-label="职业"><button v-for="c in Object.values(classById)" :key="c.id" type="button" :aria-label="`选择${c.name}`" :aria-pressed="draft.classId === c.id" :style="{ '--class-color': c.color }" @click="changeClass(c.id)"><ClassEmblem :class-id="c.id" /><span><strong>{{ c.name }}</strong><small>{{ c.en }}</small></span></button></div>
        <div class="subclass-choices" role="group" aria-label="子职业"><button v-for="s in classSubclasses" :key="s.id" type="button" :aria-label="`选择${s.name}`" :aria-pressed="draft.subclassId === s.id" :style="{ '--branch-color': elements[s.element]?.color }" @click="changeSubclass(s.id)"><img v-if="visualIcon(s)" :src="visualIcon(s)" alt="" /><span v-else class="branch-placeholder" aria-hidden="true">◇</span><span><strong>{{ elements[s.element]?.name }}</strong><small>{{ s.name }}</small></span><b v-if="draft.subclassId === s.id" aria-hidden="true">✓</b></button></div>
      </header>
      <div class="top-grid">
        <section class="panel talents"><h2><b>01</b> 天赋与技能</h2><p class="muted">来自当前 Manifest 子职业的完整可选插槽；不按推荐构筑或账号解锁状态缩减。</p>
          <div class="abilities"><LoadoutTile v-for="slot in abilitySlots" :key="slot.key" compact :image="visualIcon(abilityAt(slot.key))" :label="abilityAt(slot.key)?.name || `选择${slot.label}`" :eyebrow="slot.label" :subtitle="english(abilityAt(slot.key))" :description="visualDescription(abilityAt(slot.key))" :action-label="`选择${slot.label}：${abilityAt(slot.key)?.name || '未指定'}`" :empty="!abilityAt(slot.key)" :color="accent" @click="openPicker('ability', slot.key)" /></div>
          <div v-if="intrinsicAbilities.length" class="intrinsic-abilities"><details v-for="item in intrinsicAbilities" :key="item.id"><summary><img v-if="visualIcon(item)" :src="visualIcon(item)" alt="" /><span>{{ item.name }}<small>{{ item.kind === 'transcendenceGrenade' ? '超越期间替换手雷 固定能力' : '棱镜固定能力 点击查看' }}</small></span></summary><p>{{ visualDescription(item) }}</p></details></div>
          <div class="selection-heading"><h3>星相 <small>ASPECTS</small></h3><span>{{ draft.abilities.aspectIds.length }} / 2</span></div>
          <div class="aspect-slots"><LoadoutTile v-for="index in Math.max(2, chosenAspects.length)" :key="index" compact :image="visualIcon(chosenAspects[index - 1])" :label="chosenAspects[index - 1]?.name || `选择星相 ${index}`" :subtitle="english(chosenAspects[index - 1])" :description="visualDescription(chosenAspects[index - 1])" :action-label="`选择星相${index}：${chosenAspects[index - 1]?.name || '未指定'}`" :empty="!chosenAspects[index - 1]" :color="accent" @click="openPicker('aspect')" /></div>
          <div class="selection-heading"><h3>{{ subclass?.type === 'prismatic' ? '棱镜特性' : '元素碎片' }} <small>FRAGMENTS</small></h3><span>{{ draft.abilities[traitKey].length }} / {{ capacity ?? '—' }}</span></div>
          <p v-if="capacity == null" class="muted">先选择两个星相，碎片插槽会随所选星相展开。</p>
          <div class="fragment-slots"><LoadoutTile v-for="index in Math.max(capacity || 0, draft.abilities[traitKey].length, 1)" :key="index" compact :image="visualIcon(traitAt(index - 1))" :label="traitAt(index - 1)?.name || `选择碎片 ${index}`" :description="visualDescription(traitAt(index - 1))" :action-label="`选择碎片${index}：${traitAt(index - 1)?.name || '未指定'}`" :empty="!traitAt(index - 1)" :color="accent" :disabled="capacity == null && !draft.abilities[traitKey].length" @click="openPicker('trait')" /></div>
        </section>
        <section class="panel artifact"><h2><b>02</b> 神器与节点</h2>
          <LoadoutTile :image="visualIcon(artifact)" :label="artifact ? label(artifact) : '选择神器'" eyebrow="ARTIFACT / 神器本体" :subtitle="artifact ? english(artifact) : '点击查看神器图鉴，再配置节点'" :badge="artifact ? (artifact.selectable ? `${artifact.sockets.length} 个官方插槽 点击更换` : '旧定义 请重新选择') : ''" :empty="!artifact" action-label="选择神器" @click="openPicker('artifact')" />
          <p class="muted">{{ artifact?.note || '先选择复刻神器，再按每个插槽的官方候选池配置。节点不可重复，更换神器会清空节点。' }} <RouterLink to="/manifest">查看神器与历史目录</RouterLink></p>
          <div v-if="artifact?.selectable" class="artifact-sockets"><LoadoutTile v-for="socket in artifact.sockets" :key="socket.socketIndex" compact :image="visualIcon(nodeAt(socket.socketIndex))" :label="nodeAt(socket.socketIndex) ? label(nodeAt(socket.socketIndex)) : '选择节点'" :eyebrow="`插槽 ${socket.socketIndex + 1} ${socket.nodeHashes.length} 个候选`" :description="visualDescription(nodeAt(socket.socketIndex))" :empty="!nodeAt(socket.socketIndex)" :action-label="`神器插槽${socket.socketIndex + 1}`" @click="openPicker('artifactNode', null, socket.socketIndex)" /></div>
          <p v-else-if="artifact" class="muted">旧节点已保留在草稿中，但不视为当前有效配置。请重新选择复刻神器。</p>
          <p v-else class="empty-note">尚未选择神器。无神器依赖的构筑可以留空。</p>
        </section>
      </div>
      <section class="panel"><h2><b>03</b> 武器与 Perk 组合 <small>每组是一套独立搭配，不与其他组交叉配对</small></h2>
        <article v-for="(row, index) in draft.weapons" :key="index" class="weapon-row">
          <LoadoutTile :image="visualIcon(weapon(index))" :label="weapon(index) ? label(weapon(index)) : '选择武器'" :eyebrow="['动能栏位', '能量栏位', '威能栏位'][index]" :subtitle="english(weapon(index))" :badge="row.manifestHash ? `#${row.manifestHash} 点击更换` : '点击浏览武器卡片'" :empty="!weapon(index)" :action-label="`选择武器${index + 1}`" @click="openPicker('weapon', index)" />
          <WeaponPerkCombinations :weapon="weapon(index)" :row="row" :weapon-index="index" :manifest-version="snapshot.manifestVersion" @change="next => draft.weapons[index] = next" />
          <a-input v-model:value="row.notes" :aria-label="`武器${index + 1}备注`" placeholder="武器职责、替代武器或固定异域特性备注" :maxlength="3000" />
        </article>
        <p class="muted">不同搭配请新增组合；组内同栏的 / 仅表示该组合中可互换的选项。可从实际插槽的配图候选中选择，也可手填。候选区分普通与强化，不代表都能随机掉落或任意组合共存；大师之作保留手动建议。</p>
      </section>
      <section class="panel"><h2><b>04</b> 护甲与模组 <small>同一模组可放在多个兼容插槽</small></h2>
        <div class="armor-grid"><article v-for="(name, slot) in armorLabels" :key="slot">
          <LoadoutTile class="armor-tile" :image="visualIcon(armor(slot))" :label="armor(slot) ? label(armor(slot)) : `选择${name}`" :eyebrow="name" :subtitle="english(armor(slot))" :empty="!armor(slot)" :action-label="`选择${name}`" @click="openPicker('armor', slot)" />
          <small v-if="armor(slot)">规划能量 {{ energy(slot) }}/10</small>
          <LoadoutTile v-for="socket in sockets(slot)" :key="socket.index" compact :image="visualIcon(mod(assigned(slot, socket.index)))" :label="assigned(slot, socket.index) ? label(mod(assigned(slot, socket.index))) : '选择模组'" :eyebrow="`插槽 ${socket.index + 1}`" :badge="assigned(slot, socket.index) ? `${mod(assigned(slot, socket.index))?.energyCost ?? '?'} 点能量` : ''" :description="visualDescription(mod(assigned(slot, socket.index)))" :action-label="`${name}模组插槽${socket.index + 1}`" :empty="!assigned(slot, socket.index)" @click="openPicker('mod', slot, socket.index)" />
          <p v-if="!armor(slot)" class="muted">可不指定具体护甲。需要推荐模组时，先选带兼容插槽的护甲模板。</p>
          <a-button v-if="draft.mods[slot].some(m => !sockets(slot).some(s => s.index === m.socketIndex))" size="small" @click="draft.mods[slot] = []">清除未匹配的旧模组</a-button>
        </article></div>
        <p class="muted">按所选 Hash 的模组插槽检查；10 能量是假设已满升级的规划预算，不以装备总插槽数推导。突袭、调谐、锻造与巧匠等附加限制还需游戏内核对。</p>
        <div v-for="set in setEffects" :key="set.hash" class="set-note"><strong>{{ label(set) }} 推荐 {{ set.count }} 件</strong><span v-for="perk in set.perks" :key="perk.sandboxPerkHash" :class="{ inactive: set.count < perk.requiredSetCount }">{{ perk.requiredSetCount }} 件：{{ label(perk) }} — {{ description(perk) }}</span></div>
        <a-textarea v-model:value="draft.armorNotes" aria-label="护甲套装备注" placeholder="套装件数、核心异域、可替换部位、调谐或异域职业装备特性备注" :auto-size="{ minRows: 2, maxRows: 8 }" :maxlength="10000" />
      </section>
      <section class="panel"><h2><b>05</b> 六维目标与刷装建议</h2><StatRecommendations :targets="draft.statRecommendations" editable @change="(key, bound, value) => draft.statRecommendations[key][bound] = value" />
        <a-textarea v-model:value="draft.statNotes" aria-label="属性建议备注" placeholder="属性优先级与取舍，例如：武器 150–200，手雷至少 80；其他属性无要求" :auto-size="{ minRows: 2, maxRows: 6 }" :maxlength="10000" />
        <div class="farming-grid"><div><LoadoutTile :image="visualIcon(ghost)" :label="ghost ? label(ghost) : '选择机灵护甲商'" eyebrow="GHOST / 刷装倾向" :subtitle="english(ghost)" :description="visualDescription(ghost) || '点击卡片，查看护甲商对应的主、副属性倾向。'" :empty="!ghost" action-label="选择机灵护甲商" @click="openPicker('ghost')" /><p class="muted">提高对应随机护甲框架的出现概率，不保证属性组合或提高装备掉落数量。</p></div><label>刷装备注<a-textarea v-model:value="draft.farmingNotes" aria-label="刷装备注" placeholder="获取途径、主副属性倾向、随机掉落与替代方案" :auto-size="{ minRows: 3, maxRows: 8 }" :maxlength="10000" /></label></div>
      </section>
      <section class="panel"><h2><b>06</b> 操作与补充说明</h2><a-textarea v-model:value="draft.notes" aria-label="构筑备注" placeholder="记录操作循环、触发条件、使用场景和注意事项" :auto-size="{ minRows: 3, maxRows: 16 }" :maxlength="10000" /></section>
      <section class="panel knowledge-lookup" aria-label="配装百科速查"><h2>已选条目速查</h2><p class="muted">在新标签页查看效果、来源和相关构筑，当前编辑内容会保留。</p><div class="lookup-groups"><section v-for="group in knowledgeGroups" :key="group.label"><h3>{{ group.label }} <small>{{ group.items.length }}</small></h3><div><EntityLink v-for="item in group.items" :key="item.id || item.hash" :item="item" :kind="group.kind" new-tab /></div></section></div><p v-if="!knowledgeGroups.length" class="muted">选择技能或装备后，这里会出现对应百科入口。</p></section>
      <footer class="sheet-footer"><p>推荐草稿可随时保存与导出。空白项表示未指定，不代表缺少装备。</p><p v-if="draft.manifestVersion && draft.manifestVersion !== snapshot.manifestVersion">导入来源版本与本地快照不同，保留原推荐，请重新核对。</p><details v-if="issues.length" open><summary>配置提示</summary><ul><li v-for="issue in issues" :key="issue">{{ issue }}</li></ul></details></footer>
    </article>
    <a-modal :open="Boolean(picker)" :title="pickerTitle" :footer="null" width="1120px" wrap-class-name="loadout-visual-modal" @cancel="picker = null">
      <div class="picker-toolbar"><a-input v-model:value="search" aria-label="搜索选择卡片" placeholder="搜索中文、英文或 Hash" allow-clear /><span role="status" aria-live="polite">{{ pickerItems.length }} / {{ pickerPool.length }} 个候选 <template v-if="multiPick"> 已选 {{ pickerSelected.length }} / {{ pickerLimit ?? '—' }}</template></span></div>
      <p class="muted">{{ multiPick ? '点击卡片选择，再点已选卡片取消；选好后点击完成。' : '点击卡片即可应用；悬停或聚焦可查看右侧详情。' }}<template v-if="['weapon', 'armor'].includes(picker?.kind)"> 同名装备按 Hash 区分，更换版本会清空对应词条或模组。</template><template v-if="picker?.kind === 'artifact'"> 更换神器会清空原节点。</template></p>
      <div class="visual-picker-body"><div class="visual-picker-results"><div v-if="pickerPage.length" class="visual-picker-grid"><LoadoutTile v-for="item in pickerPage" :key="item.id || item.hash" :image="visualIcon(item)" :label="label(item)" :subtitle="english(item)" :description="visualDescription(item)" :badge="pickerBadge(item)" :active="itemSelected(item)" :disabled="Boolean(disabledReason(item))" toggle :color="accent" @mouseenter="preview = item" @focus="preview = item" @click="pick(item)" /></div><div v-else class="picker-empty">{{ status === 'loading' ? '正在加载图文目录…' : '没有匹配项，试试其他名称或清空搜索。' }}</div></div>
        <aside v-if="previewItem" class="picker-preview" aria-label="卡片详情"><img v-if="visualIcon(previewItem)" :src="visualIcon(previewItem)" alt="" /><small>{{ pickerTitle }}</small><h3>{{ label(previewItem) }}</h3><span>{{ english(previewItem) }}</span><b>{{ pickerBadge(previewItem) }}</b><p>{{ visualDescription(previewItem) || '快照未提供详细说明，可在构筑备注中补充使用建议。' }}</p><EntityLink :item="previewItem" label="查看百科与来源" new-tab /></aside>
      </div>
      <div v-if="multiPick && pickerSelected.length" class="picker-selection" aria-label="已选卡片"><button v-for="item in pickerSelected" :key="item.id" type="button" :aria-label="`取消${label(item)}`" @click="pick(item)"><img v-if="visualIcon(item)" :src="visualIcon(item)" alt="" />{{ label(item) }}<span aria-hidden="true">×</span></button></div>
      <footer class="picker-footer"><a-button @click="clearChoice">{{ multiPick ? '清空本组选择' : '清除当前选择' }}</a-button><a-pagination v-if="pickerItems.length > pickerPageSize" v-model:current="page" :page-size="pickerPageSize" :total="pickerItems.length" :show-size-changer="false" size="small" /><a-button type="primary" @click="picker = null">{{ multiPick ? '完成选择' : '返回配装' }}</a-button></footer>
    </a-modal>
    <a-modal v-model:open="transferOpen" :title="transferMode === 'export' ? '导出推荐代码' : '导入推荐代码'" :footer="null"><p>保留每个 Perk 组合的名称、词条、用途备注，以及属性区间和神器配置。旧版分栏推荐会整体放入第一组，不自动推断配对；旧版未分栏词条保留在武器备注中。</p><a-textarea v-model:value="code" aria-label="配装代码" :rows="8" /><p v-if="transferError" role="alert">{{ transferError }}</p><a-button v-if="transferMode === 'export'" type="primary" @click="copy">复制代码</a-button><a-button v-else type="primary" @click="importCode">导入草稿</a-button></a-modal>
    <LoadoutImageExport :open="imageExportOpen" :model="imageExportModel" :loading="imageExportLoading" :preparation-error="imageExportError" @close="closeImageExport" @retry="exportImage" />
  </div>
</template>


<style scoped>
.community-alert{color:var(--warn);padding:1rem;border-left:2px solid var(--warn)}.community-origin{padding:.75rem 0;color:var(--gold);font-size:.8rem}.command-bar nav{flex-wrap:wrap}

.weapon-row > .loadout-tile { align-self: start; }
.artifact-sockets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.artifact-sockets :deep(.loadout-tile){min-width:0}@media(max-width:500px){.artifact-sockets{grid-template-columns:1fr}}
.manual-page{max-width:1440px;margin:auto;padding:2rem 0 4rem}.command-bar{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:1rem}.command-bar h1{font-family:var(--font-cn);font-size:1.65rem;margin:.35rem 0 0}.eyebrow{font:.62rem var(--font-en);letter-spacing:.18em;color:var(--gold-dim)}nav{display:flex;flex-wrap:wrap;gap:.5rem}.gallery-link{display:inline-flex;align-items:center;padding:0 .7rem;border-bottom:1px solid var(--line);color:var(--gold-bright);font-size:.7rem}.snapshot,.muted{font-size:.72rem;color:var(--text-dim);line-height:1.7}.snapshot{margin:1rem 0}.loadout-sheet{border:1px solid var(--line);background:#101317;margin-top:1rem}label{display:grid;gap:.45rem;font-size:.73rem;color:var(--text-sub);min-width:0}
.sheet-title{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:1.2rem;padding:1.4rem;background:#1b1d20;border-bottom:2px solid var(--gold)}.sheet-title>label>.ant-input{font-size:1.05rem;height:46px}.class-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem}.class-choices>button{display:flex;align-items:center;gap:.65rem;padding:.7rem;color:#abb2bd;background:#181b20;border:1px solid #383c43;cursor:pointer;min-width:0}.class-choices>button[aria-pressed=true]{color:var(--class-color);border-color:var(--class-color);background:#282925}.class-choices span{display:grid;gap:.2rem;text-align:left}.class-choices strong{font-size:.83rem;color:var(--text-main)}.class-choices small{font:.62rem var(--font-en);text-transform:uppercase}.subclass-choices{grid-column:1/-1;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.5rem}.subclass-choices>button{display:flex;position:relative;gap:.65rem;align-items:center;min-width:0;text-align:left;padding:.7rem .55rem;background:#15181d;border:1px solid #383c43;cursor:pointer;color:var(--text-main)}.subclass-choices>button[aria-pressed=true]{border-color:var(--branch-color);box-shadow:inset 0 -2px 0 var(--branch-color);background:color-mix(in srgb,var(--branch-color) 9%,#15181d)}.subclass-choices img,.branch-placeholder{width:40px;height:40px;object-fit:contain;flex-shrink:0}.branch-placeholder{display:grid;place-items:center;font-size:1.8rem;color:var(--branch-color)}.subclass-choices span:not(.branch-placeholder){display:grid;gap:.35rem;min-width:0}.subclass-choices strong{font-size:.77rem}.subclass-choices small{font-size:.62rem;color:#a6afbc;overflow-wrap:anywhere}.subclass-choices b{position:absolute;right:.3rem;top:.1rem;font-size:.64rem;color:var(--branch-color)}
.top-grid{display:grid;grid-template-columns:1.05fr 1fr}.loadout-sheet .panel{padding:1.35rem;border:0;border-bottom:1px solid var(--line-soft);border-radius:0;box-shadow:none;margin:0;background:#171a1f;min-width:0}.loadout-sheet .panel+.panel{margin-top:0}.panel h2{display:flex;flex-wrap:wrap;align-items:baseline;gap:.7rem;font:600 1rem var(--font-cn);margin:0 0 1.2rem}.panel h2>b{font:.65rem var(--font-en);color:var(--gold-dim)}.panel h2>small{font-size:.65rem;font-weight:400;color:var(--text-dim)}.loadout-sheet .talents{border-right:1px solid var(--line-soft)}.abilities,.aspect-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.selection-heading{display:flex;align-items:baseline;justify-content:space-between;gap:.5rem;margin:1.25rem 0 .65rem}.selection-heading h3{font:.78rem var(--font-cn);margin:0}.selection-heading h3 small{font:.58rem var(--font-en);color:var(--text-dim);letter-spacing:.07em;margin-left:.3rem}.selection-heading>span{font:.68rem var(--font-en);color:var(--gold-dim)}.fragment-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem}.fragment-slots :deep(.tile-art){width:36px;height:36px;flex-basis:36px}.fragment-slots :deep(.loadout-tile){gap:.4rem;padding:.45rem}.fragment-slots :deep(.tile-copy strong){font-size:.68rem}
.artifact-tiers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.4rem}.artifact-tiers>div{display:flex;flex-direction:column;gap:.4rem}.artifact-tiers small{font-size:.58rem;color:var(--text-dim)}.artifact-tiers button{display:flex;align-items:center;gap:.3rem;padding:.3rem;background:#20242a;border:1px solid var(--line-soft);color:var(--text-sub);text-align:left;min-height:2.75rem;font-size:.59rem;cursor:pointer}.artifact-tiers button[aria-pressed=true]{border-color:var(--gold);background:#413b28;color:#fff}.artifact-tiers button:disabled{opacity:.4;cursor:not-allowed}.artifact-tiers img{width:1.7rem;height:1.7rem;object-fit:contain}.empty-note{padding:1rem 0;color:var(--text-dim);font-size:.75rem}
.weapon-row{display:grid;grid-template-columns:240px 1fr;gap:.8rem;padding:1rem 0;border-top:1px solid var(--line-soft)}.weapon-row>.loadout-tile{grid-row:span 2}.weapon-row>.ant-input{grid-column:2}.perk-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}.perk-fields label{font-size:.65rem}.armor-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem}.armor-grid>article{min-width:0;display:flex;flex-direction:column;gap:.6rem}.armor-grid>article>small{color:var(--text-dim);font-size:.65rem}.armor-tile{flex-direction:column;min-height:156px}.armor-grid :deep(.compact .tile-art){width:36px;height:36px;flex-basis:36px}.armor-grid :deep(.compact .tile-copy strong){font-size:.7rem}.set-note{margin:.75rem 0;padding:.75rem;border-left:2px solid var(--gold);font-size:.75rem;display:grid;gap:.4rem}.set-note span{font-size:.65rem}.inactive{opacity:.5}.farming-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-top:1rem}.panel>.ant-input{margin-top:.8rem}.sheet-footer{padding:1rem 1.35rem;color:var(--text-dim);font-size:.72rem}.sheet-footer details{color:var(--warn);line-height:1.8}.sheet-footer ul{padding-left:1.2rem}
.picker-toolbar{display:flex;gap:1rem;align-items:center;margin-top:.9rem}.picker-toolbar>.ant-input-affix-wrapper{flex:1}.picker-toolbar>span:last-child{color:var(--text-dim);font-size:.73rem;white-space:nowrap}.visual-picker-body{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:1.15rem;margin-top:.9rem;min-height:220px}.visual-picker-results{max-height:53vh;overflow-y:auto;padding:3px;scrollbar-color:#62676e #171a1f}.visual-picker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.visual-picker-grid>.loadout-tile{min-height:145px}.picker-preview{padding:1.2rem;background:#191d23;border-left:2px solid var(--gold);display:flex;align-items:flex-start;flex-direction:column;gap:.55rem;max-height:53vh;overflow-y:auto;min-width:0}.picker-preview>img{width:88px;height:88px;object-fit:contain;background:#0e1116;border:1px solid #ffffff20;margin-bottom:.3rem}.picker-preview>small{font-size:.62rem;color:var(--text-dim)}.picker-preview h3{font:600 1.1rem var(--font-cn);margin:0}.picker-preview>span{font:.7rem/1.6 var(--font-en);color:var(--text-dim);overflow-wrap:anywhere}.picker-preview>b{font-size:.7rem;font-weight:400;color:var(--gold)}.picker-preview p{font-size:.77rem;line-height:1.85;white-space:pre-line;margin:.25rem 0;color:var(--text-sub)}.picker-empty{padding:3rem 1rem;color:var(--text-dim);font-size:.85rem}.picker-selection{display:flex;flex-wrap:wrap;gap:.4rem;padding-top:.9rem}.picker-selection>button{display:flex;align-items:center;gap:.45rem;border:1px solid var(--gold-dim);background:#292820;color:var(--text-main);font-size:.72rem;padding:.25rem .5rem;cursor:pointer}.picker-selection img{width:28px;height:28px}.picker-selection span{color:var(--gold);font-size:1rem;margin-left:.25rem}.picker-footer{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.65rem;border-top:1px solid var(--line-soft);margin-top:1rem;padding-top:1rem}
button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.intrinsic-abilities{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin-top:.7rem}.intrinsic-abilities details{border:1px solid var(--line-soft);padding:.6rem;background:#20242a}.intrinsic-abilities summary{display:flex;align-items:center;gap:.6rem;cursor:pointer;font-size:.75rem}.intrinsic-abilities img{width:42px;height:42px;object-fit:contain}.intrinsic-abilities small{display:block;color:var(--text-dim);font-size:.6rem;margin-top:.3rem}.intrinsic-abilities p{font-size:.72rem;white-space:pre-line;line-height:1.8}.intrinsic-abilities summary:focus-visible{outline:2px solid var(--gold)}
@media(max-width:650px){.intrinsic-abilities{grid-template-columns:1fr}}
:global(.loadout-visual-modal .ant-modal){top:24px;padding-bottom:24px}
@media(max-width:720px){:global(.loadout-visual-modal .ant-modal){top:16px;padding-bottom:16px}.visual-picker-body .visual-picker-results{max-height:50dvh}.visual-picker-grid :deep(.tile-description){display:block;-webkit-line-clamp:unset}.visual-picker-grid :deep(.loadout-tile:disabled){opacity:.65}}
@media(max-width:1100px){.top-grid{grid-template-columns:1fr}.loadout-sheet .talents{border-right:0}.artifact-tiers button{font-size:.7rem}.armor-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.command-bar{align-items:start;flex-direction:column}.subclass-choices{grid-template-columns:repeat(3,minmax(0,1fr))}.sheet-title{grid-template-columns:1fr}}
@media(max-width:720px){.visual-picker-body{grid-template-columns:1fr}.picker-preview{display:none}.visual-picker-results{max-height:58vh}.visual-picker-grid{grid-template-columns:1fr}.visual-picker-grid>.loadout-tile{min-height:112px}.picker-toolbar{flex-direction:column;align-items:stretch;gap:.5rem}.picker-toolbar>.ant-input-affix-wrapper{flex:auto}}
@media(max-width:650px){.manual-page{padding:1rem 0 2rem}.sheet-title{padding:1rem;gap:1rem}.loadout-sheet .panel{padding:1rem}.class-choices{gap:.35rem}.class-choices>button{gap:.4rem;padding:.65rem .4rem}.class-choices :deep(.class-emblem){width:28px;height:28px}.class-choices small{font-size:.53rem}.subclass-choices>button{flex-direction:column;align-items:flex-start;padding:.65rem}.subclass-choices span:not(.branch-placeholder){gap:.2rem}.subclass-choices img{width:40px;height:40px}.weapon-row{grid-template-columns:1fr}.weapon-row>.loadout-tile{grid-row:auto}.weapon-row>.ant-input{grid-column:auto}.perk-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.armor-grid{grid-template-columns:1fr}.armor-tile{min-height:0;flex-direction:row}.farming-grid{grid-template-columns:1fr}.fragment-slots{grid-template-columns:repeat(2,minmax(0,1fr))}.artifact-tiers{gap:.25rem}.artifact-tiers button{flex-direction:column;font-size:.57rem;word-break:break-all}.command-bar nav{gap:.4rem}.abilities :deep(.compact){flex-direction:column;align-items:flex-start}.abilities :deep(.tile-art){width:56px;height:56px;flex-basis:56px}.aspect-slots :deep(.compact){flex-direction:column;align-items:flex-start}.picker-footer>.ant-pagination{order:3;width:100%;text-align:center}}
</style>

<style scoped>
.lookup-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.lookup-groups section{padding:.8rem;border-top:1px solid var(--line-soft);background:#ffffff03;min-width:0}.lookup-groups h3{margin:0 0 .8rem;font-size:.8rem}.lookup-groups small{color:var(--gold-dim);margin-left:.5rem}.lookup-groups section>div{display:flex;flex-wrap:wrap;gap:.65rem 1rem;font-size:.75rem}@media(max-width:720px){.lookup-groups{grid-template-columns:1fr}}
</style>
