<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import {
  loreCharacters,
  loreConcepts,
  loreEras,
  loreEvents,
  loreFactions,
  loreReleases,
  loreSources
} from '@/data/world'
import hunterArt from '@/assets/guardians/hunter.webp'
import titanArt from '@/assets/guardians/titan.webp'
import warlockArt from '@/assets/guardians/warlock.webp'

const { locale, localizedField } = useI18n()

const tab = ref('overview')
const keyword = ref('')
const spoilerLevel = ref(0)
const eraFilter = ref('all')
const categoryFilter = ref('all')

const tabs = [
  { id: 'overview', label: '入门导览', labelEn: 'Start here' },
  { id: 'concepts', label: '宇宙法则', labelEn: 'Foundations' },
  { id: 'timeline', label: '剧情时间线', labelEn: 'Story timeline' },
  { id: 'factions', label: '阵营关系', labelEn: 'Factions' },
  { id: 'characters', label: '人物志', labelEn: 'Characters' },
  { id: 'releases', label: '发行历史', labelEn: 'Release history' }
]

const collections = {
  concepts: loreConcepts,
  timeline: loreEvents,
  factions: loreFactions,
  characters: loreCharacters,
  releases: loreReleases
}

const recordIndex = new Map()
for (const [collection, items] of Object.entries(collections)) {
  for (const item of items) recordIndex.set(item.id, { ...item, collection })
}
const sourceIndex = new Map(loreSources.map(item => [item.id, item]))
const eraIndex = new Map(loreEras.map(item => [item.id, item]))

const text = (item, field, fallback = '') => localizedField(item, field, fallback)
const copy = (zh, en) => locale.value === 'en' ? en : zh
const recordName = item => text(item, 'name', item?.id || '')
const eraName = eraId => recordName(eraIndex.get(eraId))

const spoilerOptions = computed(() => [
  { value: 0, label: copy('新手安全', 'Introduction') },
  { value: 1, label: copy('主要剧情', 'Major story beats') },
  { value: 2, label: copy('完整剧透', 'Full spoilers') }
])

const activeCollection = computed(() => collections[tab.value] || [])
const hasEraFilter = computed(() => ['timeline', 'characters', 'releases'].includes(tab.value))
const hasCategoryFilter = computed(() => ['concepts', 'factions', 'characters', 'releases'].includes(tab.value))

function categoryValue(item) {
  if (tab.value === 'concepts') return item.category
  if (tab.value === 'factions' || tab.value === 'characters') return item.alignment
  if (tab.value === 'releases') return item.sagaId
  return ''
}

function categoryLabel(item) {
  if (tab.value === 'concepts') return text(item, 'category')
  if (tab.value === 'factions' || tab.value === 'characters') return text(item, 'alignment')
  if (tab.value === 'releases') return text(item, 'saga')
  return ''
}

const eraOptions = computed(() => {
  const ids = [...new Set(activeCollection.value.map(item => item.eraId))]
  return [{ value: 'all', label: copy('全部时代', 'All eras') }, ...ids.map(id => ({ value: id, label: eraName(id) }))]
})

const categoryOptions = computed(() => {
  const values = new Map()
  for (const item of activeCollection.value) values.set(categoryValue(item), categoryLabel(item))
  return [
    { value: 'all', label: copy('全部类别', 'All categories') },
    ...[...values].filter(([value]) => value).map(([value, label]) => ({ value, label }))
  ]
})

function searchableText(item) {
  const relatedNames = (item.relatedIds || []).flatMap(id => {
    const related = recordIndex.get(id)
    return related ? [related.name, related.nameEn] : []
  })
  return [
    item.name, item.nameEn, item.summary, item.summaryEn, item.feature, item.featureEn,
    item.destination, item.destinationEn, item.species, item.speciesEn,
    item.roleZh, item.roleEn, item.statusZh, item.statusEn,
    ...(item.aliases || []), ...(item.aliasesEn || []), ...relatedNames
  ].filter(Boolean).join(' ').toLocaleLowerCase()
}

function matchesControls(item, includeSpoilers = true) {
  const query = keyword.value.trim().toLocaleLowerCase()
  if (query && !searchableText(item).includes(query)) return false
  if (hasEraFilter.value && eraFilter.value !== 'all' && item.eraId !== eraFilter.value) return false
  if (hasCategoryFilter.value && categoryFilter.value !== 'all' && categoryValue(item) !== categoryFilter.value) return false
  return !includeSpoilers || item.spoilerLevel <= spoilerLevel.value
}

const filteredRecords = computed(() => activeCollection.value.filter(item => matchesControls(item)))
const hiddenCount = computed(() => activeCollection.value.filter(item => matchesControls(item, false) && item.spoilerLevel > spoilerLevel.value).length)
const overviewEvents = computed(() => loreEvents.filter(item => item.spoilerLevel <= spoilerLevel.value).slice(0, 6))

function visibleRelations(item) {
  return (item.relatedIds || []).map(id => recordIndex.get(id)).filter(related => related && related.spoilerLevel <= spoilerLevel.value)
}

function recordSources(item) {
  return (item.sourceIds || []).map(id => sourceIndex.get(id)).filter(Boolean)
}

async function openCollection(nextTab, id) {
  tab.value = nextTab
  keyword.value = ''
  eraFilter.value = 'all'
  categoryFilter.value = 'all'
  await nextTick()
  if (!id) return
  const target = document.getElementById(`lore-${id}`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target?.focus({ preventScroll: true })
}

function openRelated(item) {
  if (item.spoilerLevel > spoilerLevel.value) return
  openCollection(item.collection, item.id)
}

watch(tab, () => {
  keyword.value = ''
  eraFilter.value = 'all'
  categoryFilter.value = 'all'
})
</script>

<template>
  <div class="lore-page">
    <section class="lore-hero" aria-labelledby="lore-title">
      <div class="hero-copy">
        <p class="eyebrow">{{ copy('太阳系档案 / 策展式世界观指南', 'SOL ARCHIVE / CURATED LORE GUIDE') }}</p>
        <h1 id="lore-title">{{ copy('命运宇宙，从因果开始', 'Destiny, connected by cause and consequence') }}</h1>
        <p class="hero-summary">{{ copy('旅者带来了黄金时代，崩塌留下最后之城，而守护者的每次胜利都改变了下一场战争。这里把力量、人物与事件重新连成一条可以读懂的主线。', 'The Traveler enabled a Golden Age, the Collapse left the Last City, and every Guardian victory changed the next war. This guide reconnects powers, people, and events into one readable story.') }}</p>
        <div class="hero-actions">
          <button type="button" class="primary-action" @click="openCollection('timeline')">{{ copy('进入剧情时间线', 'Open story timeline') }}</button>
          <button type="button" class="text-action" @click="openCollection('concepts')">{{ copy('先理解光与暗', 'Understand Light and Darkness') }}</button>
        </div>
        <dl class="hero-stats">
          <div><dt>{{ loreEvents.length }}</dt><dd>{{ copy('关键事件', 'anchor events') }}</dd></div>
          <div><dt>{{ loreFactions.length }}</dt><dd>{{ copy('主要阵营', 'major factions') }}</dd></div>
          <div><dt>{{ loreCharacters.length }}</dt><dd>{{ copy('人物档案', 'character files') }}</dd></div>
        </dl>
      </div>
      <figure class="guardian-visual" :aria-label="copy('泰坦、猎人与术士守护者', 'Titan, Hunter, and Warlock Guardians')">
        <img class="guardian titan" :src="titanArt" :alt="copy('泰坦守护者', 'Titan Guardian')" />
        <img class="guardian hunter" :src="hunterArt" :alt="copy('猎人守护者', 'Hunter Guardian')" />
        <img class="guardian warlock" :src="warlockArt" :alt="copy('术士守护者', 'Warlock Guardian')" />
      </figure>
    </section>

    <nav class="lore-tabs" role="tablist" :aria-label="copy('世界观主题', 'Lore topics')">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :class="{ active: tab === item.id }"
        @click="tab = item.id"
      >{{ locale === 'en' ? item.labelEn : item.label }}</button>
    </nav>

    <div class="spoiler-strip">
      <div>
        <span class="control-label">{{ copy('剧透范围', 'Spoiler scope') }}</span>
        <strong>{{ spoilerOptions.find(item => item.value === spoilerLevel)?.label }}</strong>
      </div>
      <a-select
        v-model:value="spoilerLevel"
        class="spoiler-select"
        :options="spoilerOptions"
        :aria-label="copy('选择剧透范围', 'Select spoiler scope')"
        popup-class-name="lore-select-popup"
      />
    </div>

    <template v-if="tab === 'overview'">
      <section class="overview-section" aria-labelledby="primer-title">
        <header class="section-heading">
          <p>{{ copy('核心脉络', 'THE CENTRAL THREAD') }}</p>
          <h2 id="primer-title">{{ copy('先抓住四个转折', 'Four turns that define the setting') }}</h2>
        </header>
        <ol class="primer-list">
          <li>
            <span>01</span>
            <div><h3>{{ copy('旅者带来可能性', 'The Traveler brings possibility') }}</h3><p>{{ copy('人类进入黄金时代，但旅者的真正动机仍然未知。', 'Humanity enters a Golden Age, while the Traveler’s motives remain unresolved.') }}</p></div>
            <button type="button" @click="openCollection('concepts', 'traveler')">{{ copy('旅者', 'Traveler') }}</button>
          </li>
          <li>
            <span>02</span>
            <div><h3>{{ copy('崩塌切断旧世界', 'The Collapse severs the old world') }}</h3><p>{{ copy('文明毁灭，幽灵与承光者在废墟中出现。', 'Civilization falls; Ghosts and the Risen emerge from the ruins.') }}</p></div>
            <button type="button" @click="openCollection('timeline', 'collapse')">{{ copy('崩塌', 'Collapse') }}</button>
          </li>
          <li>
            <span>03</span>
            <div><h3>{{ copy('力量不再等于善恶', 'Power stops defining morality') }}</h3><p>{{ copy('守护者掌握暗，邪魔族获得光，旧有阵营边界被打破。', 'Guardians wield Darkness and Hive receive Light, breaking the old moral map.') }}</p></div>
            <button type="button" @click="openCollection('factions', 'lucent-brood')">{{ copy('光明邪魔族', 'Lucent Brood') }}</button>
          </li>
          <li>
            <span>04</span>
            <div><h3>{{ copy('选择对抗终止', 'Choice resists finality') }}</h3><p>{{ copy('见证者要消除变化；守护者以共同选择保留宇宙的可能性。', 'The Witness seeks to end change; Guardians preserve possibility through collective choice.') }}</p></div>
            <button type="button" @click="openCollection('concepts', 'darkness')">{{ copy('光与暗', 'Light and Darkness') }}</button>
          </li>
        </ol>
      </section>

      <section class="overview-section" aria-labelledby="path-title">
        <header class="section-heading split-heading">
          <div><p>{{ copy('故事路径', 'STORY PATH') }}</p><h2 id="path-title">{{ copy('从黄金时代到最后一战', 'From the Golden Age to the final battle') }}</h2></div>
          <button type="button" class="text-action" @click="openCollection('timeline')">{{ copy('查看完整时间线', 'View full timeline') }}</button>
        </header>
        <div class="anchor-track">
          <button v-for="event in overviewEvents" :key="event.id" type="button" @click="openCollection('timeline', event.id)">
            <span>{{ String(event.order / 10).padStart(2, '0') }}</span>
            <strong>{{ recordName(event) }}</strong>
            <small>{{ eraName(event.eraId) }}</small>
          </button>
        </div>
        <p v-if="loreEvents.length > overviewEvents.length" class="hidden-note">
          {{ copy(`当前剧透范围隐藏了 ${loreEvents.length - overviewEvents.length} 个后续事件。`, `${loreEvents.length - overviewEvents.length} later events are hidden by the current spoiler scope.`) }}
        </p>
      </section>
    </template>

    <template v-else>
      <section class="collection-head">
        <div>
          <p>{{ locale === 'en' ? tabs.find(item => item.id === tab)?.labelEn : tabs.find(item => item.id === tab)?.label }}</p>
          <h2>{{ copy({ concepts: '理解规则，才能理解冲突', timeline: '故事事件与因果', factions: '种族不等于立场', characters: '人物在选择中改变', releases: '现实发行顺序' }[tab], { concepts: 'Rules behind the conflict', timeline: 'Events, causes, and consequences', factions: 'Species is not allegiance', characters: 'People changed by choice', releases: 'The real-world release order' }[tab]) }}</h2>
        </div>
        <span>{{ filteredRecords.length }} / {{ activeCollection.length }}</span>
      </section>

      <div class="filter-bar">
        <a-input
          v-model:value="keyword"
          allow-clear
          class="lore-search"
          :placeholder="copy('搜索名称、别名、地点或关联条目', 'Search names, aliases, places, or related entries')"
          :aria-label="copy('搜索当前世界观主题', 'Search the current lore topic')"
        />
        <a-select
          v-if="hasEraFilter"
          v-model:value="eraFilter"
          :options="eraOptions"
          :aria-label="copy('按时代筛选', 'Filter by era')"
          popup-class-name="lore-select-popup"
        />
        <a-select
          v-if="hasCategoryFilter"
          v-model:value="categoryFilter"
          :options="categoryOptions"
          :aria-label="copy('按类别筛选', 'Filter by category')"
          popup-class-name="lore-select-popup"
        />
      </div>

      <p v-if="hiddenCount" class="hidden-note" role="status">
        {{ copy(`另有 ${hiddenCount} 条匹配内容被当前剧透范围隐藏。`, `${hiddenCount} additional matching records are hidden by the current spoiler scope.`) }}
      </p>

      <div v-if="!filteredRecords.length" class="lore-empty">
        <strong>{{ copy('没有符合条件的档案', 'No records match') }}</strong>
        <p>{{ copy('调整搜索内容或筛选范围后再查看。', 'Change the search or filter scope to continue.') }}</p>
        <button type="button" @click="keyword = ''; eraFilter = 'all'; categoryFilter = 'all'">{{ copy('清除筛选', 'Clear filters') }}</button>
      </div>

      <section v-else-if="tab === 'timeline'" class="timeline-list" :aria-label="copy('剧情事件', 'Story events')">
        <article v-for="event in filteredRecords" :id="`lore-${event.id}`" :key="event.id" class="timeline-entry" tabindex="-1">
          <div class="timeline-marker"><span>{{ String(event.order / 10).padStart(2, '0') }}</span></div>
          <div class="timeline-body">
            <header><div><p>{{ eraName(event.eraId) }}</p><h3>{{ recordName(event) }}</h3></div><span>{{ text(event, 'destination') }}</span></header>
            <p class="record-summary">{{ text(event, 'summary') }}</p>
            <dl class="causality">
              <div><dt>{{ copy('前因', 'Cause') }}</dt><dd>{{ text(event, 'cause') }}</dd></div>
              <div><dt>{{ copy('结果', 'Consequence') }}</dt><dd>{{ text(event, 'consequence') }}</dd></div>
            </dl>
            <div class="record-footer">
              <div class="relations" :aria-label="copy('相关档案', 'Related records')">
                <button v-for="related in visibleRelations(event)" :key="related.id" type="button" @click="openRelated(related)">{{ recordName(related) }}</button>
              </div>
              <small>{{ copy('核验', 'Verified') }} {{ event.verifiedAt }} · {{ recordSources(event).map(recordName).join(' / ') }}</small>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="tab === 'releases'" class="release-list" :aria-label="copy('发行历史', 'Release history')">
        <article v-for="release in filteredRecords" :id="`lore-${release.id}`" :key="release.id" tabindex="-1">
          <time>{{ release.year }}</time>
          <div><p>{{ text(release, 'saga') }}</p><h3>{{ recordName(release) }}</h3><strong>{{ text(release, 'feature') }}</strong><small class="release-provenance">{{ copy('核验', 'Verified') }} {{ release.verifiedAt }} · {{ recordSources(release).map(recordName).join(' / ') }}</small></div>
          <p>{{ text(release, 'destination') }}</p>
          <div class="relations"><button v-for="related in visibleRelations(release)" :key="related.id" type="button" @click="openRelated(related)">{{ recordName(related) }}</button></div>
        </article>
      </section>

      <section v-else class="record-grid" :aria-label="copy('世界观档案', 'Lore records')">
        <article v-for="item in filteredRecords" :id="`lore-${item.id}`" :key="item.id" class="record-card" :class="`alignment-${item.alignment || 'neutral'}`" tabindex="-1">
          <header>
            <div><p>{{ tab === 'concepts' ? text(item, 'category') : tab === 'factions' ? text(item, 'species') : text(item, 'role') }}</p><h3>{{ recordName(item) }}</h3></div>
            <span v-if="tab === 'factions' || tab === 'characters'">{{ text(item, 'alignment') }}</span>
          </header>
          <p v-if="item.aliases?.length" class="aliases">{{ copy('别名', 'Also known as') }} · {{ (locale === 'en' ? item.aliasesEn : item.aliases).join(' / ') }}</p>
          <p class="record-summary">{{ text(item, 'summary') }}</p>
          <dl v-if="tab === 'characters'" class="character-meta"><div><dt>{{ copy('现状', 'Status') }}</dt><dd>{{ text(item, 'status') }}</dd></div><div><dt>{{ copy('时代', 'Era') }}</dt><dd>{{ eraName(item.eraId) }}</dd></div></dl>
          <div class="record-footer">
            <div class="relations" :aria-label="copy('相关档案', 'Related records')">
              <button v-for="related in visibleRelations(item)" :key="related.id" type="button" @click="openRelated(related)">{{ recordName(related) }}</button>
            </div>
            <small>{{ copy('核验', 'Verified') }} {{ item.verifiedAt }} · {{ recordSources(item).map(recordName).join(' / ') }}</small>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.lore-page, .lore-page * { letter-spacing: 0; }
.lore-page { min-width: 0; }
.lore-hero { min-height: 31rem; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(22rem, .95fr); position: relative; overflow: hidden; margin: -1.75rem calc(50% - 50vw) 0; padding: 5.5rem max(1.25rem, calc((100vw - 1200px) / 2)) 4.5rem; border-bottom: 1px solid var(--line-soft); background: linear-gradient(100deg, #080d18 0%, #101725 52%, #15191e 100%); }
.lore-hero::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 72% 35%, rgba(232,193,90,.12), transparent 30%), linear-gradient(90deg, transparent 0 49%, rgba(255,255,255,.035) 49% 49.15%, transparent 49.15%); }
.hero-copy { position: relative; z-index: 2; align-self: center; max-width: 43rem; }
.eyebrow, .section-heading>p, .section-heading>div>p, .collection-head>div>p, .timeline-body header p, .release-list article>div>p, .record-card header p { color: var(--gold); font: 600 .68rem var(--font-cn); text-transform: uppercase; }
.hero-copy h1 { max-width: 42rem; margin: .65rem 0 1.1rem; font-family: var(--font-cn); font-size: 3.35rem; line-height: 1.08; text-wrap: balance; }
.hero-summary { max-width: 39rem; font-size: 1rem; line-height: 1.95; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-top: 1.8rem; }
.primary-action, .text-action { min-height: 2.75rem; padding: .65rem 1rem; border: 1px solid var(--line); border-radius: 4px; background: rgba(232,193,90,.1); color: var(--gold-bright); font: 600 .8rem var(--font-cn); cursor: pointer; transition: background .2s, border-color .2s, transform .2s; }
.primary-action:hover { background: rgba(232,193,90,.18); border-color: var(--gold); }
.text-action { min-height: auto; padding: .4rem 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--text-sub); }
.text-action:hover { color: var(--text-main); border-color: var(--gold); }
.hero-stats { display: flex; gap: 2rem; margin-top: 2.4rem; }
.hero-stats div { display: grid; gap: .1rem; }
.hero-stats dt { color: var(--text-main); font: 600 1.4rem var(--font-en); font-variant-numeric: tabular-nums; }
.hero-stats dd { color: var(--text-dim); font-size: .68rem; }
.guardian-visual { position: relative; z-index: 1; min-height: 24rem; margin: 0; align-self: end; }
.guardian { position: absolute; bottom: -5rem; width: 58%; height: 31rem; object-fit: contain; object-position: bottom; filter: saturate(.78) contrast(1.05) drop-shadow(0 1.5rem 2rem rgba(0,0,0,.58)); }
.guardian.titan { left: -2%; z-index: 1; transform: translateX(-8%) scale(.88); opacity: .72; }
.guardian.hunter { left: 21%; z-index: 3; }
.guardian.warlock { right: -4%; z-index: 2; transform: translateX(8%) scale(.92); opacity: .8; }
.lore-tabs { position: sticky; top: 4.4rem; z-index: 8; display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); margin: 0 0 1rem; border-bottom: 1px solid var(--line-soft); background: rgba(6,10,20,.92); backdrop-filter: blur(14px); }
.lore-tabs button { min-height: 3.45rem; padding: .7rem .5rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--text-dim); font: 500 .78rem var(--font-cn); cursor: pointer; transition: color .2s, border-color .2s, background .2s; }
.lore-tabs button:hover { color: var(--text-main); background: rgba(255,255,255,.025); }
.lore-tabs button.active { color: var(--gold-bright); border-bottom-color: var(--gold); }
.spoiler-strip { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1.1rem 0 3.3rem; padding: .8rem 0; border-bottom: 1px solid var(--line-soft); }
.spoiler-strip>div { display: flex; align-items: baseline; gap: .65rem; }
.control-label { color: var(--text-dim); font-size: .7rem; }
.spoiler-strip strong { color: var(--text-main); font-size: .78rem; }
.spoiler-select { width: 12rem; min-width: 0; }
.overview-section { margin: 0 0 5rem; }
.section-heading { margin-bottom: 1.8rem; }
.section-heading h2, .collection-head h2 { margin: .35rem 0 0; font-family: var(--font-cn); font-size: 1.85rem; line-height: 1.25; }
.split-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; }
.primer-list { list-style: none; border-top: 1px solid var(--line-soft); }
.primer-list li { display: grid; grid-template-columns: 3.25rem minmax(0,1fr) auto; gap: 1rem; align-items: center; min-height: 7.2rem; padding: 1.15rem .4rem; border-bottom: 1px solid var(--line-soft); }
.primer-list li>span { align-self: start; color: var(--gold-dim); font: 500 .75rem var(--font-en); font-variant-numeric: tabular-nums; }
.primer-list h3 { margin: 0 0 .3rem; font-family: var(--font-cn); font-size: 1rem; }
.primer-list p { max-width: 48rem; font-size: .82rem; line-height: 1.8; }
.primer-list button, .relations button, .lore-empty button { padding: .42rem .65rem; border: 1px solid var(--line-soft); border-radius: 3px; background: transparent; color: var(--text-sub); font: 500 .72rem var(--font-cn); cursor: pointer; transition: color .2s, border-color .2s, background .2s; }
.primer-list button:hover, .relations button:hover, .lore-empty button:hover { color: var(--gold-bright); border-color: var(--line); background: rgba(232,193,90,.06); }
.anchor-track { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); border: 1px solid var(--line-soft); border-radius: 6px; overflow: hidden; }
.anchor-track button { display: grid; align-content: space-between; gap: 1.4rem; min-height: 10rem; padding: 1rem; text-align: left; border: 0; border-right: 1px solid var(--line-soft); background: #0b111d; color: var(--text-main); cursor: pointer; transition: background .2s, color .2s; }
.anchor-track button:last-child { border-right: 0; }
.anchor-track button:hover { background: var(--bg-card); }
.anchor-track span { color: var(--gold-dim); font: .68rem var(--font-en); }
.anchor-track strong { align-self: end; font: 600 .82rem var(--font-cn); line-height: 1.45; }
.anchor-track small { color: var(--text-dim); font-size: .64rem; }
.hidden-note { margin: 1rem 0; padding: .75rem .9rem; border-left: 2px solid var(--gold-dim); background: rgba(232,193,90,.045); color: var(--text-dim); font-size: .75rem; }
.collection-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 0 0 1.4rem; }
.collection-head>span { color: var(--text-dim); font: .78rem var(--font-en); font-variant-numeric: tabular-nums; }
.filter-bar { display: grid; grid-template-columns: minmax(14rem,1fr) repeat(2, minmax(10rem,14rem)); gap: .75rem; margin-bottom: 1.5rem; }
.filter-bar .ant-select { width: 100%; min-width: 0; }
.lore-search { width: 100%; }
.record-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
.record-card { display: flex; flex-direction: column; min-height: 18rem; padding: 1.4rem; border: 1px solid var(--line-soft); border-top: 2px solid #596477; border-radius: 6px; background: #0c1320; transition: border-color .2s, background .2s, transform .2s; }
.record-card:hover { border-color: rgba(232,193,90,.3); background: #101927; transform: translateY(-2px); }
.record-card.alignment-allied { border-top-color: #7da58b; }
.record-card.alignment-hostile { border-top-color: #aa6868; }
.record-card.alignment-contested { border-top-color: #aa935c; }
.record-card.alignment-independent { border-top-color: #678ca1; }
.record-card header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.record-card header h3 { margin: .3rem 0 0; font-family: var(--font-cn); font-size: 1.18rem; }
.record-card header>span { flex: 0 0 auto; padding: .22rem .45rem; border: 1px solid var(--line-soft); border-radius: 3px; color: var(--text-dim); font-size: .64rem; }
.aliases { margin-top: .55rem; color: var(--text-dim); font-size: .69rem; }
.record-summary { margin: 1rem 0 1.25rem; max-width: 65ch; font-size: .82rem; line-height: 1.85; text-wrap: pretty; }
.character-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0 0 1rem; }
.character-meta div { border-left: 1px solid var(--line); padding-left: .7rem; }
.character-meta dt { color: var(--text-dim); font-size: .62rem; }
.character-meta dd { margin: .18rem 0 0; color: var(--text-sub); font-size: .72rem; }
.record-footer { display: grid; gap: .85rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--line-soft); }
.record-footer small { color: var(--text-dim); font-size: .62rem; line-height: 1.7; }
.relations { display: flex; flex-wrap: wrap; gap: .4rem; }
.timeline-list { position: relative; max-width: 62rem; margin: 0 auto; }
.timeline-list::before { content: ''; position: absolute; top: 1.4rem; bottom: 2rem; left: 1.3rem; width: 1px; background: linear-gradient(var(--gold), rgba(232,193,90,.08)); }
.timeline-entry { display: grid; grid-template-columns: 2.7rem minmax(0,1fr); gap: 1.2rem; position: relative; padding: 0 0 3rem; }
.timeline-marker { position: relative; z-index: 1; width: 2.7rem; height: 2.7rem; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--bg-deep); color: var(--gold); font: .65rem var(--font-en); }
.timeline-body { min-width: 0; padding: .2rem 0 0; }
.timeline-body header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.timeline-body header h3 { margin: .25rem 0 0; font-family: var(--font-cn); font-size: 1.35rem; }
.timeline-body header>span { color: var(--text-dim); font-size: .68rem; text-align: right; }
.causality { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0 0 1.2rem; }
.causality div { padding: .8rem 0; border-top: 1px solid var(--line-soft); }
.causality dt { color: var(--gold-dim); font-size: .66rem; }
.causality dd { margin: .35rem 0 0; color: var(--text-sub); font-size: .75rem; line-height: 1.75; }
.release-list { border-top: 1px solid var(--line-soft); }
.release-list article { display: grid; grid-template-columns: 5rem minmax(13rem,1.15fr) minmax(10rem,.8fr) minmax(12rem,1fr); gap: 1.2rem; align-items: center; min-height: 7rem; padding: 1rem .35rem; border-bottom: 1px solid var(--line-soft); }
.release-list time { color: var(--gold); font: 500 1rem var(--font-en); font-variant-numeric: tabular-nums; }
.release-list h3 { margin: .2rem 0; font-family: var(--font-cn); font-size: 1rem; }
.release-list strong { color: var(--text-sub); font-size: .72rem; font-weight: 500; }
.release-provenance { display: block; margin-top: .45rem; color: var(--text-dim); font-size: .6rem; }
.release-list article>p { font-size: .75rem; }
.lore-empty { padding: 4rem 1rem; text-align: center; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
.lore-empty strong { font: 600 1rem var(--font-cn); }
.lore-empty p { margin: .5rem 0 1.2rem; font-size: .8rem; }
.timeline-entry:focus-visible, .record-card:focus-visible, .release-list article:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; }

@media (max-width: 900px) {
  .lore-hero { grid-template-columns: minmax(0,1fr) 19rem; padding-top: 4.5rem; }
  .hero-copy h1 { font-size: 2.7rem; }
  .guardian-visual { min-height: 22rem; }
  .guardian { width: 68%; height: 27rem; }
  .lore-tabs { grid-template-columns: repeat(3, minmax(0,1fr)); position: static; }
  .anchor-track { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .anchor-track button { border-bottom: 1px solid var(--line-soft); }
  .filter-bar { grid-template-columns: minmax(0,1fr) repeat(2, minmax(9rem,12rem)); }
  .release-list article { grid-template-columns: 4rem 1fr 1fr; }
  .release-list .relations { grid-column: 2 / -1; }
}

@media (max-width: 680px) {
  .lore-hero { min-height: 38rem; grid-template-columns: 1fr; padding-top: 3.3rem; padding-bottom: 0; }
  .hero-copy { align-self: start; }
  .hero-copy h1 { font-size: 2.15rem; }
  .hero-summary { font-size: .88rem; line-height: 1.8; }
  .hero-stats { gap: 1.25rem; margin-top: 1.5rem; }
  .guardian-visual { min-height: 15rem; margin-top: -1rem; opacity: .72; }
  .guardian { bottom: -5rem; height: 21rem; }
  .lore-tabs button { min-height: 3rem; font-size: .7rem; }
  .spoiler-strip { margin-bottom: 2.5rem; }
  .spoiler-strip>div { display: grid; gap: .1rem; }
  .spoiler-select { width: 10.5rem; }
  .section-heading h2, .collection-head h2 { font-size: 1.45rem; }
  .overview-section { margin-bottom: 3.5rem; }
  .primer-list li { grid-template-columns: 2rem minmax(0,1fr); }
  .primer-list li>button { grid-column: 2; justify-self: start; }
  .split-heading { align-items: start; }
  .anchor-track { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .anchor-track button { min-height: 8rem; }
  .filter-bar { grid-template-columns: 1fr; }
  .filter-bar .ant-select { width: 100%; }
  .record-grid { grid-template-columns: 1fr; }
  .record-card { min-height: 0; padding: 1.1rem; }
  .timeline-list::before { left: .95rem; }
  .timeline-entry { grid-template-columns: 2rem minmax(0,1fr); gap: .8rem; }
  .timeline-marker { width: 2rem; height: 2rem; }
  .timeline-body header { display: block; }
  .timeline-body header>span { display: block; margin-top: .4rem; text-align: left; }
  .causality { grid-template-columns: 1fr; gap: .25rem; }
  .release-list article { grid-template-columns: 3.5rem minmax(0,1fr); align-items: start; }
  .release-list article>p, .release-list .relations { grid-column: 2; }
}

@media (max-width: 390px) {
  .hero-copy h1 { font-size: 1.85rem; }
  .hero-stats { gap: .8rem; }
  .lore-tabs { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .spoiler-strip { align-items: stretch; }
  .spoiler-select { width: 9.5rem; }
  .anchor-track { grid-template-columns: 1fr; }
  .anchor-track button { border-right: 0; }
  .collection-head { align-items: start; }
}
</style>
