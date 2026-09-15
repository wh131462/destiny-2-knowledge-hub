<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { armorName, armorDescription, versionSummary, versionLabels, requiresArtifact, conditionSummary } from '@/i18n/metadata'
import { ui, useI18n, localized } from '@/i18n'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArmorCatalog } from '@/composables/useArmorCatalog'
import ArmorSetExplorer from '@/components/ArmorSetExplorer.vue'
import ArmorSystemGuide from '@/components/ArmorSystemGuide.vue'
import EntityLink from '@/components/EntityLink.vue'
import RelatedBuilds from '@/components/RelatedBuilds.vue'
import { armorSlots, armorClasses, armorGroups } from '../../../packages/manifest-catalog/armor.js'
import ItemDefinitionInfo from '@/components/ItemDefinitionInfo.vue'
import { manifestText } from '@/utils/manifestText'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { catalog, status, load } = useArmorCatalog()
onMounted(load)

const allowed = (value, values, fallback) => {
  const normalized = String(value ?? '')
  return values.includes(normalized) ? normalized : fallback
}
const viewIds = ['catalog', 'sets', 'planner', 'guide']
const scopeIds = ['exotics', 'all', 'mods']
const availabilityIds = ['', 'current', 'source-confirmed', 'historical']
const sortIds = ['name', 'availability', 'slot']
const classIds = armorClasses.map(item => item.id)
const slotIds = ['', ...armorSlots.map(item => item.id)]
const view = ref(allowed(route.query.view, viewIds, 'catalog'))
const catalogScope = ref(allowed(route.query.scope, scopeIds, 'exotics'))
const classId = ref(allowed(route.query.class, classIds, 'titan'))
const keyword = ref(String(route.query.q || ''))
const slotFilter = ref(allowed(route.query.slot, slotIds, ''))
const availabilityFilter = ref(allowed(route.query.availability, availabilityIds, ''))
const sortBy = ref(allowed(route.query.sort, sortIds, 'name'))
const modVersion = ref('standard')
const limit = ref(24)
const selectedArmor = ref(null)
const selectedVersions = ref([])

const views = [
  { id: 'catalog', label: '防具图鉴', en: 'CATALOG' },
  { id: 'sets', label: '套装效果', en: 'SETS' },
  { id: 'planner', label: '套装搭配', en: 'PLANNER' },
  { id: 'guide', label: '系统指南', en: 'GUIDE' }
]
const scopeOptions = [
  { value: 'exotics', label: '异域护甲' },
  { value: 'all', label: '全部防具' },
  { value: 'mods', label: '模组图鉴' }
]
const availabilityOptions = [
  { value: '', label: '全部版本状态' },
  { value: 'current', label: '当前系统定义' },
  { value: 'source-confirmed', label: '来源已登记' },
  { value: 'historical', label: '历史定义' }
]
const sortOptions = [
  { value: 'name', label: '按名称' },
  { value: 'availability', label: '当前版本优先' },
  { value: 'slot', label: '按部位' }
]
const slotOptions = computed(() => [{ value: '', label: ui('全部部位') }, ...armorSlots.map(slot => ({ value: slot.id, label: localized(slot) }))])
const localizedSelectOptions = options => options.map(option => ({ ...option, label: ui(option.label) }))
const icon = item => item?.icon ? `https://www.bungie.net${item.icon}` : ''
const watermark = item => item?.iconWatermark ? `https://www.bungie.net${item.iconWatermark}` : ''
const description = item => manifestText(armorDescription(item), locale.value)
const isExotic = item => item?.tierTypeHash === 2759499571
const rarityName = item => isExotic(item) ? '异域' : item?.tierTypeHash === 4008398120 ? '传说' : '其他'
const slotName = item => armorSlots.find(slot => slot.id === item?.armorSlot)?.name || '未知部位'
const className = item => armorClasses.find(itemClass => itemClass.id === item?.classId)?.name || '通用'
const classItemName = computed(() => armorClasses.find(itemClass => itemClass.id === classId.value)?.classItem)
const query = computed(() => keyword.value.trim().toLowerCase())
const setByHash = computed(() => new Map((catalog.value?.sets || []).map(set => [set.hash, set])))
const traitByHash = computed(() => new Map((catalog.value?.traits || []).map(trait => [trait.hash, trait])))
const allGroups = computed(() => armorGroups(catalog.value?.items || []))
const exoticCount = computed(() => allGroups.value.filter(group => isExotic(group[0])).length)
const traitText = item => (item.traits || []).flatMap(pool => pool.hashes.map(hash => traitByHash.value.get(hash))).filter(Boolean).flatMap(trait => [trait.name, trait.nameZh, trait.description, trait.descriptionZh]).join(' ')
const setsFor = item => (item?.setHashes || []).map(hash => setByHash.value.get(hash)).filter(Boolean)
const matchesAvailability = item => !availabilityFilter.value || (availabilityFilter.value === 'current' ? item.availabilityStatus !== 'historical' : item.availabilityStatus === availabilityFilter.value)
const availabilityName = item => item?.availabilityStatus === 'source-confirmed' ? '来源已登记' : item?.availabilityStatus === 'historical' ? '历史定义' : '当前系统定义'
const availabilityRank = item => item?.availabilityStatus === 'source-confirmed' ? 2 : item?.availabilityStatus === 'historical' ? 0 : 1
const primaryTrait = item => {
  const traits = (item?.traits || []).flatMap(pool => pool.hashes.map(hash => traitByHash.value.get(hash))).filter(Boolean)
  if (isExotic(item) && item?.armorSlot === 'classItem') return '双列异域特性'
  return traits.map(armorName).filter(Boolean).join(' / ') || setsFor(item).map(armorName).join(' / ') || '未登记固有特性'
}
const filteredGroups = computed(() => allGroups.value.filter(group => {
  const item = group[0]
  if (item.classId !== classId.value || (catalogScope.value === 'exotics' && !isExotic(item))) return false
  if (slotFilter.value && item.armorSlot !== slotFilter.value) return false
  if (!matchesAvailability(item)) return false
  if (!query.value) return true
  return group.some(version => [version.name, version.nameZh, String(version.hash), versionSummary(version), traitText(version), ...setsFor(version).flatMap(set => [set.name, set.nameZh])].join(' ').toLowerCase().includes(query.value))
}).sort((a, b) => {
  const first = a[0], second = b[0]
  const primary = sortBy.value === 'availability' ? availabilityRank(second) - availabilityRank(first) : sortBy.value === 'slot' ? slotIds.indexOf(first.armorSlot) - slotIds.indexOf(second.armorSlot) : 0
  return primary || armorName(first).localeCompare(armorName(second), 'zh')
}))
const visibleGroups = computed(() => filteredGroups.value.slice(0, limit.value))
const filteredMods = computed(() => (catalog.value?.mods || []).filter(mod =>
  (modVersion.value === 'all' || (modVersion.value === 'artifact' ? requiresArtifact(mod) : !requiresArtifact(mod) && !['deprecated', 'placeholder'].includes(mod.definitionState))) &&
  (!slotFilter.value || mod.slot === slotFilter.value) &&
  (!query.value || [mod.name, mod.nameZh, mod.description, mod.descriptionZh, versionSummary(mod), conditionSummary(mod), String(mod.hash)].join(' ').toLowerCase().includes(query.value))
).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh')))
const visibleMods = computed(() => filteredMods.value.slice(0, limit.value))
const selectedSources = computed(() => selectedArmor.value ? [
  ...(selectedArmor.value.activitySources || []).map(source => ({ type: '活动奖励定义', name: source.activityNameZh || source.activityName })),
  ...(selectedArmor.value.vendorSources || []).map(source => ({ type: '商人库存定义', name: source.vendorNameZh || source.vendorName }))
].filter(source => source.name) : [])
const selectedTraits = computed(() => (selectedArmor.value?.traits || []).map(pool => ({ ...pool, options: pool.hashes.map(hash => traitByHash.value.get(hash)).filter(Boolean) })))
const selectedVersionNumber = computed(() => Math.max(1, selectedVersions.value.findIndex(item => item.hash === selectedArmor.value?.hash) + 1))
const resultCount = computed(() => catalogScope.value === 'mods' ? filteredMods.value.length : filteredGroups.value.length)
const displayedCount = computed(() => catalogScope.value === 'mods' ? visibleMods.value.length : visibleGroups.value.length)

function openArmor(item, versions) {
  if (!item) return
  const group = versions || allGroups.value.find(candidate => candidate.some(version => version.hash === item.hash)) || [item]
  selectedVersions.value = group
  selectedArmor.value = group[0]
}
function changeVersion(hash) { selectedArmor.value = selectedVersions.value.find(item => item.hash === hash) || selectedVersions.value[0] }
function selectView(next) { view.value = next }
function openPlanner() { view.value = 'planner' }
function reset() {
  keyword.value = ''
  slotFilter.value = ''
  availabilityFilter.value = ''
  sortBy.value = 'name'
  modVersion.value = 'standard'
}
function normalizedRouteState(nextQuery) {
  return {
    view: allowed(nextQuery.view, viewIds, 'catalog'),
    scope: allowed(nextQuery.scope, scopeIds, 'exotics'),
    classId: allowed(nextQuery.class, classIds, 'titan'),
    slot: allowed(nextQuery.slot, slotIds, ''),
    availability: allowed(nextQuery.availability, availabilityIds, ''),
    sort: allowed(nextQuery.sort, sortIds, 'name'),
    q: String(nextQuery.q || '')
  }
}
function applyRouteState(nextQuery) {
  const next = normalizedRouteState(nextQuery)
  view.value = next.view
  catalogScope.value = next.scope
  classId.value = next.classId
  slotFilter.value = next.slot
  availabilityFilter.value = next.availability
  sortBy.value = next.sort
  keyword.value = next.q
}
function routeQuery() {
  return {
    ...route.query,
    view: view.value === 'catalog' ? undefined : view.value,
    scope: catalogScope.value === 'exotics' ? undefined : catalogScope.value,
    class: classId.value === 'titan' ? undefined : classId.value,
    slot: slotFilter.value || undefined,
    availability: availabilityFilter.value || undefined,
    sort: sortBy.value === 'name' ? undefined : sortBy.value,
    q: keyword.value.trim() || undefined
  }
}

watch(() => route.query, applyRouteState)
watch([view, catalogScope, classId, slotFilter, availabilityFilter, sortBy, keyword], () => {
  limit.value = 24
  const next = routeQuery()
  const current = Object.fromEntries(Object.entries(route.query).filter(([, value]) => value != null && value !== ''))
  const cleanNext = Object.fromEntries(Object.entries(next).filter(([, value]) => value != null && value !== ''))
  if (JSON.stringify(current) !== JSON.stringify(cleanNext)) router.replace({ query: cleanNext })
})
watch([catalogScope, modVersion], () => { slotFilter.value = ''; limit.value = 24 })
</script>

<template>
  <div class="armor-page">
    <header class="armor-head">
      <div><p class="eyebrow">ARMOR ARCHIVE / GUARDIAN LOADOUTS</p><h1>{{ t('pages.armor.title') }}</h1><p>{{ ui('查当前定义、读套装效果，再把五个部位组成可用方案。') }}</p></div>
      <div class="armor-facts"><div><strong>{{ catalog?.sets.length ?? '—' }}</strong><span>{{ ui('官方套装') }}</span></div><div><strong>{{ catalog ? exoticCount : '—' }}</strong><span>{{ ui('异域款式') }}</span></div><div><strong>05</strong><span>{{ ui('护甲部位') }}</span></div></div>
    </header>
    <div class="snapshot-line"><span><i></i> BUNGIE MANIFEST</span><span v-if="catalog">{{ ui('快照') }} {{ catalog.syncedAt?.slice(0, 10) }} / {{ catalog.items.length.toLocaleString() }} {{ ui('个防具定义') }}</span><span v-else>{{ ui('正在连接防具目录') }}</span></div>

    <nav class="armor-task-nav" :aria-label="ui('防具任务')">
      <button v-for="item in views" :key="item.id" type="button" :aria-pressed="view === item.id" @click="selectView(item.id)"><span>{{ ui(item.label) }}</span><small>{{ item.en }}</small></button>
    </nav>

    <section v-if="view !== 'guide'" class="armor-controls panel">
      <div v-if="view !== 'planner'" class="control-main">
        <a-input v-model:value="keyword" allow-clear :placeholder="view === 'sets' ? ui('搜索套装名称或效果，如：手雷、治疗…') : ui('搜索防具、异域特性、套装效果或 Hash…')" :aria-label="ui('搜索防具目录')" />
        <button class="reset-link" type="button" @click="reset">{{ ui('重置筛选') }}</button>
      </div>
      <div class="filter-row">
        <a-radio-group v-model:value="classId" button-style="solid" class="class-radio" :aria-label="ui('职业筛选')"><a-radio-button v-for="itemClass in armorClasses" :key="itemClass.id" :value="itemClass.id">{{ ui(itemClass.name) }}<small>{{ itemClass.classItem }}</small></a-radio-button></a-radio-group>
        <template v-if="view === 'catalog'">
          <a-select v-model:value="catalogScope" class="filter-select scope-select" :options="localizedSelectOptions(scopeOptions)" :aria-label="ui('图鉴范围')" />
          <a-select v-model:value="slotFilter" class="filter-select" :options="slotOptions" :aria-label="ui('部位筛选')" />
          <a-select v-if="catalogScope !== 'mods'" v-model:value="availabilityFilter" class="filter-select" :options="localizedSelectOptions(availabilityOptions)" :aria-label="ui('版本状态筛选')" />
          <a-select v-if="catalogScope !== 'mods'" v-model:value="sortBy" class="filter-select" :options="localizedSelectOptions(sortOptions)" :aria-label="ui('排序')" />
          <a-select v-else v-model:value="modVersion" class="filter-select wide-select" :aria-label="ui('模组版本')"><a-select-option value="standard">{{ ui('普通定义（不含神器限定）') }}</a-select-option><a-select-option value="artifact">{{ ui('需神器解锁的版本') }}</a-select-option><a-select-option value="all">{{ ui('全部定义（含历史与占位）') }}</a-select-option></a-select>
        </template>
      </div>
      <div v-if="view === 'catalog'" class="result-summary" role="status"><span>{{ displayedCount }} / {{ resultCount }} {{ catalogScope === 'mods' ? ui('个模组') : ui('款防具') }}</span><small>{{ catalogScope === 'mods' ? ui('效果与能量消耗来自官方定义') : ui('同名版本已合并，默认展示证据最强的当前定义') }}</small></div>
    </section>

    <DestinyLoading v-if="status === 'loading' || status === 'idle'" :label="ui('正在整理护甲库')" :detail="ui('读取套装效果、异域特性与模组定义…')" />
    <div v-else-if="status === 'error'" class="catalog-state" role="alert"><h2>{{ ui('防具目录暂时无法加载') }}</h2><p>{{ ui('请重试以读取官方数据。') }}</p><button type="button" class="outline-button" @click="load">{{ ui('重新加载') }}</button></div>
    <template v-else-if="catalog">
      <ArmorSystemGuide v-if="view === 'guide'" :catalog="catalog" />
      <KeepAlive v-else-if="view === 'sets' || view === 'planner'"><ArmorSetExplorer :catalog="catalog" :class-id="classId" :query="keyword" :mode="view" @open-armor="openArmor" @open-planner="openPlanner" /></KeepAlive>
      <section v-else class="catalog-section">
        <div class="section-title"><div><h2>{{ catalogScope === 'exotics' ? ui('异域护甲索引') : catalogScope === 'mods' ? ui('防具模组索引') : ui('完整防具档案') }}</h2><p>{{ catalogScope === 'mods' ? ui('按部位和版本查看模组效果与能量消耗。') : ui('选择卡片查看版本、固有特性、套装归属与获取证据。') }}</p></div><span>{{ resultCount.toLocaleString() }} {{ catalogScope === 'mods' ? 'MODS' : 'ARMOR' }}</span></div>

        <div v-if="catalogScope !== 'mods'" class="armor-grid">
          <button v-for="group in visibleGroups" :key="group[0].hash" type="button" class="armor-tile" :class="{ exotic: isExotic(group[0]) }" @click="openArmor(group[0], group)">
            <div class="armor-icon"><img v-if="icon(group[0])" :src="icon(group[0])" :alt="armorName(group[0])" loading="lazy" /><span v-else>◇</span><img v-if="watermark(group[0])" class="armor-watermark" :src="watermark(group[0])" alt="" /></div>
            <div class="armor-tile-copy">
              <div class="tile-top"><span>{{ ui(rarityName(group[0])) }} / {{ ui(slotName(group[0])) }}</span><span class="availability" :class="group[0].availabilityStatus">{{ ui(availabilityName(group[0])) }}</span></div>
              <h3>{{ armorName(group[0]) }}</h3><small class="english-name">{{ group[0].name }}</small><p>{{ ui(primaryTrait(group[0])) }}</p>
              <footer><span>{{ group.length }} {{ ui('个版本') }}</span><span>{{ ui('查看记录') }} →</span></footer>
            </div>
          </button>
        </div>
        <div v-else class="mod-grid">
          <article v-for="mod in visibleMods" :key="mod.hash" class="mod-card"><header><img v-if="icon(mod)" :src="icon(mod)" alt="" loading="lazy" /><div><h3>{{ armorName(mod) }}</h3><small>{{ mod.name }}</small></div><span class="energy-cost" :aria-label="mod.energyCost == null ? ui('能量消耗未登记') : ui('能量消耗 {0}', [mod.energyCost])">{{ mod.energyCost ?? '—' }}<small>{{ ui('能量') }}</small></span></header><ItemDefinitionInfo :item="mod" compact /><p>{{ description(mod) || ui('该定义未提供效果说明。') }}</p><footer><span>{{ armorSlots.find(slot => slot.id === mod.slot)?.name || ui('通用 / 活动专属') }}</span><EntityLink :item="mod" kind="mods" :label="ui('模组详情')" /></footer></article>
        </div>
        <div v-if="!resultCount" class="empty-state"><h3>{{ ui('没有匹配的防具') }}</h3><p>{{ ui('试试其他职业、部位或更短的关键词。') }}</p><button type="button" class="outline-button" @click="reset">{{ ui('清空筛选') }}</button></div>
        <button v-if="resultCount > limit" type="button" class="load-more" @click="limit += 24">{{ ui('加载更多（还有 {0} 项）', [resultCount - limit]) }}</button>
      </section>
    </template>

    <a-modal :open="Boolean(selectedArmor)" :title="null" :footer="null" :width="960" wrap-class-name="armor-record-modal" @cancel="selectedArmor = null">
      <div v-if="selectedArmor" class="armor-record">
        <header class="record-hero" :class="{ exotic: isExotic(selectedArmor) }">
          <div class="record-icon"><img v-if="icon(selectedArmor)" :src="icon(selectedArmor)" :alt="armorName(selectedArmor)" /><span v-else>◇</span><img v-if="watermark(selectedArmor)" class="record-watermark" :src="watermark(selectedArmor)" alt="" /></div>
          <div class="record-identity"><p class="record-kicker"><span>{{ ui(rarityName(selectedArmor)) }}</span> ARMOR RECORD</p><h2>{{ armorName(selectedArmor) }}</h2><p class="record-en-name">{{ selectedArmor.name }}</p><div class="record-facts"><span>{{ ui(className(selectedArmor)) }}</span><span>{{ ui(slotName(selectedArmor)) }}</span><span>HASH {{ selectedArmor.hash }}</span></div><p v-if="description(selectedArmor)" class="record-description">{{ description(selectedArmor) }}</p></div>
          <div class="record-status"><strong>{{ ui('定义') }} {{ selectedVersionNumber }}</strong><span>{{ selectedVersions.length }} {{ ui('个版本') }}</span><b :class="selectedArmor.availabilityStatus">{{ ui(availabilityName(selectedArmor)) }}</b></div>
        </header>

        <section v-if="selectedVersions.length > 1" class="record-band"><div class="record-section-title"><div><span>VERSIONS</span><h3>{{ ui('装备版本') }}</h3></div><small>{{ ui('当前定义优先，历史定义保留供核对') }}</small></div><a-select class="record-version-select" popup-class-name="armor-version-options" :aria-label="ui('装备版本')" :value="selectedArmor.hash" @change="changeVersion"><a-select-option v-for="(version, index) in selectedVersions" :key="version.hash" :value="version.hash"><span class="version-option">{{ ui('定义') }} {{ index + 1 }} / {{ versionSummary(version) || ui(availabilityName(version)) }}</span></a-select-option></a-select><ItemDefinitionInfo :item="selectedArmor" compact /></section>

        <div class="record-columns">
          <div class="record-main">
            <section v-if="selectedTraits.length" class="record-band"><div class="record-section-title"><div><span>INTRINSIC</span><h3>{{ selectedArmor.armorSlot === 'classItem' && isExotic(selectedArmor) ? ui('双列异域特性') : ui('固有特性') }}</h3></div></div><p v-if="selectedArmor.armorSlot === 'classItem' && isExotic(selectedArmor)" class="record-note">{{ ui('当前快照可能只提供每列默认示例，不代表固定掉落组合。') }}</p><div class="trait-list"><article v-for="(pool, index) in selectedTraits" :key="pool.socketIndex" class="trait-column"><header v-if="selectedTraits.length > 1">{{ ui('第 {0} 列', [index + 1]) }}</header><div v-for="trait in pool.options" :key="trait.hash" class="trait-detail"><img v-if="icon(trait)" :src="icon(trait)" alt="" loading="lazy" /><div><h4>{{ armorName(trait) }}</h4><p>{{ description(trait) || ui('该特性暂无说明。') }}</p></div></div></article></div></section>
            <section v-else-if="isExotic(selectedArmor)" class="record-band"><div class="record-section-title"><div><span>INTRINSIC</span><h3>{{ ui('固有特性') }}</h3></div></div><p class="record-note">{{ ui('该版本的固有特性尚未解析，可切换其他版本核对。') }}</p></section>
            <section v-if="setsFor(selectedArmor).length" class="record-band"><div class="record-section-title"><div><span>SET BONUS</span><h3>{{ ui('所属套装') }}</h3></div></div><article v-for="set in setsFor(selectedArmor)" :key="set.hash" class="record-set"><h4>{{ armorName(set) }}</h4><div v-for="perk in set.perks" :key="perk.sandboxPerkHash"><strong>{{ perk.requiredSetCount }} {{ ui('件') }} / {{ armorName(perk) }}</strong><p>{{ description(perk) }}</p></div></article></section>
          </div>
          <aside class="record-aside">
            <section><span>ACQUISITION</span><h3>{{ ui('获取线索') }}</h3><template v-if="selectedSources.length"><div v-for="(source, index) in selectedSources" :key="index" class="source-row"><small>{{ ui(source.type) }}</small><strong>{{ source.name }}</strong></div></template><p v-else>{{ ui('当前定义没有直接关联的活动奖励或商人记录。') }}</p></section>
            <section><span>INSTANCE DATA</span><h3>{{ ui('属性与装备实例') }}</h3><p>{{ ui('随机掉落的六维属性、Tier、能量等级与大师状态属于具体装备实例，请在游戏内检查实物。') }}</p></section>
          </aside>
        </div>
        <div class="related-area"><RelatedBuilds :item="selectedArmor" /></div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.armor-page{padding-bottom:3rem}.armor-head{display:flex;justify-content:space-between;gap:2rem;align-items:end;padding:2.2rem 0 1.5rem;border-bottom:1px solid var(--line-soft)}.eyebrow{margin:0;color:var(--gold-dim);font:.62rem var(--font-en);letter-spacing:0}.armor-head h1{margin:.55rem 0 .45rem;font-family:var(--font-cn);font-size:2.35rem}.armor-head>div>p:last-child{margin:0;color:var(--text-sub);font-size:.82rem}.armor-facts{display:flex;flex:none}.armor-facts>div{min-width:7rem;padding:.3rem 1.1rem;border-left:1px solid var(--line-soft)}.armor-facts strong,.armor-facts span{display:block}.armor-facts strong{color:var(--gold-bright);font:500 1.55rem var(--font-en);font-variant-numeric:tabular-nums}.armor-facts span{margin-top:.3rem;color:var(--text-dim);font-size:.59rem}.snapshot-line{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 0;color:var(--text-dim);font-size:.58rem}.snapshot-line>span:first-child{display:flex;align-items:center;gap:.45rem;font-family:var(--font-en)}.snapshot-line i{width:4px;height:4px;border-radius:50%;background:#a6caaa}.armor-task-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin:1rem 0 1.2rem;border:1px solid var(--line-soft);background:var(--line-soft)}.armor-task-nav button{min-width:0;padding:.75rem 1rem;border:0;background:var(--bg-dark);color:var(--text-sub);text-align:left;cursor:pointer}.armor-task-nav button:hover{background:var(--bg-hover)}.armor-task-nav button:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}.armor-task-nav button[aria-pressed=true]{box-shadow:inset 3px 0 0 var(--gold);background:rgba(232,193,90,.08);color:var(--gold-bright)}.armor-task-nav span,.armor-task-nav small{display:block}.armor-task-nav span{font-size:.78rem;font-weight:600}.armor-task-nav small{margin-top:.15rem;color:var(--text-dim);font:.52rem var(--font-en)}
.armor-controls{display:grid;gap:.75rem;margin-bottom:1.25rem;padding:1rem}.control-main{display:flex;align-items:center;gap:.75rem}.control-main .ant-input-affix-wrapper{flex:1}.reset-link{flex:none;border:0;background:transparent;color:var(--gold-dim);font-size:.64rem;cursor:pointer}.filter-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}.class-radio{display:flex}.class-radio .ant-radio-button-wrapper{height:auto;min-height:2.3rem;padding:.35rem .7rem;border-color:var(--line-soft);background:transparent;color:var(--text-sub);line-height:1.1}.class-radio .ant-radio-button-wrapper::before{display:none}.class-radio small{display:block;margin-top:.12rem;color:var(--text-dim);font-size:.5rem}.class-radio .ant-radio-button-wrapper-checked{border-color:var(--gold);background:rgba(232,193,90,.1);color:var(--gold-bright)}.filter-select{min-width:9.5rem}.scope-select{min-width:8rem}.wide-select{min-width:14rem}.result-summary{display:flex;justify-content:space-between;gap:1rem;color:var(--gold-bright);font:.68rem var(--font-en)}.result-summary small{color:var(--text-dim);font:400 .62rem var(--font-cn)}
.section-title{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin:1.6rem 0 .75rem}.section-title h2{margin:0;font-size:1rem}.section-title p{max-width:44rem;margin:.25rem 0 0;color:var(--text-dim);font-size:.66rem}.section-title>span{color:var(--gold-dim);font:.58rem var(--font-en)}.armor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line-soft)}.armor-tile{display:grid;grid-template-columns:4.2rem minmax(0,1fr);gap:.7rem;min-width:0;min-height:6.7rem;padding:.75rem;border:0;background:var(--bg-dark);color:var(--text-main);text-align:left;cursor:pointer}.armor-tile:hover{background:var(--bg-hover)}.armor-tile:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}.armor-tile.exotic{background:linear-gradient(120deg,rgba(232,193,90,.09),var(--bg-dark) 62%)}.armor-icon{position:relative;width:4.2rem;height:4.2rem;border:1px solid var(--line-soft);background:var(--bg-deep);overflow:hidden}.armor-icon img{width:100%;height:100%;object-fit:cover}.armor-icon .armor-watermark{position:absolute;inset:0;pointer-events:none}.armor-tile-copy{min-width:0}.tile-top{display:flex;justify-content:space-between;gap:.4rem;min-height:1rem;color:var(--gold-dim);font-size:.53rem}.availability{color:var(--text-dim);white-space:nowrap}.availability.source-confirmed{color:#a9c7ad}.availability.historical{color:#9c96a3}.armor-tile h3{margin:.25rem 0 .08rem;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.english-name{display:block;color:var(--text-dim);font:.54rem var(--font-en);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.armor-tile p{margin:.35rem 0;color:var(--text-sub);font-size:.61rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.armor-tile footer{display:flex;justify-content:space-between;gap:.5rem;color:var(--text-dim);font-size:.55rem}.armor-tile footer span:last-child{color:var(--gold-dim)}
.mod-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line-soft)}.mod-card{display:flex;flex-direction:column;min-width:0;padding:1rem;background:var(--bg-dark)}.mod-card header{display:flex;align-items:center;gap:.65rem}.mod-card header>img{width:2.6rem;height:2.6rem}.mod-card header>div{flex:1;min-width:0}.mod-card h3{font-size:.78rem}.mod-card header small{display:block;color:var(--text-dim);font-size:.55rem;overflow-wrap:anywhere}.mod-card p{flex:1;color:var(--text-sub);font-size:.68rem;line-height:1.7;white-space:pre-line}.energy-cost{color:var(--gold-bright);font:700 1.05rem var(--font-en);text-align:center}.energy-cost small{font:400 .5rem var(--font-cn)!important}.mod-card footer{display:flex;justify-content:space-between;gap:.5rem;padding-top:.65rem;border-top:1px solid var(--line-soft);color:var(--text-dim);font-size:.58rem}.empty-state,.catalog-state{padding:3rem 1rem;border:1px solid var(--line-soft);background:var(--bg-dark);text-align:center}.empty-state h3,.catalog-state h2{font-size:1rem}.empty-state p,.catalog-state p{color:var(--text-sub);font-size:.72rem}.outline-button,.load-more{padding:.7rem 1rem;border:1px solid var(--gold-dim);background:rgba(232,193,90,.06);color:var(--gold-bright);cursor:pointer}.load-more{display:block;width:100%;margin-top:1rem}.outline-button:focus-visible,.load-more:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.armor-record{color:var(--text-main);background:var(--bg-dark)}.record-hero{display:grid;grid-template-columns:6rem minmax(0,1fr) auto;gap:1rem;padding:1.25rem 3.2rem 1.25rem 1.25rem;background:var(--bg-panel);border-top:3px solid var(--text-dim)}.record-hero.exotic{border-top-color:var(--gold)}.record-icon{position:relative;width:6rem;height:6rem;border:1px solid var(--line-soft);background:var(--bg-deep)}.record-icon img{width:100%;height:100%;object-fit:cover}.record-icon .record-watermark{position:absolute;inset:0}.record-identity{min-width:0}.record-kicker{margin:0 0 .25rem;color:var(--text-dim);font:.56rem var(--font-en)}.record-kicker span{color:var(--gold-bright)}.record-identity h2{margin:0;font-size:1.35rem}.record-en-name{margin:.15rem 0;color:var(--gold-dim);font:.65rem var(--font-en)}.record-facts{display:flex;flex-wrap:wrap;margin-top:.5rem;color:var(--text-sub);font:.58rem var(--font-en)}.record-facts span{padding:0 .5rem;border-left:1px solid var(--line-soft)}.record-facts span:first-child{padding-left:0;border-left:0}.record-description{max-width:42rem;margin:.65rem 0 0;color:var(--text-sub);font-size:.68rem;line-height:1.65;white-space:pre-line}.record-status{min-width:8rem;text-align:right}.record-status strong,.record-status span,.record-status b{display:block}.record-status strong{color:var(--gold-bright);font:700 1.25rem var(--font-en)}.record-status span{color:var(--text-dim);font-size:.55rem}.record-status b{margin-top:.6rem;color:var(--text-sub);font-size:.58rem;font-weight:500}.record-status b.source-confirmed{color:#a9c7ad}.record-status b.historical{color:#aaa0ad}.record-band{padding:1rem 1.25rem;border-top:1px solid var(--line-soft)}.record-section-title{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:.7rem}.record-section-title span,.record-aside section>span{color:var(--gold-dim);font:.52rem var(--font-en)}.record-section-title h3,.record-aside h3{margin:.15rem 0 0;font-size:.8rem}.record-section-title small{color:var(--text-dim);font-size:.56rem;text-align:right}.record-version-select{width:100%}.record-version-select+.definition-info{margin-top:.55rem}.record-columns{display:grid;grid-template-columns:minmax(0,1fr) 16rem;border-top:1px solid var(--line-soft)}.record-columns .record-band:first-child{border-top:0}.record-main{min-width:0}.record-aside{padding:1rem 1.25rem;border-left:1px solid var(--line-soft);background:var(--bg-panel)}.record-aside section{padding-bottom:1rem;margin-bottom:1rem;border-bottom:1px solid var(--line-soft)}.record-aside p,.source-row{color:var(--text-sub);font-size:.62rem;line-height:1.65}.source-row{display:grid;gap:.15rem;margin-top:.55rem}.source-row small{color:var(--gold-dim)}.trait-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1px;background:var(--line-soft)}.trait-column{min-width:0;padding:.7rem;background:var(--bg-panel)}.trait-column>header{padding-bottom:.45rem;color:var(--gold-dim);font-size:.56rem}.trait-detail{display:flex;gap:.7rem;padding:.55rem;background:var(--bg-dark)}.trait-detail img{width:2.7rem;height:2.7rem}.trait-detail h4,.record-set h4{margin:0 0 .25rem;color:var(--gold-bright);font-size:.72rem}.trait-detail p,.record-set p{margin:0;color:var(--text-sub);font-size:.62rem;line-height:1.65;white-space:pre-line}.record-note{color:var(--text-dim);font-size:.62rem}.record-set>div{padding:.6rem 0;border-top:1px solid var(--line-soft)}.record-set strong{font-size:.65rem}.related-area{padding:0 1.25rem 1rem;border-top:1px solid var(--line-soft)}
:global(.armor-record-modal .ant-modal){top:1rem;padding-bottom:1rem}:global(.armor-record-modal .ant-modal-content){max-height:calc(100dvh - 2rem);padding:0;overflow:auto;background:var(--bg-dark);border-radius:0}:global(.armor-record-modal .ant-modal-close){z-index:3;color:var(--text-main);background:rgba(6,10,20,.75)}:global(.armor-record-modal .ant-modal-close:hover){color:var(--gold-bright);background:var(--bg-hover)}:global(.armor-version-options .ant-select-item-option-content){white-space:normal;line-height:1.55;overflow-wrap:anywhere}.version-option{font-size:.68rem}
@media(max-width:1000px){.armor-grid,.mod-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.armor-facts>div{min-width:6rem}.filter-select{min-width:8.5rem}}
@media(max-width:760px){.armor-head{align-items:flex-start;flex-direction:column;gap:1rem;padding-top:1.2rem}.armor-head h1{font-size:2rem}.armor-facts{width:100%}.armor-facts>div{flex:1;min-width:0;padding:.2rem .75rem}.armor-facts>div:first-child{padding-left:0;border-left:0}.armor-task-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.armor-task-nav button{padding:.65rem .75rem}.filter-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.class-radio{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.class-radio .ant-radio-button-wrapper{text-align:center}.filter-select,.scope-select,.wide-select{width:100%;min-width:0}.result-summary{align-items:flex-start;flex-direction:column;gap:.2rem}.record-hero{grid-template-columns:4.5rem minmax(0,1fr);padding:1rem 3rem 1rem .8rem}.record-icon{width:4.5rem;height:4.5rem}.record-status{grid-column:1/-1;display:flex;align-items:baseline;gap:.5rem;min-width:0;text-align:left}.record-status strong{font-size:.9rem}.record-status b{margin:0 0 0 auto}.record-columns{grid-template-columns:1fr}.record-aside{border-top:1px solid var(--line-soft);border-left:0}}
@media(max-width:560px){.snapshot-line{align-items:flex-start;flex-direction:column;gap:.25rem}.armor-grid,.mod-grid{grid-template-columns:1fr}.control-main{gap:.45rem}.section-title{align-items:flex-start;flex-direction:column}.armor-tile{grid-template-columns:3.8rem minmax(0,1fr)}.armor-icon{width:3.8rem;height:3.8rem}:global(.armor-record-modal .ant-modal){top:0;width:100%!important;max-width:none;margin:0;padding:0}:global(.armor-record-modal .ant-modal-content){min-height:100dvh}.record-identity h2{font-size:1rem}.record-facts{font-size:.52rem}.record-band,.record-aside{padding:.85rem .8rem}.record-section-title{align-items:flex-start}.trait-list{grid-template-columns:1fr}.related-area{padding:0 .8rem .8rem}}
</style>
