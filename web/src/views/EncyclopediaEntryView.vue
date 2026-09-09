<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { useI18n, ui, manifestDescription, localizedField, uiMessage } from '@/i18n'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { editorialById } from '@/data/encyclopedia'
import { catalogDatasets } from '@/data/catalogDatasets'
import { weaponBaseStats } from '../../../packages/manifest-catalog/weapon-details.js'
import { dataUrl } from '@/utils/dataUrl'
import { manifestText } from '@/utils/manifestText'
import SourceProvenance from '@/components/SourceProvenance.vue'
import RelatedBuilds from '@/components/RelatedBuilds.vue'
import ItemDefinitionInfo from '@/components/ItemDefinitionInfo.vue'
import { variantName } from '@/i18n/metadata'
import EntityLink from '@/components/EntityLink.vue'

const { locale } = useI18n()
const route = useRoute()
const item = shallowRef(null), officialItem = shallowRef(null), snapshot = shallowRef({})
const loading = ref(false), error = ref(''), supplementalError = ref('')
const weaponRecord = shallowRef(null), plugs = shallowRef({})
const stats = computed(() => weaponBaseStats(weaponRecord.value))
const candidates = socket => socket.plugItemHashes.map(hash => ({ ...(plugs.value[hash] || { hash, name: `词条 #${hash}` }), craftingOptions: (socket.plugOptions || []).filter(row => row.plugItemHash === hash) }))
const curated = computed(() => route.params.kind === 'curated')
const config = computed(() => catalogDatasets.find(d => d.id === route.params.kind))
const title = computed(() => item.value ? variantName(item.value) : `条目 ${route.params.id}`)
const description = value => manifestText(manifestDescription(value) || localizedField(value, 'effect') || localizedField(value, 'desc') || localizedField(value, 'bonus') || ui(value?.values?.effect) || '', locale.value)
const icon = computed(() => { const path = officialItem.value?.icon || item.value?.icon; return path ? (path.startsWith('http') ? path : `https://www.bungie.net${path}`) : '' })
const effects = computed(() => (officialItem.value?.perkDetails || officialItem.value?.perks || item.value?.perkDetails || item.value?.perks || []).filter(p => typeof p === 'object' && p.visibility !== 2))
const staticSources = computed(() => [...(item.value?.vendorSources || []), ...(item.value?.activitySources || [])])
const relationships = computed(() => (item.value?.mechanicIds || []).map(id => editorialById[id]).filter(Boolean))
const facts = computed(() => Object.entries(item.value?.values || {}).filter(([key]) => key !== 'effect'))
const back = computed(() => curated.value ? '/builds' : { path: '/manifest', query: { type: config.value?.id || 'items', q: String(route.params.id), filter: 'all' } })
let request = 0
async function readDataset(dataset) {
  const response = await fetch(dataUrl(`${dataset.file}.json`))
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data[dataset.key])) throw new Error('目录格式不正确')
  return data
}
async function load() {
  const token = ++request, id = String(route.params.id), isCurated = curated.value, dataset = config.value
  item.value = null; officialItem.value = null; weaponRecord.value = null; plugs.value = {}; snapshot.value = {}; error.value = ''; supplementalError.value = ''; loading.value = true
  try {
    if (isCurated) {
      const entry = editorialById[id]
      if (!entry) throw new Error('没有找到该条目')
      item.value = entry
      if (entry.manifestHash) {
        try {
          const data = await readDataset(catalogDatasets.find(d => d.id === 'items'))
          if (token !== request) return
          officialItem.value = data.items.find(i => String(i.hash) === String(entry.manifestHash)) || null
          snapshot.value = { manifestVersion: data.manifestVersion, syncedAt: data.syncedAt }
        } catch { if (token === request) supplementalError.value = '官方描述暂时加载失败，以下仍可查阅已登记的编辑资料。' }
      }
    } else {
      if (!dataset) throw new Error('不支持的条目类型')
      const data = await readDataset(dataset)
      if (token !== request) return
      const record = data[dataset.key].find(i => String(i.hash ?? i.itemHash) === id)
      if (!record) throw new Error('当前快照未收录该条目')
      item.value = record; snapshot.value = { manifestVersion: data.manifestVersion, syncedAt: data.syncedAt }
    }
    const hash = item.value?.manifestHash || item.value?.hash
    const sourceItem = item.value
    if (hash && (sourceItem.itemType === 3 || sourceItem.type === 'weapon')) {
      try {
        const [rich, plugData] = await Promise.all([
          readDataset({ file: 'manifest-equipment-rich', key: 'items' }),
          readDataset(catalogDatasets.find(d => d.id === 'plugs'))
        ])
        if (token !== request) return
        if (rich.manifestVersion !== snapshot.value.manifestVersion || plugData.manifestVersion !== snapshot.value.manifestVersion) throw new Error('快照版本不一致')
        weaponRecord.value = rich.items.find(i => String(i.hash) === String(hash)) || null
        plugs.value = Object.fromEntries(plugData.items.map(i => [i.hash, i]))
      } catch { if (token === request) supplementalError.value = '武器素体或词条详情暂时不可用，请稍后重新读取。' }
    }

  } catch (e) { if (token === request) error.value = e.message }
  finally { if (token === request) loading.value = false }
}
watch(() => [route.params.kind, route.params.id], load, { immediate: true })
</script>
<template>
  <div class="entry-page">
    <nav class="entry-breadcrumb"><RouterLink to="/">{{ ui("首页") }}</RouterLink><span>/</span><span>{{ ui("百科图鉴") }}</span><span>/</span><span>{{ ui("条目详情") }}</span></nav>
    <DestinyLoading v-if="loading" :label="ui('正在读取条目…')" />
    <section v-else-if="error" class="entry-empty" role="alert"><h1>{{ ui("暂时无法显示条目") }}</h1><p>{{ uiMessage(error) }}</p><button @click="load">{{ ui("重新读取") }}</button><RouterLink to="/manifest">{{ ui("返回图鉴") }}</RouterLink></section>
    <template v-else-if="item">
      <header class="entry-head"><img v-if="icon" :src="icon" alt="" /><div><p class="entry-kicker">KNOWLEDGE RECORD / {{ curated ? ui("机制与编辑资料") : config.label }}</p><h1>{{ title }}</h1><p>{{ item.en || (item.nameZh ? item.name : '') }}</p></div><RouterLink v-if="curated" :to="back">{{ ui("浏览构筑") }} →</RouterLink></header>
      <div class="entry-layout"><div class="entry-content">
        <section class="entry-section"><h2>{{ ui("版本与使用条件") }}</h2><ItemDefinitionInfo :item="officialItem || item" /><p v-if="item.energyCost != null">{{ ui("能量消耗") }} {{ item.energyCost }}</p></section>
        <section class="entry-section"><h2><span aria-hidden="true"></span> {{ ui("效果与说明") }}</h2><p v-if="supplementalError" role="status">{{ uiMessage(supplementalError) }}</p><p v-if="description(officialItem)" class="entry-description">{{ description(officialItem) }}</p><p v-if="description(item) && description(item) !== description(officialItem)" class="entry-description">{{ description(item) }}</p><p v-if="!description(item) && !description(officialItem) && !effects.length" class="entry-muted">{{ ui("当前条目未提供详细效果说明。") }}</p><article v-for="(effect, index) in effects" :key="effect.hash || index" class="entry-effect"><h3 v-if="effect.requiredSetCount">{{ effect.requiredSetCount }} {{ ui("件效果") }}</h3><p>{{ description(effect) || ui("未登记效果文本") }}</p></article><dl v-if="facts.length" class="entry-facts"><div v-for="[key, value] in facts" :key="key"><dt>{{ key }}</dt><dd>{{ value }}</dd></div></dl></section>
        <section v-if="item.guideCategory" class="entry-section"><h2><span aria-hidden="true"></span> {{ ui("活动流程与准备") }}</h2><p class="entry-description">{{ item.mechanics }}</p><p class="entry-muted">{{ item.scope }}</p><p v-if="item.gaps" class="entry-muted">{{ item.gaps }}</p><div class="entry-links"><RouterLink :to="{ path: '/activities', query: { entry: item.id } }">{{ ui("查看完整流程、准备与奖励 →") }}</RouterLink><a :href="item.reference.revisionUrl" target="_blank" rel="noopener noreferrer">{{ ui("核对来源") }} {{ item.reference.checkedAt }} ↗</a></div></section>
        <section v-if="stats.length" class="entry-section"><h2><span aria-hidden="true"></span> {{ ui("武器素体") }}</h2><dl class="weapon-stats"><div v-for="stat in stats" :key="stat.key"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl></section>
        <section v-if="relationships.length" class="entry-section"><h2><span aria-hidden="true"></span> {{ ui("关联机制") }}</h2><div class="entry-links"><EntityLink v-for="related in relationships" :key="related.id" :item="related" /></div></section>
        <section v-if="item.perkSockets?.length" class="entry-section"><h2><span aria-hidden="true"></span> {{ ui("词条候选") }}</h2><details v-for="socket in item.perkSockets" :key="socket.socketIndex"><summary>{{ ui("插槽") }} {{ socket.socketIndex + 1 }} {{ socket.plugItemHashes.length }} {{ ui("个候选") }}</summary><div class="entry-links"><div v-for="perk in candidates(socket)" :key="perk.hash"><EntityLink :item="perk" kind="plugs" /><ItemDefinitionInfo :item="perk" /></div></div></details></section>
        <section v-if="staticSources.length" class="entry-section"><h2>{{ ui("获取来源") }}</h2><p class="entry-muted">{{ ui("静态目录来源，不代表当前在售或本周掉落。") }}</p><ul class="static-sources"><li v-for="(source, index) in staticSources" :key="index">{{ source.vendorNameZh || source.activityNameZh || source.vendorName || source.activityName }}</li></ul></section><RelatedBuilds :item="item" />
        <div v-if="!curated" class="official-data-link"><RouterLink :to="back" class="btn small">{{ ui("官方数据查看") }} ↗</RouterLink><span>{{ ui("前往官方数据目录查看原始定义与 Manifest Hash。") }}</span></div>
      </div><aside><SourceProvenance :item="item" :snapshot="snapshot" :official="!curated" /><p class="entry-muted">{{ curated ? ui("来源分级和条目分级分别展示；具体说明以登记的证据为准。") : ui("官方定义用于查阅名称与效果；同步时间不等于实机测试时间。") }}</p></aside></div>
    </template>
  </div>
</template>
<style scoped>
.weapon-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem 1.5rem}.weapon-stats>div{display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--line-soft);font-size:.8rem}.weapon-stats dt{color:var(--text-sub)}.weapon-stats dd{margin:0;color:var(--gold-bright);font-variant-numeric:tabular-nums}.static-sources{font-size:.8rem;line-height:1.8;padding-left:1.2rem}.entry-content{counter-reset:entry-section}.entry-section{counter-increment:entry-section}.entry-section h2 span::before{content:counter(entry-section,decimal-leading-zero)}.entry-page{max-width:1120px;margin:auto}.entry-breadcrumb{display:flex;flex-wrap:wrap;gap:.6rem;font-size:.75rem;color:var(--text-dim);padding:1rem 0}.entry-breadcrumb a,.entry-head>a{color:var(--gold)}.entry-head{display:flex;align-items:center;gap:1.4rem;padding:2rem 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.entry-head img{width:88px;height:88px;object-fit:contain;background:var(--bg-card)}.entry-head>div{min-width:0;flex:1}.entry-head h1{margin:.4rem 0;font-size:clamp(1.8rem,4vw,3rem);overflow-wrap:anywhere}.entry-head p{margin:0;color:var(--text-dim)}.entry-kicker{font:.65rem var(--font-en);letter-spacing:.14em;color:var(--gold-dim)!important}.entry-head>a{font-size:.75rem;flex-shrink:0}.entry-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:3rem;padding:1rem 0 3rem}.entry-layout .entry-content,.entry-layout aside{min-width:0}.entry-layout aside{border-left:1px solid var(--line-soft);padding-left:1.5rem}.entry-section{padding:1.2rem 0;border-bottom:1px solid var(--line-soft)}.entry-section h2{font-size:1rem;margin:0 0 1rem}.entry-section h2 span{font:.7rem var(--font-en);color:var(--gold-dim);margin-right:1rem}.entry-description,.entry-effect p{white-space:pre-line;line-height:1.9;font-size:.9rem}.entry-muted{color:var(--text-dim);font-size:.75rem;line-height:1.75}.entry-links{display:flex;flex-wrap:wrap;gap:.7rem 1.2rem;padding:.6rem 0;font-size:.82rem}.entry-facts>div{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 0;border-top:1px solid var(--line-soft);font-size:.78rem}.entry-facts dt{overflow-wrap:anywhere}.entry-section summary{cursor:pointer;padding:.7rem 0;color:var(--gold);font-size:.8rem}.official-data-link{display:flex;align-items:center;gap:.8rem;margin-top:1.5rem;padding-top:1.2rem;border-top:1px solid var(--line-soft);color:var(--text-dim);font-size:.72rem}.official-data-link .btn{flex-shrink:0}.entry-empty{padding:3rem 0}.entry-empty button{margin-right:1rem;padding:.6rem 1rem;background:transparent;color:var(--gold);border:1px solid var(--line)}
@media(max-width:800px){.entry-layout{grid-template-columns:1fr;gap:1rem}.entry-layout aside{border-left:0;padding-left:0}.entry-head{flex-wrap:wrap;gap:1rem}.entry-head img{width:60px;height:60px}.entry-head>a{width:100%}}
</style>
