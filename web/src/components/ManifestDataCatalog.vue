<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { ui, useI18n, uiMessage } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogDatasets } from '@/data/catalogDatasets'
import ItemDefinitionInfo from '@/components/ItemDefinitionInfo.vue'
import { variantName, versionSummary, conditionSummary } from '@/i18n/metadata'
import EntityLink from '@/components/EntityLink.vue'
import SourceProvenance from '@/components/SourceProvenance.vue'
import StableDisclosure from '@/components/StableDisclosure.vue'
import { dataUrl } from '@/utils/dataUrl'
import { manifestText } from '@/utils/manifestText'

const { locale } = useI18n()
const route = useRoute(), router = useRouter()
const datasets = catalogDatasets
const dataset = ref('equipment'), filter = ref('all'), keyword = ref(''), page = ref(1)
const cache = ref({}), loading = ref(false), error = ref(''), pageSize = 36
const current = computed(() => datasets.find(d => d.id === dataset.value))
const payload = computed(() => cache.value[current.value.file])
let request = 0
async function load() {
  const token = ++request, config = current.value
  loading.value = true; error.value = ''
  try {
    if (!cache.value[config.file]) {
      const response = await fetch(dataUrl(config.file + '.json'))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (!Array.isArray(data[config.key]) || data.count !== data[config.key].length) throw new Error('目录结构或数量不一致')
      cache.value[config.file] = data
    }
  } catch (e) { if (token === request) error.value = `${config.label}加载失败：${e.message}。这不表示该类型没有数据。` }
  finally { if (token === request) loading.value = false }
}
watch(dataset, () => { page.value = 1; load() }, { immediate: true })
watch(() => route.query, q => {
  dataset.value = datasets.some(d => d.id === q.type) ? q.type : 'equipment'
  keyword.value = typeof q.q === 'string' ? q.q : ''
  filter.value = typeof q.filter === 'string' ? q.filter : dataset.value === 'artifacts' ? 'reprised' : 'all'
}, { immediate: true })
function selectDataset(id) {
  router.push({ path: '/manifest', query: { type: id } })
}
watch([keyword, filter], () => {
  if (route.path !== '/manifest') return
  const next = { ...route.query, type: dataset.value, q: keyword.value || undefined, filter: filter.value }
  if (route.query.q !== next.q || route.query.type !== next.type || route.query.filter !== next.filter) router.replace({ query: next })
})
watch([keyword, filter], () => { page.value = 1 })
const displayName = i => locale.value === 'zh' && (i?.nameZh || i?.name) ? variantName(i) : (locale.value === 'zh' ? i?.nameZh || i?.name : i?.name || i?.nameZh) || `Hash ${i?.hash ?? i?.itemHash}`
const description = i => manifestText((locale.value === 'zh' ? i?.descriptionZh || i?.description : i?.description || i?.descriptionZh) || '', locale.value)
const effects = i => (i.perkDetails || i.perks || []).filter(p => p.visibility !== 2)
const icon = i => i?.icon ? (/^https?:/.test(i.icon) ? i.icon : 'https://www.bungie.net' + i.icon) : ''
const artifactKind = i => ({ reprised: '复刻神器 可配置', historical: '历史物品 仅查阅', legacy: '旧节点树 仅查阅' }[i.kind])
const filters = computed(() => dataset.value === 'equipment' ? [['all', '全部'], ['weapon', '武器'], ['armor', '护甲']]
  : dataset.value === 'artifacts' ? [['reprised', '复刻神器'], ['historical', '历史物品'], ['legacy', '旧节点树'], ['all', '全部记录']]
    : ['plugs', 'mods'].includes(dataset.value) ? [['all', '全部'], ['armor', '护甲'], ['weapon', '武器'], ['ghost', '机灵'], ['artifact', '神器'], ['tuning', '调谐']] : [])
function matchesFilter(i) {
  if (filter.value === 'all') return true
  if (dataset.value === 'equipment') return i.itemType === (filter.value === 'weapon' ? 3 : 2)
  if (dataset.value === 'artifacts') return i.kind === filter.value
  const c = i.category || ''
  if (filter.value === 'armor') return c.startsWith('enhancements.') && !/ghost|artifact/.test(c)
  return c.includes(filter.value)
}
const records = computed(() => (payload.value?.[current.value.key] || []).filter(current.value.filter || (() => true)))
const searchable = computed(() => records.value.map(i => [i, `${JSON.stringify(i)} ${versionSummary(i)} ${conditionSummary(i)}`.toLowerCase()]))
const filtered = computed(() => { const q = keyword.value.trim().toLowerCase(); return searchable.value.filter(([i, text]) => matchesFilter(i) && (!q || text.includes(q))).map(([i]) => i) })
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const recordKey = (i, index) => `${i.sourceComponent || ''}:${i.hash || i.itemHash}:${i.vendorHash || i.activityHash || ''}:${i.vendorItemIndex ?? i.rewardIndex ?? ''}:${i.itemIndex ?? index}`
const sourceName = s => s.vendorNameZh || s.activityNameZh || s.vendorName || s.activityName
const columnName = s => ({ barrel: '枪管 / 弓弦 / 刀身', magazine: '弹匣 / 箭矢 / 护手', trait1: '特性一', trait2: '特性二', origin: '起源特性' }[s.perkColumn] || `插槽 ${s.socketIndex + 1}`)
const plugDetails = ref({}), plugError = ref('')
async function loadWeaponDetails() {
  if (Object.keys(plugDetails.value).length) return
  try {
    const response = await fetch(dataUrl('manifest-plugs.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (data.manifestVersion !== payload.value?.manifestVersion) throw new Error('词条版本与目录不同，请刷新')
    plugDetails.value = Object.fromEntries(data.items.map(i => [i.hash, i])); plugError.value = ''
  } catch (e) { plugError.value = e.message }
}
</script>

<template>
  <div>
    <header class="catalog-head"><p class="eyebrow">BUNGIE MANIFEST / DEFINITION ATLAS</p><h1>{{ ui("官方数据图鉴") }}</h1><p>{{ ui("官方定义、完整候选与历史留档。配装推荐单独维护，不以推荐数量代替目录覆盖。") }}</p><RouterLink to="/data-status">{{ ui("查看逐类型完整性对账 →") }}</RouterLink></header>
    <nav class="dataset-tabs" :aria-label="ui(&quot;数据类型&quot;)"><button v-for="d in datasets" :key="d.id" :aria-pressed="dataset === d.id" @click="selectDataset(d.id)">{{ ui(d.label) }}</button></nav>
    <section class="catalog-tools"><a-input v-model:value="keyword" :aria-label="ui(&quot;搜索官方数据&quot;)" :placeholder="ui(&quot;搜索中文、英文、描述或 Hash&quot;)" allow-clear size="large" /><div class="kind-tabs"><button v-for="[id, name] in filters" :key="id" :aria-pressed="filter === id" @click="filter = id">{{ ui(name) }}</button></div></section>
    <p class="scope-note">{{ ui(current.note) }}</p>
    <DestinyLoading v-if="loading" :label="ui('正在加载{0}…', [ui(current.label)])" />
    <p v-else-if="error" role="alert" class="error">{{ uiMessage(error) }} <button @click="load">{{ ui("重试加载") }}</button></p>
    <template v-else>
      <div class="result-line" role="status" aria-live="polite"><strong>{{ filtered.length.toLocaleString() }} {{ ui("条 / 本类型") }} {{ records.length.toLocaleString() }} {{ ui("条") }}</strong><small>{{ ui("快照") }} {{ payload?.syncedAt?.slice(0, 10) }} {{ ui("第") }} {{ page }} / {{ pages }} {{ ui("页") }}</small></div>
      <div class="catalog-grid" :class="{ 'artifact-grid': dataset === 'artifacts' }">
        <article v-for="(item, index) in visible" :key="recordKey(item, index)" class="catalog-item">
          <header><img v-if="icon(item)" :src="icon(item)" alt="" loading="lazy" /><span v-else class="no-image" :aria-label="ui(&quot;官方未提供图标&quot;)">—</span><div><small v-if="dataset === 'artifacts'" class="category">{{ ui(artifactKind(item)) }}</small><h2><EntityLink :item="item" :kind="dataset" :label="displayName(item)" /></h2><small v-if="item.nameZh && item.name">{{ locale === 'zh' ? item.name : item.nameZh }}</small><small>Hash {{ item.hash || item.itemHash }}</small></div></header>
          <ItemDefinitionInfo :item="item" compact /><p v-if="item.category" class="category">{{ ui(item.category) }}</p><p v-if="item.typeName || item.itemTypeDisplayName">{{ item.typeName || item.itemTypeDisplayName }}</p>
          <p v-if="item.weaponFamily || item.armorSlot">{{ item.weaponFamily || item.armorSlot }} {{ item.classId || item.ammoSlot }}</p><p v-if="item.energyCost != null">{{ ui("能量消耗") }} {{ item.energyCost }}</p>
          <p v-if="description(item)" class="description">{{ description(item) }}</p><p v-else-if="!effects(item).length && !item.nodes?.length && !item.itemHash" class="missing">{{ ui("官方未提供详细描述") }}</p>
          <div v-if="effects(item).length" class="effects"><div v-for="(perk, p) in effects(item)" :key="perk.hash || perk.sandboxPerkHash || p"><strong v-if="perk.requiredSetCount">{{ perk.requiredSetCount }} {{ ui("件：") }}{{ displayName(perk) }}</strong><p>{{ description(perk) || ui("无公开效果文本") }}</p></div></div>
          <template v-if="dataset === 'artifacts'"><p class="scope-note">{{ ui(item.note) }}</p><RouterLink v-if="item.selectable" to="/manual-loadout">{{ ui("进入配装工具配置 →") }}</RouterLink><StableDisclosure v-if="item.nodes.length" :title="`${ui('查看全部')} ${item.nodes.length} ${ui('个节点与')}${item.selectable ? ui('插槽池') : ui('层级')}`" :width="820" trigger-class="catalog-disclosure"><div class="node-list"><div v-for="node in item.nodes" :key="node.hash" class="node"><img v-if="icon(node)" :src="icon(node)" alt="" loading="lazy" /><div><strong>{{ displayName(node) }}</strong><small>Hash {{ node.hash }}</small><p v-for="(perk, p) in effects(node)" :key="p">{{ description(perk) }}</p></div></div></div><div v-for="socket in item.sockets" :key="socket.socketIndex" class="pool"><strong>{{ ui("插槽") }} {{ socket.socketIndex + 1 }} {{ socket.nodeHashes.length }} {{ ui("候选") }}</strong><p>{{ socket.nodeHashes.map(h => displayName(item.nodes.find(n => n.hash === h))).join(' / ') }}</p></div><p v-for="tier in item.tiers" :key="tier.tierIndex">{{ ui("第") }} {{ tier.tierIndex }} {{ ui("层 前置") }} {{ tier.minimumUnlockPointsUsedRequirement }}：{{ tier.items.map(displayName).join(' / ') }}</p></StableDisclosure></template>
          <StableDisclosure v-if="item.perkSockets?.length" :title="`${ui('全部词条候选')} ${item.perkSockets.length} ${ui('个插槽')}`" :width="820" trigger-class="catalog-disclosure" @open="loadWeaponDetails"><p v-if="plugError" class="error">{{ plugError }}</p><div v-for="socket in item.perkSockets" :key="socket.socketIndex" class="pool"><strong>{{ ui(columnName(socket)) }} {{ socket.plugItemHashes.length }} {{ ui("候选") }}</strong><p>{{ socket.plugItemHashes.map(h => plugDetails[h] ? displayName(plugDetails[h]) : `#${h}`).join(' / ') }}</p></div></StableDisclosure>
          <StableDisclosure v-if="item.vendorSources?.length || item.activitySources?.length" :title="`${ui('全部静态来源')} ${(item.vendorSources?.length || 0) + (item.activitySources?.length || 0)} ${ui('条')}`" :width="680" trigger-class="catalog-disclosure"><p v-for="(s, n) in [...(item.vendorSources || []), ...(item.activitySources || [])]" :key="n">{{ sourceName(s) }} #{{ s.vendorHash || s.activityHash }}</p></StableDisclosure>
          <StableDisclosure v-if="item.itemHashes?.length" :title="`${ui('套装全部成员')} ${item.itemHashes.length} ${ui('件')}`" :width="680" trigger-class="catalog-disclosure"><p v-for="(hash, n) in item.itemHashes" :key="hash">{{ item.items?.[n] }} #{{ hash }}</p></StableDisclosure>
          <template v-if="item.itemHash"><p>{{ sourceName(item) }} #{{ item.vendorHash || item.activityHash }}</p><p>{{ ui("物品 #") }}{{ item.itemHash }} {{ ui("数量") }} {{ item.quantity }}</p></template>
          <SourceProvenance :item="item" :snapshot="payload || {}" official compact />
          <StableDisclosure v-if="item.raw" :title="`${item.sourceComponent} ${ui('查看标准字段')}`" :width="900" trigger-class="catalog-disclosure"><pre>{{ JSON.stringify(item.raw, null, 2) }}</pre></StableDisclosure>
        </article>
      </div>
      <p v-if="!visible.length">{{ ui("没有匹配项，试试其他名称或清空筛选。") }}</p>
      <nav class="pagination" :aria-label="ui(&quot;分页&quot;)"><button :disabled="page === 1" @click="page--">{{ ui("上一页") }}</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="page++">{{ ui("下一页") }}</button></nav>
    </template>
  </div>
</template>

<style scoped>
.catalog-head{padding:2.5rem 0 1.6rem;border-bottom:1px solid var(--line-soft)}.eyebrow{color:var(--gold-dim);font:.7rem var(--font-en);letter-spacing:.18em}.catalog-head h1{margin:.5rem 0}.catalog-head p{color:var(--text-sub)}.catalog-head a,.catalog-item a{font-size:.75rem;color:var(--gold)}.dataset-tabs,.kind-tabs{display:flex;flex-wrap:wrap;gap:.4rem}.dataset-tabs{margin:1.5rem 0}.dataset-tabs button,.kind-tabs button,.pagination button{border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);padding:.6rem .8rem;cursor:pointer;font-size:.76rem}button[aria-pressed=true]{border-color:var(--gold);color:var(--gold);background:#d6b35b14}.catalog-tools{display:grid;gap:.8rem}.scope-note{color:var(--text-dim);font-size:.76rem;line-height:1.6}.result-line{display:flex;justify-content:space-between;gap:1rem;margin:1rem 0;color:var(--gold);font-size:.78rem}.result-line small{color:var(--text-dim)}.catalog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line-soft);border:1px solid var(--line-soft)}.artifact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.catalog-item{min-width:0;padding:1rem;background:var(--bg-dark)}.catalog-item header{display:flex;align-items:center;gap:.8rem}.catalog-item header>div{min-width:0}.catalog-item img,.no-image{width:56px;height:56px;object-fit:contain;flex-shrink:0;background:var(--bg-card)}.no-image{display:grid;place-items:center;color:var(--text-dim)}.catalog-item h2{font-size:.94rem;margin:0;overflow-wrap:anywhere}.catalog-item small{display:block;color:var(--text-dim);font-size:.62rem;overflow-wrap:anywhere}.catalog-item p{font-size:.76rem;line-height:1.6;overflow-wrap:anywhere;white-space:pre-line}.catalog-item .category{color:var(--gold-dim);font-size:.65rem;word-break:break-word}.missing{color:var(--text-dim)}.effects{margin-top:.6rem}.effects>div{padding:.35rem 0;border-top:1px solid var(--line-soft)}.effects strong{font-size:.76rem}.effects p{margin:.2rem 0}.catalog-item details{margin-top:.8rem;border-top:1px solid var(--line-soft);padding-top:.6rem}.catalog-item summary{cursor:pointer;color:var(--gold);font-size:.76rem}.pool{margin-top:.8rem}.pool strong{font-size:.73rem}.pool p{color:var(--text-sub)}.node{display:flex;gap:.7rem;padding:.7rem 0;border-bottom:1px solid var(--line-soft)}.node img{width:38px;height:38px}.node strong{font-size:.8rem}.node p{margin:.3rem 0}.pagination{display:flex;justify-content:center;align-items:center;gap:1rem;margin:1.5rem 0;font-size:.78rem}.pagination button:disabled{opacity:.35;cursor:default}.error{color:var(--warn)}pre{max-height:22rem;overflow:auto;font-size:.65rem}.catalog-item :focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}@media(max-width:1000px){.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.catalog-grid{grid-template-columns:1fr}.result-line{flex-direction:column;gap:.3rem}.dataset-tabs button{padding:.55rem .65rem}.catalog-head{padding-top:1.5rem}}
</style>
<style scoped>
.catalog-item :deep(.catalog-disclosure){margin-top:.55rem;color:var(--gold);font-size:.76rem}
</style>
