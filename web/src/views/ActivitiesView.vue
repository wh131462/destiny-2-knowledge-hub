<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { activitiesV2 } from '@/data/v2'
import { useI18n } from '@/i18n'
import { useManifestAssets } from '@/composables/useManifestAssets'
import ActivityGuideCard from '@/components/ActivityGuideCard.vue'

const { t, locale } = useI18n()
const route = useRoute()
const { weaponItems } = useManifestAssets()
const rewardByName = computed(() => {
  const map = new Map()
  for (const item of weaponItems.value) {
    if (!map.has(item.name) || (!map.get(item.name).collectibleHash && item.collectibleHash)) map.set(item.name, item)
  }
  return map
})
const tabs = [
  { id: 'guide', label: '我该玩什么', en: 'Choose an activity', title: '从游玩目标开始', subtitle: '六种游玩方向，展开查看开始步骤与准备建议。' },
  { id: 'raids', label: '突袭', en: 'Raids', title: '突袭协作指南', subtitle: '先了解机制与分工，再准备下一段遭遇。原版退役突袭单独标识。' },
  { id: 'dungeons', label: '地牢', en: 'Dungeons', title: '地牢探索指南', subtitle: '从核心机制到首领准备，找到适合这次冒险的目的地。' },
  { id: 'events', label: '限时事件', en: 'Limited events', title: '节日与赛事指南', subtitle: '查阅活动目标、参与流程与历年玩法差异。' }
]
const tab = ref('guide'), keyword = ref(''), openGuide = ref(null), trait = ref(''), raidScope = ref('all')
const categoryTab = item => ({ raid: 'raids', dungeon: 'dungeons', event: 'events' })[item.category] || 'guide'
const activeTab = computed(() => tabs.find(item => item.id === tab.value))
const entries = computed(() => activitiesV2.filter(item => categoryTab(item) === tab.value))
const traits = ['单人入门', '异域任务', '限时机制', '符号推理', '场地危险']
const raidCounts = computed(() => ({ historical: entries.value.filter(item => item.historical).length, later: entries.value.filter(item => !item.historical).length }))
const matches = item => {
  const query = keyword.value.trim().toLowerCase()
  const searchable = [item.name, item.en, item.intent, ...item.aliases, item.destination, ...item.tags,
    ...item.rewards, ...item.rewards.map(name => rewardByName.value.get(name)?.nameZh), ...item.encounters.map(encounter => encounter.name)]
  return (!query || searchable.join(' ').toLowerCase().includes(query))
    && (tab.value !== 'dungeons' || !trait.value || item.tags.includes(trait.value))
    && (tab.value !== 'raids' || raidScope.value === 'all' || Boolean(item.historical) === (raidScope.value === 'historical'))
}
const filteredEntries = computed(() => entries.value.filter(matches))
function selectTab(id) { tab.value = id; keyword.value = ''; trait.value = ''; raidScope.value = 'all'; openGuide.value = null }
function clearFilters() { keyword.value = ''; trait.value = ''; raidScope.value = 'all' }
watch(() => route.query.entry, id => {
  const entry = activitiesV2.find(item => item.id === id)
  if (entry) { selectTab(categoryTab(entry)); keyword.value = entry.name; openGuide.value = entry.id }
}, { immediate: true })
</script>

<template>
  <div>
    <header class="page-head"><h1>{{ t('pages.activities.title') }}</h1><p>{{ t('pages.activities.subtitle') }}</p></header>
    <nav class="tabs" aria-label="活动分类"><button v-for="item in tabs" :key="item.id" class="tab" :class="{ active: tab === item.id }" :aria-pressed="tab === item.id" @click="selectTab(item.id)">{{ locale === 'en' ? item.en : item.label }}<span>{{ activitiesV2.filter(entry => categoryTab(entry) === item.id).length }}</span></button></nav>
    <div class="activity-heading"><div><p class="activity-eyebrow">{{ activeTab.en.toUpperCase() }} / FIELD GUIDE</p><h2>{{ activeTab.title }}</h2><p>{{ activeTab.subtitle }}</p></div><span aria-live="polite">{{ filteredEntries.length }} / {{ entries.length }} 篇指南</span></div>
    <a-input v-model:value="keyword" class="search-box" size="large" allow-clear aria-label="搜索活动名称、别名或奖励" placeholder="搜索名称、英文、旧称或代表武器…" />
    <div v-if="tab === 'dungeons'" class="activity-filters" aria-label="地牢特点筛选"><button type="button" :aria-pressed="!trait" @click="trait = ''">全部地牢</button><button v-for="filter in traits" :key="filter" type="button" :aria-pressed="trait === filter" @click="trait = filter">{{ filter }}</button></div>
    <div v-if="tab === 'raids'" class="activity-filters" aria-label="突袭资料筛选"><button type="button" :aria-pressed="raidScope === 'all'" @click="raidScope = 'all'">全部突袭</button><button type="button" :aria-pressed="raidScope === 'later'" @click="raidScope = 'later'">后续与复刻突袭 {{ raidCounts.later }}</button><button type="button" :aria-pressed="raidScope === 'historical'" @click="raidScope = 'historical'">原版已退役 {{ raidCounts.historical }}</button></div>
    <div class="activity-list"><ActivityGuideCard v-for="(item, index) in filteredEntries" :key="item.id" :item="item" :index="index" :expanded="openGuide === item.id" :reward-by-name="rewardByName" @toggle="openGuide = openGuide === item.id ? null : item.id" /></div>
    <div v-if="!filteredEntries.length" class="empty">没有匹配的活动。<button type="button" class="clear-filters" @click="clearFilters">清除筛选</button></div>
  </div>
</template>

<style scoped>
.page-head{margin-bottom:1.3rem}.page-head h1{margin-bottom:.35rem}.page-head p{color:var(--text-dim)}.tabs{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}.tab{display:flex;gap:.6rem;align-items:center;padding:.55rem 1rem;border:0;border-left:2px solid transparent;background:transparent;color:var(--text-sub);cursor:pointer;font:inherit;font-size:.82rem;transition:.2s}.tab span{font:.58rem var(--font-en);color:var(--text-dim)}.tab:hover,.tab.active{color:var(--gold-bright);background:rgba(232,193,90,.06)}.tab.active{border-left-color:var(--gold)}.search-box{margin:.25rem 0 1rem}.activity-heading{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin:1.5rem 0 1rem}.activity-heading h2{font-family:var(--font-cn);font-size:1.4rem;margin:.3rem 0}.activity-heading p{font-size:.78rem;color:var(--text-sub)}.activity-heading>span{font-size:.7rem;white-space:nowrap;color:var(--gold-dim)}.activity-eyebrow{font:.6rem var(--font-en)!important;letter-spacing:.17em;color:var(--gold-dim)!important}.activity-filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem}.activity-filters button,.clear-filters{border:1px solid var(--line-soft);background:transparent;padding:.45rem .8rem;color:var(--text-sub);font-size:.72rem;cursor:pointer}.activity-filters button[aria-pressed="true"]{border-color:var(--gold-dim);color:var(--gold-bright);background:rgba(232,193,90,.06)}.activity-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start}.tab:focus-visible,.activity-filters button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@media(max-width:760px){.activity-list{grid-template-columns:1fr}.activity-heading{align-items:start;flex-direction:column}}
</style>
