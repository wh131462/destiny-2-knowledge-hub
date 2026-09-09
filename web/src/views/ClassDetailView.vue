<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { classes, stats } from '@/data/classes'
import { sources } from '@/data/v2'
import ElementBadge from '@/components/ElementBadge.vue'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import SubclassSkillCatalog from '@/components/SubclassSkillCatalog.vue'
import { useI18n, localized } from '@/i18n'

const { locale } = useI18n()

const route = useRoute()
const router = useRouter()

const classObj = computed(() => classes.find(c => c.id === route.params.classId))

const activeEl = ref(route.query.el || classObj.value?.subclasses[0]?.element || 'solar')

watch(() => route.query.el, (v) => {
  if (v) activeEl.value = v
})

const activeSub = computed(() => classObj.value?.subclasses.find(s => s.element === activeEl.value))
const prismaticSource = sources.find(source => source.id === 'bungie-final-shape')

function selectSubclass(element) {
  activeEl.value = element
  router.replace({ query: { ...route.query, el: element } })
}
</script>

<template>
  <div v-if="classObj">
    <router-link to="/classes" class="back">← 返回职业百科</router-link>

    <div class="class-hero" :style="{ borderColor: classObj.color }">
      <div class="class-icon" :style="{ borderColor: classObj.color, color: classObj.color }">
        {{ classObj.name[0] }}
      </div>
      <div>
        <h1>{{ localized(classObj) }} <span v-if="locale === 'zh'" class="en">{{ classObj.en }}</span></h1>
        <p class="role">{{ classObj.role }}</p>
        <p class="desc">{{ classObj.desc }}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="panel">
        <h3>职业技能</h3>
        <p>{{ classObj.classAbility }}</p>
        <h3>职业特长</h3>
        <ul class="tight">
          <li v-for="t in classObj.traits" :key="t">{{ t }}</li>
        </ul>
        <h3>属性倾向</h3>
        <p>{{ classObj.stats.join(' → ') }}</p>
      </div>

      <div class="panel">
        <h3>子职业选择</h3>
        <div class="el-tabs">
          <button
            v-for="s in classObj.subclasses"
            :key="s.element"
            class="el-tab"
            :class="[{ active: activeEl === s.element }]"
            @click="selectSubclass(s.element)"
          >
            <ElementBadge :element="s.element" />
            <span class="branch">{{ s.branch }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeSub" class="panel sub-detail" :class="{ 'prismatic-detail': activeSub.type === 'prismatic' }">
      <div class="sub-head">
        <ElementBadge :element="activeSub.element" />
        <h2>{{ activeSub.branch }}</h2>
        <span class="badge blue">{{ localized(classObj) }}：{{ activeSub.type === 'prismatic' ? '跨元素子职业' : activeSub.element }}</span>
      </div>

      <div v-if="activeSub.type !== 'prismatic'" class="detail-grid">
        <div class="detail-col">
          <h4>超能力 Super</h4>
          <p class="super">{{ activeSub.super }}</p>
          <h4>定位</h4>
          <p>{{ activeSub.focus }}</p>
          <h4>天赋 Aspects</h4>
          <div class="aspects">
            <span v-for="a in activeSub.aspects" :key="a" class="aspect">{{ a }}</span>
          </div>
        </div>
        <div class="detail-col">
          <h4>推荐构筑方向</h4>
          <div class="build-suggest">
            {{ activeSub.build }}
          </div>
        </div>
      </div>

      <template v-else>
        <section class="prism-intro">
          <div>
            <p class="eyebrow">PRISMATIC / CLASS SUBCLASS</p>
            <h3>{{ locale === 'en' ? `Prismatic ${classObj.en}` : `${classObj.name}的棱镜分支` }}</h3>
            <p>{{ locale === 'en' ? 'Prismatic is not a sixth element. It combines a class-specific selection of Light and Darkness abilities, then connects both sides through Transcendence.' : '棱镜不是第六种元素，而是该职业专属的跨元素子职业：从光能与暗影技能池中组合能力，并通过“超越”连接两侧能量。' }}</p>
          </div>
          <div class="prism-counts">
            <span><b>{{ activeSub.superIds.length }}</b> 超能力</span>
            <span><b>{{ activeSub.meleeIds.length }}</b> 近战</span>
            <span><b>{{ activeSub.grenadeIds.length }}</b> 手雷</span>
            <span><b>{{ activeSub.aspectIds.length }}</b> 星相</span>
          </div>
        </section>


        <section class="transcendence">
          <div>
            <p class="eyebrow">TRANSCENDENCE</p>
            <h3>{{ locale === 'en' ? 'Transcendence is more than a Super' : '超越不是普通大招' }}</h3>
            <p>{{ locale === 'en' ? 'Light and Darkness damage fill opposite sides of the meter. Fill both to enter Transcendence and gain enhanced ability regeneration plus a class-specific grenade.' : '造成光能与暗影伤害会分别填充两侧能量；两侧充满后进入超越，获得强化技能回复，并暂时使用职业专属超越手雷。' }}</p>
          </div>
          <div class="trans-grenade">
            <span>{{ localized(classObj) }}专属</span>
            <strong>{{ localized(activeSub.transcendenceGrenade) }}</strong>
            <small v-if="locale === 'zh'">{{ activeSub.transcendenceGrenade.en }}</small>
          </div>
        </section>


        <footer class="source-note">
          <ConfidenceBadge level="A" />
          <p>技能池和棱镜体系以本地 Bungie Manifest 快照及《终焉之形》官方资料为基线；平衡更新后仍需重新核验。</p>
          <a v-if="prismaticSource?.url" :href="prismaticSource.url" target="_blank" rel="noreferrer">查看官方入口 ↗</a>
        </footer>
      </template>
    </div>

    <SubclassSkillCatalog v-if="activeSub" :key="activeSub.id" :subclass="activeSub" />
    <div class="note">
      属性快捷参考：
      <span v-for="s in stats.slice(0, 3)" :key="s.key" class="stat-chip">{{ s.name }}</span>
      （详情见防具与套装页）
    </div>
  </div>

  <div v-else class="empty">未找到该职业</div>
</template>

<style scoped>
.back { font-size: 0.85rem; color: var(--text-sub); }
.back:hover { color: var(--gold-bright); }
.class-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--line-soft);
  border-left-width: 4px;
  border-radius: var(--radius);
  background: linear-gradient(160deg, var(--bg-card), var(--bg-dark));
  margin: 14px 0 18px;
}
.class-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 800;
  background: rgba(255,255,255,0.03);
  flex-shrink: 0;
}
.class-hero .en { font-family: var(--font-en); font-size: 0.9rem; color: var(--gold-dim); letter-spacing: 0.2em; }
.role { color: var(--gold-bright); font-size: 0.9rem; margin: 2px 0 6px; }
.desc { font-size: 0.9rem; line-height: 1.7; }
.info-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 14px; margin-bottom: 16px; }
.el-tabs { display: flex; flex-direction: column; gap: 8px; }
.el-tab {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.02);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-cn);
}
.el-tab:hover { border-color: var(--line); }
.el-tab.active { border-color: var(--gold-dim); background: rgba(232,193,90,0.08); }
.el-tab .branch { font-size: 0.9rem; font-weight: 600; }
.sub-detail { margin-bottom: 16px; }
.sub-detail.prismatic-detail { border-color: rgba(180,107,255,.32); background: radial-gradient(circle at 92% 5%, rgba(180,107,255,.12), transparent 28%), linear-gradient(155deg, rgba(15,22,37,.96), rgba(9,14,27,.94)); }
.sub-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.sub-head h2 { margin: 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-col h4 { color: var(--gold-dim); font-family: var(--font-cn); font-size: 0.8rem; letter-spacing: 0.1em; margin-bottom: 8px; }
.super { font-size: 1rem; color: var(--text-main); margin-bottom: 14px; }
.aspects { display: flex; flex-wrap: wrap; gap: 8px; }
.aspect {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 0.78rem;
  color: var(--gold-bright);
}
.build-suggest {
  background: rgba(77,184,255,0.05);
  border: 1px solid rgba(77,184,255,0.2);
  border-radius: 10px;
  padding: 14px;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-sub);
}
.stat-chip {
  display: inline-block;
  margin: 0 4px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(232,193,90,0.1);
  border: 1px solid var(--line);
  color: var(--gold-bright);
  font-size: 0.78rem;
}
.eyebrow { color: var(--gold-dim); font: 600 .66rem var(--font-en); letter-spacing: .2em; }
.prism-intro { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: end; padding: 18px 0 22px; border-top: 1px solid rgba(180,107,255,.22); }
.prism-intro h3, .transcendence h3, .facet-title h3 { margin: 5px 0 8px; font-family: var(--font-cn); }
.prism-intro p:not(.eyebrow), .transcendence p:not(.eyebrow) { color: var(--text-sub); font-size: .86rem; line-height: 1.75; }
.prism-counts { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--line-soft); }
.prism-counts span { display: flex; align-items: baseline; gap: 7px; padding: 11px; color: var(--text-dim); font-size: .7rem; border-right: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
.prism-counts span:nth-child(2n) { border-right: 0; }
.prism-counts span:nth-last-child(-n+2) { border-bottom: 0; }
.prism-counts b { color: var(--gold-bright); font: 700 1.15rem var(--font-en); }
.pool-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pool-block { padding: 18px; border-top: 1px solid var(--line); background: rgba(5,10,20,.42); }
.pool-block h3 { margin: 0 0 14px; font-family: var(--font-cn); font-size: .9rem; }
.pool-block h3 small { margin-left: 6px; color: var(--text-dim); font: .58rem var(--font-en); letter-spacing: .12em; }
.aspects-block { grid-column: 1 / -1; }
.ability-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.ability-list li { display: grid; grid-template-columns: 7px minmax(0,1fr) auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line-soft); }
.ability-list li:last-child { border-bottom: 0; }
.ability-list b { font-size: .78rem; }
.ability-list span, .prism-aspects span { color: var(--text-dim); font: .62rem var(--font-en); }
.element-mark { width: 6px; height: 6px; background: var(--text-dim); transform: rotate(45deg); }
.element-mark.solar { background: var(--solar); }.element-mark.arc { background: var(--arc); }.element-mark.void { background: var(--void); }.element-mark.stasis { background: var(--stasis); }.element-mark.strand { background: var(--strand); }
.prism-aspects { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 1px; background: var(--line-soft); }
.prism-aspects div { display: grid; grid-template-columns: 7px minmax(0,1fr); gap: 4px 9px; align-content: start; padding: 13px; background: var(--bg-dark); }
.prism-aspects span { grid-column: 2; }
.transcendence { display: grid; grid-template-columns: 1.45fr 1fr; align-items: center; gap: 24px; margin: 18px 0; padding: 20px; border-left: 3px solid #ba7cff; background: linear-gradient(90deg, rgba(180,107,255,.11), rgba(77,184,255,.04)); }
.trans-grenade { padding: 16px; border: 1px solid rgba(180,107,255,.3); }
.trans-grenade span, .trans-grenade small { display: block; color: var(--text-dim); font-size: .68rem; }
.trans-grenade strong { display: block; margin: 4px 0; font-size: 1.15rem; }
.facet-section { margin-top: 24px; }
.facet-title { display: flex; justify-content: space-between; align-items: end; gap: 18px; margin-bottom: 8px; }
.facet-title span { color: var(--gold-dim); font: .65rem var(--font-en); letter-spacing: .15em; }
.facet-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
.facet-list article { display: grid; grid-template-columns: 26px 1fr; gap: 10px; padding: 12px 0; border-top: 1px solid var(--line-soft); }
.facet-index { color: var(--gold-dim); font: .62rem var(--font-en); }
.facet-list h4 { margin: 0; font-family: var(--font-cn); font-size: .82rem; }
.facet-list small { color: var(--text-dim); font-size: .62rem; }
.facet-list p { margin-top: 4px; color: var(--text-sub); font-size: .76rem; line-height: 1.55; }
.source-note { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line-soft); }
.source-note p { flex: 1; color: var(--text-dim); font-size: .72rem; }
.source-note a { color: var(--gold-bright); font-size: .72rem; white-space: nowrap; }
@media (max-width: 700px) {
  .info-grid, .detail-grid, .prism-intro, .pool-layout, .transcendence { grid-template-columns: 1fr; }
  .aspects-block { grid-column: auto; }
  .prism-aspects, .facet-list { grid-template-columns: 1fr; }
  .source-note { align-items: flex-start; flex-direction: column; }
}
</style>
