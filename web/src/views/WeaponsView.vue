<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import StableDisclosure from '@/components/StableDisclosure.vue'
import { ui, useI18n, localized, manifestDescription } from '@/i18n'
import RelatedBuilds from '@/components/RelatedBuilds.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { weaponTypes } from '@/data/weapons'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { weaponBaseStats, weaponArchivePerks, weaponIntrinsics, weaponChampionCounters, weaponVersionHighlights, weaponVersionGroups, weaponVersionKey, matchWeaponVersion } from '../../../packages/manifest-catalog/weapon-details.js'
import { perkLabel } from '@/i18n/metadata'
import { manifestText } from '@/utils/manifestText'

const { t, locale } = useI18n()
const { weaponItems, status, iconFor, assetFor, recordsForHash, vendorEntries, activityRewards } = useManifestAssets()

const { byHash: plugsByHash, state: perkState, load: loadPerks } = useWeaponPerks()
onMounted(loadPerks)
const selectedStats = computed(() => weaponBaseStats(selectedWeapon.value))
const selectedPools = computed(() => pools(selectedWeapon.value))
const intrinsics = computed(() => weaponIntrinsics(selectedWeapon.value, plugsByHash.value))
const versionGroups = computed(() => weaponVersionGroups(weaponItems.value))
const versionsFor = item => item ? versionGroups.value.get(weaponVersionKey(item)) || [] : []
const versions = computed(() => versionsFor(selectedWeapon.value))
const versionDiffs = computed(() => selectedWeapon.value && versions.value.length > 1 ? weaponVersionHighlights(selectedWeapon.value, versions.value, plugsByHash.value) : [])
const versionNumber = item => versionsFor(item).findIndex(version => version.hash === item.hash) + 1
const versionSummary = item => weaponBaseStats(item).filter(stat => ['Rounds Per Minute', 'Charge Time', 'Draw Time', 'Impact', 'Range', 'Handling'].includes(stat.key)).map(stat => `${stat.label} ${stat.value}`).join(' ')
const watermark = item => item.iconWatermark ? `https://www.bungie.net${item.iconWatermark}` : ''
const plugIcon = plug => plug.icon ? (plug.icon.startsWith('http') ? plug.icon : `https://www.bungie.net${plug.icon}`) : ''
const championIcon = champion => champion?.icon ? `https://www.bungie.net${champion.icon}` : ''
const plugDescription = plug => manifestText(manifestDescription(plug), locale.value)
const selectedChampions = computed(() => weaponChampionCounters(selectedWeapon.value, plugsByHash.value, versions.value))
const selectedSources = computed(() => sources(selectedWeapon.value))
const championTags = item => weaponChampionCounters(item, plugsByHash.value, versionsFor(item))

const route = useRoute()
const keyword = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { keyword.value = String(value || '') })
const slotFilter = ref('')
const familyFilter = ref('')
const elementFilter = ref('')
const rarityFilter = ref('')
const sortBy = ref('name')
const selectedWeapon = ref(null)
const detailDialog = ref(null)
const manifestSection = ref(null)
let returnFocus = null
let bodyOverflow = ''
const showAllVersions = ref(false)
const visibleLimit = ref(120)
watch([keyword, slotFilter, familyFilter, elementFilter, rarityFilter, sortBy, showAllVersions], () => { visibleLimit.value = 120 })

const slots = [
  { id: '', label: '全部槽位', en: 'All slots' },
  { id: 'kinetic', label: '动能槽', en: 'Kinetic' },
  { id: 'energy', label: '能量槽', en: 'Energy' },
  { id: 'power', label: '重型槽', en: 'Power' }
]
const officialSlotNames = { '': '全部槽位', kinetic: '动能槽', energy: '能量槽', power: '重型槽' }


const weaponFamilyLabels = {
  'Auto Rifle': '自动步枪', Bows: '弓', 'Fusion Rifle': '融合步枪', Glaives: '长戟',
  'Grenade Launchers': '榴弹发射器', 'Hand Cannon': '手炮', 'Machine Gun': '机枪',
  'Pulse Rifle': '脉冲步枪', 'Rocket Launcher': '火箭筒', 'Scout Rifle': '斥候步枪',
  Shotgun: '霰弹枪', Sidearm: '手枪', 'Sniper Rifle': '狙击枪',
  'Submachine Guns': '冲锋枪', Sword: '剑', 'Trace Rifles': '追踪步枪'
}
const familyLabel = family => weaponFamilyLabels[family] || family
const familyOptions = computed(() => [...new Set(weaponItems.value.map(item => item.weaponFamily).filter(Boolean))].sort().map(value => ({ value, label: familyLabel(value) })))
const elementOptions = [
  { id: '', label: '全部元素', en: 'All elements' },
  { id: '1', label: '动能', en: 'Kinetic' },
  { id: '2', label: '电弧', en: 'Arc' },
  { id: '3', label: '烈日', en: 'Solar' },
  { id: '4', label: '虚空', en: 'Void' },
  { id: '6', label: '冰影', en: 'Stasis' },
  { id: '7', label: '缚丝', en: 'Strand' }
]
const elementLabel = item => ui(elementOptions.find(option => option.id === String(item?.damageType))?.label || '元素未登记')
const rarityOptions = [
  { id: '', label: '全部稀有度', en: 'All rarities' },
  { id: 'exotic', label: '异域', en: 'Exotic' },
  { id: 'legendary', label: '传说', en: 'Legendary' },
  { id: 'other', label: '其他', en: 'Other' }
]
const query = computed(() => keyword.value.trim().toLowerCase())
const isExotic = item => item?.tierTypeHash === 2759499571
const isLegendary = item => item?.tierTypeHash === 4008398120
const matchesSlot = item => !slotFilter.value || item.ammoSlot === slotFilter.value
const matchesElement = item => !elementFilter.value || String(item.damageType) === elementFilter.value
const matchesRarity = item => !rarityFilter.value || (rarityFilter.value === 'exotic' ? isExotic(item) : rarityFilter.value === 'legendary' ? isLegendary(item) : !isExotic(item) && !isLegendary(item))
const matchesQuery = item => matchWeaponVersion(item, keyword.value, versionsFor(item), [familyLabel(item.weaponFamily)])
const matchingWeapons = computed(() => weaponItems.value.filter(item => matchesSlot(item) && (!familyFilter.value || item.weaponFamily === familyFilter.value) && matchesElement(item) && matchesRarity(item) && matchesQuery(item)))
const matchingGroups = computed(() => weaponVersionGroups(matchingWeapons.value))
const officialCount = computed(() => showAllVersions.value ? matchingWeapons.value.length : matchingGroups.value.size)
const officialWeapons = computed(() => {
  const result = showAllVersions.value ? [...matchingWeapons.value] : [...matchingGroups.value.values()].map(group => group[0])
  return result.sort((a, b) => {
    const primary = sortBy.value === 'rarity' ? Number(isExotic(b)) - Number(isExotic(a)) || Number(isLegendary(b)) - Number(isLegendary(a)) : sortBy.value === 'family' ? (a.weaponFamily || '').localeCompare(b.weaponFamily || '') : 0
    return primary || zhName(a).localeCompare(zhName(b), 'zh') || versionNumber(a) - versionNumber(b)
  }).slice(0, visibleLimit.value)
})
const displayedCount = computed(() => officialWeapons.value.length)
const exoticIndex = computed(() => slots.slice(1).map(slot => {
  const definitions = weaponItems.value.filter(item => isExotic(item) && item.ammoSlot === slot.id)
  const groups = [...weaponVersionGroups(definitions).values()]
  return {
    ...slot,
    definitions: definitions.length,
    weapons: groups.length,
    previews: groups.map(group => group[0]).sort((a, b) => zhName(a).localeCompare(zhName(b), 'zh')).slice(0, 6)
  }
}))
const exoticWeaponCount = computed(() => exoticIndex.value.reduce((total, slot) => total + slot.weapons, 0))
const filteredArchetypes = computed(() => weaponTypes.filter(w => (!slotFilter.value || (slotFilter.value === 'kinetic' ? w.slot.includes('动能') : slotFilter.value === 'energy' ? w.slot.includes('能量') : w.slot.includes('重型'))) && (!query.value || `${w.name} ${w.en} ${w.desc} ${ui(w.desc)}`.toLowerCase().includes(query.value))))

function zhName(item) { return localized(item) || ui('未命名武器') }
function enName(item) { return item?.name || item?.en || item?.nameZh || 'Unnamed weapon' }
function icon(item) { const value = iconFor(item); return value || (item?.icon ? `https://www.bungie.net${item.icon}` : '') }
function slotLabel(item) { return ui(officialSlotNames[item?.ammoSlot] || item?.ammoSlot || '槽位未登记') }
function rarityLabel(item) { return ui(isExotic(item) ? '异域 / Exotic' : isLegendary(item) ? '传说 / Legendary' : '其他 / Other') }
function pools(item) { return weaponArchivePerks(item, plugsByHash.value) }
function sources(item) {
  const asset = assetFor(item) || item
  const vendors = recordsForHash(vendorEntries, asset.hash)
  const activities = recordsForHash(activityRewards, asset.hash)
  return [...(vendors.length ? vendors : asset.vendorSources || []).slice(0, 3).map(source => ({ kind: '商人 / Vendor', zh: source.vendorNameZh || '中文本地化未返回', en: source.vendorName || 'English name unavailable' })), ...(activities.length ? activities : asset.activitySources || []).slice(0, 3).map(source => ({ kind: '活动 / Activity', zh: source.activityNameZh || '中文本地化未返回', en: source.activityName || 'English name unavailable' }))]
}
function openDetail(item) {
  if (!selectedWeapon.value) returnFocus = document.activeElement
  selectedWeapon.value = item
}
function closeDetail() { selectedWeapon.value = null }
function resetFilters() { keyword.value = ''; slotFilter.value = ''; familyFilter.value = ''; elementFilter.value = ''; rarityFilter.value = ''; sortBy.value = 'name'; showAllVersions.value = false }
async function browseExoticSlot(slot) {
  keyword.value = ''
  slotFilter.value = slot
  familyFilter.value = ''
  elementFilter.value = ''
  rarityFilter.value = 'exotic'
  sortBy.value = 'name'
  showAllVersions.value = false
  await nextTick()
  manifestSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(selectedWeapon, async (weapon, previous) => {
  if (weapon && !previous) {
    bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    detailDialog.value?.focus()
  } else if (!weapon && previous) {
    document.body.style.overflow = bodyOverflow
    returnFocus?.focus?.()
    returnFocus = null
  }
})
onBeforeUnmount(() => { document.body.style.overflow = bodyOverflow })
</script>

<template>
  <div class="weapons-page">
    <div class="page-head weapon-head"><div><p class="eyebrow">WEAPON ARCHIVE / MANIFEST ATLAS</p><h1>{{ t('pages.weapons.title') }}</h1><p>{{ t('pages.weapons.subtitle') }}</p></div><div class="catalog-stat"><strong>{{ weaponItems.length.toLocaleString() }}</strong><span>{{ ui("官方武器实体 / Manifest weapon entities") }}</span></div></div>

    <section class="weapon-controls panel">
      <div class="control-main"><a-input v-model:value="keyword" size="large" allow-clear :aria-label="ui(&quot;搜索武器&quot;)" :placeholder="ui(&quot;搜索武器、Hash 或 武器名#定义编号…&quot;)" /><button class="reset-link" type="button" @click="resetFilters">{{ ui("重置筛选 / Reset") }}</button></div>
      <div class="filter-row">
        <a-radio-group v-model:value="slotFilter" button-style="solid" class="filter-radio" :aria-label="ui(&quot;槽位筛选&quot;)"><a-radio-button v-for="slot in slots" :key="slot.id" :value="slot.id">{{ ui(slot.label) }}<small>{{ slot.en }}</small></a-radio-button></a-radio-group>
        <a-select v-model:value="familyFilter" class="filter-select" option-label-prop="label" :aria-label="ui(&quot;武器类型筛选&quot;)"><a-select-option value="" :label="ui(&quot;全部武器类型&quot;)">{{ ui("全部武器类型") }} / All families</a-select-option><a-select-option v-for="family in familyOptions" :key="family.value" :value="family.value" :label="locale === 'en' ? family.value : family.label">{{ family.label }} / {{ family.value }}</a-select-option></a-select>
        <a-select v-model:value="elementFilter" class="filter-select element-select" option-label-prop="label" :aria-label="ui(&quot;元素筛选&quot;)"><a-select-option v-for="element in elementOptions" :key="element.id" :value="element.id" :label="locale === 'en' ? element.en : element.label">{{ ui(element.label) }} / {{ element.en }}</a-select-option></a-select>
        <a-select v-model:value="rarityFilter" class="filter-select" option-label-prop="label" :aria-label="ui(&quot;稀有度筛选&quot;)"><a-select-option v-for="rarity in rarityOptions" :key="rarity.id" :value="rarity.id" :label="locale === 'en' ? rarity.en : rarity.label">{{ ui(rarity.label) }} / {{ rarity.en }}</a-select-option></a-select>
        <a-select v-model:value="sortBy" class="filter-select" option-label-prop="label" :aria-label="ui(&quot;排序&quot;)"><a-select-option value="name" :label="ui(&quot;名称&quot;)">{{ ui("名称 / Name") }}</a-select-option><a-select-option value="family" :label="ui(&quot;类型&quot;)">{{ ui("类型 / Family") }}</a-select-option><a-select-option value="rarity" :label="ui(&quot;稀有度&quot;)">{{ ui("稀有度 / Rarity") }}</a-select-option></a-select>
      </div>
      <div class="version-controls" role="status" aria-live="polite"><label><input v-model="showAllVersions" type="checkbox" /> {{ ui("展开所有版本") }}</label><span>{{ matchingGroups.size.toLocaleString() }} {{ ui("款武器") }} {{ matchingWeapons.length.toLocaleString() }} {{ ui("个版本") }}</span></div>
    </section>

    <section ref="manifestSection" class="manifest-section"><div class="section-title"><div><h2>{{ ui("武器图鉴 / Weapon index") }}</h2><p>{{ ui("完整武器图鉴；点击卡片查看素体、Perk 池与获取来源。") }}</p></div><span class="en">{{ officialCount.toLocaleString() }} WEAPONS</span></div>
      <DestinyLoading v-if="status === 'loading'" :label="ui('正在加载官方武器目录 / Loading Manifest weapons…')" /><p v-else-if="status === 'error'" class="empty error">{{ ui("官方武器目录加载失败 / Failed to load the official catalog.") }}</p>
      <template v-else>
        <div class="result-line"><span>{{ ui("显示") }} {{ displayedCount }} / {{ officialCount.toLocaleString() }} {{ showAllVersions ? ui("个版本") : ui("款武器") }}</span><small>{{ ui("图标、名称、槽位、素体数值、Perk 池与来源均优先读取 Manifest") }}</small></div>
        <div class="official-grid">
          <button v-for="w in officialWeapons" :key="w.hash" type="button" class="official-weapon" :class="{ exotic: isExotic(w) }" @click="openDetail(w)">
            <div class="weapon-thumb"><img v-if="icon(w)" :src="icon(w)" :alt="`${zhName(w)} / ${enName(w)}`" loading="lazy" /><span v-else>{{ ui("无图标") }}</span><img v-if="watermark(w)" class="watermark" :src="watermark(w)" :alt="ui(&quot;发行标记&quot;)" /></div>
            <div class="weapon-copy">
              <div class="official-top">
                <span class="badge" :class="{ gold: isExotic(w) }">{{ rarityLabel(w) }}</span>
                <span class="official-indicators">
                  <span v-if="versionsFor(w).length > 1" class="version-count">{{ versionsFor(w).length }} {{ ui("个版本") }}</span>
                  <span v-if="perkState === 'ready' && championTags(w).length" class="card-champion-icons" :aria-label="ui(&quot;固有反勇士类型&quot;)">
                    <span v-for="champion in championTags(w)" :key="champion.id" class="card-champion-icon" :aria-label="locale === 'en' ? champion.counterEn : champion.counterZh" :title="locale === 'en' ? champion.counterEn : champion.counterZh"><img :src="championIcon(champion)" alt="" aria-hidden="true" loading="lazy" /></span>
                  </span>
                </span>
              </div>
              <h3>{{ zhName(w) }}</h3><p class="en-name">{{ enName(w) }}</p><p>{{ elementLabel(w) }} / {{ familyLabel(w.weaponFamily) }} / {{ w.weaponFamily || ui("武器类型未登记") }} {{ slotLabel(w) }}</p>
            </div>
          </button>
        </div>
        <p v-if="!officialWeapons.length" class="empty">{{ ui("没有匹配的官方武器实体 / No matching Manifest weapons.") }}</p><p v-else-if="officialCount > displayedCount" class="catalog-note"><button class="load-more" type="button" @click="visibleLimit += 120">{{ ui("加载更多（还有") }} {{ officialCount - displayedCount }} {{ showAllVersions ? ui("个版本") : ui("款武器") }}）</button></p>
      </template>
    </section>

    <section class="knowledge-section"><div class="section-title"><div><h2>{{ t('pages.weapons.archetypes') }} / Archetypes</h2><p>{{ ui("这里解释武器原型在战斗中的定位，不代替具体武器的 Manifest 数据。") }}</p></div><span class="en">FIELD GUIDE</span></div><div class="grid grid-3"><article v-for="w in filteredArchetypes" :key="w.id" class="card archetype-card"><div class="w-top"><span class="badge gold">{{ ui(w.slot) }}</span><span class="range">{{ ui(w.range) }}{{ ui("距离 / range") }}</span></div><h3>{{ localized(w) }}</h3><span class="en-tag">{{ w.en.toUpperCase() }}</span><p>{{ ui(w.desc) }}</p></article></div><div v-if="!filteredArchetypes.length" class="empty">{{ ui("没有匹配的武器原型。") }}</div></section>

    <section class="knowledge-section exotic-index-section">
      <div class="section-title"><div><h2>{{ ui("异域武器索引 / Exotic index") }}</h2><p>{{ ui("按槽位浏览当前 Manifest 中的异域武器；数量为同名武器合并后的目录款数。") }}</p></div><span class="en">{{ exoticWeaponCount.toLocaleString() }} EXOTICS</span></div>
      <div class="exotic-index">
        <button v-for="slot in exoticIndex" :key="slot.id" type="button" class="exotic-index-entry" :aria-label="ui('查看{0}异域武器', [ui(slot.label)])" @click="browseExoticSlot(slot.id)">
          <div class="exotic-index-head"><span>{{ ui(slot.label) }}</span><small>{{ slot.en.toUpperCase() }}</small><strong>{{ slot.weapons.toLocaleString() }}</strong></div>
          <div class="exotic-preview-strip" aria-hidden="true"><span v-for="weapon in slot.previews" :key="weapon.hash"><img v-if="icon(weapon)" :src="icon(weapon)" alt="" /></span></div>
          <div class="exotic-index-foot"><span>{{ slot.definitions.toLocaleString() }} {{ ui("个 Manifest 定义") }}</span><b>{{ ui("查看全部") }} <i aria-hidden="true">→</i></b></div>
        </button>
      </div>
    </section>

    <div v-if="selectedWeapon" class="weapon-overlay" @click.self="closeDetail" @keydown.esc="closeDetail">
      <section ref="detailDialog" class="weapon-dialog weapon-record" role="dialog" aria-modal="true" :aria-label="`${zhName(selectedWeapon)} weapon details`" tabindex="-1">
        <button type="button" class="detail-close" :aria-label="ui(&quot;关闭详情&quot;)" :title="ui(&quot;关闭详情&quot;)" @click="closeDetail">×</button>

        <header class="record-hero" :class="{ exotic: isExotic(selectedWeapon) }">
          <div class="detail-weapon-icon">
            <img v-if="icon(selectedWeapon)" :src="icon(selectedWeapon)" :alt="zhName(selectedWeapon)" />
            <span v-else>{{ ui("无图标") }}</span>
            <img v-if="watermark(selectedWeapon)" class="detail-watermark" :src="watermark(selectedWeapon)" alt="" />
          </div>
          <div class="record-identity">
            <p class="record-kicker"><span>{{ rarityLabel(selectedWeapon) }}</span> WEAPON RECORD</p>
            <h2>{{ zhName(selectedWeapon) }}</h2>
            <p class="record-en-name">{{ enName(selectedWeapon) }}</p>
            <div class="weapon-facts">
              <span>{{ selectedWeapon.weaponFamily || ui("武器类型未登记") }}</span>
              <span>{{ slotLabel(selectedWeapon) }}</span>
              <span>HASH {{ selectedWeapon.hash }}</span>
            </div>
            <p v-if="selectedWeapon.descriptionZh || selectedWeapon.description" class="record-description">{{ manifestText(manifestDescription(selectedWeapon), locale) }}</p>
            <p v-if="selectedSources.length" class="acquisition-line"><span>{{ ui("获取") }}</span><strong>{{ locale === 'en' ? selectedSources[0].en : selectedSources[0].zh }}</strong><small v-if="selectedSources.length > 1">+{{ selectedSources.length - 1 }}</small></p>
            <p v-else class="acquisition-line unresolved"><span>{{ ui("获取") }}</span><strong>{{ ui("来源未解析") }}</strong></p>
          </div>
          <div class="record-status">
            <strong>{{ ui("定义") }} {{ versionNumber(selectedWeapon) }}</strong>
            <span>{{ versions.length }} {{ ui("个版本") }}</span>
            <div v-if="selectedChampions.length" class="detail-champion-icons" :aria-label="ui(&quot;固有反勇士类型&quot;)">
              <span v-for="champion in selectedChampions" :key="champion.id" class="detail-champion-icon" :aria-label="locale === 'en' ? champion.counterEn : champion.counterZh" :title="locale === 'en' ? champion.counterEn : champion.counterZh"><img :src="championIcon(champion)" alt="" aria-hidden="true" /></span>
            </div>
            <span v-else-if="perkState === 'ready'" class="champion-unresolved">{{ ui("框架克制未解析") }}</span>
          </div>
        </header>

        <section v-if="versions.length > 1" class="record-band version-block">
          <div class="record-section-title"><div><span>VERSIONS</span><h3>{{ ui("武器版本") }}</h3></div><small>{{ ui("选择同名武器的 Manifest 定义") }}</small></div>
          <div class="version-switcher" role="group" :aria-label="ui(&quot;武器版本&quot;)">
            <button v-for="(version, index) in versions" :key="version.hash" type="button" :aria-pressed="version.hash === selectedWeapon.hash" @click="openDetail(version)">
              <span>{{ ui("定义") }} {{ index + 1 }}</span>
              <strong>{{ version.hash === selectedWeapon.hash ? ui("当前版本") : ui("切换版本") }}</strong>
              <small>{{ versionSummary(version) || `Hash ${version.hash}` }}</small>
            </button>
          </div>
          <p v-if="versionDiffs.length" class="version-diff"><b>{{ ui("版本差异") }}</b>{{ versionDiffs.join('；') }}</p>
        </section>

        <section v-if="intrinsics.length" class="record-band intrinsic-band">
          <div class="record-section-title"><div><span>INTRINSIC</span><h3>{{ ui("固有特性") }}</h3></div></div>
          <div class="intrinsic-list">
            <article v-for="intrinsic in intrinsics" :key="intrinsic.hash" class="intrinsic-item">
              <img v-if="plugIcon(intrinsic)" :src="plugIcon(intrinsic)" alt="" />
              <div><h3>{{ perkLabel(intrinsic) }}</h3><p>{{ plugDescription(intrinsic) || ui("该特性暂无说明。") }}</p></div>
            </article>
          </div>
        </section>

        <div class="record-detail-grid">
          <section class="stats-panel">
            <div class="record-section-title"><div><span>FRAME DATA</span><h3>{{ ui("武器素体") }}</h3></div></div>
            <p class="stat-note">{{ ui("基础数值，不叠加 Perk、催化或大师属性。") }}</p>
            <div v-if="selectedStats.length" class="stat-grid">
              <div v-for="stat in selectedStats" :key="stat.key" class="stat-item"><span>{{ ui(stat.label) }}</span><strong>{{ stat.value }}</strong><i v-if="stat.bar"><b :style="{ width: `${stat.percent}%` }"></b></i></div>
            </div>
            <p v-else class="muted">{{ ui("该版本未提供素体数值。") }}</p>
          </section>

          <section class="perks-panel">
            <div class="record-section-title"><div><span>SOCKET MATRIX</span><h3>{{ ui("Perk 池") }}</h3></div><small v-if="selectedPools.length">{{ selectedPools.length }} {{ ui("列") }}</small></div>
            <DestinyLoading v-if="perkState === 'loading' || perkState === 'idle'" compact :label="ui('正在加载 Perk 详情…')" />
            <p v-else-if="perkState === 'error'" class="muted" role="alert">{{ ui("Perk 详情加载失败。") }}<button type="button" class="reset-link" @click="loadPerks">{{ ui("重试") }}</button></p>
            <template v-else>
              <p v-if="selectedPools.length" class="stat-note">{{ ui("按实际插槽展示可用词条；选择词条可查看效果说明。") }}</p>
              <div v-if="selectedPools.length" class="pool-list">
                <article v-for="pool in selectedPools" :key="pool.socketIndex" class="perk-column">
                  <header><strong>{{ pool.label }}</strong><small>{{ pool.options.length }} {{ ui("项") }}</small></header>
                  <StableDisclosure v-for="perk in pool.options" :key="perk.hash" :title="perkLabel(perk)" :width="560" trigger-class="perk-option" wrap-class-name="perk-detail-modal">
                    <template #trigger><img v-if="plugIcon(perk)" :src="plugIcon(perk)" alt="" loading="lazy" /><span>{{ perkLabel(perk) }}<small>{{ perk.name }}</small></span></template>
                    <div class="perk-detail-content"><img v-if="plugIcon(perk)" :src="plugIcon(perk)" alt="" /><div><small>{{ perk.name }}</small><p>{{ plugDescription(perk) || ui("该词条暂无说明。") }}</p></div></div>
                  </StableDisclosure>
                  <p v-if="pool.missingHashes.length" class="muted">{{ pool.missingHashes.length }} {{ ui("项词条详情缺失") }}</p>
                </article>
              </div>
              <p v-else class="muted">{{ ui("该版本未提供可查看的武器 Perk 列。") }}</p>
            </template>
          </section>
        </div>

        <div class="related-area"><RelatedBuilds :item="selectedWeapon" /></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.weapons-page{padding-bottom:4rem}.weapon-head{display:flex;justify-content:space-between;gap:2rem;align-items:end}.eyebrow{color:var(--gold-dim);font:.66rem var(--font-en);letter-spacing:.18em}.catalog-stat{min-width:15rem;padding:1rem 1.2rem;border-left:2px solid var(--gold);background:rgba(255,255,255,.035)}.catalog-stat strong{display:block;color:var(--gold-bright);font:700 1.45rem var(--font-en);font-variant-numeric:tabular-nums}.catalog-stat span{color:var(--text-dim);font-size:.65rem}.weapon-controls{display:grid;gap:1rem;margin:1.2rem 0 2rem;padding:1rem}.control-main{display:flex;gap:.8rem;align-items:center}.control-main .ant-input-affix-wrapper{flex:1}.reset-link{border:0;background:none;color:var(--gold-dim);font-size:.65rem;cursor:pointer;white-space:nowrap}.filter-row{display:flex;gap:.55rem;flex-wrap:wrap;align-items:center}.filter-radio{display:flex;gap:.35rem;flex-wrap:wrap}.filter-radio .ant-radio-button-wrapper{height:auto;min-height:2.35rem;padding:.4rem .65rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);line-height:1.15}.filter-radio .ant-radio-button-wrapper::before{display:none}.filter-radio .ant-radio-button-wrapper small{display:block;color:var(--text-dim);font-size:.53rem;margin-top:.14rem}.filter-radio .ant-radio-button-wrapper-checked{border-color:var(--gold);background:rgba(232,193,90,.1);color:var(--gold-bright)}.filter-select{min-width:10rem}.section-title{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin:2rem 0 .8rem}.section-title>div{flex:1;min-width:0;text-align:left}.section-title h2{margin:0;font-size:1rem;text-align:left}.section-title p{margin:.25rem 0 0;color:var(--text-dim);font-size:.68rem;max-width:44rem;text-align:left}.section-title>.en{flex:none;color:var(--gold-dim);font:.6rem var(--font-en);white-space:nowrap}.result-line{display:flex;justify-content:space-between;gap:1rem;align-items:baseline;margin:-.25rem 0 .7rem;color:var(--gold-bright);font:.7rem var(--font-en)}.result-line small{color:var(--text-dim);font:400 .64rem var(--font-cn)}.official-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft)}.official-weapon{display:grid;grid-template-columns:4.2rem 1fr;gap:.7rem;min-width:0;min-height:6.55rem;padding:.75rem;background:var(--bg-dark);border:0;color:inherit;text-align:left;cursor:pointer;transition:background .2s,transform .2s}.official-weapon:hover{background:rgba(232,193,90,.08);transform:translateY(-1px)}.official-weapon:focus-visible{outline:2px solid var(--gold-bright);outline-offset:-2px}.official-weapon.exotic{background:linear-gradient(120deg,rgba(232,193,90,.1),var(--bg-dark) 60%)}.weapon-thumb{width:4.2rem;height:4.2rem;display:flex;align-items:center;justify-content:center;background:#121212;border:1px solid var(--line-soft);overflow:hidden}.weapon-thumb img{width:100%;height:100%;object-fit:contain}.weapon-thumb span{color:var(--text-dim);font-size:.56rem}.weapon-copy{min-width:0}.official-top{display:flex;justify-content:space-between;gap:.4rem;align-items:center;min-height:1.25rem}.official-indicators{display:flex;align-items:center;justify-content:flex-end;gap:.38rem;min-width:0}.version-count{color:var(--text-dim);font:.52rem var(--font-en);white-space:nowrap}.card-champion-icons{display:flex;align-items:center;gap:.18rem}.card-champion-icon{display:flex;width:1.2rem;height:1.2rem;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);background:#111519}.card-champion-icon img{display:block;width:.9rem;height:.9rem;object-fit:contain}.badge{display:inline-block;color:var(--text-dim);font-size:.54rem;letter-spacing:.04em}.badge.gold{color:var(--gold-bright)}.official-weapon h3{margin:.25rem 0 .08rem;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.en-name{font:.56rem var(--font-en)!important;color:var(--gold-dim)!important;margin:0 0 .2rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.official-weapon p{font-size:.62rem;color:var(--text-sub);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.catalog-note,.muted{color:var(--text-dim);font-size:.64rem}.empty{text-align:center;padding:3rem;color:var(--text-dim)}.error{color:var(--warn)}.knowledge-section{margin-top:2.3rem}.archetype-card{min-height:10rem}.en-tag{display:block;font:.58rem var(--font-en);letter-spacing:.12em;color:var(--gold-dim);margin:-.1rem 0 .45rem}.w-top,.exo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}.range,.wtype{color:var(--text-dim);font-size:.62rem}.exotic-card{border-color:rgba(232,193,90,.25)}.how{margin-top:.7rem;color:var(--gold-dim);font-size:.65rem;line-height:1.5}.reference-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:2.3rem}.info-panels{margin:0}.info-panels table{width:100%;border-collapse:collapse;font-size:.7rem}.info-panels th,.info-panels td{padding:.45rem;border-bottom:1px solid var(--line-soft);text-align:left}.foundry-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:.45rem}.foundry{display:flex;justify-content:space-between;gap:.5rem;padding:.55rem .65rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.02)}.f-name{color:var(--gold-bright);font:.66rem var(--font-en)}.f-style{color:var(--text-sub);font-size:.63rem}.weapon-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:1.2rem;background:rgba(3,6,12,.8);backdrop-filter:blur(8px)}.weapon-dialog{position:relative;width:min(64rem,100%);max-height:min(46rem,calc(100vh - 2.4rem));overflow:auto;padding:1.25rem;background:var(--bg-dark, #202020);border:1px solid var(--line);box-shadow:0 24px 80px rgba(0,0,0,.6)}.detail-close{position:absolute;right:.7rem;top:.55rem;width:2rem;height:2rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);font-size:1.35rem;cursor:pointer}.weapon-detail-head{display:grid;grid-template-columns:6rem 1fr;gap:1rem;align-items:center;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}.detail-weapon-icon{width:6rem;height:6rem;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.detail-weapon-icon img{width:100%;height:100%;object-fit:contain}.weapon-detail-head h2{margin:.3rem 0 .08rem;font-size:1.25rem}.weapon-detail-head p{margin:0;color:var(--gold-dim);font:.66rem var(--font-en)}.weapon-detail-head small{display:block;color:var(--text-dim);font-size:.58rem;margin-top:.4rem}.detail-block{padding-top:.85rem;margin-top:.85rem;border-top:1px solid var(--line-soft)}.detail-block h3{margin:0 0 .55rem;color:var(--gold-dim);font-size:.7rem}.detail-block p{margin:.35rem 0;color:var(--text-sub);font-size:.68rem;line-height:1.55}.detail-block p b{color:var(--gold-dim)}.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem .85rem}.stat-item{display:grid;grid-template-columns:1fr auto;gap:.22rem}.stat-item span{color:var(--text-sub);font-size:.62rem}.stat-item span small{display:block;color:var(--text-dim);font:.5rem var(--font-en)}.stat-item strong{font:700 .68rem var(--font-en);color:var(--text-main)}.stat-item i{grid-column:1/-1;height:3px;background:rgba(255,255,255,.08)}.stat-item i b{display:block;height:100%;background:var(--gold)}.pool-list{display:grid;gap:.5rem}.pool-list article{padding:.55rem .65rem;background:rgba(255,255,255,.04);border-left:2px solid var(--gold-dim)}.pool-list strong{font:.6rem var(--font-en);color:var(--gold-dim)}.pool-list p{font-size:.62rem}.source-list{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem}.source-list article{padding:.5rem .6rem;background:rgba(255,255,255,.04)}.source-list span{display:block;color:var(--gold-dim);font-size:.55rem}.source-list strong{display:block;font-size:.64rem;margin-top:.2rem}.source-list small{display:block;color:var(--text-dim);font:.54rem var(--font-en);margin-top:.12rem}.weapon-dialog footer{display:block;margin-top:1rem;color:var(--text-dim);font-size:.55rem}
@media(max-width:900px){.weapon-head{align-items:flex-start;flex-direction:column}.catalog-stat{width:100%}.official-grid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.weapon-head{gap:.75rem}.catalog-stat{min-width:0;padding:.55rem .75rem}.catalog-stat strong{display:inline;margin-right:.45rem;font-size:1rem}.weapon-controls{gap:.65rem;margin:.8rem 0 1.2rem;padding:.75rem}.control-main{gap:.45rem}.filter-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.filter-radio{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.3rem}.filter-radio .ant-radio-button-wrapper{min-width:0;padding:.35rem .45rem;text-align:center}.filter-select{width:100%;min-width:0}.official-grid,.reference-grid{grid-template-columns:1fr}.section-title{align-items:flex-start;flex-direction:column;gap:.35rem}.result-line small,.en-name{display:none!important}.stat-grid,.source-list{grid-template-columns:1fr}.weapon-detail-head{grid-template-columns:4.5rem 1fr}.detail-weapon-icon{width:4.5rem;height:4.5rem}}
</style>

<style scoped>
.version-switcher{display:flex;gap:.4rem;flex-wrap:wrap}.version-switcher button{min-width:2.4rem;padding:.4rem .7rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.025);color:var(--text-sub);font:.7rem var(--font-en);cursor:pointer}.version-switcher button[aria-pressed="true"]{border-color:var(--gold-dim);background:rgba(232,193,90,.08);color:var(--gold-bright)}.version-switcher button:focus-visible{outline:2px solid var(--gold)}.version-diff{margin:.6rem 0 0;color:var(--text-dim);font-size:.66rem;line-height:1.7}.foldable>summary{display:flex;align-items:center;gap:.6rem;cursor:pointer;list-style:none;color:var(--gold-dim);font-size:.7rem}.foldable>summary::-webkit-details-marker{display:none}.foldable>summary span{color:var(--text-dim);font:.58rem var(--font-en)}.foldable>summary:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.foldable-body{margin-top:.55rem}.source-block .source-list{margin-top:.6rem}.source-block .entity-link{margin-top:.8rem;display:inline-block}
.intrinsic-item{display:flex;gap:1rem;align-items:center;padding:.65rem;background:rgba(255,255,255,.025)}.intrinsic-item>img{width:3.5rem;height:3.5rem;object-fit:contain}.intrinsic-item small{font-size:.58rem;color:var(--text-dim)}.intrinsic-item h3{margin:.2rem 0;font-size:1rem;color:var(--text-main)}.intrinsic-item p{white-space:pre-line}
.stat-note{color:var(--text-dim)!important;font-size:.62rem!important;margin-bottom:.8rem!important}.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem 2rem;max-width:42rem}.stat-item{grid-template-columns:7rem 2.3rem minmax(3rem,1fr);align-items:center;gap:.65rem}.stat-item span{font-size:.75rem}.stat-item strong{text-align:right;font-size:.78rem;font-variant-numeric:tabular-nums}.stat-item i{grid-column:auto;height:7px}.stat-item i b{background:var(--text-sub)}
.pool-list{grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.65rem;align-items:start}.pool-list article{padding:.65rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.025)}.perk-column>header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.15rem .25rem .65rem;border-bottom:1px solid var(--line-soft)}.perk-column>header strong{font-size:.75rem;font-family:var(--font-cn)}.perk-column>header small{font-size:.58rem;color:var(--text-dim)}.pool-list :deep(.perk-option){margin-top:.4rem;min-height:2.9rem;padding:.42rem .35rem;border:0;background:transparent}.pool-list :deep(.perk-option:hover){background:rgba(255,255,255,.045)}.pool-list :deep(.perk-option>img){width:2rem;height:2rem;object-fit:contain}.pool-list :deep(.perk-option>span){min-width:0;flex:1;font-size:.73rem;overflow-wrap:anywhere}.pool-list :deep(.perk-option small){display:block;font:.53rem var(--font-en);color:var(--text-dim);margin-top:.25rem}.perk-detail-content{display:grid;grid-template-columns:3.5rem minmax(0,1fr);gap:1rem;align-items:start}.perk-detail-content>img{width:3.5rem;height:3.5rem;object-fit:contain;background:var(--bg-deep)}.perk-detail-content small{color:var(--gold-dim);font:.62rem var(--font-en)}.perk-detail-content p{white-space:pre-line;line-height:1.8}
@media(max-width:620px){.weapon-overlay{padding:.5rem}.weapon-dialog{padding:1rem;max-height:calc(100dvh - 1rem)}.stat-grid{grid-template-columns:1fr}.pool-list{grid-template-columns:repeat(2,minmax(0,1fr))}.weapon-detail-head{padding-right:1.3rem}.weapon-detail-head h2{font-size:1rem}.pool-list :deep(.perk-option){gap:.4rem}.pool-list :deep(.perk-option>img){width:1.6rem;height:1.6rem}.perk-detail-content{grid-template-columns:2.8rem minmax(0,1fr)}.perk-detail-content>img{width:2.8rem;height:2.8rem}}
.version-controls{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;font-size:.72rem;color:var(--text-sub)}.version-controls label{display:flex;gap:.5rem;align-items:center;cursor:pointer}.version-controls input{accent-color:var(--gold)}.weapon-thumb{position:relative}.watermark{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.load-more{display:block;width:100%;padding:.8rem;border:1px solid var(--line-soft);background:rgba(232,193,90,.06);color:var(--gold-bright);cursor:pointer}.load-more:focus-visible{outline:2px solid var(--gold)}
.exotic-index{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;border:1px solid var(--line);background:var(--line)}
.exotic-index-entry{display:grid;gap:.85rem;min-width:0;padding:1rem;border:0;background:var(--bg-dark);color:inherit;text-align:left;cursor:pointer;transition:background .18s,box-shadow .18s}
.exotic-index-entry:hover{background:var(--bg-panel);box-shadow:inset 0 3px 0 var(--gold)}
.exotic-index-entry:focus-visible{position:relative;z-index:1;outline:2px solid var(--gold-bright);outline-offset:-2px}
.exotic-index-head{display:grid;grid-template-columns:1fr auto;align-items:end;min-height:2.6rem}
.exotic-index-head>span{color:var(--text-main);font-size:.88rem;font-weight:700}
.exotic-index-head>small{grid-column:1;color:var(--gold-dim);font:.53rem var(--font-en)}
.exotic-index-head>strong{grid-column:2;grid-row:1/3;color:var(--gold-bright);font:700 1.65rem var(--font-en);font-variant-numeric:tabular-nums}
.exotic-preview-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line-soft)}
.exotic-preview-strip>span{aspect-ratio:1;min-width:0;background:var(--bg-deep);overflow:hidden}
.exotic-preview-strip img{display:block;width:100%;height:100%;object-fit:contain;transition:transform .18s}
.exotic-index-entry:hover .exotic-preview-strip img{transform:scale(1.04)}
.exotic-index-foot{display:flex;justify-content:space-between;gap:.8rem;align-items:center;color:var(--text-dim);font-size:.58rem}
.exotic-index-foot b{flex:none;color:var(--gold);font-weight:600}
.exotic-index-foot i{font-style:normal;font-family:var(--font-en)}
@media(max-width:760px){.exotic-index{grid-template-columns:1fr}.exotic-index-entry{grid-template-columns:minmax(7rem,.7fr) minmax(0,1.3fr);align-items:center}.exotic-index-head{min-height:0}.exotic-index-foot{grid-column:1/-1}}
@media(max-width:540px){.exotic-index-entry{display:grid;grid-template-columns:1fr;gap:.65rem;padding:.8rem}.exotic-index-foot{grid-column:auto}.exotic-preview-strip{grid-template-columns:repeat(6,minmax(0,1fr))}}
@media(max-width:360px){.pool-list{grid-template-columns:1fr}}
</style>

<style scoped>
.weapon-overlay{
  padding:clamp(.7rem,2vw,1.5rem);
  background:rgba(6,10,20,.88);
  backdrop-filter:blur(12px);
}
.weapon-record{
  --record-accent:var(--gold);
  width:min(76rem,100%);
  max-height:calc(100dvh - clamp(1.4rem,4vw,3rem));
  padding:0;
  color:var(--text-main);
  background:var(--bg-dark);
  border:1px solid var(--line);
  border-top:3px solid var(--record-accent);
  box-shadow:0 32px 90px rgba(0,0,0,.72);
  scrollbar-color:var(--gold-dim) var(--bg-deep);
}
.weapon-record:focus{outline:none}
.weapon-record .detail-close{
  z-index:3;
  top:.85rem;
  right:.85rem;
  display:grid;
  place-items:center;
  width:2.2rem;
  height:2.2rem;
  padding:0;
  border-color:var(--line-soft);
  color:var(--text-main);
  background:rgba(6,10,20,.82);
  line-height:1;
  transition:border-color .18s,background .18s,color .18s;
}
.weapon-record .detail-close:hover{border-color:var(--record-accent);background:var(--bg-hover);color:var(--gold-bright)}
.weapon-record .detail-close:focus-visible{outline:2px solid var(--record-accent);outline-offset:2px}
.record-hero{
  display:grid;
  grid-template-columns:6.5rem minmax(0,1fr) auto;
  gap:1.15rem;
  align-items:start;
  padding:1.35rem 4rem 1.35rem 1.35rem;
  background:var(--bg-panel);
}
.record-hero.exotic{--record-accent:var(--gold-bright)}
.record-hero .detail-weapon-icon{
  position:relative;
  width:6.5rem;
  height:6.5rem;
  border:1px solid var(--line);
  background:var(--bg-deep);
}
.record-hero .detail-weapon-icon>img:first-child{position:relative;z-index:1}
.record-hero .detail-weapon-icon .detail-watermark{position:absolute;z-index:2;inset:0;width:100%;height:100%;pointer-events:none}
.record-hero .detail-weapon-icon>span{color:var(--text-dim);font-size:.65rem}
.record-identity{min-width:0}
.record-kicker{display:flex;gap:.55rem;align-items:center;margin:0 0 .35rem;color:var(--text-dim);font:600 .62rem var(--font-en);letter-spacing:0}
.record-kicker span{color:var(--record-accent)}
.record-identity h2{margin:0;font-size:1.45rem;line-height:1.2;overflow-wrap:anywhere}
.record-en-name{margin:.18rem 0 0;color:var(--gold-dim);font:.7rem var(--font-en);overflow-wrap:anywhere}
.weapon-facts{display:flex;gap:0;margin-top:.65rem;color:var(--text-sub);font:.62rem var(--font-en)}
.weapon-facts span{padding:0 .6rem;border-left:1px solid var(--line-soft);overflow-wrap:anywhere}
.weapon-facts span:first-child{padding-left:0;border-left:0}
.record-description{max-width:48rem;margin:.75rem 0 0;color:var(--text-sub);font-size:.72rem;line-height:1.7;white-space:pre-line}
.acquisition-line{display:flex;gap:.45rem;align-items:baseline;margin:.55rem 0 0;color:var(--text-sub);font-size:.67rem}
.acquisition-line>span{color:var(--record-accent)}
.acquisition-line strong{font-weight:500;overflow-wrap:anywhere}
.acquisition-line small{color:var(--text-dim);font:600 .58rem var(--font-en)}
.record-status{min-width:8.5rem;padding-top:.25rem;text-align:right}
.record-status>strong{display:block;color:var(--record-accent);font:700 1.5rem var(--font-en);font-variant-numeric:tabular-nums}
.record-status>span{display:block;margin-top:.08rem;color:var(--text-dim);font:.58rem var(--font-en)}
.detail-champion-icons{display:flex;justify-content:flex-end;gap:.3rem;margin-top:.75rem}
.detail-champion-icon{display:flex;width:2rem;height:2rem;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--bg-deep)}
.detail-champion-icon img{display:block;width:1.5rem;height:1.5rem;object-fit:contain}
.champion-unresolved{margin-top:.7rem;color:var(--text-dim);font-size:.55rem}
.record-band{padding:1rem 1.35rem;border-top:1px solid var(--line-soft)}
.record-section-title{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:.8rem}
.record-section-title>div>span{display:block;margin-bottom:.12rem;color:var(--record-accent);font:600 .55rem var(--font-en);letter-spacing:0}
.record-section-title h3{margin:0;color:var(--text-main);font-size:.88rem}
.record-section-title>small{color:var(--text-dim);font-size:.6rem;text-align:right}
.weapon-record .version-switcher{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1px;background:var(--line-soft);border:1px solid var(--line-soft)}
.weapon-record .version-switcher button{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:.18rem .55rem;
  min-width:0;
  padding:.7rem .8rem;
  border:0;
  text-align:left;
  background:var(--bg-dark);
}
.weapon-record .version-switcher button>span{grid-row:1/3;color:var(--text-dim);font:700 .78rem var(--font-en)}
.weapon-record .version-switcher button>strong{color:var(--text-main);font-size:.68rem}
.weapon-record .version-switcher button>small{display:block;color:var(--text-dim);font:.55rem var(--font-en);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.weapon-record .version-switcher button:hover{background:var(--bg-hover)}
.weapon-record .version-switcher button[aria-pressed="true"]{box-shadow:inset 3px 0 0 var(--record-accent);background:rgba(232,193,90,.09)}
.weapon-record .version-switcher button[aria-pressed="true"]>span,.weapon-record .version-switcher button[aria-pressed="true"]>strong{color:var(--record-accent)}
.weapon-record .version-switcher button:focus-visible{position:relative;z-index:1;outline:2px solid var(--record-accent);outline-offset:-2px}
.weapon-record .version-diff{display:flex;gap:.5rem;margin:.65rem 0 0;color:var(--text-dim);font-size:.62rem;line-height:1.65}
.weapon-record .version-diff b{flex:none;color:var(--text-sub);font-weight:600}
.intrinsic-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1px;background:var(--line-soft)}
.weapon-record .intrinsic-item{gap:.8rem;min-width:0;padding:.75rem;background:var(--bg-card)}
.weapon-record .intrinsic-item>img{flex:none;width:3rem;height:3rem}
.weapon-record .intrinsic-item h3{margin:0;color:var(--text-main);font-size:.8rem}
.weapon-record .intrinsic-item p{margin:.2rem 0 0;color:var(--text-sub);font-size:.64rem;line-height:1.6}
.record-detail-grid{display:grid;grid-template-columns:minmax(15rem,19rem) minmax(0,1fr);border-top:1px solid var(--line-soft)}
.stats-panel,.perks-panel{min-width:0;padding:1.2rem 1.35rem}
.stats-panel{border-right:1px solid var(--line-soft);background:var(--bg-panel)}
.weapon-record .stat-note{margin:-.2rem 0 .9rem!important;color:var(--text-dim)!important;font-size:.58rem!important;line-height:1.55}
.weapon-record .stat-grid{display:grid;grid-template-columns:1fr;gap:.55rem;max-width:none}
.weapon-record .stat-item{display:grid;grid-template-columns:minmax(5rem,1fr) 2.4rem minmax(3rem,1.25fr);gap:.55rem;align-items:center}
.weapon-record .stat-item span{color:var(--text-sub);font-size:.67rem;overflow-wrap:anywhere}
.weapon-record .stat-item strong{text-align:right;color:var(--text-main);font-size:.7rem;font-variant-numeric:tabular-nums}
.weapon-record .stat-item i{grid-column:auto;height:5px;background:var(--bg-deep);overflow:hidden}
.weapon-record .stat-item i b{background:var(--record-accent)}
.weapon-record .pool-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;align-items:stretch;background:var(--line-soft);border:1px solid var(--line-soft)}
.weapon-record .pool-list>.perk-column{min-width:0;padding:.65rem;background:var(--bg-panel);border:0}
.weapon-record .perk-column>header{padding:.05rem .15rem .55rem;border-color:var(--line-soft)}
.weapon-record .perk-column>header strong{color:var(--text-main);font-size:.7rem}
.weapon-record .perk-column>header small{color:var(--text-dim);font-size:.53rem}
.weapon-record .perk-option{margin:0;border-bottom:1px solid var(--line-soft)}
.weapon-record .perk-option:last-of-type{border-bottom:0}
.weapon-record .perk-option summary{display:grid;grid-template-columns:2rem minmax(0,1fr) auto;gap:.5rem;min-height:2.9rem;padding:.42rem .15rem}
.weapon-record .perk-option summary:hover{background:var(--bg-hover)}
.weapon-record .perk-option summary:focus-visible{outline:2px solid var(--record-accent);outline-offset:-2px}
.weapon-record .perk-option summary img{width:2rem;height:2rem}
.weapon-record .perk-option summary span{min-width:0;color:var(--text-main);font-size:.67rem;line-height:1.35}
.weapon-record .perk-option summary small{margin-top:.12rem;color:var(--text-dim);font-size:.48rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.weapon-record .perk-option summary>b{color:var(--text-dim);font:400 .75rem var(--font-en)}
.weapon-record .perk-option[open]{background:rgba(232,193,90,.06)}
.weapon-record .perk-option[open] summary>b{color:var(--record-accent);transform:rotate(45deg)}
.weapon-record .perk-option>p{margin:0;padding:.35rem .3rem .65rem;color:var(--text-sub);font-size:.6rem;line-height:1.65;white-space:pre-line}
.related-area{padding:0 1.35rem 1.25rem;border-top:1px solid var(--line-soft)}

@media(max-width:760px){
  .record-hero{grid-template-columns:5rem minmax(0,1fr);padding:1rem 3.7rem 1rem 1rem}
  .record-hero .detail-weapon-icon{width:5rem;height:5rem}
  .record-status{grid-column:1/-1;display:flex;gap:.6rem;align-items:center;min-width:0;padding-top:0;text-align:left}
  .record-status>strong{font-size:1rem}.record-status>span{margin:0}.detail-champion-icons{justify-content:flex-start;margin:0 0 0 auto}
  .record-detail-grid{grid-template-columns:1fr}
  .stats-panel{border-right:0;border-bottom:1px solid var(--line-soft)}
}
@media(max-width:540px){
  .weapon-overlay{align-items:stretch;padding:0}
  .weapon-record{width:100%;max-height:100dvh;border-right:0;border-bottom:0;border-left:0}
  .record-hero{grid-template-columns:4.35rem minmax(0,1fr);gap:.75rem;padding:.85rem 3.35rem .9rem .8rem}
  .record-hero .detail-weapon-icon{width:4.35rem;height:4.35rem}
  .record-identity h2{font-size:1.05rem}
  .record-kicker{font-size:.53rem}.record-en-name{font-size:.6rem}
  .weapon-facts{flex-wrap:wrap;row-gap:.3rem;font-size:.53rem}.weapon-facts span{padding:0 .4rem}.weapon-facts span:first-child{padding-left:0}
  .record-description{font-size:.65rem;line-height:1.55}
  .acquisition-line{align-items:flex-start;font-size:.6rem}
  .detail-champion-icons{flex-wrap:wrap}
  .record-band,.stats-panel,.perks-panel{padding:.9rem .8rem}
  .record-section-title{align-items:start;margin-bottom:.65rem}.record-section-title>small{max-width:9rem}
  .weapon-record .version-switcher{display:grid;grid-template-columns:1fr;overflow:visible}
  .weapon-record .version-switcher button{width:100%}
  .weapon-record .version-diff{display:block}.weapon-record .version-diff b{display:block;margin-bottom:.15rem}
  .intrinsic-list{grid-template-columns:1fr}
  .weapon-record .stat-item{grid-template-columns:minmax(4.8rem,1fr) 2rem minmax(3rem,1.1fr)}
  .weapon-record .pool-list{grid-template-columns:repeat(2,minmax(0,1fr))}
  .related-area{padding:0 .8rem .9rem}
}
@media(max-width:390px){
  .weapon-record .pool-list{grid-template-columns:1fr}
  .record-status{align-items:flex-start;flex-wrap:wrap}.detail-champion-icons{width:100%;margin-left:0}
}
</style>
