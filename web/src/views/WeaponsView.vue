<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { ui, useI18n, localized, localizedField, manifestDescription } from '@/i18n'
import ItemDefinitionInfo from '@/components/ItemDefinitionInfo.vue'
import EntityLink from '@/components/EntityLink.vue'
import SourceProvenance from '@/components/SourceProvenance.vue'
import RelatedBuilds from '@/components/RelatedBuilds.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { weaponTypes } from '@/data/weapons'
import { gearItems, acquisitionById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { weaponBaseStats, weaponArchivePerks, weaponIntrinsics, weaponVersionHighlights, weaponVersionGroups, weaponVersionKey, matchWeaponVersion } from '../../../packages/manifest-catalog/weapon-details.js'
import { perkLabel } from '@/i18n/metadata'
import { manifestText } from '@/utils/manifestText'

const { t, locale } = useI18n()
const { weaponItems, status, iconFor, assetFor, recordsForHash, vendorEntries, activityRewards, snapshot } = useManifestAssets()

const { byHash: plugsByHash, state: perkState, load: loadPerks } = useWeaponPerks()
onMounted(loadPerks)
const selectedStats = computed(() => weaponBaseStats(selectedWeapon.value))
const selectedPools = computed(() => pools(selectedWeapon.value))
const intrinsics = computed(() => weaponIntrinsics(selectedWeapon.value, plugsByHash.value))
const versionGroups = computed(() => weaponVersionGroups(weaponItems.value))
const versionsFor = item => item ? versionGroups.value.get(weaponVersionKey(item)) || [] : []
const versions = computed(() => versionsFor(selectedWeapon.value))
const versionNumber = item => versionsFor(item).findIndex(version => version.hash === item.hash) + 1
const versionSummary = item => weaponBaseStats(item).filter(stat => ['Rounds Per Minute', 'Charge Time', 'Draw Time', 'Impact', 'Range', 'Handling'].includes(stat.key)).map(stat => `${stat.label} ${stat.value}`).join(' ')
const versionSource = item => [...new Set([...(item.vendorSources || []).map(source => localizedField(source, 'vendorName')), ...(item.activitySources || []).map(source => localizedField(source, 'activityName'))])].filter(Boolean).join('、') || '获取来源未登记'
const watermark = item => item.iconWatermark ? `https://www.bungie.net${item.iconWatermark}` : ''
const perkCount = item => pools(item).reduce((sum, pool) => sum + pool.options.length, 0)
const plugIcon = plug => plug.icon ? (plug.icon.startsWith('http') ? plug.icon : `https://www.bungie.net${plug.icon}`) : ''
const plugDescription = plug => manifestText(manifestDescription(plug), locale.value)

const route = useRoute()
const keyword = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { keyword.value = String(value || '') })
const slotFilter = ref('')
const familyFilter = ref('')
const rarityFilter = ref('')
const sortBy = ref('name')
const selectedWeapon = ref(null)
const showAllVersions = ref(false)
const visibleLimit = ref(120)
watch([keyword, slotFilter, familyFilter, rarityFilter, sortBy, showAllVersions], () => { visibleLimit.value = 120 })

const slots = [
  { id: '', label: '全部槽位', en: 'All slots' },
  { id: 'kinetic', label: '动能槽', en: 'Kinetic' },
  { id: 'energy', label: '能量槽', en: 'Energy' },
  { id: 'power', label: '重型槽', en: 'Power' }
]
const officialSlotNames = { '': '全部槽位', kinetic: '动能槽', energy: '能量槽', power: '重型槽' }


const familyOptions = computed(() => [...new Set(weaponItems.value.map(item => item.weaponFamily).filter(Boolean))].sort())
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
const matchesRarity = item => !rarityFilter.value || (rarityFilter.value === 'exotic' ? isExotic(item) : rarityFilter.value === 'legendary' ? isLegendary(item) : !isExotic(item) && !isLegendary(item))
const matchesQuery = item => matchWeaponVersion(item, keyword.value, versionsFor(item))
const matchingWeapons = computed(() => weaponItems.value.filter(item => matchesSlot(item) && (!familyFilter.value || item.weaponFamily === familyFilter.value) && matchesRarity(item) && matchesQuery(item)))
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
const canonicalExotics = computed(() => gearItems.filter(item => item.type === 'weapon' && item.rarity === 'exotic').filter(item => !query.value || `${item.name} ${item.en} ${(item.aliases || []).join(' ')}`.toLowerCase().includes(query.value)))
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
function openDetail(item) { selectedWeapon.value = item }
function closeDetail() { selectedWeapon.value = null }
function resetFilters() { keyword.value = ''; slotFilter.value = ''; familyFilter.value = ''; rarityFilter.value = ''; sortBy.value = 'name'; showAllVersions.value = false }
</script>

<template>
  <div class="weapons-page">
    <div class="page-head weapon-head"><div><p class="eyebrow">WEAPON ARCHIVE / MANIFEST ATLAS</p><h1>{{ t('pages.weapons.title') }}</h1><p>{{ t('pages.weapons.subtitle') }}</p></div><div class="catalog-stat"><strong>{{ weaponItems.length.toLocaleString() }}</strong><span>{{ ui("官方武器实体 / Manifest weapon entities") }}</span></div></div>

    <section class="weapon-controls panel">
      <div class="control-main"><a-input v-model:value="keyword" size="large" allow-clear :placeholder="ui(&quot;搜索武器、Hash 或 武器名#版本号…&quot;)" /><button class="reset-link" type="button" @click="resetFilters">{{ ui("重置筛选 / Reset") }}</button></div>
      <div class="filter-row"><a-radio-group v-model:value="slotFilter" button-style="solid" class="filter-radio"><a-radio-button v-for="slot in slots" :key="slot.id" :value="slot.id">{{ ui(slot.label) }}<small>{{ slot.en }}</small></a-radio-button></a-radio-group><a-select v-model:value="familyFilter" allow-clear class="filter-select" :placeholder="ui(&quot;武器类型 / Weapon family&quot;)"><a-select-option v-for="family in familyOptions" :key="family" :value="family">{{ family }}</a-select-option></a-select><a-select v-model:value="rarityFilter" class="filter-select" :placeholder="ui(&quot;稀有度 / Rarity&quot;)"><a-select-option v-for="rarity in rarityOptions" :key="rarity.id" :value="rarity.id">{{ ui(rarity.label) }} / {{ rarity.en }}</a-select-option></a-select><a-select v-model:value="sortBy" class="filter-select" :aria-label="ui(&quot;排序&quot;)"><a-select-option value="name">{{ ui("名称 / Name") }}</a-select-option><a-select-option value="family">{{ ui("类型 / Family") }}</a-select-option><a-select-option value="rarity">{{ ui("稀有度 / Rarity") }}</a-select-option></a-select></div>
      <div class="version-controls" role="status" aria-live="polite"><label><input v-model="showAllVersions" type="checkbox" /> {{ ui("展开所有版本") }}</label><span>{{ matchingGroups.size.toLocaleString() }} {{ ui("款武器") }} {{ matchingWeapons.length.toLocaleString() }} {{ ui("个版本") }}</span></div>
    </section>

    <section class="manifest-section"><div class="section-title"><div><h2>{{ ui("官方武器实体 / Official weapons") }}</h2><p>{{ ui("每条记录均来自当前 Bungie Manifest 快照；点击卡片查看素体数值、Perk 池和获取来源。") }}</p></div><span class="en">{{ officialCount.toLocaleString() }} MATCHES</span></div>
      <DestinyLoading v-if="status === 'loading'" :label="ui('正在加载官方武器目录 / Loading Manifest weapons…')" /><p v-else-if="status === 'error'" class="empty error">{{ ui("官方武器目录加载失败 / Failed to load the official catalog.") }}</p>
      <template v-else><div class="result-line"><span>{{ ui("显示") }} {{ displayedCount }} / {{ officialCount.toLocaleString() }} {{ showAllVersions ? ui("个版本") : ui("款武器") }}</span><small>{{ ui("图标、名称、槽位、素体数值、Perk 池与来源均优先读取 Manifest") }}</small></div><div class="official-grid"><button v-for="w in officialWeapons" :key="w.hash" type="button" class="official-weapon" :class="{ exotic: isExotic(w) }" @click="openDetail(w)"><div class="weapon-thumb"><img v-if="icon(w)" :src="icon(w)" :alt="`${zhName(w)} / ${enName(w)}`" loading="lazy" /><span v-else>{{ ui("无图标") }}</span><img v-if="watermark(w)" class="watermark" :src="watermark(w)" :alt="ui(&quot;发行标记&quot;)" /></div><div class="weapon-copy"><div class="official-top"><span class="badge" :class="{ gold: isExotic(w) }">{{ rarityLabel(w) }}</span><small>Hash {{ w.hash }}</small></div><h3>{{ zhName(w) }}</h3><p class="en-name">{{ enName(w) }}</p><p>{{ w.weaponFamily || ui("武器类型未登记") }} {{ slotLabel(w) }}</p><p class="version-badge">{{ showAllVersions ? ui("版本 #{0} / {1}", [versionNumber(w), versionsFor(w).length]) : ui("{0} 个版本 查看版本与 Perk 池", [versionsFor(w).length]) }}</p><ItemDefinitionInfo :item="w" compact /><div class="weapon-facts"><span v-if="w.socketCount">{{ w.socketCount }} {{ ui("插槽 / sockets") }}</span><span v-if="perkState === 'ready' && perkCount(w)">{{ perkCount(w) }} {{ ui("个 Perk 选项 / perk options") }}</span></div></div></button></div><p v-if="!officialWeapons.length" class="empty">{{ ui("没有匹配的官方武器实体 / No matching Manifest weapons.") }}</p><p v-else-if="officialCount > displayedCount" class="catalog-note"><button class="load-more" type="button" @click="visibleLimit += 120">{{ ui("加载更多（还有") }} {{ officialCount - displayedCount }} {{ showAllVersions ? ui("个版本") : ui("款武器") }}）</button></p></template>
    </section>

    <section class="knowledge-section"><div class="section-title"><div><h2>{{ t('pages.weapons.archetypes') }} / Archetypes</h2><p>{{ ui("这里解释武器原型在战斗中的定位，不代替具体武器的 Manifest 数据。") }}</p></div><span class="en">FIELD GUIDE</span></div><div class="grid grid-3"><article v-for="w in filteredArchetypes" :key="w.id" class="card archetype-card"><div class="w-top"><span class="badge gold">{{ ui(w.slot) }}</span><span class="range">{{ ui(w.range) }}{{ ui("距离 / range") }}</span></div><h3>{{ localized(w) }}</h3><span class="en-tag">{{ w.en.toUpperCase() }}</span><p>{{ ui(w.desc) }}</p></article></div><div v-if="!filteredArchetypes.length" class="empty">{{ ui("没有匹配的武器原型。") }}</div></section>

    <section class="knowledge-section"><div class="section-title"><div><h2>{{ t('pages.weapons.exotics') }} / Featured exotics</h2><p>{{ ui("精选构筑中的异域武器入口；完整实体、素体和 Perk 信息以官方武器列表为准。") }}</p></div><span class="en">CURATED INDEX</span></div><div class="grid grid-3"><article v-for="w in canonicalExotics" :key="w.id" class="card exotic-card"><div class="exo-top"><span class="badge gold">{{ ui("异域 / EXOTIC") }}</span><span class="wtype">{{ w.type }}</span></div><h3>✦ {{ localized(w) }}</h3><span class="en-tag">{{ w.en.toUpperCase() }}</span><p>{{ w.description || ui("官方装备定义已接入；点击上方 Manifest 条目查看可核验数据。") }}</p><div class="how">{{ ui("槽位：") }}{{ ui(w.slot) }} / {{ w.en }}{{ ui("；获取路径：") }}{{ acquisitionById[w.acquisitionId]?.name || ui("待核验 / pending verification") }}</div></article></div><div v-if="!canonicalExotics.length" class="empty">{{ ui("没有匹配的精选异域武器。") }}</div></section>

    <div v-if="selectedWeapon" class="weapon-overlay" @click.self="closeDetail">
      <section class="weapon-dialog" role="dialog" aria-modal="true" :aria-label="`${zhName(selectedWeapon)} weapon details`" tabindex="-1" @keydown.esc="closeDetail">
        <button type="button" class="detail-close" :aria-label="ui(&quot;关闭详情&quot;)" @click="closeDetail">×</button>
        <header class="weapon-detail-head">
          <div class="detail-weapon-icon"><img v-if="icon(selectedWeapon)" :src="icon(selectedWeapon)" :alt="zhName(selectedWeapon)" /></div>
          <div><span class="badge" :class="{ gold: isExotic(selectedWeapon) }">{{ rarityLabel(selectedWeapon) }}</span><h2>{{ zhName(selectedWeapon) }}</h2><p>{{ enName(selectedWeapon) }}</p><small>Hash {{ selectedWeapon.hash }} {{ selectedWeapon.weaponFamily || ui("武器类型未登记") }} {{ slotLabel(selectedWeapon) }}</small><small>{{ ui("版本 #") }}{{ versionNumber(selectedWeapon) }} / {{ versions.length }}</small></div>
        </header>
        <section v-if="versions.length > 1" class="detail-block version-block">
          <h3>{{ ui("武器版本 / Versions") }}</h3>
          <p class="stat-note">{{ ui("编号用于区分同名版本，不代表发行先后。输入“武器名#编号”可直接查询；普通、专家等型号分别列出。") }}</p>
          <div class="version-list">
            <button v-for="(version, index) in versions" :key="version.hash" type="button" :aria-pressed="version.hash === selectedWeapon.hash" @click="openDetail(version)">
              <span class="version-heading"><span class="version-icon"><img v-if="icon(version)" :src="icon(version)" alt="" /><img v-if="watermark(version)" class="watermark" :src="watermark(version)" :alt="ui(&quot;发行标记&quot;)" /></span><span><strong>#{{ index + 1 }}{{ version.hash === selectedWeapon.hash ? ui(" 已选") : '' }}</strong><small>Hash {{ version.hash }}</small></span></span>
              <ItemDefinitionInfo :item="version" compact /><span class="version-summary">{{ versionSummary(version) || ui("素体数值未登记") }}</span>
              <span v-if="perkState === 'ready'" class="version-summary">{{ pools(version).length }} {{ ui("列 Perk") }} {{ perkCount(version) }} {{ ui("个选项") }}</span>
              <span v-for="difference in weaponVersionHighlights(version, versions, plugsByHash)" :key="difference" class="version-summary">{{ difference }}</span><span class="version-source">{{ versionSource(version) }}</span>
            </button>
          </div>
        </section>
        <ItemDefinitionInfo :item="selectedWeapon" />
        <section v-if="intrinsics.length" class="detail-block intrinsic-list">
          <article v-for="intrinsic in intrinsics" :key="intrinsic.hash" class="intrinsic-item"><img v-if="plugIcon(intrinsic)" :src="plugIcon(intrinsic)" alt="" /><div><small>{{ ui("固有特性 / Intrinsic") }}</small><h3>{{ perkLabel(intrinsic) }}</h3><p>{{ plugDescription(intrinsic) }}</p></div></article>
        </section>
        <section v-if="selectedWeapon.descriptionZh || selectedWeapon.description" class="detail-block"><h3>{{ ui("武器说明 / Description") }}</h3><p>{{ manifestText(manifestDescription(selectedWeapon), locale) }}</p></section>
        <section class="detail-block">
          <h3>{{ ui("武器素体 / Base stats") }}</h3>
          <p class="stat-note">{{ ui("基础数值，不叠加 Perk、催化或大师属性。") }}</p>
          <div v-if="selectedStats.length" class="stat-grid"><div v-for="stat in selectedStats" :key="stat.key" class="stat-item"><span>{{ ui(stat.label) }}</span><strong>{{ stat.value }}</strong><i v-if="stat.bar"><b :style="{ width: `${stat.percent}%` }"></b></i></div></div>
          <p v-else class="muted">{{ ui("该版本未提供素体数值。") }}</p>
        </section>
        <section class="detail-block">
          <h3>{{ ui("Perk 池 / Perk pools") }}</h3>
          <DestinyLoading v-if="perkState === 'loading' || perkState === 'idle'" compact :label="ui('正在加载 Perk 详情…')" />
          <p v-else-if="perkState === 'error'" class="muted" role="alert">{{ ui("Perk 详情加载失败。") }}<button type="button" class="reset-link" @click="loadPerks">{{ ui("重试") }}</button></p>
          <template v-else>
            <p v-if="selectedPools.length" class="stat-note">{{ ui("按实际插槽展示可用词条；强化词条单独标注。") }}</p>
            <div v-if="selectedPools.length" class="pool-list">
              <article v-for="pool in selectedPools" :key="pool.socketIndex" class="perk-column">
                <header><strong>{{ pool.label }}</strong><small>{{ pool.options.length }} {{ ui("项") }}</small></header>
                <details v-for="perk in pool.options" :key="perk.hash" class="perk-option"><summary><img v-if="plugIcon(perk)" :src="plugIcon(perk)" alt="" loading="lazy" /><span>{{ perkLabel(perk) }}<small>{{ perk.name }}</small></span></summary><p>{{ plugDescription(perk) || ui("该词条暂无说明。") }}</p><ItemDefinitionInfo :item="perk" /><EntityLink :item="perk" kind="plugs" :label="ui(&quot;来源与条目详情&quot;)" /></details>
                <p v-if="pool.missingHashes.length" class="muted">{{ pool.missingHashes.length }} {{ ui("项词条详情缺失") }}</p>
              </article>
            </div>
            <p v-else class="muted">{{ ui("该版本未提供可展开的武器 Perk 列。") }}</p>
          </template>
        </section>
        <section v-if="sources(selectedWeapon).length" class="detail-block"><h3>{{ ui("获取来源 / Acquisition") }}</h3><div class="source-list"><article v-for="(source, index) in sources(selectedWeapon)" :key="`${source.kind}-${index}`"><span>{{ ui(source.kind) }}</span><strong>{{ locale === 'en' ? source.en : source.zh }}</strong><small>{{ source.en }}</small></article></div></section>
        <EntityLink :item="selectedWeapon" kind="equipment" :label="ui(&quot;打开独立百科条目&quot;)" /><SourceProvenance :item="selectedWeapon" :snapshot="snapshot" official compact /><RelatedBuilds :item="selectedWeapon" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.weapons-page{padding-bottom:4rem}.weapon-head{display:flex;justify-content:space-between;gap:2rem;align-items:end}.eyebrow{color:var(--gold-dim);font:.66rem var(--font-en);letter-spacing:.18em}.catalog-stat{min-width:15rem;padding:1rem 1.2rem;border-left:2px solid var(--gold);background:rgba(255,255,255,.035)}.catalog-stat strong{display:block;color:var(--gold-bright);font:700 1.45rem var(--font-en);font-variant-numeric:tabular-nums}.catalog-stat span{color:var(--text-dim);font-size:.65rem}.weapon-controls{display:grid;gap:1rem;margin:1.2rem 0 2rem;padding:1rem}.control-main{display:flex;gap:.8rem;align-items:center}.control-main .ant-input-affix-wrapper{flex:1}.reset-link{border:0;background:none;color:var(--gold-dim);font-size:.65rem;cursor:pointer;white-space:nowrap}.filter-row{display:flex;gap:.55rem;flex-wrap:wrap;align-items:center}.filter-radio{display:flex;gap:.35rem;flex-wrap:wrap}.filter-radio .ant-radio-button-wrapper{height:auto;min-height:2.35rem;padding:.4rem .65rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);line-height:1.15}.filter-radio .ant-radio-button-wrapper::before{display:none}.filter-radio .ant-radio-button-wrapper small{display:block;color:var(--text-dim);font-size:.53rem;margin-top:.14rem}.filter-radio .ant-radio-button-wrapper-checked{border-color:var(--gold);background:rgba(232,193,90,.1);color:var(--gold-bright)}.filter-select{min-width:10rem}.section-title{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin:2rem 0 .8rem}.section-title>div{flex:1;min-width:0;text-align:left}.section-title h2{margin:0;font-size:1rem;text-align:left}.section-title p{margin:.25rem 0 0;color:var(--text-dim);font-size:.68rem;max-width:44rem;text-align:left}.section-title>.en{flex:none;color:var(--gold-dim);font:.6rem var(--font-en);white-space:nowrap}.result-line{display:flex;justify-content:space-between;gap:1rem;align-items:baseline;margin:-.25rem 0 .7rem;color:var(--gold-bright);font:.7rem var(--font-en)}.result-line small{color:var(--text-dim);font:400 .64rem var(--font-cn)}.official-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft);max-height:62rem;overflow:auto}.official-weapon{display:grid;grid-template-columns:4.2rem 1fr;gap:.7rem;min-width:0;padding:.75rem;background:var(--bg-dark);border:0;color:inherit;text-align:left;cursor:pointer;transition:background .2s,transform .2s}.official-weapon:hover{background:rgba(232,193,90,.08);transform:translateY(-1px)}.official-weapon:focus-visible{outline:2px solid var(--gold-bright);outline-offset:-2px}.official-weapon.exotic{background:linear-gradient(120deg,rgba(232,193,90,.1),var(--bg-dark) 60%)}.weapon-thumb{width:4.2rem;height:4.2rem;display:flex;align-items:center;justify-content:center;background:#121212;border:1px solid var(--line-soft);overflow:hidden}.weapon-thumb img{width:100%;height:100%;object-fit:contain}.weapon-thumb span{color:var(--text-dim);font-size:.56rem}.weapon-copy{min-width:0}.official-top{display:flex;justify-content:space-between;gap:.4rem;align-items:center}.official-top small{color:var(--text-dim);font:.52rem var(--font-en);white-space:nowrap}.badge{display:inline-block;color:var(--text-dim);font-size:.54rem;letter-spacing:.04em}.badge.gold{color:var(--gold-bright)}.official-weapon h3{margin:.25rem 0 .08rem;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.en-name{font:.56rem var(--font-en)!important;color:var(--gold-dim)!important;margin:0 0 .2rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.official-weapon p{font-size:.62rem;color:var(--text-sub);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.weapon-facts{display:flex;gap:.55rem;flex-wrap:wrap;margin-top:.35rem;color:var(--text-dim);font-size:.54rem}.catalog-note,.muted{color:var(--text-dim);font-size:.64rem}.empty{text-align:center;padding:3rem;color:var(--text-dim)}.error{color:var(--warn)}.knowledge-section{margin-top:2.3rem}.archetype-card{min-height:10rem}.en-tag{display:block;font:.58rem var(--font-en);letter-spacing:.12em;color:var(--gold-dim);margin:-.1rem 0 .45rem}.w-top,.exo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}.range,.wtype{color:var(--text-dim);font-size:.62rem}.exotic-card{border-color:rgba(232,193,90,.25)}.how{margin-top:.7rem;color:var(--gold-dim);font-size:.65rem;line-height:1.5}.reference-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:2.3rem}.info-panels{margin:0}.info-panels table{width:100%;border-collapse:collapse;font-size:.7rem}.info-panels th,.info-panels td{padding:.45rem;border-bottom:1px solid var(--line-soft);text-align:left}.foundry-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:.45rem}.foundry{display:flex;justify-content:space-between;gap:.5rem;padding:.55rem .65rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.02)}.f-name{color:var(--gold-bright);font:.66rem var(--font-en)}.f-style{color:var(--text-sub);font-size:.63rem}.weapon-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:1.2rem;background:rgba(3,6,12,.8);backdrop-filter:blur(8px)}.weapon-dialog{position:relative;width:min(64rem,100%);max-height:min(46rem,calc(100vh - 2.4rem));overflow:auto;padding:1.25rem;background:var(--bg-dark, #202020);border:1px solid var(--line);box-shadow:0 24px 80px rgba(0,0,0,.6)}.detail-close{position:absolute;right:.7rem;top:.55rem;width:2rem;height:2rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);font-size:1.35rem;cursor:pointer}.weapon-detail-head{display:grid;grid-template-columns:6rem 1fr;gap:1rem;align-items:center;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}.detail-weapon-icon{width:6rem;height:6rem;background:#111;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.detail-weapon-icon img{width:100%;height:100%;object-fit:contain}.weapon-detail-head h2{margin:.3rem 0 .08rem;font-size:1.25rem}.weapon-detail-head p{margin:0;color:var(--gold-dim);font:.66rem var(--font-en)}.weapon-detail-head small{display:block;color:var(--text-dim);font-size:.58rem;margin-top:.4rem}.detail-block{padding-top:.85rem;margin-top:.85rem;border-top:1px solid var(--line-soft)}.detail-block h3{margin:0 0 .55rem;color:var(--gold-dim);font-size:.7rem}.detail-block p{margin:.35rem 0;color:var(--text-sub);font-size:.68rem;line-height:1.55}.detail-block p b{color:var(--gold-dim)}.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem .85rem}.stat-item{display:grid;grid-template-columns:1fr auto;gap:.22rem}.stat-item span{color:var(--text-sub);font-size:.62rem}.stat-item span small{display:block;color:var(--text-dim);font:.5rem var(--font-en)}.stat-item strong{font:700 .68rem var(--font-en);color:var(--text-main)}.stat-item i{grid-column:1/-1;height:3px;background:rgba(255,255,255,.08)}.stat-item i b{display:block;height:100%;background:var(--gold)}.pool-list{display:grid;gap:.5rem}.pool-list article{padding:.55rem .65rem;background:rgba(255,255,255,.04);border-left:2px solid var(--gold-dim)}.pool-list strong{font:.6rem var(--font-en);color:var(--gold-dim)}.pool-list p{font-size:.62rem}.source-list{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem}.source-list article{padding:.5rem .6rem;background:rgba(255,255,255,.04)}.source-list span{display:block;color:var(--gold-dim);font-size:.55rem}.source-list strong{display:block;font-size:.64rem;margin-top:.2rem}.source-list small{display:block;color:var(--text-dim);font:.54rem var(--font-en);margin-top:.12rem}.weapon-dialog footer{display:block;margin-top:1rem;color:var(--text-dim);font-size:.55rem}
@media(max-width:900px){.weapon-head{align-items:flex-start;flex-direction:column}.catalog-stat{width:100%}.official-grid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.control-main{align-items:stretch;flex-direction:column}.official-grid,.reference-grid{grid-template-columns:1fr}.section-title{align-items:flex-start;flex-direction:column;gap:.35rem}.stat-grid,.source-list{grid-template-columns:1fr}.weapon-detail-head{grid-template-columns:4.5rem 1fr}.detail-weapon-icon{width:4.5rem;height:4.5rem}}
</style>

<style scoped>
.version-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.5rem}.version-list button{min-width:0;text-align:left;padding:.7rem .85rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.025);color:var(--text-sub);cursor:pointer}.version-list button[aria-pressed="true"]{border-color:var(--gold-dim);background:rgba(232,193,90,.08)}.version-list strong{font-size:.72rem}.version-list small{display:block;color:var(--text-dim);font:.6rem var(--font-en);margin-top:.3rem}
.intrinsic-item{display:flex;gap:1rem;align-items:center;padding:.65rem;background:rgba(255,255,255,.025)}.intrinsic-item>img{width:3.5rem;height:3.5rem;object-fit:contain}.intrinsic-item small{font-size:.58rem;color:var(--text-dim)}.intrinsic-item h3{margin:.2rem 0;font-size:1rem;color:var(--text-main)}.intrinsic-item p{white-space:pre-line}
.stat-note{color:var(--text-dim)!important;font-size:.62rem!important;margin-bottom:.8rem!important}.stat-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem 2rem;max-width:42rem}.stat-item{grid-template-columns:7rem 2.3rem minmax(3rem,1fr);align-items:center;gap:.65rem}.stat-item span{font-size:.75rem}.stat-item strong{text-align:right;font-size:.78rem;font-variant-numeric:tabular-nums}.stat-item i{grid-column:auto;height:7px}.stat-item i b{background:var(--text-sub)}
.pool-list{grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.65rem;align-items:start}.pool-list article{padding:.65rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.025)}.perk-column>header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.15rem .25rem .65rem;border-bottom:1px solid var(--line-soft)}.perk-column>header strong{font-size:.75rem;font-family:var(--font-cn)}.perk-column>header small{font-size:.58rem;color:var(--text-dim)}.perk-option{margin-top:.4rem}.perk-option summary{display:flex;align-items:center;gap:.6rem;padding:.45rem .2rem;cursor:pointer;list-style:none}.perk-option summary::-webkit-details-marker{display:none}.perk-option summary:hover{background:rgba(255,255,255,.045)}.perk-option summary:focus-visible,.version-list button:focus-visible{outline:2px solid var(--gold)}.perk-option summary img{width:2rem;height:2rem;object-fit:contain}.perk-option summary span{font-size:.73rem;overflow-wrap:anywhere}.perk-option summary small{display:block;font:.53rem var(--font-en);color:var(--text-dim);margin-top:.25rem}.perk-option[open]{background:rgba(255,255,255,.04)}.perk-option p{padding:.1rem .4rem .5rem;white-space:pre-line;line-height:1.75}
@media(max-width:620px){.weapon-overlay{padding:.5rem}.weapon-dialog{padding:1rem;max-height:calc(100dvh - 1rem)}.stat-grid{grid-template-columns:1fr}.pool-list{grid-template-columns:repeat(2,minmax(0,1fr))}.weapon-detail-head{padding-right:1.3rem}.weapon-detail-head h2{font-size:1rem}.perk-option summary{gap:.4rem}.perk-option summary img{width:1.6rem;height:1.6rem}}
.version-controls{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;font-size:.72rem;color:var(--text-sub)}.version-controls label{display:flex;gap:.5rem;align-items:center;cursor:pointer}.version-controls input{accent-color:var(--gold)}.version-badge{color:var(--gold-bright)!important;margin-top:.4rem!important;white-space:normal!important}.version-heading{display:flex;align-items:center;gap:.6rem}.version-icon{display:block;position:relative;width:2.7rem;height:2.7rem;flex:none}.version-icon img{width:100%;height:100%;object-fit:contain}.version-summary,.version-source{display:block;margin-top:.55rem;font-size:.65rem;line-height:1.65;overflow-wrap:anywhere}.version-source{color:var(--text-dim)}.weapon-thumb{position:relative}.watermark{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.load-more{display:block;width:100%;padding:.8rem;border:1px solid var(--line-soft);background:rgba(232,193,90,.06);color:var(--gold-bright);cursor:pointer}.load-more:focus-visible{outline:2px solid var(--gold)}
@media(max-width:360px){.pool-list{grid-template-columns:1fr}}
</style>
