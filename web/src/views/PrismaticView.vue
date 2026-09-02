<script setup>
import { ref, computed } from 'vue'
import { classesV2, subclasses, abilityById, aspectById, facets, sources } from '@/data/v2'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const activeClass = ref('titan')
const active = computed(() => subclasses.find(item => item.id === `${activeClass.value}-prismatic`))
const className = computed(() => localized(classesV2.find(item => item.id === activeClass.value)))

const list = (ids) => ids.map(id => abilityById[id] || aspectById[id]).filter(Boolean)
</script>

<template>
  <div class="prismatic-page">
    <header class="page-head prism-head">
      <div>
        <p class="eyebrow">SUBCLASS SYSTEM / VERIFIED BASELINE</p>
        <h1>{{ t('pages.prismatic.title') }}</h1>
        <p>{{ t('pages.prismatic.subtitle') }}</p>
      </div>
      <div class="prism-mark" aria-hidden="true"><span></span></div>
    </header>

    <div class="class-switch" role="tablist" :aria-label="t('pages.prismatic.chooseClass')">
      <button v-for="item in classesV2" :key="item.id" :class="{ active: activeClass === item.id }" role="tab" :aria-selected="activeClass === item.id" @click="activeClass = item.id">
        <small v-if="locale === 'zh'">{{ item.en }}</small>{{ localized(item) }}
      </button>
    </div>

    <section class="system-summary">
      <div><span>{{ t('pages.prismatic.current') }}</span><strong>{{ localized(active) }}</strong></div>
      <div><span>{{ t('pages.prismatic.supers') }}</span><strong>{{ active.superIds.length }}</strong></div>
      <div><span>{{ t('pages.prismatic.melee') }}</span><strong>{{ active.meleeIds.length }}</strong></div>
      <div><span>{{ t('pages.prismatic.grenades') }}</span><strong>{{ active.grenadeIds.length }}</strong></div>
      <div><span>{{ t('pages.prismatic.aspects') }}</span><strong>{{ active.aspectIds.length }}</strong></div>
    </section>

    <section class="pool-layout">
      <article class="pool-block">
        <div class="block-title"><span>01</span><h2>{{ className }}超能力</h2></div>
        <ul><li v-for="item in list(active.superIds)" :key="item.id"><i :class="item.element"></i><b>{{ localized(item) }}</b><span v-if="locale === 'zh'">{{ item.en }}</span></li></ul>
      </article>
      <article class="pool-block">
        <div class="block-title"><span>02</span><h2>{{ t('pages.prismatic.meleeAndGrenade') }}</h2></div>
        <ul><li v-for="item in list([...active.meleeIds, ...active.grenadeIds])" :key="item.id"><i :class="item.element"></i><b>{{ localized(item) }}</b><span v-if="locale === 'zh'">{{ item.en }}</span></li></ul>
      </article>
      <article class="pool-block wide">
        <div class="block-title"><span>03</span><h2>{{ t('pages.prismatic.classAspects') }}</h2></div>
        <div class="aspect-grid"><div v-for="item in list(active.aspectIds)" :key="item.id"><i :class="item.element"></i><strong>{{ localized(item) }}</strong><span v-if="locale === 'zh'">{{ item.en }}</span></div></div>
      </article>
    </section>

    <section class="transcendence">
      <div><p class="eyebrow">TRANSCENDENCE</p><h2>{{ locale === 'en' ? 'Transcendence is more than a Super' : '超越不是普通大招' }}</h2><p>{{ locale === 'en' ? 'Light and Darkness damage fill opposite sides of the meter. Fill both to enter Transcendence and gain enhanced ability regeneration, weapon damage, and a class-specific grenade.' : '造成光能与暗影伤害分别填充两侧能量。两侧同时完成后进入超越，获得强化技能回复、武器伤害与职业专属超越手雷。' }}</p></div>
      <div class="trans-grenade"><span>{{ className }}{{ locale === 'en' ? ' exclusive' : '专属' }}</span><strong>{{ localized(active.transcendenceGrenade) }}</strong><small v-if="locale === 'zh'">{{ active.transcendenceGrenade.en }}</small></div>
    </section>

    <section>
      <div class="section-title"><h2>{{ t('pages.prismatic.facet') }}</h2><span class="en">21 FACETS</span></div>
      <div class="facet-list">
        <article v-for="item in facets" :key="item.id"><span class="index">{{ String(facets.indexOf(item) + 1).padStart(2, '0') }}</span><div><h3>{{ localized(item) }}</h3><small v-if="locale === 'zh'">{{ item.en }}</small><p>{{ item.description }}</p></div></article>
      </div>
    </section>

    <footer class="source-note">
      <ConfidenceBadge level="A" />
      <p>技能池和棱镜体系以 Bungie 官方清单与《终焉之形》资料为基线。每次平衡更新仍需重新核验。</p>
      <a :href="sources[0].url" target="_blank" rel="noreferrer">查看官方入口 ↗</a>
    </footer>
  </div>
</template>

<style scoped>
.prism-head { display: grid; grid-template-columns: 1fr auto; align-items: center; min-height: 19rem; padding: 3rem; border: 1px solid var(--line-soft); background: radial-gradient(circle at 85% 25%, rgba(187,120,255,.2), transparent 28%), radial-gradient(circle at 72% 75%, rgba(83,199,255,.14), transparent 35%), #0b1020; overflow: hidden; }
.page-head p:not(.eyebrow) { max-width: 46rem; margin-top: 1rem; }
.eyebrow { color: var(--gold-dim); font: 600 .7rem var(--font-en); letter-spacing: .24em; }
.prism-mark { width: 10rem; aspect-ratio: 1; border: 1px solid rgba(255,255,255,.22); transform: rotate(45deg); display: grid; place-items: center; box-shadow: 0 0 60px rgba(180,107,255,.18); }
.prism-mark span { width: 55%; aspect-ratio: 1; border: 1px solid var(--gold); box-shadow: inset 0 0 25px rgba(232,193,90,.18); }
.class-switch { display: grid; grid-template-columns: repeat(3,1fr); border-bottom: 1px solid var(--line-soft); }
.class-switch button { padding: 1.2rem; border: 0; border-right: 1px solid var(--line-soft); background: transparent; color: var(--text-sub); cursor: pointer; font: 600 1rem var(--font-cn); }
.class-switch button small { display: block; color: var(--text-dim); font: .6rem var(--font-en); letter-spacing: .2em; }
.class-switch button.active { color: var(--gold-bright); background: rgba(232,193,90,.06); box-shadow: inset 0 -2px var(--gold); }
.system-summary { display: grid; grid-template-columns: repeat(5,1fr); margin: 2rem 0; border: 1px solid var(--line-soft); }
.system-summary div { padding: 1rem; border-right: 1px solid var(--line-soft); }
.system-summary span { display: block; color: var(--text-dim); font-size: .72rem; }
.system-summary strong { font: 700 1.25rem var(--font-en); }
.pool-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.pool-block { padding: 1.5rem; background: rgba(15,22,37,.82); border-top: 1px solid var(--line); }
.pool-block.wide { grid-column: 1/-1; }
.block-title { display: flex; gap: .8rem; align-items: baseline; margin-bottom: 1.2rem; }
.block-title span { color: var(--gold-dim); font: .7rem var(--font-en); }.block-title h2{margin:0}
.pool-block ul { list-style: none; display: grid; gap: .55rem; }
.pool-block li { display: grid; grid-template-columns: .5rem 1fr auto; gap: .75rem; align-items: center; padding: .65rem 0; border-bottom: 1px solid var(--line-soft); }
.pool-block li span,.aspect-grid span { color: var(--text-dim); font: .65rem var(--font-en); }
.pool-block i,.aspect-grid i { width: .42rem; height: .42rem; background: var(--text-dim); transform: rotate(45deg); }.solar{background:var(--solar)!important}.arc{background:var(--arc)!important}.void{background:var(--void)!important}.stasis{background:var(--stasis)!important}.strand{background:var(--strand)!important}
.aspect-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: .6rem; }.aspect-grid div{display:grid;grid-template-columns:.5rem 1fr;gap:.25rem .65rem;padding:1rem;border-left:1px solid var(--line-soft)}.aspect-grid span{grid-column:2}
.transcendence { display:grid;grid-template-columns:1.5fr 1fr;gap:2rem;align-items:center;margin:3rem 0;padding:2rem;border-left:3px solid #ba7cff;background:linear-gradient(90deg,rgba(180,107,255,.11),rgba(77,184,255,.04));}.transcendence h2{margin:.2rem 0}.trans-grenade{padding:1.5rem;border:1px solid rgba(180,107,255,.3)}.trans-grenade span,.trans-grenade small{display:block;color:var(--text-dim)}.trans-grenade strong{display:block;font-size:1.3rem;margin:.3rem 0}
.facet-list { display: grid; grid-template-columns: repeat(2,1fr); gap: 0 2rem; }.facet-list article{display:grid;grid-template-columns:2rem 1fr;gap:1rem;padding:1rem 0;border-top:1px solid var(--line-soft)}.facet-list .index{color:var(--gold-dim);font:.65rem var(--font-en)}.facet-list h3{font-family:var(--font-cn)}.facet-list small{color:var(--text-dim)}.facet-list p{font-size:.84rem;margin-top:.4rem}
.source-note{display:flex;align-items:center;gap:1rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--line-soft)}.source-note p{flex:1;font-size:.8rem}.source-note a{font-size:.8rem}
@media(max-width:760px){.prism-head{grid-template-columns:1fr;padding:1.5rem}.prism-mark{display:none}.system-summary{grid-template-columns:repeat(2,1fr)}.pool-layout,.transcendence{grid-template-columns:1fr}.pool-block.wide{grid-column:auto}.aspect-grid{grid-template-columns:1fr 1fr}.facet-list{grid-template-columns:1fr}.source-note{align-items:flex-start;flex-direction:column}}
</style>
