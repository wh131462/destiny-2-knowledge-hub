<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { useArmorCatalog } from '@/composables/useArmorCatalog'
import ArmorSetExplorer from '@/components/ArmorSetExplorer.vue'
import ArmorSystemGuide from '@/components/ArmorSystemGuide.vue'
import EntityLink from '@/components/EntityLink.vue'
import SourceProvenance from '@/components/SourceProvenance.vue'
import { armorSlots, armorClasses, armorGroups, armorName, armorDescription } from '../../../packages/manifest-catalog/armor.js'
import { manifestText } from '@/utils/manifestText'

const { t } = useI18n()
const route = useRoute()
const { catalog, status, load } = useArmorCatalog()
onMounted(load)
const tab = ref('sets')
const classId = ref('titan')
const keyword = ref(String(route.query.q || ''))
const slotFilter = ref('')
const rarityFilter = ref('')
const modScope = ref('slot')
const limit = ref(48)
const selectedArmor = ref(null)
const selectedVersions = ref([])
const tabs = [
  { id: 'sets', label: '套装与搭配', en: 'SET BONUSES' },
  { id: 'exotics', label: '异域护甲', en: 'EXOTICS' },
  { id: 'all', label: '全部防具', en: 'ARMOR ARCHIVE' },
  { id: 'mods', label: '模组图鉴', en: 'ARMOR MODS' },
  { id: 'guide', label: '系统指南', en: 'FIELD GUIDE' }
]
const icon = item => item?.icon ? `https://www.bungie.net${item.icon}` : ''
const description = item => manifestText(armorDescription(item))
const isExotic = item => item?.tierTypeHash === 2759499571
const rarityName = item => isExotic(item) ? '异域' : item?.tierTypeHash === 4008398120 ? '传说' : '其他'
const slotName = item => armorSlots.find(slot => slot.id === item?.armorSlot)?.name || '未知部位'
const className = item => armorClasses.find(c => c.id === item?.classId)?.name || '通用'
const classItemName = computed(() => armorClasses.find(c => c.id === classId.value)?.classItem)
const query = computed(() => keyword.value.trim().toLowerCase())
const setByHash = computed(() => new Map((catalog.value?.sets || []).map(set => [set.hash, set])))
const traitByHash = computed(() => new Map((catalog.value?.traits || []).map(trait => [trait.hash, trait])))
const allGroups = computed(() => armorGroups(catalog.value?.items || []))
const exoticCount = computed(() => allGroups.value.filter(group => isExotic(group[0])).length)
const traitText = item => (item.traits || []).flatMap(pool => pool.hashes.map(hash => traitByHash.value.get(hash))).filter(Boolean).flatMap(trait => [trait.name, trait.nameZh, trait.description, trait.descriptionZh]).join(' ')
const setsFor = item => item.setHashes.map(hash => setByHash.value.get(hash)).filter(Boolean)
const filteredGroups = computed(() => allGroups.value.map(group => group.filter(item =>
  item.classId === classId.value && (!slotFilter.value || item.armorSlot === slotFilter.value) &&
  (tab.value !== 'exotics' || isExotic(item)) &&
  (tab.value !== 'all' || !rarityFilter.value || (rarityFilter.value === 'exotic' ? isExotic(item) : item.tierTypeHash === 4008398120)) &&
  (!query.value || [item.name, item.nameZh, String(item.hash), traitText(item), ...setsFor(item).flatMap(set => [set.name, set.nameZh])].join(' ').toLowerCase().includes(query.value))
)).filter(group => group.length).sort((a, b) => Number(isExotic(b[0])) - Number(isExotic(a[0])) || armorName(a[0]).localeCompare(armorName(b[0]), 'zh')))
const visibleGroups = computed(() => filteredGroups.value.slice(0, limit.value))
const primaryTrait = item => {
  const pools = item.traits || []
  if (!pools.length) return ''
  if (isExotic(item) && item.armorSlot === 'classItem') return '双列异域特性 · 查看定义与说明'
  if (pools.some(pool => pool.hashes.length > 1)) return `${pools.length} 列特性 · 查看可选词条`
  return pools.flatMap(pool => pool.hashes.map(hash => traitByHash.value.get(hash))).filter(Boolean).map(armorName).join(' · ')
}
const filteredMods = computed(() => (catalog.value?.mods || []).filter(mod =>
  (modScope.value === 'all' || (modScope.value === 'special' ? mod.slot === 'any' : mod.slot !== 'any' && (!slotFilter.value || mod.slot === slotFilter.value))) &&
  (!query.value || [mod.name, mod.nameZh, mod.description, mod.descriptionZh, String(mod.hash)].join(' ').toLowerCase().includes(query.value))
).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh')))
const selectedSources = computed(() => selectedArmor.value ? [
  ...selectedArmor.value.activitySources.map(source => ({ type: '活动奖励定义', name: source.activityNameZh || source.activityName })),
  ...selectedArmor.value.vendorSources.map(source => ({ type: '商人库存定义', name: source.vendorNameZh || source.vendorName }))
].filter(source => source.name) : [])
const selectedTraits = computed(() => (selectedArmor.value?.traits || []).map(pool => ({ ...pool, options: pool.hashes.map(hash => traitByHash.value.get(hash)).filter(Boolean) })))
function openArmor(item, versions) {
  selectedArmor.value = item
  selectedVersions.value = versions || allGroups.value.find(group => group.some(version => version.hash === item.hash)) || [item]
}
function reset() { keyword.value = ''; slotFilter.value = ''; rarityFilter.value = ''; modScope.value = 'slot' }
watch([keyword, classId, slotFilter, rarityFilter, modScope, tab], () => { limit.value = 48 })
watch(() => route.query.q, value => { keyword.value = String(value || ''); if (value) tab.value = 'all' })
if (keyword.value) tab.value = 'all'
</script>

<template>
  <div class="armor-page">
    <header class="armor-hero">
      <div class="hero-copy"><span class="eyebrow">GUARDIAN FIELD MANUAL <i></i> 06 / ARMOR</span><h1>{{ t('pages.armor.title') }}<span class="title-mark" aria-hidden="true">/</span></h1><p>让每一个部位，都成为构筑的一部分。</p><span class="hero-description">查套装效果、选异域核心、理清属性与模组，再把五个部位组合起来。</span></div>
      <div class="hero-facts"><div><strong>{{ catalog?.sets.length ?? '—' }}</strong><span>官方套装</span></div><div><strong>{{ catalog ? exoticCount : '—' }}</strong><span>异域款式</span></div><div><strong>05</strong><span>护甲部位</span></div></div>
    </header>
    <div class="snapshot-line"><span><i></i> BUNGIE MANIFEST</span><span v-if="catalog">快照 {{ catalog.syncedAt?.slice(0, 10) }} · {{ catalog.items.length.toLocaleString() }} 个防具定义，含同名版本</span><span v-else>正在连接防具目录</span></div>
    <nav class="armor-tabs" aria-label="防具栏目"><button v-for="item in tabs" :key="item.id" type="button" :aria-pressed="tab === item.id" @click="tab = item.id"><span>{{ item.label }}</span><small>{{ item.en }}</small></button></nav>
    <div v-if="tab !== 'guide'" class="armor-toolbar">
      <div v-if="tab !== 'mods'" class="class-picker" role="group" aria-label="职业筛选"><button v-for="c in armorClasses" :key="c.id" type="button" :aria-pressed="classId === c.id" @click="classId = c.id">{{ c.name }}</button></div>
      <a-input v-model:value="keyword" allow-clear :placeholder="tab === 'sets' ? '搜索套装名称或效果，如：手雷、治疗…' : tab === 'mods' ? '搜索模组名称或效果…' : '搜索防具、异域特性或 Hash…'" aria-label="搜索防具目录" class="armor-search" />
      <button class="reset-button" type="button" @click="reset">重置</button>
    </div>
    <div v-if="status === 'loading' || status === 'idle'" class="catalog-state" role="status"><span class="loading-line"></span><h2>正在整理护甲库</h2><p>读取套装效果、异域特性与模组定义…</p></div>
    <div v-else-if="status === 'error'" class="catalog-state" role="alert"><h2>防具目录暂时无法加载</h2><p>请重试以读取官方数据。</p><button type="button" class="outline-button" @click="load">重新加载</button></div>
    <template v-else-if="catalog">
      <KeepAlive><ArmorSetExplorer v-if="tab === 'sets'" :catalog="catalog" :class-id="classId" :query="keyword" @open-armor="openArmor" /></KeepAlive>
      <ArmorSystemGuide v-if="tab === 'guide'" :catalog="catalog" />
      <template v-else-if="tab !== 'sets'">
        <div v-if="tab !== 'mods' || modScope === 'slot'" class="slot-picker" role="group" aria-label="部位筛选"><button type="button" :aria-pressed="!slotFilter" @click="slotFilter = ''">全部部位</button><button v-for="slot in armorSlots" :key="slot.id" type="button" :aria-pressed="slotFilter === slot.id" @click="slotFilter = slot.id">{{ slot.name }}<small v-if="slot.id === 'classItem' && tab !== 'mods'"> / {{ classItemName }}</small></button></div>
        <template v-if="tab === 'all' || tab === 'exotics'">
          <div class="archive-heading"><div><h2>{{ tab === 'exotics' ? '以一件异域，定义你的打法' : '你的防具资料库' }}</h2><p>{{ tab === 'exotics' ? '每次最多装备一件异域护甲；可与一件异域武器同时装备。' : '按职业和部位查阅官方装备；同名且套装归属相同的版本合并展示。' }}</p></div><select v-if="tab === 'all'" v-model="rarityFilter" aria-label="稀有度筛选"><option value="">全部稀有度</option><option value="exotic">异域</option><option value="legendary">传说</option></select></div>
          <p class="result-count" role="status">{{ filteredGroups.length }} 款匹配 · 已展示 {{ visibleGroups.length }} 款</p>
          <div class="armor-grid"><button v-for="group in visibleGroups" :key="group[0].hash" type="button" class="armor-tile" :class="{ exotic: isExotic(group[0]) }" @click="openArmor(group[0], group)"><div class="armor-icon"><img v-if="icon(group[0])" :src="icon(group[0])" alt="" loading="lazy" /><span v-else>◇</span></div><div class="armor-tile-copy"><span class="tile-meta">{{ rarityName(group[0]) }} / {{ slotName(group[0]) }}</span><h3>{{ armorName(group[0]) }}</h3><small class="english-name">{{ group[0].name }}</small><p v-if="primaryTrait(group[0])" class="trait-line">{{ primaryTrait(group[0]) }}</p><p v-else>{{ setsFor(group[0]).map(armorName).join('、') || '未登记套装加成' }}</p><span class="tile-footer">{{ group.length }} 个版本 <span>查看详情 ↗</span></span></div></button></div>
          <div v-if="!filteredGroups.length" class="empty-state"><h3>没有匹配的防具</h3><p>试试其他职业、部位，或缩短关键词。</p><button type="button" class="outline-button" @click="reset">清空筛选</button></div>
          <button v-if="filteredGroups.length > limit" type="button" class="load-more" @click="limit += 48">加载更多 · 还有 {{ filteredGroups.length - limit }} 款</button>
        </template>
        <template v-else-if="tab === 'mods'">
          <div class="archive-heading"><div><h2>为每个部位找到合适的模组</h2><p>查看官方效果与能量消耗；特殊模组的可用性还需符合装备插槽和活动条件。</p></div><select v-model="modScope" aria-label="模组范围"><option value="slot">按部位模组</option><option value="special">通用与活动模组</option><option value="all">所有模组</option></select></div>
          <p class="mod-note">同一件护甲的模组消耗合计不能超过其能量容量。模组图鉴包含历史定义，不表示当前掉落装备都能安装。</p>
          <p class="result-count" role="status">{{ filteredMods.length }} 个匹配 · 显示 {{ Math.min(limit, filteredMods.length) }} 个</p>
          <div class="mod-grid"><article v-for="mod in filteredMods.slice(0, limit)" :key="mod.hash" class="mod-card"><header><img v-if="icon(mod)" :src="icon(mod)" alt="" loading="lazy" /><div><h3>{{ armorName(mod) }}</h3><small>{{ mod.name }}</small></div><span class="energy-cost" :aria-label="mod.energyCost == null ? '能量消耗未登记' : `能量消耗 ${mod.energyCost}`">{{ mod.energyCost ?? '—' }}<small>能量</small></span></header><p>{{ description(mod) || '该定义未提供效果说明。' }}</p><small v-if="mod.differingPerkNames?.length" class="mod-definition-note">关联效果：{{ mod.differingPerkNames.join('、') }}（与条目名称不同）</small><small class="mod-definition-note">定义 {{ mod.hash }}</small><footer><span>{{ armorSlots.find(slot => slot.id === mod.slot)?.name || '通用 / 活动专属' }}</span><EntityLink :item="mod" kind="mods" label="模组详情" /></footer></article></div>
          <div v-if="!filteredMods.length" class="empty-state"><h3>未找到匹配模组</h3><button type="button" class="outline-button" @click="reset">清空筛选</button></div>
          <button v-if="filteredMods.length > limit" type="button" class="load-more" @click="limit += 48">加载更多 · 还有 {{ filteredMods.length - limit }} 个</button>
        </template>
      </template>
    </template>

    <a-modal :open="Boolean(selectedArmor)" :title="selectedArmor ? armorName(selectedArmor) : ''" :footer="null" :width="760" wrap-class-name="armor-modal" @cancel="selectedArmor = null">
      <div v-if="selectedArmor" class="armor-detail">
        <header class="detail-heading"><img v-if="icon(selectedArmor)" :src="icon(selectedArmor)" alt="" /><div><span :class="{ 'exotic-label': isExotic(selectedArmor) }">{{ rarityName(selectedArmor) }} · {{ className(selectedArmor) }} · {{ slotName(selectedArmor) }}</span><h2>{{ armorName(selectedArmor) }}</h2><p>{{ selectedArmor.name }}</p><small>Hash {{ selectedArmor.hash }}</small></div></header>
        <label v-if="selectedVersions.length > 1" class="version-select">装备版本<select :value="selectedArmor.hash" @change="selectedArmor = selectedVersions.find(item => item.hash === Number($event.target.value))"><option v-for="(version, index) in selectedVersions" :key="version.hash" :value="version.hash">版本 {{ index + 1 }} · Hash {{ version.hash }}</option></select></label>
        <p v-if="selectedVersions.length > 1" class="detail-note">版本编号仅用于区分定义，不表示发行顺序；属性与可用功能以实际持有的装备为准。</p>
        <section v-if="selectedTraits.length" class="detail-section"><h3>{{ selectedArmor.armorSlot === 'classItem' && isExotic(selectedArmor) ? '双列异域特性' : selectedTraits.some(pool => pool.options.length > 1) ? '异域特性与可选词条' : '固有特性' }}</h3><p v-if="selectedArmor.armorSlot === 'classItem' && isExotic(selectedArmor)" class="detail-note">异域职业装备拥有两列特性。当前快照可能仅提供插槽默认示例；下列说明不代表固定掉落组合，完整候选池未返回时无法推导其他组合。</p><div v-for="(pool, index) in selectedTraits" :key="pool.socketIndex"><p v-if="pool.options.length > 1" class="detail-note">第 {{ index + 1 }} 列 · {{ pool.options.length }} 个候选，实际掉落从该列选择特性，以下并非同时生效。</p><p v-else-if="selectedArmor.armorSlot === 'classItem' && pool.definitionOnly" class="detail-note">第 {{ index + 1 }} 列 · 定义默认示例，完整候选池未提供</p><article v-for="trait in pool.options" :key="trait.hash" class="trait-detail"><img v-if="icon(trait)" :src="icon(trait)" alt="" loading="lazy" /><div><h4>{{ armorName(trait) }}</h4><p>{{ description(trait) || '该特性暂无说明。' }}</p></div></article></div></section>
        <p v-else-if="isExotic(selectedArmor)" class="detail-note">该版本的固有特性尚未解析，可切换版本或打开百科查阅。</p>
        <section v-if="setsFor(selectedArmor).length" class="detail-section"><h3>所属套装</h3><article v-for="set in setsFor(selectedArmor)" :key="set.hash"><h4>{{ armorName(set) }}</h4><div v-for="perk in set.perks" :key="perk.sandboxPerkHash" class="detail-set-bonus"><strong>{{ perk.requiredSetCount }} 件 · {{ armorName(perk) }}</strong><p>{{ description(perk) }}</p></div></article></section>
        <p v-if="description(selectedArmor)" class="armor-flavor">{{ description(selectedArmor) }}</p>
        <section class="detail-section"><h3>属性与装备实例</h3><p class="detail-note">此处收录装备定义，随机掉落的六维属性、Tier、能量等级与大师状态由具体实例决定。请在游戏内检查实物数值后用于配装。</p></section>
        <section class="detail-section"><h3>获取线索</h3><template v-if="selectedSources.length"><div v-for="(source, index) in selectedSources" :key="index" class="source-row"><span>{{ source.type }}</span><strong>{{ source.name }}</strong></div><p class="detail-note">定义关联不保证当前轮换可用，也不代表具体遭遇战的掉落概率。</p></template><p v-else class="detail-note">当前定义没有直接关联的活动奖励或商人记录，无法据此确定当前获取路径。</p></section>
        <EntityLink :item="selectedArmor" kind="equipment" label="打开独立百科条目" /><SourceProvenance :item="selectedArmor" :snapshot="catalog || {}" official compact />
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.armor-page{--armor-muted:#9eacc2;padding-bottom:24px}.armor-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:35px;min-height:225px;padding:24px 0 34px;border-bottom:1px solid #e8c15a33}.hero-copy{position:relative}.eyebrow{display:flex;align-items:center;gap:12px;font-family:var(--font-en);font-size:.6rem;letter-spacing:.14em;color:#b6a477}.eyebrow i{width:24px;height:1px;background:#b6a47766}.armor-hero h1{font-family:var(--font-cn);font-size:2.7rem;letter-spacing:.05em;margin:17px 0 11px;font-weight:600}.title-mark{margin-left:20px;color:#e8c15a44;font-weight:300}.hero-copy>p{font-size:1.03rem;color:#d5deed;letter-spacing:.03em}.hero-description{display:block;font-size:.79rem;color:var(--armor-muted);margin-top:7px}.hero-facts{display:flex;gap:34px;flex-shrink:0}.hero-facts>div{display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--line-soft);padding-left:25px}.hero-facts strong{font-family:var(--font-en);font-weight:400;font-size:2rem;color:#e1d6b9}.hero-facts span{font-size:.68rem;letter-spacing:.08em;color:#9ba9bf}.snapshot-line{display:flex;justify-content:space-between;gap:12px;padding:12px 0;font-size:.63rem;color:#9ca9bc;letter-spacing:.02em}.snapshot-line>span:first-child{display:flex;gap:8px;align-items:center;font-family:var(--font-en);font-size:.53rem}.snapshot-line i{width:4px;height:4px;border-radius:50%;background:#a6caaa}.armor-tabs{display:flex;border-bottom:1px solid var(--line-soft);margin:22px 0 24px;gap:8px}.armor-tabs button{background:transparent;color:#9facbf;border:0;border-bottom:2px solid transparent;text-align:left;padding:12px 25px 16px 0;margin-right:22px;cursor:pointer;font:inherit}.armor-tabs button span{font-size:.94rem;display:block}.armor-tabs button small{font-family:var(--font-en);font-size:.51rem;letter-spacing:.11em;display:block;margin-top:6px;color:#8d99ad}.armor-tabs button[aria-pressed=true]{color:var(--gold);border-bottom-color:var(--gold)}.armor-tabs button[aria-pressed=true] small{color:#b3a277}.armor-toolbar{display:flex;gap:18px;align-items:center;margin-bottom:24px}.class-picker{display:flex;gap:3px;border:1px solid var(--line-soft);padding:3px}.class-picker button{background:transparent;border:0;color:#a6b5ca;cursor:pointer;padding:7px 25px;font:inherit;font-size:.77rem;white-space:nowrap}.class-picker button[aria-pressed=true]{background:#d6deec15;color:#eef0f7}.armor-search{flex:1;max-width:520px;margin-left:auto}.reset-button{background:transparent;border:0;color:#a5b3c8;font:inherit;font-size:.75rem;cursor:pointer}.slot-picker{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:25px}.slot-picker button{padding:7px 16px;background:#101a29;border:1px solid var(--line-soft);color:#a5b4c9;font:inherit;font-size:.76rem;cursor:pointer}.slot-picker button[aria-pressed=true]{color:#e3cf9d;border-color:#e8c15a66;background:#e8c15a08}.slot-picker small{font-size:.66rem}.archive-heading{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:20px}.archive-heading h2{font-family:var(--font-cn);font-size:1.3rem;margin:0 0 8px}.archive-heading p,.mod-note{font-size:.76rem;line-height:1.9}.result-count{font-size:.7rem;color:#a0aec3;margin:15px 0}.armor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.armor-tile{display:flex;gap:16px;align-items:start;padding:19px;background:#101a29;border:1px solid var(--line-soft);color:var(--text-main);text-align:left;cursor:pointer;transition:border-color .2s,background .2s;min-width:0}.armor-tile:hover{background:#152132;border-color:#b9c9e066}.armor-tile.exotic{border-top:2px solid #a4894b}.armor-icon{width:62px;height:62px;flex-shrink:0;background:#ffffff06;border:1px solid #ffffff22;padding:2px}.armor-icon img{width:100%;height:100%;object-fit:cover}.armor-tile-copy{min-width:0;flex:1}.tile-meta{display:block;color:#abb9ce;font-size:.58rem;letter-spacing:.08em;margin-bottom:5px}.exotic .tile-meta{color:#cab474}.armor-tile h3{font-family:var(--font-cn);font-size:.95rem;font-weight:500}.english-name{display:block;color:#8c9bb2;font-size:.64rem;line-height:1.6;margin-top:3px}.armor-tile p{font-size:.72rem;margin:14px 0;color:#b1bed0}.armor-tile .trait-line{color:#d3c5a1}.tile-footer{display:flex;justify-content:space-between;gap:8px;color:#8f9eb5;font-size:.62rem;padding-top:12px;border-top:1px solid var(--line-soft)}.tile-footer>span{color:#bcaa7f;white-space:nowrap}.empty-state,.catalog-state{text-align:center;padding:60px 20px;border:1px solid var(--line-soft);background:#0d1725}.empty-state h3,.catalog-state h2{font-family:var(--font-cn);font-size:1.1rem;margin:0 0 12px}.empty-state p,.catalog-state p{font-size:.8rem}.outline-button,.load-more{padding:10px 18px;border:1px solid #e8c15a55;background:#e8c15a06;color:var(--gold);font:inherit;font-size:.77rem;cursor:pointer;margin-top:20px}.load-more{display:block;width:100%;padding:15px}.loading-line{display:block;width:90px;height:2px;background:var(--gold);margin:0 auto 24px;animation:loading 1s ease-in-out infinite alternate}@keyframes loading{to{opacity:.25;transform:scaleX(.5)}}select{font:inherit;font-size:.75rem;background:#121e2f;border:1px solid #ffffff25;color:#c5d0e0;padding:8px 10px;max-width:100%;border-radius:3px}.mod-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.mod-card{padding:20px;background:#101a29;border:1px solid var(--line-soft);display:flex;flex-direction:column}.mod-card header{display:flex;align-items:center;gap:11px}.mod-card header>img{width:40px;height:40px;flex-shrink:0}.mod-card h3{font-family:var(--font-cn);font-size:.87rem}.mod-card header>div{flex:1;min-width:0}.mod-card header small{font-size:.62rem;color:#99a7be}.mod-card p{font-size:.76rem;line-height:1.9;white-space:pre-line;margin:17px 0;flex:1}.energy-cost{display:flex;flex-direction:column;align-items:center;font-size:1.1rem;color:#d3c49b;font-family:var(--font-en);flex-shrink:0}.energy-cost small{font-family:var(--font-cn);font-size:.6rem!important}.mod-definition-note{display:block;color:#acb9cc;font-size:.64rem;line-height:1.7;margin-bottom:10px}.mod-card footer{display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid var(--line-soft);font-size:.65rem;color:#97a6bd}.detail-heading{display:flex;gap:20px;align-items:center;margin:15px 0 24px}.detail-heading>img{width:82px;height:82px;border:1px solid #ffffff33;padding:3px}.detail-heading h2{font-family:var(--font-cn);font-size:1.5rem;margin:5px 0}.detail-heading span,.detail-heading p{font-size:.78rem;color:#a7b5cb}.detail-heading small{font-size:.66rem;color:#97a4ba;display:block;margin-top:4px}.detail-heading .exotic-label{color:var(--gold)}.detail-section{padding:20px 0;border-top:1px solid var(--line-soft)}.detail-section>h3{font-family:var(--font-cn);font-size:.95rem;margin-bottom:14px}.detail-note{font-size:.75rem;color:#a5b3c9;line-height:1.9}.version-select{display:flex;align-items:center;gap:18px;font-size:.78rem;margin-bottom:12px}.version-select select{flex:1}.trait-detail{display:flex;gap:15px;padding:15px;background:#ffffff03;margin-top:8px}.trait-detail img{width:40px;height:40px;flex-shrink:0}.trait-detail h4,.detail-section h4{font-family:var(--font-cn);font-size:.84rem;color:#d9c793;margin-bottom:7px}.trait-detail p,.detail-set-bonus p{font-size:.78rem;line-height:1.9;white-space:pre-line}.detail-set-bonus{padding:12px 0}.detail-set-bonus strong{font-size:.78rem;color:#c4b58b}.detail-set-bonus p{margin-top:5px}.armor-flavor{font-size:.8rem;margin:16px 0;white-space:pre-line}.source-row{font-size:.75rem;display:flex;gap:15px;margin:8px 0}.source-row span{color:#9eacc2}.armor-detail>:deep(.entity-link){font-size:.8rem}
@media(max-width:1100px){.hero-facts{gap:18px}.hero-facts>div{padding-left:16px}.hero-facts strong{font-size:1.7rem}.armor-grid,.mod-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.armor-tabs button{margin-right:12px;padding-right:16px}.armor-hero h1{font-size:2.3rem}}
@media(max-width:760px){.armor-hero{align-items:start;flex-direction:column;gap:28px;padding:12px 0 24px}.hero-facts{width:100%;gap:0}.hero-facts>div{width:33.333%;padding-left:18px;gap:5px}.hero-facts strong{font-size:1.5rem}.hero-facts>div:first-child{padding-left:0;border-left:0}.armor-tabs{overflow:auto;gap:0;margin-top:12px}.armor-tabs button{padding:10px 16px 13px 0;margin-right:15px;flex-shrink:0}.armor-tabs button span{font-size:.83rem}.armor-tabs button small{font-size:.46rem}.armor-toolbar{flex-wrap:wrap;gap:12px}.class-picker{width:100%}.class-picker button{flex:1;padding:7px 15px}.armor-search{margin:0;max-width:none}.snapshot-line{font-size:.57rem;flex-wrap:wrap}.snapshot-line>span:first-child{font-size:.48rem}.archive-heading{align-items:start;flex-direction:column}.armor-icon{width:52px;height:52px}.slot-picker{gap:6px}.slot-picker button{padding:6px 11px}.hero-description{font-size:.75rem}.title-mark{display:none}}
@media(max-width:560px){.armor-grid,.mod-grid{grid-template-columns:1fr}.armor-hero h1{font-size:2.15rem}.eyebrow{font-size:.48rem;gap:8px}.hero-copy>p{font-size:.9rem}.detail-heading{gap:13px}.detail-heading>img{width:62px;height:62px}.detail-heading h2{font-size:1.2rem}.version-select{align-items:start;flex-direction:column;gap:8px}.source-row{flex-direction:column;gap:3px}}
@media(prefers-reduced-motion:reduce){.loading-line{animation:none}.armor-tile{transition:none}}
</style>
