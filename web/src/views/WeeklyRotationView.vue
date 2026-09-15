<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import RotationRewards from '@/components/RotationRewards.vue'
import RotationHint from '@/components/RotationHint.vue'
import { filterRotationRecords, rotationQuery, useWeeklyRotation } from '@/composables/useWeeklyRotation'

const route = useRoute()
const router = useRouter()
const { locale, formatDate } = useI18n()
const { snapshot, records, state, error, status, remaining, load } = useWeeklyRotation()
const initialQuery = rotationQuery(route.query)
const category = ref(initialQuery.category)
const difficulty = ref(initialQuery.difficulty)
const dataState = ref(initialQuery.status)
const tr = (zh, en) => locale.value === 'en' ? en : zh
const categoryOptions = computed(() => [
  { value: 'all', label: tr('全部类别', 'All categories') },
  { value: 'raid', label: tr('突袭', 'Raids') },
  { value: 'dungeon', label: tr('地牢', 'Dungeons') },
  { value: 'exotic-mission', label: tr('异域任务', 'Exotic missions') },
  { value: 'pve', label: tr('先锋与 PvE', 'Vanguard & PvE') },
  { value: 'pvp', label: tr('熔炉与 PvP', 'Crucible & PvP') },
  { value: 'vendor', label: tr('商人', 'Vendors') },
  { value: 'event', label: tr('事件', 'Events') },
  { value: 'other', label: tr('其他里程碑', 'Other milestones') }
])
const difficultyLabel = value => locale.value === 'en' ? value : ({ Standard: '标准', Normal: '普通', Master: '大师', Legend: '传说', Legendary: '传说', Expert: '专家', Grandmaster: '宗师' }[value] || value)
const difficultyOptions = computed(() => [
  { value: 'all', label: tr('全部难度', 'All difficulties') },
  ...[...new Set(records.value.map(item => item.difficulty).filter(Boolean))].map(value => ({ value, label: difficultyLabel(value) }))
])
const statusOptions = computed(() => [
  { value: 'all', label: tr('全部数据状态', 'All data states') },
  { value: 'fresh', label: tr('最新', 'Fresh') },
  { value: 'partial', label: tr('部分覆盖', 'Partial coverage') },
  { value: 'stale', label: tr('已过期', 'Stale') },
  { value: 'unavailable', label: tr('不可用', 'Unavailable') }
])
const filteredRecords = computed(() => filterRotationRecords(records.value, { category: category.value, difficulty: difficulty.value, status: dataState.value }, status()))
const groups = computed(() => categoryOptions.value.slice(1).map(option => ({ ...option, items: filteredRecords.value.filter(item => item.category === option.value) })).filter(group => group.items.length))
const statusText = computed(() => ({ fresh: tr('已更新', 'Up to date'), partial: tr('部分活动可查', 'Partial coverage'), stale: tr('数据已过期', 'Expired'), unavailable: tr('暂无活动', 'Unavailable') }[status()]))
const updateQuery = () => router.replace({ query: { ...route.query, category: category.value === 'all' ? undefined : category.value, difficulty: difficulty.value === 'all' ? undefined : difficulty.value, status: dataState.value === 'all' ? undefined : dataState.value } })
watch([category, difficulty, dataState], updateQuery)
watch(() => route.query, query => {
  const next = rotationQuery(query)
  category.value = next.category; difficulty.value = next.difficulty; dataState.value = next.status
})
const reset = () => { category.value = 'all'; difficulty.value = 'all'; dataState.value = 'all' }
const name = item => {
  const value = locale.value === 'en' ? (item.name || item.nameZh) : (item.nameZh || item.name)
  return /^Milestone \d+$/.test(value) ? tr('名称待解析', 'Name unavailable') : value
}
const title = item => name(item).replace(/[:：]\s*(Standard|Normal|Master|Legend|Legendary|Expert|Grandmaster|标准|普通|大师|传说|专家|宗师)\s*$/i, '')
const description = item => locale.value === 'en' ? item.description : (item.descriptionZh || item.description)
const date = value => value ? formatDate(value, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : tr('未提供', 'Not supplied')
const windowDate = value => value ? formatDate(value, { month: 'short', day: 'numeric' }) : tr('未提供', 'Not supplied')
const countdown = endDate => {
  const value = remaining(endDate)
  if (!value) return tr('结束时间未提供', 'End time not supplied')
  if (value.expired) return tr('已结束', 'Ended')
  return value.days ? tr(`${value.days}天 ${value.hours}小时`, `${value.days}d ${value.hours}h`) : tr(`${value.hours}小时 ${value.minutes}分`, `${value.hours}h ${value.minutes}m`)
}
const details = item => item.modifierDetails || (item.modifiers || []).map(value => ({ name: typeof value === 'string' && !/^\d+$/.test(value) ? value : '', hash: /^\d+$/.test(String(value)) ? value : null, kind: 'modifier' }))
const readableDetails = item => {
  const values = details(item).filter(value => !value.hidden && (value.name || value.nameZh))
  // The API can return both a short HUD label and the full activity-screen description.
  return values.filter(value => value.displayInActivitySelection !== false || !values.some(other => name(other) === name(value) && other.displayInActivitySelection === true))
}
const challenges = item => readableDetails(item).filter(value => value.kind === 'challenge')
const modifiers = item => readableDetails(item).filter(value => value.kind !== 'challenge')
const unresolvedCount = item => details(item).filter(value => !value.hidden && !value.name && !value.nameZh).length
const readableValues = values => (values || []).filter(value => typeof value === 'string' && !/^\d+$/.test(value))
const modifierContent = item => {
  const lines = [description(item) || tr('暂无更详细的说明，请查看游戏内活动提示。', 'No further description available. Check the in-game activity screen.')]
  if (item.displayInActivitySelection === false) lines.push(tr('不在活动选择界面展示。', 'Not shown in the activity selection screen.'))
  return lines.join('\n')
}
const modifierIcon = item => {
  const path = item?.icon || ''
  return path.startsWith('http') ? path : (path ? `https://www.bungie.net${path}` : '')
}
const periodHint = item => item.startDate || item.endDate ? `${date(item.startDate)} — ${date(item.endDate)}` : tr('此活动没有提供重置周期。', 'No reset window is available for this activity.')
const titleHint = item => [name(item), description(item), item.guide?.intro].filter(Boolean).join('\n\n')
const championInfo = value => {
  const v = String(value).toLowerCase()
  if (v.includes('barrier') || v.includes('屏障')) return { label: tr('屏障', 'Barrier'), hint: tr('需要反屏障武器或词条才能击破其护盾。', 'Requires Anti-Barrier weapons or perks to pierce its shield.') }
  if (v.includes('overload') || v.includes('超载') || v.includes('过载')) return { label: tr('超载', 'Overload'), hint: tr('需要反超载词条打断其恢复与瞬移。', 'Requires Anti-Overload perks to disrupt its recovery and teleport.') }
  if (v.includes('unstoppable') || v.includes('不可阻挡') || v.includes('势不可挡')) return { label: tr('不可阻挡', 'Unstoppable'), hint: tr('需要反不可阻挡词条才能使其眩晕。', 'Requires Anti-Unstoppable perks to stagger it.') }
  return { label: value, hint: tr('需要对应类型的反勇士词条。', 'Requires matching anti-champion perks.') }
}
const championsOf = item => readableValues(item.champions).map(championInfo)
const guideMetaHint = item => {
  const g = item.guide
  if (!g) return ''
  return [g.destination ? tr(`地点：${g.destination}`, `Destination: ${g.destination}`) : '', g.release ? tr(`版本：${g.release}`, `Release: ${g.release}`) : '', g.mechanics ? tr(`机制：${g.mechanics}`, `Mechanics: ${g.mechanics}`) : ''].filter(Boolean).join('\n')
}
const guidePrepHint = item => {
  const g = item.guide
  if (!g) return ''
  const prep = (g.preparation || []).map((p, i) => `${i + 1}. ${p}`).join('\n')
  const parts = []
  if (g.mechanics) parts.push(tr('机制要点', 'Mechanics') + '：' + g.mechanics)
  if (prep) parts.push(tr('准备建议', 'Preparation') + '：\n' + prep)
  return parts.join('\n\n')
}
const reload = () => load().catch(() => {})
</script>

<template>
  <div class="rotation-page">
    <header class="rotation-head">
      <h1>{{ tr('本周轮换', 'Weekly Rotation') }}</h1>
      <button type="button" class="btn small" :disabled="state === 'loading'" @click="reload">↻ {{ tr('刷新数据', 'Refresh data') }}</button>
    </header>

    <p class="week-overview" :class="status()" aria-live="polite">
      <i class="status-dot" aria-hidden="true"></i>
      <span v-if="snapshot?.week?.start">{{ windowDate(snapshot.week.start) }} — {{ windowDate(snapshot.week.end) }}</span>
      <span v-else>{{ tr('等待首次同步', 'Awaiting first sync') }}</span>
      <template v-if="snapshot?.week?.end"> / {{ tr(`剩余 ${countdown(snapshot.week.end)}`, `${countdown(snapshot.week.end)} left`) }}</template>
      <template v-if="state === 'loading'"> / {{ tr('更新中…', 'Updating…') }}</template>
      <template v-else> / {{ statusText }}</template>
    </p>
    <p v-if="error || snapshot?.error" class="note" role="alert">{{ error || snapshot.error }}</p>

    <section class="rotation-filters" :aria-label="tr('筛选活动', 'Filter activities')">
      <div><label for="rotation-category">{{ tr('活动类别', 'Category') }}</label><a-select id="rotation-category" v-model:value="category" :aria-label="tr('活动类别', 'Category')" :options="categoryOptions" /></div>
      <div><label for="rotation-difficulty">{{ tr('难度', 'Difficulty') }}</label><a-select id="rotation-difficulty" v-model:value="difficulty" :aria-label="tr('难度', 'Difficulty')" :options="difficultyOptions" /></div>
      <div><label for="rotation-status">{{ tr('数据状态', 'Data state') }}</label><a-select id="rotation-status" v-model:value="dataState" :aria-label="tr('数据状态', 'Data state')" :options="statusOptions" /></div>
      <button type="button" class="filter-reset" @click="reset">{{ tr('清除筛选', 'Clear filters') }}</button>
    </section>

    <div v-if="state === 'loading' && !records.length" class="rotation-empty">{{ tr('正在读取本周活动…', 'Loading activities…') }}</div>
    <div v-else-if="!records.length" class="rotation-empty"><h2>{{ tr('暂时没有可展示的活动', 'No activities available yet') }}</h2><p>{{ tr('当前没有可用的官方数据，请稍后刷新。', 'No official data is available. Please refresh later.') }}</p></div>
    <div v-else-if="!filteredRecords.length" class="rotation-empty"><h2>{{ tr('没有符合筛选条件的活动', 'No matching activities') }}</h2><p>{{ tr('可以清除筛选；来源未返回的类别暂时无法展示。', 'Clear the filters. Categories absent from the source are not available yet.') }}</p><button type="button" class="btn small" @click="reset">{{ tr('查看全部活动', 'Show all activities') }}</button></div>
    <section v-for="group in groups" :key="group.value" class="rotation-group">
      <header class="group-heading"><h2>{{ group.label }} <span>{{ group.items.length }}</span></h2></header>
      <div class="rotation-grid">
        <article v-for="item in group.items" :key="item.id" class="rotation-card">
          <div class="card-heading">
            <a-tooltip :destroy-tooltip-on-hide="true"><template #title><span class="tooltip-text">{{ titleHint(item) }}</span></template><img v-if="item.iconUrl" :src="item.iconUrl" alt="" loading="lazy" class="activity-icon" /></a-tooltip>
            <div>
              <div v-if="item.difficulty" class="card-labels"><a-tooltip :title="tr(`难度：${difficultyLabel(item.difficulty)}`, `Difficulty: ${difficultyLabel(item.difficulty)}`)"><span class="difficulty-badge" :class="{ master: item.difficulty === 'Master' }">{{ difficultyLabel(item.difficulty) }}</span></a-tooltip></div>
              <a-tooltip :destroy-tooltip-on-hide="true"><template #title><span class="tooltip-text">{{ titleHint(item) }}</span></template><h3>{{ title(item) }}</h3></a-tooltip>
              <p v-if="locale !== 'en' && item.nameZh && item.name && !/^Milestone /.test(item.name)" class="english-name">{{ item.name }}</p>
            </div>
          </div>
          <p v-if="description(item)" class="activity-description">{{ description(item) }}</p>
          <div class="activity-facts"><a-tooltip v-if="item.guide?.fireteam"><template #title><span class="tooltip-text">{{ guideMetaHint(item) }}</span></template><span class="fact"><i class="fact-ico">◈</i>{{ tr(`${item.guide.fireteam} 人活动`, `${item.guide.fireteam} players`) }}</span></a-tooltip><RotationHint :label="item.endDate ? tr(`剩余 ${countdown(item.endDate)}`, `${countdown(item.endDate)} left`) : tr('周期未提供', 'No reset window')" :content="periodHint(item)" tone="subtle" /></div>
          <section v-if="championsOf(item).length" class="activity-highlights"><h4>{{ tr('勇士', 'Champions') }} <span>{{ championsOf(item).length }}</span></h4><div class="modifier-labels"><RotationHint v-for="(champion, index) in championsOf(item)" :key="index" :label="champion.label" :content="champion.hint" tone="champion" /></div></section>
          <section v-if="challenges(item).length" class="activity-highlights"><h4>{{ tr('挑战', 'Challenges') }} <span>{{ challenges(item).length }}</span></h4><div class="modifier-labels"><RotationHint v-for="(modifier, index) in challenges(item)" :key="index" :label="name(modifier)" :title="name(modifier)" :icon="modifierIcon(modifier)" :content="modifierContent(modifier)" tone="challenge" /></div></section>
          <section v-if="modifiers(item).length" class="activity-highlights"><h4>{{ tr('修饰词与战斗条件', 'Modifiers & combat conditions') }}</h4><div class="modifier-labels"><RotationHint v-for="(modifier, index) in modifiers(item)" :key="index" :label="name(modifier)" :title="name(modifier)" :icon="modifierIcon(modifier)" :content="modifierContent(modifier)" /></div></section>
          <p v-if="unresolvedCount(item)" class="empty-detail">{{ tr(`${unresolvedCount(item)} 项修饰词说明暂缺。`, `${unresolvedCount(item)} modifier descriptions are unavailable.`) }}</p>
          <RotationRewards :item="item" />
          <footer v-if="item.guide" class="card-footer">
            <div class="footer-links"><RouterLink :to="{ path: '/activities', query: { entry: item.guide.id } }">{{ tr('活动攻略', 'Activity guide') }} ↗</RouterLink></div>
            <RotationHint v-if="item.guide?.mechanics || item.guide?.preparation?.length" :label="tr('准备与机制', 'Preparation & mechanics')" :content="guidePrepHint(item)" tone="subtle" />
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rotation-page { max-width: 1120px; margin: 0 auto; }
.rotation-head { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1rem 0 1.2rem; }
.rotation-head h1 { font-family: var(--font-cn); font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -.03em; margin: 0; }
.week-overview { display: flex; align-items: center; flex-wrap: wrap; gap: .3rem; color: var(--text-dim); font-size: .76rem; margin: 0 0 .9rem; }
.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--ok); }
.stale .status-dot, .unavailable .status-dot { background: var(--warn); }
.rotation-filters { display: grid; grid-template-columns: minmax(160px,1.2fr) minmax(140px,1fr) minmax(140px,.8fr) auto; gap: 1rem; align-items: end; margin: 1rem 0; }
.rotation-filters > div { display: grid; gap: .4rem; min-width: 0; }
.rotation-filters label { font-size: .75rem; color: var(--text-sub); }
.rotation-filters .ant-select { width: 100%; }
.filter-reset { border: 0; background: transparent; color: var(--text-sub); height: 40px; cursor: pointer; }
.filter-reset:hover { color: var(--gold-bright); }
.rotation-group { margin: 1.7rem 0 2.5rem; }
.group-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.group-heading h2 { font-family: var(--font-cn); font-size: 1.2rem; letter-spacing: 0; }
.group-heading h2 span { color: var(--gold); font-size: .8rem; font-weight: 400; margin-left: .5rem; }
.rotation-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; align-items: stretch; }
.rotation-card { display: flex; flex-direction: column; min-width: 0; padding: 1.4rem 1.4rem 0; border: 1px solid var(--line-soft); border-radius: 4px; background: var(--bg-panel); }
.card-heading { display: flex; align-items: center; gap: .9rem; }
.activity-icon { width: 48px; height: 48px; object-fit: contain; opacity: .9; flex-shrink: 0; border-radius: 4px; background: rgba(255,255,255,.03); cursor: help; }
.card-heading > div { min-width: 0; }
.card-labels { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; font-size: .7rem; color: var(--text-sub); }
.difficulty-badge { color: var(--text-main); padding: 0 .45rem; border: 1px solid var(--line-soft); border-radius: 3px; cursor: help; }
.difficulty-badge.master { color: var(--gold-bright); border-color: var(--gold-dim); }
.card-heading h3 { font-family: var(--font-cn); font-size: 1.25rem; font-weight: 600; line-height: 1.5; margin: .2rem 0; overflow-wrap: anywhere; }
.english-name { font-size: .72rem; color: var(--text-sub); margin: 0; }
.activity-description { font-size: .84rem; color: var(--text-sub); margin: 1rem 0 0; line-height: 1.8; }
.activity-highlights { margin: 1rem 0; }
.activity-highlights h4 { font-size: .85rem; font-weight: 500; margin: 0 0 .65rem; }
.activity-highlights h4 span { color: var(--text-sub); font-size: .7rem; margin-left: .35rem; }
.modifier-labels { display: flex; flex-wrap: wrap; gap: .4rem; }
.activity-facts { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin: .7rem 0 1rem; color: var(--text-sub); font-size: .72rem; }
.fact { display: inline-flex; align-items: center; gap: .35rem; cursor: help; }
.fact-ico { color: var(--gold-dim); font-style: normal; font-size: .7rem; }
.tooltip-text { display: block; white-space: pre-line; max-width: 360px; line-height: 1.7; }
.empty-detail { font-size: .8rem; color: var(--text-sub); margin-top: .55rem; }
.card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--line-soft); padding: .9rem 0; }
.card-footer a { font-size: .78rem; }
.footer-links { display: flex; flex-wrap: wrap; gap: .9rem; }
.rotation-empty { padding: 3rem 1rem; text-align: center; border: 1px dashed var(--line-soft); margin: 2rem 0; }
.rotation-empty h2 { font-size: 1.1rem; }
.rotation-empty p { color: var(--text-sub); font-size: .85rem; margin: .75rem 0; }
@media (max-width: 760px) {
  .rotation-head { padding-top: 1rem; align-items: start; }
  .rotation-head > .btn { flex-shrink: 0; margin-top: .3rem; }
  .rotation-head h1 { font-size: 2rem; }
  .rotation-filters { grid-template-columns: 1fr 1fr; gap: .75rem; }
  .filter-reset { height: 30px; text-align: right; }
  .rotation-grid { grid-template-columns: 1fr; }
  .rotation-card { padding: 1.1rem 1.1rem 0; }
  .card-heading h3 { font-size: 1.15rem; }
}
</style>
