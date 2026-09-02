<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  abilityById,
  aspectById,
  armorSetById,
  curatedBuilds,
  auditRecommendationData,
  facetById,
  fragmentById,
  gearById,
  modById,
  subclassById,
  subclasses
} from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'

const { iconFor, assetFor, artifacts, equipmentItems, manifestMods, manifestPerks, plugSets, itemSets, vendorEntries, activityRewards, recordsForHash, entityForHash } = useManifestAssets()
const route = useRoute()

const classOptions = [
  { id: 'hunter', name: '猎人', en: 'HUNTER', color: 'var(--arc)' },
  { id: 'titan', name: '泰坦', en: 'TITAN', color: 'var(--solar)' },
  { id: 'warlock', name: '术士', en: 'WARLOCK', color: 'var(--void)' }
]
const styleOptions = [
  { id: 'addClear', name: '清怪', desc: '高频技能、范围伤害与持续循环' },
  { id: 'bossDamage', name: '爆发', desc: '首领输出窗口与武器协同' },
  { id: 'survivability', name: '生存', desc: '高压活动、控制与恢复' }
]

const selectedClass = ref('hunter')
const selectedSubclass = ref('hunter-arc')
const selectedStyle = ref('addClear')
const selectedBuildId = ref('')
const selectedDetail = ref(null)

const initialBuild = computed(() => curatedBuilds.find(item => item.id === route.query.build))
if (initialBuild.value) {
  selectedClass.value = initialBuild.value.classId
  selectedSubclass.value = initialBuild.value.subclassId
  selectedBuildId.value = initialBuild.value.id
}

const classSubclasses = computed(() => subclasses.filter(item => item.classId === selectedClass.value))
const filteredBuilds = computed(() => curatedBuilds.filter(build => {
  if (build.isTemplateBaseline || !auditRecommendationData(build).verified) return false
  if (build.classId !== selectedClass.value) return false
  if (selectedSubclass.value && build.subclassId !== selectedSubclass.value) return false
  return true
}))
const rankedBuilds = computed(() => [...filteredBuilds.value].sort((a, b) => {
  const score = item => (item.scoring?.[selectedStyle.value] || 0) + (item.confidence === 'A' ? 5 : item.confidence === 'B' ? 3 : 0)
  return score(b) - score(a)
}))
const recommendedBuild = computed(() => {
  const chosen = curatedBuilds.find(item => item.id === selectedBuildId.value)
  return (chosen && !chosen.isTemplateBaseline && auditRecommendationData(chosen).verified ? chosen : null) || rankedBuilds.value[0] || null
})
const subclass = computed(() => subclassById[recommendedBuild.value?.subclassId])
const classInfo = computed(() => classOptions.find(item => item.id === recommendedBuild.value?.classId) || classOptions[0])
const statTargets = computed(() => {
  const build = recommendedBuild.value
  const target = build?.targetStats || {}
  const style = selectedStyle.value
  return [
    { key: 'health', label: '生命', value: target.resilience >= 100 ? '高' : '中', hint: '优先保证高压容错' },
    { key: 'melee', label: '近战', value: style === 'addClear' && build?.classId === 'hunter' ? '80+' : '60+', hint: '技能循环核心' },
    { key: 'grenade', label: '手雷', value: target.discipline >= 80 ? '80+' : '60+', hint: '控场与启动技能' },
    { key: 'super', label: '超能', value: style === 'bossDamage' ? '80+' : '60+', hint: '按活动窗口积累' },
    { key: 'classAbility', label: '职业', value: build?.classId === 'hunter' ? '80+' : '60+', hint: '闪身 / 路障 / 裂隙' },
    { key: 'weapon', label: '武器', value: style === 'bossDamage' ? '150–200' : '100–150', hint: '武器协同预算' }
  ]
})

const abilityItems = computed(() => {
  const abilities = recommendedBuild.value?.abilities || {}
  return [
    ['超能', abilities.superId],
    ['职业技能', abilities.classAbilityId],
    ['近战', abilities.meleeId],
    ['手雷', abilities.grenadeId]
  ].map(([label, id]) => ({ label, item: abilityById[id] })).filter(entry => entry.item)
})
const aspectItems = computed(() => (recommendedBuild.value?.abilities?.aspectIds || []).map(id => aspectById[id]).filter(Boolean))
const facetItems = computed(() => {
  const build = recommendedBuild.value
  const ids = build?.abilities?.facetIds?.length ? build.abilities.facetIds : build?.abilities?.fragmentIds || []
  return ids.map(id => facetById[id] || fragmentById[id]).filter(Boolean)
})
const weapons = computed(() => (recommendedBuild.value?.weapons || []).map(selection => ({ ...selection, item: gearById[selection.itemId] })).filter(item => item.item))
const armorSlots = [
  ['helmet', '头盔'], ['arms', '臂铠'], ['chest', '胸甲'], ['legs', '腿甲'], ['classItem', '职业装备']
]
const modsBySlot = computed(() => armorSlots.map(([key, label]) => ({ key, label, mods: (recommendedBuild.value?.armorMods?.[key] || []).map(id => modById[id]).filter(Boolean) })))
const ghostMods = computed(() => {
  const armorerName = selectedStyle.value === 'bossDamage' ? 'Gunner Armorer' : selectedStyle.value === 'survivability' ? 'Bulwark Armorer' : 'Brawler Armorer'
  const findMod = englishName => manifestMods.value.find(item => item.name === englishName)
  return [armorerName, 'Expert Tracker', 'Activity Mod Socket'].map(findMod).filter(Boolean)
})
const artifact = computed(() => artifacts.value?.[0] || null)
const artifactHighlights = computed(() => (artifact.value?.tiers || []).map(tier => ({ ...tier, item: tier.items?.[0] || null })).filter(tier => tier.item))
const armorPieces = computed(() => {
  const build = recommendedBuild.value
  const set = armorSetById[build?.armorSetId]
  if (!set) return []
  const prefix = String(set.en || '').replace(/\s+(Suit|Set)$/i, '').trim()
  const slotLabels = { helmet: '头盔', arms: '臂铠', chest: '胸甲', legs: '腿甲', classItem: '职业' }
  return armorSlots.map(([slot]) => {
    const item = equipmentItems.value.find(candidate => candidate.itemType === 2 && candidate.classId === build?.classId && candidate.armorSlot === slot && candidate.name.startsWith(prefix) && candidate.icon)
    return item ? { label: slotLabels[slot] || slot, item } : null
  }).filter(Boolean)
})

function icon(item) { return iconFor(item) }
function name(item) { return item?.nameZh || item?.name || item?.en || '未命名实体' }
function englishName(item, detail = null) { return item?.en || detail?.asset?.name || item?.name || '' }
function openDetail(item, extra = {}) {
  if (!item) return
  selectedDetail.value = { item, asset: assetFor(item), ...extra }
}
function closeDetail() { selectedDetail.value = null }
function onDetailKeydown(event) {
  if (event.key === 'Escape' && selectedDetail.value) closeDetail()
}
function detailDescriptionZh(detail) { return detail?.asset?.descriptionZh || detail?.item?.descriptionZh || detail?.asset?.perkDetails?.map(perk => perk.descriptionZh).filter(Boolean).join('\n\n') || detail?.item?.perkDetails?.map(perk => perk.descriptionZh).filter(Boolean).join('\n\n') || '' }
function detailDescriptionEn(detail) { return detail?.asset?.description || detail?.item?.description || detail?.asset?.perkDetails?.map(perk => perk.description).filter(Boolean).join('\n\n') || detail?.item?.perkDetails?.map(perk => perk.description).filter(Boolean).join('\n\n') || '' }
function modSummary(mod) { return mod?.descriptionZh || mod?.description || mod?.perkDetails?.map(perk => perk.descriptionZh || perk.description).filter(Boolean).join('；') || `能量 ${mod?.energyCost ?? '—'}` }
function detailSocketPools(detail) {
  const pools = detail?.asset?.socketPools || []
  return pools.filter(pool => pool.socketCategory || pool.plugSetHash || pool.plugItemCount).map(pool => {
    const plugSet = plugSets.value.find(set => String(set.hash) === String(pool.plugSetHash))
    const fallbackItems = (plugSet?.plugItemHashes || []).map(hash => entityForHash(hash)).filter(Boolean)
    const localizedNames = pool.plugNamesZh?.length ? pool.plugNamesZh : fallbackItems.map(item => item.nameZh || item.name).filter(Boolean)
    const englishNames = pool.plugNames?.length ? pool.plugNames : fallbackItems.map(item => item.name).filter(Boolean)
    return { ...pool, localizedNames: [...new Set(localizedNames)], englishNames: [...new Set(englishNames)], plugSet }
  })
}
function detailSources(detail) {
  const asset = detail?.asset
  if (!asset) return []
  const vendors = recordsForHash(vendorEntries, asset.hash)
  const activities = recordsForHash(activityRewards, asset.hash)
  return [...(vendors.length ? vendors : (asset.vendorSources || [])).map(source => ({ kind: '商人', nameZh: source.vendorNameZh || '', nameEn: source.vendorName || '', hash: source.vendorHash })), ...(activities.length ? activities : (asset.activitySources || [])).map(source => ({ kind: '活动', nameZh: source.activityNameZh || '', nameEn: source.activityName || '', hash: source.activityHash }))]
}
function detailSet(detail) {
  const asset = detail?.asset
  return asset?.hash ? itemSets.value.find(candidate => candidate.itemHashes?.includes(asset.hash)) || null : null
}
function detailMeta(detail) {
  const asset = detail?.asset
  if (!asset) return []
  return [asset.weaponFamily && `武器类型：${asset.weaponFamily}`, asset.ammoSlot && `弹药槽：${asset.ammoSlot}`, asset.equipmentSlotName && `装备槽：${asset.equipmentSlotName}`, asset.armorSlot && `护甲部位：${asset.armorSlot}`, asset.categoryNames?.length && `分类：${asset.categoryNames.join(' / ')}`, asset.energyCost != null && `能量：${asset.energyCost}`, asset.tierTypeHash && `品质数据已接入`].filter(Boolean)
}
function detailPerks(detail) {
  return detail?.perks?.length ? detail.perks : detail?.item?.perkDetails?.length ? detail.item.perkDetails : detail?.item?.perkOptionsZh?.length ? detail.item.perkOptionsZh : detail?.item?.perkOptions || detail?.asset?.perkDetails || detail?.asset?.perkOptionsZh || detail?.asset?.perkOptions || []
}
function perkLabel(perk) {
  if (typeof perk !== 'string') return perk?.nameZh || perk?.name || '未命名 Perk'
  const official = manifestPerks.value.find(item => item.name === perk || item.nameZh === perk)
  return official?.nameZh || official?.name || perk
}
function perkEnglishLabel(perk) {
  if (typeof perk !== 'string') return perk?.name || perk?.nameZh || ''
  const official = manifestPerks.value.find(item => item.name === perk || item.nameZh === perk)
  return official?.name || perk
}
function tierTitle(tier) {
  const index = Number(tier?.tierIndex)
  return Number.isFinite(index) && index > 0 ? `第 ${index} 层 / ${tier.displayTitle || `Tier ${index}`}` : (tier?.displayTitle || '未命名层级')
}
const weaponStatLabels = { Impact: '伤害', Range: '射程', Stability: '稳定性', Handling: '操控性', 'Reload Speed': '填装速度', 'Aim Assistance': '辅助瞄准', Zoom: '变焦', 'Recoil Direction': '后坐方向', Magazine: '弹匣', 'Rounds Per Minute': '每分钟发射数', Velocity: '弹速', 'Blast Radius': '爆炸范围', 'Charge Time': '充能时间', 'Draw Time': '拉弓时间', 'Guard Resistance': '防御抗性', 'Guard Efficiency': '防御效率', 'Swing Speed': '挥砍速度' }
function detailStats(detail) {
  const stats = detail?.asset?.baseStats || detail?.item?.baseStats || {}
  return Object.entries(stats).map(([key, value]) => ({ key, label: weaponStatLabels[key] || key, value })).filter(item => Number.isFinite(item.value) && item.value > 0 && !['Attack', 'Power'].includes(item.key)).slice(0, 12)
}
function displayBuildName(build) {
  return (build?.name || '智能配装方案').replace(/\s*(?:可复现基准流)\s*$/, '').trim()
}
function chooseClass(id) {
  selectedClass.value = id
  const first = classSubclasses.value[0]
  selectedSubclass.value = first?.id || ''
  selectedBuildId.value = ''
}
function chooseSubclass(id) {
  selectedSubclass.value = id
  selectedBuildId.value = ''
}
onMounted(() => document.addEventListener('keydown', onDetailKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onDetailKeydown))
</script>

<template>
  <div class="smart-page">
    <section class="smart-hero">
      <div>
        <p class="eyebrow">SMART LOADOUT / ONE-FLOW BUILD</p>
        <h1>智能配装</h1>
        <p class="hero-copy">选择职业、子职业和玩法目标，系统自动组合天赋、技能、武器与模组，并生成一张可以直接保存的配装卡。</p>
      </div>
      <div class="hero-status"><span>推荐引擎</span><strong>BUILD AI / {{ rankedBuilds.length || 0 }} 个候选</strong><small>基于当前站内已核验目录</small><router-link to="/manual-loadout" class="manual-link">改为手动配装 ↗</router-link></div>
    </section>

    <section class="control-panel">
      <div class="control-block"><span class="control-label">01. 职业</span><a-radio-group v-model:value="selectedClass" button-style="solid" class="choice-row" @change="chooseClass(selectedClass)"><a-radio-button v-for="item in classOptions" :key="item.id" :value="item.id">{{ item.name }} <small>{{ item.en }}</small></a-radio-button></a-radio-group></div>
      <div class="control-block"><span class="control-label">02. 子职业</span><a-select v-model:value="selectedSubclass" class="smart-select" @change="chooseSubclass(selectedSubclass)"><a-select-option v-for="item in classSubclasses" :key="item.id" :value="item.id">{{ item.name }} / {{ item.en }}</a-select-option></a-select></div>
      <div class="control-block"><span class="control-label">03. 玩法目标</span><a-radio-group v-model:value="selectedStyle" button-style="solid" class="style-row"><a-radio-button v-for="item in styleOptions" :key="item.id" :value="item.id"><strong>{{ item.name }}</strong><small>{{ item.desc }}</small></a-radio-button></a-radio-group></div>
    </section>

    <section class="candidate-strip" v-if="rankedBuilds.length > 1"><span>智能候选</span><button v-for="item in rankedBuilds.slice(0,4)" :key="item.id" :class="{active:(recommendedBuild?.id===item.id)}" @click="selectedBuildId=item.id">{{ displayBuildName(item) }}</button></section>

    <section v-if="recommendedBuild" class="one-flow-card" :style="{'--accent': classInfo.color}">
        <header class="flow-title"><div><p>{{ classInfo.en }} / {{ subclass?.name || 'SUBCLASS' }} / {{ selectedStyle === 'bossDamage' ? '爆发' : selectedStyle === 'survivability' ? '生存' : '清怪' }}</p><h2>{{ displayBuildName(recommendedBuild) }}</h2><span>{{ recommendedBuild.goal }}</span></div><div class="flow-badge"><b>SMART PICK</b><small>仅显示已通过 Manifest 精确映射</small></div></header>

      <div class="flow-grid top-grid">
        <section class="flow-panel core-panel"><h3>核心装备</h3><button v-if="icon(gearById[recommendedBuild.exoticArmorId])" class="core-item interactive-card" type="button" @click="openDetail(gearById[recommendedBuild.exoticArmorId])"><div class="large-icon"><img :src="icon(gearById[recommendedBuild.exoticArmorId])" :alt="name(gearById[recommendedBuild.exoticArmorId])"></div><div><strong>{{ name(gearById[recommendedBuild.exoticArmorId]) }}</strong><small>{{ englishName(gearById[recommendedBuild.exoticArmorId]) }}</small><small>异域护甲：{{ armorSetById[recommendedBuild.armorSetId]?.name }} / {{ armorSetById[recommendedBuild.armorSetId]?.en }}</small></div></button><p v-else class="data-missing">Manifest 中暂无该装备的官方图标，已隐藏占位内容。</p></section>
        <section class="flow-panel abilities-panel"><h3>天赋与技能 / Abilities <em>点击图标查看详情</em></h3><div class="ability-row"><template v-for="entry in abilityItems" :key="entry.label"><button v-if="icon(entry.item)" class="ability-card interactive-card" type="button" @click="openDetail(entry.item)"><span>{{ entry.label }}</span><div class="icon-box"><img :src="icon(entry.item)" :alt="name(entry.item)"></div><strong>{{ name(entry.item) }}</strong><small>{{ englishName(entry.item) }}</small></button></template></div><div class="trait-row"><div><span>星相 / Aspects</span><button v-for="item in aspectItems" :key="item.id" type="button" class="trait-chip" @click="openDetail(item)">{{ name(item) }}<small>{{ englishName(item) }}</small></button></div><div><span>{{ recommendedBuild.abilities?.facetIds?.length ? '棱镜特性 / Facets' : '碎片 / Fragments' }}</span><button v-for="item in facetItems.slice(0,5)" :key="item.id" type="button" class="trait-chip" @click="openDetail(item)">{{ name(item) }}<small>{{ englishName(item) }}</small></button></div></div></section>
        <section class="flow-panel recommendation-panel"><h3>智能判断</h3><ul><li>优先保证 <b>{{ selectedStyle === 'bossDamage' ? '武器与超能爆发' : selectedStyle === 'survivability' ? '生命与职业技能' : '手雷与近战循环' }}</b></li><li>推荐组合包含 <b>{{ recommendedBuild.mechanicIds?.length || 0 }} 个机制节点</b></li><li v-if="recommendedBuild.championCoverage?.overload?.length">已覆盖超载冠军</li><li v-else>进入高难活动前需补充反冠军武器</li></ul></section>
      </div>

      <section v-if="artifact" class="flow-panel artifact-panel">
        <div class="artifact-heading">
          <div><h3>赛季神器 <em>点击查看全部节点</em></h3><p>本赛季：{{ name(artifact) }} / {{ englishName(artifact) }}，按玩法目标优先解锁关键被动</p></div>
          <button v-if="icon(artifact)" type="button" class="artifact-summary interactive-card" @click="openDetail(artifact)"><div class="artifact-icon"><img :src="icon(artifact)" :alt="name(artifact)"></div><span>{{ artifact.tiers?.length || 0 }} 层，{{ artifact.tiers?.reduce((sum, tier) => sum + (tier.items?.length || 0), 0) || 0 }} 个节点</span></button>
        </div>
        <div class="artifact-grid"><template v-for="tier in artifactHighlights" :key="tier.tierHash"><button v-if="icon(tier.item)" type="button" class="artifact-node interactive-card" @click="openDetail(tier.item, { artifactTier: tier })"><span>{{ tierTitle(tier) }}</span><div class="artifact-node-icon"><img :src="icon(tier.item)" :alt="name(tier.item)"></div><strong>{{ name(tier.item) }}</strong><small>{{ englishName(tier.item) }}</small><small>{{ tier.minimumUnlockPointsUsedRequirement ? `需 ${tier.minimumUnlockPointsUsedRequirement} 点` : '可直接解锁' }}</small></button></template></div>
      </section>

      <p class="data-note">属性增强模组在当前 Manifest 快照中没有可确认的英文实体，已标记为待核验，不展示伪造数值。</p><div class="flow-grid middle-grid">
        <section class="flow-panel weapon-panel"><h3>武器 <em>点击查看词条</em></h3><div class="weapon-list"><template v-for="item in weapons" :key="item.itemId"><button v-if="icon(item.item)" class="weapon-card interactive-card" type="button" @click="openDetail(item.item, { perks: item.perks, purpose: item.purpose })"><div class="weapon-icon"><img :src="icon(item.item)" :alt="name(item.item)"></div><div><span>{{ item.item.slot || '武器槽位' }} / {{ item.item.ammo || '弹药' }}</span><strong>{{ name(item.item) }}</strong><small>{{ englishName(item.item) }}</small><small>{{ item.perks?.join(' + ') || '点击查看官方 Perk 池' }}</small></div></button></template></div></section>
        <section class="flow-panel mod-panel"><h3>模组 / Mods <em>点击查看效果</em></h3><div class="mod-grid"><article v-for="slot in modsBySlot" :key="slot.key"><span>{{ slot.label }}</span><template v-for="mod in slot.mods" :key="mod.id"><button v-if="icon(mod)" class="mod-item interactive-card" type="button" @click="openDetail(mod)"><div class="tiny-icon"><img :src="icon(mod)" :alt="name(mod)"></div><small>{{ name(mod) }}</small><small>{{ englishName(mod) }}</small></button></template></article></div></section>
      </div>

      <div class="flow-grid bottom-grid">
        <section class="flow-panel stats-panel"><h3>六维目标</h3><div class="smart-stats"><article v-for="stat in statTargets" :key="stat.key"><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.hint }}</small></article></div></section>
        <section class="flow-panel armor-panel"><h3>护甲套装 / Armor Set <em>点击查看装备</em></h3><div class="armor-list"><button v-for="piece in armorPieces" :key="piece.item.hash" class="armor-card interactive-card" type="button" @click="openDetail(piece.item)"><div class="armor-icon"><img :src="icon(piece.item)" :alt="name(piece.item)"></div><small>{{ piece.label }}</small><strong>{{ name(piece.item) }}</strong><small>{{ englishName(piece.item) }}</small></button></div><p v-if="armorPieces.length">{{ armorSetById[recommendedBuild.armorSetId]?.name }} / {{ armorSetById[recommendedBuild.armorSetId]?.en }}：仅展示 Manifest 中存在官方图标的真实装备</p><p v-else class="data-missing">Manifest 中暂无该套装的可用部位数据，未生成占位装备。</p><div class="ghost-heading"><span>机灵模组 / Ghost Mods</span><small>按当前玩法自动推荐，点击查看</small></div><div class="ghost-list"><button v-for="mod in ghostMods" :key="mod.hash" class="ghost-card interactive-card" type="button" @click="openDetail(mod)"><div class="ghost-icon"><img :src="icon(mod)" :alt="name(mod)"></div><div><strong>{{ name(mod) }}</strong><small>{{ englishName(mod) }}</small><small>{{ modSummary(mod) }}</small></div></button></div></section>
      </div>
    </section>
    <div v-if="selectedDetail" class="detail-overlay" role="presentation" @click.self="closeDetail">
      <section class="detail-dialog" role="dialog" aria-modal="true" :aria-label="`${name(selectedDetail.item)} 详情`">
        <button type="button" class="detail-close" aria-label="关闭详情" @click="closeDetail">×</button>
        <div class="detail-head"><div class="detail-icon"><img v-if="icon(selectedDetail.item)" :src="icon(selectedDetail.item)" :alt="name(selectedDetail.item)"><span v-else class="data-missing">暂无官方图标</span></div><div><p>{{ selectedDetail.item?.type || selectedDetail.item?.kind || 'BUILD COMPONENT' }}</p><h2>{{ name(selectedDetail.item) }}</h2><small>{{ englishName(selectedDetail.item, selectedDetail) }}</small></div></div>
        <div v-if="detailDescriptionZh(selectedDetail) || detailDescriptionEn(selectedDetail)" class="detail-description"><p v-if="detailDescriptionZh(selectedDetail)"><b>中文</b> {{ detailDescriptionZh(selectedDetail) }}</p><p v-if="detailDescriptionEn(selectedDetail)"><b>English</b> {{ detailDescriptionEn(selectedDetail) }}</p></div>
        <div v-if="detailMeta(selectedDetail).length" class="detail-section"><h3>Manifest 实体信息</h3><div class="detail-pills"><span v-for="meta in detailMeta(selectedDetail)" :key="meta">{{ meta }}</span></div></div>
        <div v-if="detailSet(selectedDetail)" class="detail-section"><h3>装备套装 / Item Set</h3><div class="detail-pills"><span><b>中文</b> {{ detailSet(selectedDetail).nameZh || '中文本地化未返回' }}</span><span><b>English</b> {{ detailSet(selectedDetail).name || '名称未返回' }}</span><template v-for="perk in detailSet(selectedDetail).perks || []" :key="`${perk.sandboxPerkHash}-${perk.requiredSetCount}`"><span><b>{{ perk.requiredSetCount }} 件套</b> {{ perk.nameZh || '中文本地化未返回' }}<small>{{ perk.name || 'English name unavailable' }}</small></span></template></div></div>
        <div v-if="detailStats(selectedDetail).length" class="detail-section"><h3>武器素体数值</h3><div class="entity-stats"><div v-for="stat in detailStats(selectedDetail)" :key="stat.key" class="entity-stat"><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><i><b :style="{ width: `${Math.min(100, Math.max(0, Number(stat.value) / (stat.key === 'Rounds Per Minute' ? 1200 : 100) * 100))}%` }"></b></i></div></div></div>
        <div v-if="detailPerks(selectedDetail).length" class="detail-section"><h3>Perk / 词条</h3><div class="detail-pills"><span v-for="perk in detailPerks(selectedDetail)" :key="typeof perk === 'string' ? perk : perk.hash"><b>{{ perkLabel(perk) }}</b><small>{{ perkEnglishLabel(perk) }}</small></span></div></div>
        <div v-if="detailSocketPools(selectedDetail).length" class="detail-section"><h3>Socket / PlugSet</h3><div class="perk-pool"><article v-for="(pool, index) in detailSocketPools(selectedDetail)" :key="`${pool.socketTypeHash}-${index}`"><span>{{ pool.socketCategory || '未分类插槽' }} · 第 {{ index + 1 }} 列 · {{ pool.plugItemCount || 0 }} 个可选项</span><p v-if="pool.localizedNames?.length">中文：{{ pool.localizedNames.join('、') }}</p><small v-if="pool.englishNames?.length">English: {{ pool.englishNames.join(', ') }}</small><p v-if="!pool.localizedNames?.length && !pool.englishNames?.length">该插槽的 PlugSet 仅提供哈希数据，名称未在当前本地化快照中返回。</p></article></div></div>
        <div v-if="detailSources(selectedDetail).length" class="detail-section"><h3>Manifest 获取来源 / Acquisition</h3><div class="detail-pills"><span v-for="source in detailSources(selectedDetail)" :key="`${source.kind}-${source.hash}`"><b>{{ source.kind }}</b> {{ source.nameZh || '中文本地化未返回' }}<small>{{ source.nameEn || 'English name unavailable' }}</small></span></div></div>
        <div v-if="selectedDetail.item?.tiers?.length" class="detail-section"><h3>神器节点</h3><div class="artifact-detail-tiers"><article v-for="tier in selectedDetail.item.tiers" :key="tier.tierHash"><span>{{ tierTitle(tier) }}：{{ tier.minimumUnlockPointsUsedRequirement ? `需 ${tier.minimumUnlockPointsUsedRequirement} 点` : '起始层' }}</span><div><button v-for="node in tier.items" :key="node.hash" type="button" class="artifact-detail-node interactive-card" @click="openDetail(node, { artifactTier: tier })"><img v-if="icon(node)" :src="icon(node)" :alt="name(node)"><strong>{{ name(node) }}</strong><small>{{ englishName(node) }}</small></button></div></article></div></div>
        <div v-if="selectedDetail.artifactTier" class="detail-section"><h3>{{ tierTitle(selectedDetail.artifactTier) }}：节点说明</h3><div class="detail-description"><p v-if="selectedDetail.item?.descriptionZh"><b>中文</b> {{ selectedDetail.item.descriptionZh }}</p><p v-if="selectedDetail.item?.description"><b>English</b> {{ selectedDetail.item.description }}</p><p v-if="!selectedDetail.item?.descriptionZh && !selectedDetail.item?.description" class="data-missing">Manifest 未返回该节点的中英文说明。</p></div></div>
        <div v-if="selectedDetail.purpose" class="detail-section"><h3>推荐职责</h3><p>{{ selectedDetail.purpose }}</p></div>
        <div v-if="selectedDetail.item?.mechanicIds?.length" class="detail-section"><h3>关联机制</h3><div class="detail-pills"><span v-for="mechanic in selectedDetail.item.mechanicIds" :key="mechanic">{{ mechanic }}</span></div></div>
        <small class="detail-source">点击卡片外区域或右上角关闭</small>
      </section>
    </div>
    <div v-else class="empty">当前筛选没有可用的已核验构筑。</div>
  </div>
</template>

<style scoped>
.smart-page{padding-bottom:4rem}.smart-hero{display:flex;justify-content:space-between;gap:2rem;align-items:end;padding:2.5rem 0 2rem;border-bottom:1px solid var(--line-soft)}.eyebrow{color:var(--gold-dim);font:.68rem var(--font-en);letter-spacing:.24em}.smart-hero h1{font-family:var(--font-cn);font-size:clamp(2.4rem,6vw,4.7rem);letter-spacing:-.06em;margin:.4rem 0}.hero-copy{max-width:42rem;color:var(--text-sub)}.hero-status{min-width:13rem;padding:1rem;border-left:2px solid var(--accent);background:rgba(255,255,255,.03)}.hero-status span,.hero-status small{display:block;color:var(--text-dim);font-size:.68rem}.hero-status strong{display:block;color:var(--gold-bright);font:.8rem var(--font-en);margin:.3rem 0}.control-panel{display:grid;grid-template-columns:1fr 1.1fr 1.8fr;gap:1px;margin:1.2rem 0;background:var(--line-soft);border:1px solid var(--line-soft)}.control-block{padding:1rem;background:rgba(10,15,30,.9)}.control-label{display:block;color:var(--gold-dim);font:.65rem var(--font-en);margin-bottom:.7rem}.choice-row,.style-row{display:flex;gap:.5rem;flex-wrap:wrap}.choice,.style-choice{border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);cursor:pointer}.choice{padding:.55rem .7rem}.choice small{display:block;color:var(--text-dim);font:.55rem var(--font-en);margin-top:.15rem}.choice.active,.style-choice.active{background:rgba(232,193,90,.1);border-color:var(--gold);color:var(--gold-bright)}.smart-select{width:100%;height:2.7rem;padding:0 .7rem;border:1px solid var(--line-soft);background:var(--bg-deep);color:var(--text-main)}.style-choice{flex:1 1 8rem;text-align:left;padding:.55rem}.style-choice strong,.style-choice small{display:block}.style-choice strong{font-size:.78rem}.style-choice small{font-size:.63rem;color:var(--text-dim);margin-top:.2rem}.candidate-strip{display:flex;align-items:center;gap:.5rem;overflow:auto;margin:1rem 0;color:var(--text-dim);font-size:.7rem}.candidate-strip button{white-space:nowrap;padding:.35rem .6rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);cursor:pointer}.candidate-strip button.active{border-color:var(--gold);color:var(--gold-bright);background:rgba(232,193,90,.08)}.one-flow-card{background:#171717;border:1px solid var(--line-soft);box-shadow:0 25px 70px rgba(0,0,0,.4)}.flow-title{display:flex;justify-content:space-between;gap:1rem;padding:1.5rem 1.7rem;background:linear-gradient(110deg,rgba(255,255,255,.05),rgba(255,255,255,0)),linear-gradient(90deg,rgba(232,193,90,.13),transparent 60%);border-bottom:1px solid var(--line-soft)}.flow-title p{color:var(--gold-dim);font:.63rem var(--font-en);letter-spacing:.14em}.flow-title h2{font-family:var(--font-cn);font-size:1.7rem;margin:.25rem 0}.flow-title span{font-size:.73rem;color:var(--text-sub)}.flow-badge{display:flex;flex-direction:column;align-items:end;gap:.2rem}.flow-badge b{font:.65rem var(--font-en);color:var(--gold-bright)}.flow-badge small{color:var(--text-dim);font-size:.64rem}.flow-grid{display:grid;gap:1px;background:var(--line-soft)}.top-grid{grid-template-columns:1fr 2.4fr 1fr}.middle-grid{grid-template-columns:1fr 1.25fr}.bottom-grid{grid-template-columns:1fr 1.25fr}.flow-panel{padding:1.1rem;background:#1d1d1d;min-width:0}.flow-panel h3{font-family:var(--font-cn);font-size:.82rem;margin:0 0 .85rem;color:var(--text-main)}.core-item{display:grid;gap:.7rem}.large-icon{width:100%;aspect-ratio:1.1;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.large-icon img{width:100%;height:100%;object-fit:cover}.large-icon b{font:700 2.3rem var(--font-en);color:var(--gold-bright)}.core-item strong,.core-item small{display:block}.core-item strong{font-size:.8rem}.core-item small{color:var(--text-dim);font-size:.62rem;margin-top:.2rem}.ability-row{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}.ability-row article{text-align:center;min-width:0}.ability-row span{display:block;color:var(--text-dim);font-size:.58rem;margin-bottom:.3rem}.icon-box{width:100%;aspect-ratio:1;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.icon-box img{width:100%;height:100%;object-fit:cover}.icon-box b{font:700 1.2rem var(--font-en);color:var(--gold-bright)}.ability-row strong{display:block;font-size:.62rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.3rem}.trait-row{display:grid;grid-template-columns:1fr 1.5fr;gap:.8rem;margin-top:1rem}.trait-row div{display:flex;flex-wrap:wrap;gap:.25rem}.trait-row span{width:100%;color:var(--gold-dim);font-size:.6rem}.trait-row b{padding:.22rem .38rem;background:rgba(255,255,255,.06);font-size:.62rem;font-weight:500}.recommendation-panel ul{padding-left:1rem;margin:0;color:var(--text-sub);font-size:.7rem}.recommendation-panel li{margin:.55rem 0}.recommendation-panel b{color:var(--gold-bright)}.weapon-list{display:grid;gap:.4rem}.weapon-list article{display:grid;grid-template-columns:3.2rem 1fr;align-items:center;gap:.6rem;padding:.4rem;background:#151515;border:1px solid var(--line-soft)}.weapon-icon{width:3.2rem;height:3.2rem;background:#111;display:flex;align-items:center;justify-content:center;overflow:hidden}.weapon-icon img{width:100%;height:100%;object-fit:cover}.weapon-icon b{font:700 1.2rem var(--font-en);color:var(--gold-bright)}.weapon-list span,.weapon-list small{display:block;color:var(--text-dim);font-size:.58rem}.weapon-list strong{display:block;font-size:.72rem}.weapon-list small{color:var(--gold-dim);margin-top:.15rem}.mod-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:.35rem}.mod-grid article{min-width:0}.mod-grid article>span{display:block;color:var(--text-dim);font-size:.58rem;margin-bottom:.35rem}.mod-item{display:grid;gap:.18rem;margin-bottom:.4rem}.tiny-icon{width:100%;aspect-ratio:1;background:#272727;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.tiny-icon img{width:100%;height:100%;object-fit:cover}.tiny-icon b{font-size:.75rem;color:var(--gold-bright)}.mod-item small{font-size:.54rem;color:var(--text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.smart-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft)}.smart-stats article{padding:.75rem;background:#171717;min-height:5.4rem}.smart-stats span,.smart-stats small{display:block}.smart-stats span{color:var(--text-sub);font-size:.7rem}.smart-stats strong{display:block;color:var(--gold-bright);font:700 1.1rem var(--font-en);margin:.2rem 0}.smart-stats small{color:var(--text-dim);font-size:.55rem}.armor-list{display:grid;grid-template-columns:repeat(5,1fr);gap:.4rem}.armor-list article{min-width:0}.armor-icon{width:100%;aspect-ratio:1;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.armor-icon img{width:100%;height:100%;object-fit:cover}.armor-icon b{color:var(--gold-dim);font:700 1rem var(--font-en)}.armor-list small,.armor-list strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.armor-list small{color:var(--text-dim);font-size:.55rem;margin-top:.25rem}.armor-list strong{font-size:.6rem}.armor-panel p{color:var(--gold-dim);font-size:.62rem;margin-top:.8rem}.empty{text-align:center;padding:4rem;color:var(--text-dim)}
@media(max-width:900px){.smart-hero{align-items:start;flex-direction:column}.hero-status{width:100%}.control-panel,.top-grid,.middle-grid,.bottom-grid{grid-template-columns:1fr}.mod-grid{grid-template-columns:repeat(5,1fr)}}
@media(max-width:560px){.ability-row{grid-template-columns:repeat(2,1fr)}.trait-row{grid-template-columns:1fr}.smart-stats{grid-template-columns:repeat(2,1fr)}.armor-list{grid-template-columns:repeat(3,1fr)}.flow-title{padding:1.1rem;flex-direction:column}.flow-badge{align-items:start}.flow-title h2{font-size:1.35rem}}
.large-icon{width:5.5rem;height:5.5rem;aspect-ratio:auto;margin:0 auto}.large-icon img{object-fit:contain}.icon-box{width:3.4rem;height:3.4rem;aspect-ratio:auto;margin:0 auto}.icon-box img{object-fit:contain}.weapon-icon{width:2.65rem;height:2.65rem}.weapon-icon img,.armor-icon img,.tiny-icon img{object-fit:contain}.armor-icon{width:3.25rem;height:3.25rem;aspect-ratio:auto}.tiny-icon{width:2.7rem;height:2.7rem;aspect-ratio:auto}
.ghost-heading{display:flex;justify-content:space-between;align-items:baseline;margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--line-soft)}.ghost-heading span{color:var(--gold-dim);font-size:.65rem}.ghost-heading small{color:var(--text-dim);font-size:.56rem}.ghost-list{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-top:.55rem}.ghost-list article{display:grid;grid-template-columns:2.35rem 1fr;align-items:center;gap:.45rem;min-width:0}.ghost-icon{width:2.35rem;height:2.35rem;background:#272727;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.ghost-icon img{width:100%;height:100%;object-fit:contain}.ghost-icon b{color:var(--gold-bright);font:.8rem var(--font-en)}.ghost-list strong,.ghost-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ghost-list strong{font-size:.6rem}.ghost-list small{color:var(--text-dim);font-size:.52rem;margin-top:.12rem}
.interactive-card{border:0;background:transparent;color:inherit;text-align:inherit;cursor:pointer;padding:0;transition:background .18s,border-color .18s,transform .18s}.interactive-card:hover{background:rgba(232,193,90,.08);transform:translateY(-1px)}.interactive-card:focus-visible{outline:2px solid var(--gold-bright);outline-offset:3px}.core-item.interactive-card{width:100%;padding:.35rem}.ability-card{width:100%;padding:.25rem;border:1px solid transparent}.weapon-card{width:100%;display:grid;grid-template-columns:2.65rem 1fr;align-items:center;gap:.6rem;padding:.4rem;background:#151515;border:1px solid var(--line-soft);text-align:left}.mod-item{width:100%;padding:.18rem;text-align:left}.trait-chip{border:1px solid transparent;background:rgba(255,255,255,.06);color:var(--text-sub);padding:.22rem .38rem;font:inherit;font-size:.62rem;cursor:pointer}.trait-chip:hover{border-color:var(--gold-dim);color:var(--gold-bright)}.armor-card{width:100%;text-align:left}.ghost-card{width:100%;display:grid;grid-template-columns:2.35rem 1fr;align-items:center;gap:.45rem;padding:.18rem;text-align:left}.flow-panel h3 em{float:right;color:var(--text-dim);font-size:.52rem;font-style:normal;font-weight:400}.choice-row,.style-row{display:flex!important;gap:.5rem;flex-wrap:wrap}.choice-row .ant-radio-button-wrapper,.style-row .ant-radio-button-wrapper{height:auto;min-height:2.4rem;padding:.45rem .7rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);line-height:1.25}.choice-row .ant-radio-button-wrapper::before,.style-row .ant-radio-button-wrapper::before{display:none}.choice-row .ant-radio-button-wrapper small,.style-row .ant-radio-button-wrapper small{display:block;color:var(--text-dim);font-size:.55rem;line-height:1.1;margin-top:.15rem}.choice-row .ant-radio-button-wrapper-checked,.style-row .ant-radio-button-wrapper-checked{border-color:var(--gold);background:rgba(232,193,90,.1);color:var(--gold-bright)}.style-row .ant-radio-button-wrapper{flex:1 1 8rem;text-align:left}.style-row .ant-radio-button-wrapper strong,.style-row .ant-radio-button-wrapper small{display:block}.smart-select{height:2.7rem}.smart-select :deep(.ant-select-selector){height:2.7rem!important;display:flex;align-items:center}.smart-select :deep(.ant-select-selection-item){line-height:2.55rem}
.detail-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:1.25rem;background:rgba(3,6,12,.78);backdrop-filter:blur(8px)}.detail-dialog{position:relative;width:min(33rem,100%);max-height:min(42rem,calc(100vh - 2.5rem));overflow:auto;padding:1.35rem;background:linear-gradient(155deg,#202b43,#0c1220);border:1px solid var(--line);box-shadow:0 24px 80px rgba(0,0,0,.6)}.detail-close{position:absolute;right:.75rem;top:.55rem;width:2rem;height:2rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);font-size:1.35rem;line-height:1;cursor:pointer}.detail-close:hover{color:var(--gold-bright);border-color:var(--gold)}.detail-head{display:grid;grid-template-columns:5rem 1fr;align-items:center;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}.detail-icon{width:5rem;height:5rem;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.detail-icon img{width:100%;height:100%;object-fit:contain}.detail-icon b{font:700 1.8rem var(--font-en);color:var(--gold-bright)}.detail-head p{color:var(--gold-dim);font:.58rem var(--font-en);letter-spacing:.12em}.detail-head h2{font-family:var(--font-cn);font-size:1.25rem;margin:.2rem 0}.detail-head small{color:var(--text-dim);font:.62rem var(--font-en)}.detail-description{color:var(--text-sub);font-size:.76rem;white-space:pre-line;margin:1rem 0}.detail-section{padding-top:.8rem;margin-top:.8rem;border-top:1px solid var(--line-soft)}.detail-section h3{font-family:var(--font-cn);font-size:.7rem;margin:0 0 .5rem;color:var(--gold-dim)}.detail-section p{font-size:.72rem}.detail-pills{display:flex;flex-wrap:wrap;gap:.35rem}.detail-pills span{padding:.3rem .45rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.05);color:var(--text-sub);font-size:.64rem}.detail-pills span small{display:block;color:var(--text-dim);font-size:.58rem;margin-top:.12rem}.detail-pills span>b{color:var(--gold-dim);font-weight:600}.detail-source{display:block;margin-top:1.1rem;color:var(--text-dim);font-size:.58rem}
</style>
<style scoped>
.manual-link{display:block;margin-top:.55rem;color:var(--gold-bright);font-size:.62rem}
</style>
<style scoped>
.data-missing{color:var(--text-dim);font-size:.62rem;line-height:1.5}
</style>
<style scoped>
.artifact-panel{border-top:1px solid var(--line-soft)}.artifact-heading{display:flex;justify-content:space-between;gap:1rem;align-items:center}.artifact-heading h3{margin-bottom:.25rem}.artifact-heading p{margin:0;color:var(--text-dim);font-size:.62rem}.artifact-summary{display:flex;align-items:center;gap:.5rem;color:var(--text-sub);font-size:.62rem}.artifact-icon{width:2.8rem;height:2.8rem;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.artifact-icon img{width:100%;height:100%;object-fit:contain}.artifact-icon b{color:var(--gold-bright);font:700 1rem var(--font-en)}.artifact-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:.45rem;margin-top:.75rem}.artifact-node{display:grid;gap:.22rem;text-align:center;padding:.35rem;background:rgba(255,255,255,.035);border:1px solid var(--line-soft)}.artifact-node>span{color:var(--gold-dim);font-size:.56rem}.artifact-node-icon{width:2.8rem;height:2.8rem;margin:.1rem auto 0;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.artifact-node-icon img{width:100%;height:100%;object-fit:contain}.artifact-node-icon b{color:var(--gold-bright)}.artifact-node strong{font-size:.58rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.artifact-node small{color:var(--text-dim);font-size:.52rem}.artifact-detail-tiers{display:grid;gap:.6rem}.artifact-detail-tiers article{padding:.45rem;background:rgba(255,255,255,.04)}.artifact-detail-tiers article>span{display:block;color:var(--gold-dim);font-size:.58rem;margin-bottom:.35rem}.artifact-detail-tiers article>div{display:grid;grid-template-columns:repeat(2,1fr);gap:.3rem}.artifact-detail-node{display:grid;grid-template-columns:1.7rem 1fr;align-items:center;gap:.3rem;padding:.2rem;text-align:left;color:var(--text-sub)}.artifact-detail-node img{width:1.7rem;height:1.7rem;object-fit:contain;background:#111}.artifact-detail-node strong{font-size:.58rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.entity-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem .8rem}.entity-stat{display:grid;grid-template-columns:1fr auto;align-items:center;gap:.25rem}.entity-stat span{color:var(--text-sub);font-size:.64rem}.entity-stat strong{color:var(--text-main);font:700 .68rem var(--font-en)}.entity-stat i{grid-column:1/-1;height:3px;background:rgba(255,255,255,.08);overflow:hidden}.entity-stat i b{display:block;height:100%;background:var(--gold)}.perk-pool{display:grid;gap:.45rem}.perk-pool article{padding:.45rem .55rem;background:rgba(255,255,255,.04);border-left:2px solid var(--gold-dim)}.perk-pool span{display:block;color:var(--gold-dim);font-size:.58rem}.perk-pool p{color:var(--text-sub);font-size:.64rem;margin-top:.2rem;line-height:1.55}
@media(max-width:560px){.artifact-heading{align-items:flex-start;flex-direction:column}.artifact-summary{align-self:flex-start}.artifact-grid{grid-template-columns:repeat(3,1fr)}}
.artifact-detail-node strong,.artifact-detail-node small{grid-column:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.artifact-detail-node strong{font-size:.58rem}.artifact-detail-node small{color:var(--text-dim);font-size:.5rem}
.ability-card small,.trait-chip small,.mod-item small{display:block;color:var(--text-dim);font-size:.5rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trait-chip{display:inline-block;max-width:100%}
</style>
