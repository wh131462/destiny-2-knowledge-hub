<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { classesV2, subclasses, activitiesV2, curatedBuilds, recommendBuilds, auditRecommendationData, gearById, abilityById, aspectById, facetById, mechanicById, calculateStats, scoreBuild, validateBuild } from '@/data/v2'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import StatGrid from '@/components/StatGrid.vue'
import { useOwnedItems } from '@/composables/useOwnedItems'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const classId = ref('')
const activityId = ref('')
const goal = ref('')
const subclassType = ref('all')
const subclassId = ref('')
const { ownedSet } = useOwnedItems()
const { iconFor, weaponItems } = useManifestAssets()
const officialAcquisition = ref(null)
const selectedWeaponId = ref('')
onMounted(async () => {
  try {
    const response = await fetch('/data/acquisition-sources.json')
    if (response.ok) officialAcquisition.value = await response.json()
  } catch {
    officialAcquisition.value = null
  }
})

const goalOptions = [
  { id: '', name: '综合表现' }, { id: 'survivability', name: '生存' }, { id: 'addClear', name: '清怪' },
  { id: 'control', name: '控场' }, { id: 'bossDamage', name: '首领输出' }, { id: 'support', name: '团队辅助' }
]

const results = computed(() => recommendBuilds({
  classId: classId.value,
  subclassId: subclassId.value,
  subclassType: subclassType.value === 'all' ? '' : subclassType.value,
  activityId: activityId.value,
  goals: goal.value ? [goal.value] : []
  ,ownedItemIds: [...ownedSet.value], strict: true
}))

const subclassOptions = computed(() => subclasses.filter(item =>
  (!classId.value || item.classId === classId.value) &&
  (subclassType.value === 'all' || (subclassType.value === 'prismatic' ? item.type === 'prismatic' : item.type === 'mono'))
))
watch([classId, subclassType], () => {
  if (subclassId.value && !subclassOptions.value.some(item => item.id === subclassId.value)) subclassId.value = ''
})

const gearName = id => localized(gearById[id]) || id
const abilityName = id => localized(abilityById[id]) || id
const aspectName = id => localized(aspectById[id]) || id
const facetName = id => localized(facetById[id]) || id
const mechanicName = id => localized(mechanicById[id]) || id
const officialFor = id => officialAcquisition.value?.items?.find(item => item.id === id) || null
const ownership = build => {
  const ids = [build.armorSetId, build.exoticArmorId, ...build.weapons.map(item => item.itemId)]
  const count = ids.filter(id => ownedSet.value.has(id)).length
  return { count, total: ids.length }
}
const dataAudit = build => auditRecommendationData(build)

const weaponOptions = computed(() => weaponItems.value)
const selectedWeapon = computed(() => weaponOptions.value.find(item => String(item.hash) === String(selectedWeaponId.value)) || gearById[selectedWeaponId.value] || null)
const matchingBuilds = computed(() => selectedWeaponId.value
  ? curatedBuilds.filter(build => build.weapons.some(item => {
    const gear = gearById[item.itemId]
    return gear && selectedWeapon.value && (gear.en === selectedWeapon.value.name || gear.name === selectedWeapon.value.nameZh)
  }))
  : [])

const weaponSlotLabels = { kinetic: '动能槽', energy: '能量槽', power: '重型槽' }
const weaponRecommendations = computed(() => {
  if (!selectedWeapon.value) return []
  const sourceIds = new Set(matchingBuilds.value.flatMap(build => build.weapons.map(item => gearById[item.itemId]?.en).filter(Boolean)))
  return ['kinetic', 'energy', 'power']
    .filter(slot => slot !== selectedWeapon.value.slot)
    .map(slot => {
      const candidates = weaponOptions.value
        .filter(item => item.ammoSlot === slot && item.hash !== selectedWeapon.value.hash)
        .map(item => {
          const sameElement = item.damageType && selectedWeapon.value.damageType && item.damageType === selectedWeapon.value.damageType
          const score = (sourceIds.has(item.name) ? 12 : 0) + (sameElement ? 5 : 0) + (item.vendorSources?.length || item.activitySources?.length ? 2 : 0)
          return { item, score, path: item.vendorSources?.[0] || item.activitySources?.[0] || null }
        })
        .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
        .slice(0, 3)
      return { slot, label: weaponSlotLabels[slot], candidates }
    })
})

const loadoutWeapons = build => build.weapons.map(item => ({ ...item, gear: gearById[item.itemId] })).filter(item => item.gear)
const icon = item => iconFor(item)
const candidateKey = item => String(item.hash)
const acquisitionLabel = candidate => {
  if (candidate.path?.vendorName) return `${candidate.path.vendorName}：Manifest 官方供应商`
  if (candidate.path?.activityName) return `${candidate.path.activityName}：Manifest 官方活动`
  return '官方实体已确认：获取路径待核验'
}
</script>

<template>
  <div>
    <header class="lab-head">
      <div><p class="eyebrow">BUILD LAB / RULES ENGINE 2.1</p><h1>{{ t('pages.buildLab.title') }}</h1><p>{{ t('pages.buildLab.subtitle') }}</p></div>
      <router-link to="/prismatic" class="prism-link">先了解棱镜系统 <span>↗</span></router-link>
    </header>

    <section class="query-panel" aria-label="构筑筛选条件">
      <fieldset><legend>01. {{ locale === 'en' ? 'Class' : '职业' }}</legend><div class="options"><button :class="{active:!classId}" @click="classId=''">{{ t('common.all') }}</button><button v-for="item in classesV2" :key="item.id" :class="{active:classId===item.id}" @click="classId=item.id">{{ localized(item) }}</button></div></fieldset>
      <fieldset><legend>02. 子职业系统</legend><a-select v-model:value="subclassType" class="lab-select" aria-label="子职业系统"><a-select-option value="all">普通 + 棱镜</a-select-option><a-select-option value="prismatic">只看棱镜</a-select-option><a-select-option value="mono">只看普通元素</a-select-option></a-select></fieldset>
      <fieldset><legend>03. 分支</legend><a-select v-model:value="subclassId" class="lab-select" aria-label="子职业分支" allow-clear><a-select-option value="">全部分支</a-select-option><a-select-option v-for="item in subclassOptions" :key="item.id" :value="item.id">{{ item.name }} / {{ item.en }}</a-select-option></a-select></fieldset>
      <fieldset><legend>04. {{ locale === 'en' ? 'Activity' : '活动' }}</legend><a-select v-model:value="activityId" class="lab-select" :aria-label="locale === 'en' ? 'Activity' : '活动'" allow-clear><a-select-option value="">{{ locale === 'en' ? 'All activities' : '全部活动' }}</a-select-option><a-select-option v-for="item in activitiesV2" :key="item.id" :value="item.id">{{ localized(item) }}</a-select-option></a-select></fieldset>
      <fieldset><legend>05. 优先目标</legend><a-select v-model:value="goal" class="lab-select" aria-label="优先目标"><a-select-option v-for="item in goalOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option></a-select></fieldset>
    </section>

    <div class="lab-actions"><router-link to="/manual-loadout" class="workbench-link">打开手动一图流配装 <span>↗</span></router-link><router-link to="/build-workbench" class="workbench-link">打开高级 JSON 工作台 <span>↗</span></router-link></div>

    <section class="weapon-studio" aria-labelledby="weapon-studio-title">
      <div class="studio-heading">
        <div><p class="eyebrow">WEAPON-LED LOADOUT</p><h2 id="weapon-studio-title">从一把武器开始配装</h2><p>指定你想用的武器，系统会按槽位、元素协同和已验证构筑给出搭配，并附上获取入口。</p></div>
        <a-select v-model:value="selectedWeaponId" class="weapon-picker" allow-clear show-search option-filter-prop="label" placeholder="选择一把武器…" aria-label="选择一把武器">
          <a-select-option v-for="item in weaponOptions" :key="item.hash" :value="String(item.hash)" :label="`${item.name} ${item.nameZh || ''}`">{{ item.nameZh || item.name }} <span>{{ item.name }}</span></a-select-option>
        </a-select>
      </div>
      <template v-if="selectedWeapon">
        <div class="weapon-focus">
          <div class="focus-icon"><img v-if="icon(selectedWeapon)" :src="icon(selectedWeapon)" :alt="selectedWeapon.name" /><span v-else>{{ selectedWeapon.name.slice(0, 1) }}</span></div>
          <div><span class="slot-label">{{ weaponSlotLabels[selectedWeapon.ammoSlot || selectedWeapon.slot] || '武器' }} / {{ selectedWeapon.weaponFamily || selectedWeapon.frame || selectedWeapon.ammo || '类型未登记' }}</span><h3>{{ selectedWeapon.nameZh || selectedWeapon.name }}</h3><p>{{ selectedWeapon.name }}：{{ selectedWeapon.weaponFamily || '武器' }}：{{ selectedWeapon.craftable ? '可锻造' : selectedWeapon.vendorSources?.length || selectedWeapon.activitySources?.length ? '官方来源已登记' : '获取路径待核验' }}</p></div>
          <router-link v-if="matchingBuilds.length" :to="`/builds/${matchingBuilds[0].id}`" class="text-action">查看验证构筑 ↗</router-link>
        </div>
        <div class="pairing-heading"><strong>推荐同装配的其他槽位武器</strong><span>{{ matchingBuilds.length ? `基于 ${matchingBuilds.length} 套已验证构筑，并结合武器元素与弹药位排序` : '基于槽位、元素和弹药位排序' }}</span></div>
        <div class="pairing-grid">
          <section v-for="group in weaponRecommendations" :key="group.slot" class="pairing-slot"><header><span>{{ group.label }}</span><small>{{ group.candidates.length }} 个建议</small></header><button v-for="candidate in group.candidates" :key="candidate.item.hash" type="button" class="pairing-item" @click="selectedWeaponId = candidateKey(candidate.item)"><span class="mini-icon"><img v-if="icon(candidate.item)" :src="icon(candidate.item)" :alt="candidate.item.nameZh || candidate.item.name" /><b v-else>{{ (candidate.item.nameZh || candidate.item.name).slice(0, 1) }}</b></span><span class="pairing-copy"><strong>{{ candidate.item.nameZh || candidate.item.name }}</strong><small>{{ candidate.item.weaponFamily || '武器' }} / {{ candidate.item.ammoSlot || '槽位未登记' }}</small><em>{{ acquisitionLabel(candidate) }}</em></span><span class="choose-arrow">›</span></button></section>
        </div>
      </template>
      <div v-else class="weapon-empty"><span>01</span><p>选择一把你已经拥有、或准备获取的武器，开始生成其他槽位建议。</p></div>
    </section>

    <div class="result-line"><span>{{ results.length }} 套合法方案</span><p>匹配结果不会跨职业、跨模式或用模糊文案凑数。</p></div>

    <section v-if="results.length" class="build-list">
      <article v-for="({ build, validation, recommendationScore }, index) in results" :key="build.id" class="build-row">
        <div class="rank"><span>{{ String(index + 1).padStart(2,'0') }}</span><strong>{{ recommendationScore }}</strong><small>场景分</small></div>
        <div class="build-main">
          <div class="build-title"><div><p>{{ localized(classesV2.find(c=>c.id===build.classId)) }}：{{ build.difficulty }}</p><h2>{{ build.name }}</h2></div><div class="title-meta"><span>{{ ownership(build).count }}/{{ ownership(build).total }} {{ locale === 'en' ? 'core items owned' : '核心装备已拥有' }}</span><ConfidenceBadge :level="build.confidence" /></div></div>
          <p class="goal">{{ build.goal }}</p>
            <p v-if="results[index].reasons?.length" class="reasons">推荐依据：{{ results[index].reasons.join('、') }}</p>
          <p v-if="results[index].implementation?.nextSteps?.length" class="next-steps">实现顺序：{{ results[index].implementation.nextSteps.join(' → ') }}</p>
          <div class="recommendation-evidence">
            <span class="readiness" :class="results[index].implementation?.readiness">{{ results[index].implementation?.readiness === 'ready' ? '可直接实现' : `准备度：还缺 ${results[index].implementation?.coreMissingCount || 0} 件` }}</span>
            <span v-if="results[index].implementation?.championGaps?.length" class="gap">冠军缺口：{{ results[index].implementation.championGaps.join('、') }}</span>
            <span v-else class="ready-note">当前活动冠军覆盖完整</span>
            <span v-if="results[index].implementation?.missingItems?.length" class="source-note">官方索引已匹配 {{ results[index].implementation.missingItems.filter(item => officialFor(item.itemId)?.matched).length }}/{{ results[index].implementation.missingItems.length }} 件，可信度 {{ results[index].implementation.missingItems.map(item => item.confidence).join('、') }}</span>
            <span v-else class="source-note">核心装备均已拥有，无待获取步骤</span>
          </div>
          <div v-if="results[index].scoreBreakdown" class="score-breakdown" aria-label="推荐评分拆解">
            <span>场景 {{ results[index].scoreBreakdown.activityScore }}</span><span>目标 +{{ results[index].scoreBreakdown.goalBonus }}</span><span>拥有 +{{ results[index].scoreBreakdown.ownershipBonus }}</span><span>属性 +{{ results[index].scoreBreakdown.targetBonus }}</span><span>冠军 +{{ results[index].scoreBreakdown.championCoverageScore }}</span><span v-if="results[index].scoreBreakdown.readinessPenalty">准备度 -{{ results[index].scoreBreakdown.readinessPenalty }}</span>
          </div>

          <div class="loadout-strip" aria-label="构筑装备顺序">
            <div class="loadout-slot exotic"><span>异域护甲</span><div class="loadout-visual"><img v-if="icon(gearById[build.exoticArmorId])" :src="icon(gearById[build.exoticArmorId])" :alt="gearName(build.exoticArmorId)" /><b v-else>{{ gearName(build.exoticArmorId).slice(0, 1) }}</b></div><strong>{{ gearName(build.exoticArmorId) }}</strong></div>
            <div v-for="item in loadoutWeapons(build)" :key="item.itemId" class="loadout-slot"><span>{{ weaponSlotLabels[item.gear.slot] }}</span><div class="loadout-visual"><img v-if="icon(item.gear)" :src="icon(item.gear)" :alt="item.gear.name" /><b v-else>{{ item.gear.name.slice(0, 1) }}</b></div><strong>{{ item.gear.name }}</strong><small>{{ item.perks.join('、') || '固定异域特性' }}</small></div>
            <div class="loadout-slot ability-slot"><span>子职业核心</span><div class="ability-stack"><div><small>超能力</small><strong>{{ abilityName(build.abilities.superId) }}</strong></div><div><small>手雷</small><strong>{{ abilityName(build.abilities.grenadeId) }}</strong></div></div><small>{{ build.abilities.aspectIds.map(id => aspectName(id)).join('、') }}</small></div>
          </div>
          <div class="build-actions"><router-link :to="`/builds/${build.id}`" class="open-build">打开完整配置 <span>→</span></router-link></div>

          <details>
            <summary>展开完整配置与机制解释</summary>
            <div class="details-body">
              <section><h3>星相与棱镜特性</h3><div class="tokens"><span v-for="id in build.abilities.aspectIds" :key="id" class="aspect">{{ aspectName(id) }}</span><span v-for="id in build.abilities.facetIds" :key="id">{{ facetName(id) }}</span></div></section>
              <section><h3>最终属性</h3><StatGrid :result="calculateStats(build)" /></section>
              <section><h3>武器与词条</h3><ol class="weapon-list"><li v-for="item in build.weapons" :key="item.itemId"><b>{{ gearName(item.itemId) }}</b><span>{{ item.perks.join(' + ') || '固定异域特性' }}</span><p>{{ item.purpose }}</p></li></ol></section>
              <section><h3>核心机制</h3><div class="tokens"><span v-for="id in build.mechanicIds" :key="id">{{ mechanicName(id) }}</span></div></section>
              <section class="rotation"><h3>操作循环</h3><ol><li v-for="step in build.rotation" :key="step">{{ step }}</li></ol></section>
              <section><h3>场景评分</h3><div class="score-bars"><div v-for="item in scoreBuild(build, activityId || build.activityIds[0]).contributions" :key="item.axis"><span>{{ item.axis }}</span><i><b :style="{width:`${item.value}%`}"></b></i><strong>{{ item.value }}</strong></div></div></section>
              <section class="warnings"><h3>限制与校验警告</h3><ul><li v-for="item in build.limitations" :key="item">{{ item }}</li><li v-for="item in validation.warnings" :key="item.message">{{ item.message }}</li></ul></section>
              <router-link :to="`/builds/${build.id}`" class="detail-link">查看构筑详情与完整获取路线 →</router-link>
            </div>
          </details>
        </div>
      </article>
    </section>

    <section v-else class="no-match"><span>NO EXACT MATCH</span><h2>没有通过校验的精确方案</h2><p>请减少筛选条件。系统不会用错误职业或错误活动类型的构筑代替结果。</p></section>
  </div>
</template>

<style scoped>
.lab-head{display:flex;justify-content:space-between;align-items:end;gap:2rem;padding:2.5rem 0 2rem;border-bottom:1px solid var(--line-soft)}.lab-head>div{max-width:48rem}.lab-head p:not(.eyebrow){margin-top:.7rem}.eyebrow{color:var(--gold-dim);font:600 .7rem var(--font-en);letter-spacing:.24em}.prism-link{flex:0 0 auto;padding:.8rem 0;border-bottom:1px solid var(--line);color:var(--gold-bright)}
.query-panel{display:grid;grid-template-columns:1.1fr 1fr 1.35fr 1.25fr 1fr;margin:2rem 0;border:1px solid var(--line-soft);background:rgba(10,15,30,.7)}fieldset{border:0;padding:1.25rem;border-right:1px solid var(--line-soft)}legend{padding:0;color:var(--gold-dim);font:.65rem var(--font-en);letter-spacing:.15em}.options{display:flex;gap:.4rem;margin-top:.6rem}.options button{flex:1;padding:.65rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);cursor:pointer}.options button.active{color:var(--bg-deep);background:var(--gold);border-color:var(--gold)}.lab-select{width:100%;margin-top:.6rem}
.result-line{display:flex;justify-content:space-between;align-items:center;margin:2.5rem 0 1rem}.result-line span{font:600 .75rem var(--font-en);letter-spacing:.12em;color:var(--gold-bright)}.result-line p{font-size:.78rem}
.build-list{display:grid;gap:1rem}.build-row{display:grid;grid-template-columns:5.5rem 1fr;border-top:1px solid var(--line);background:linear-gradient(100deg,rgba(232,193,90,.055),transparent 45%)}.rank{padding:1.5rem 1rem;border-right:1px solid var(--line-soft);display:flex;flex-direction:column;align-items:center}.rank span{align-self:flex-start;color:var(--text-dim);font:.65rem var(--font-en)}.rank strong{font:800 2rem var(--font-en);margin-top:1rem}.rank small{color:var(--text-dim)}.build-main{padding:1.5rem}.build-title{display:flex;justify-content:space-between;gap:1rem}.build-title p{color:var(--gold-dim);font-size:.72rem}.build-title h2{margin:.15rem 0;font-family:var(--font-cn)}.goal{max-width:48rem;margin:.6rem 0 1.3rem}.core-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line-soft)}.core-grid div{padding:.8rem;border-right:1px solid var(--line-soft)}.core-grid span{display:block;color:var(--text-dim);font-size:.68rem}.core-grid b{font-size:.84rem}
.title-meta{display:flex;flex-direction:column;align-items:flex-end;gap:.4rem}.title-meta>span{color:var(--text-dim);font-size:.68rem}
details{margin-top:1rem}summary{cursor:pointer;color:var(--gold-bright);font-size:.8rem;padding:.65rem 0;list-style-position:inside}.details-body{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding-top:1rem}.details-body section{padding:1.1rem;background:rgba(255,255,255,.025);border-top:1px solid var(--line-soft)}.details-body h3{font-family:var(--font-cn);font-size:.85rem;margin-bottom:.8rem}.tokens{display:flex;flex-wrap:wrap;gap:.4rem}.tokens span{padding:.3rem .55rem;border:1px solid var(--line-soft);font-size:.72rem;color:var(--text-sub)}.tokens .aspect{color:var(--gold-bright);border-color:var(--line)}.weapon-list{list-style:none;display:grid;gap:.65rem}.weapon-list li{display:grid;grid-template-columns:1fr 1fr;gap:.2rem .8rem;padding-bottom:.6rem;border-bottom:1px solid var(--line-soft)}.weapon-list span{color:var(--gold-dim);font-size:.75rem}.weapon-list p{grid-column:1/-1;font-size:.75rem}.rotation{grid-column:1/-1}.rotation ol{counter-reset:step;list-style:none;display:grid;grid-template-columns:repeat(5,1fr);gap:.6rem}.rotation li{padding:.8rem;border-left:1px solid var(--line);font-size:.76rem}.rotation li:before{counter-increment:step;content:counter(step,decimal-leading-zero);display:block;color:var(--gold-dim);font:.65rem var(--font-en);margin-bottom:.5rem}.score-bars{display:grid;gap:.55rem}.score-bars>div{display:grid;grid-template-columns:7rem 1fr 2rem;align-items:center;gap:.5rem;font-size:.7rem}.score-bars i{height:3px;background:rgba(255,255,255,.07)}.score-bars b{display:block;height:100%;background:var(--blue)}.warnings{border-top-color:var(--warn)!important}.warnings ul{padding-left:1.1rem;color:var(--text-sub);font-size:.78rem}.detail-link{grid-column:1/-1;justify-self:end;padding:.8rem 0;border-bottom:1px solid var(--line)}
.no-match{text-align:left;padding:4rem 0;border-top:1px solid var(--danger)}.no-match span{color:var(--danger);font:.7rem var(--font-en);letter-spacing:.2em}.no-match h2{font-family:var(--font-cn)}
.weapon-studio{margin:0 0 2.5rem;border:1px solid var(--line);background:linear-gradient(135deg,rgba(232,193,90,.08),rgba(10,15,30,.82) 42%);padding:1.25rem}.studio-heading{display:flex;justify-content:space-between;align-items:end;gap:1.5rem}.studio-heading h2{font-family:var(--font-cn);font-size:1.35rem;margin:.3rem 0 .35rem}.studio-heading p:not(.eyebrow){font-size:.76rem;max-width:42rem}.weapon-picker{width:min(20rem,100%)}.weapon-picker span{color:var(--text-dim);font-size:.7rem}.weapon-focus{display:grid;grid-template-columns:4.5rem 1fr auto;align-items:center;gap:1rem;margin-top:1.25rem;padding:1rem;background:rgba(6,10,20,.66);border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}.focus-icon,.loadout-visual,.mini-icon{background:linear-gradient(145deg,#27334a,#0c1221);border:1px solid var(--line-soft);overflow:hidden;display:flex;align-items:center;justify-content:center}.focus-icon{width:4.5rem;height:4.5rem}.focus-icon img,.loadout-visual img,.mini-icon img{width:100%;height:100%;object-fit:cover}.focus-icon span,.loadout-visual b,.mini-icon b{font:700 1.15rem var(--font-en);color:var(--gold-bright)}.slot-label{color:var(--gold-dim);font-size:.66rem}.weapon-focus h3{font-family:var(--font-cn);font-size:1.1rem;margin:.15rem 0}.weapon-focus p{font-size:.7rem}.text-action,.open-build{color:var(--gold-bright);font-size:.72rem;border-bottom:1px solid var(--line);padding-bottom:.3rem;white-space:nowrap}.pairing-heading{display:flex;justify-content:space-between;gap:1rem;align-items:baseline;margin:1.25rem 0 .65rem}.pairing-heading strong{font-size:.78rem}.pairing-heading span{color:var(--text-dim);font-size:.66rem}.pairing-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem}.pairing-slot{background:rgba(6,10,20,.58);border:1px solid var(--line-soft)}.pairing-slot header{display:flex;justify-content:space-between;padding:.7rem .8rem;border-bottom:1px solid var(--line-soft)}.pairing-slot header span{color:var(--gold-dim);font-size:.68rem}.pairing-slot header small{color:var(--text-dim);font-size:.62rem}.pairing-item{width:100%;display:grid;grid-template-columns:2.5rem 1fr auto;align-items:center;gap:.65rem;padding:.6rem .8rem;border:0;border-bottom:1px solid var(--line-soft);background:transparent;color:var(--text-main);text-align:left;cursor:pointer}.pairing-item:last-child{border-bottom:0}.pairing-item:hover{background:rgba(232,193,90,.08)}.mini-icon{width:2.5rem;height:2.5rem}.pairing-copy{display:grid;gap:.1rem;min-width:0}.pairing-copy strong{font-size:.73rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pairing-copy small{color:var(--text-sub);font-size:.62rem}.pairing-copy em{color:var(--gold-dim);font-size:.6rem;font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.choose-arrow{color:var(--gold-bright);font-size:1.2rem}.weapon-empty{display:flex;align-items:center;gap:.7rem;margin-top:1rem;padding:.9rem 0 0;color:var(--text-dim);font-size:.72rem}.weapon-empty span{color:var(--gold-dim);font:700 .7rem var(--font-en)}.loadout-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid var(--line-soft);background:rgba(6,10,20,.42)}.loadout-slot{min-width:0;padding:.7rem;border-right:1px solid var(--line-soft)}.loadout-slot:last-child{border-right:0}.loadout-slot>span{display:block;color:var(--text-dim);font-size:.61rem;margin-bottom:.45rem}.loadout-visual{width:100%;aspect-ratio:1.65;max-height:5rem;margin-bottom:.45rem}.loadout-slot>strong{display:block;font-size:.71rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.loadout-slot>small{display:block;color:var(--gold-dim);font-size:.59rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.2rem}.ability-stack{display:grid;gap:.28rem;margin-bottom:.35rem}.ability-stack div{display:flex;justify-content:space-between;gap:.4rem;align-items:baseline}.ability-stack small{color:var(--text-dim);font-size:.58rem}.ability-stack strong{font-size:.65rem;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.build-actions{display:flex;justify-content:flex-end;margin-top:.7rem}
@media(max-width:800px){.lab-head{align-items:flex-start;flex-direction:column}.query-panel{grid-template-columns:1fr}fieldset{border-right:0;border-bottom:1px solid var(--line-soft)}.build-row{grid-template-columns:1fr}.rank{display:none}.core-grid{grid-template-columns:1fr 1fr}.details-body{grid-template-columns:1fr}.rotation{grid-column:auto}.rotation ol{grid-template-columns:1fr 1fr}}
</style>
<style scoped>
.reasons { margin: -.7rem 0 1rem; color: var(--gold-dim); font-size: .72rem; }
.next-steps { margin: -.35rem 0 1rem; color: var(--text-sub); font-size: .72rem; }
.lab-actions { display: flex; justify-content: flex-end; margin: -1rem 0 2rem; }
.workbench-link { color: var(--gold-bright); font-size: .78rem; border-bottom: 1px solid var(--line); padding-bottom: .35rem; }
.recommendation-evidence { display:flex; flex-wrap:wrap; gap:.45rem; align-items:center; margin:.15rem 0 .7rem; font-size:.68rem; }
.recommendation-evidence > span { padding:.32rem .5rem; border:1px solid var(--line-soft); color:var(--text-sub); }
.recommendation-evidence .readiness.ready { color:var(--ok); border-color:rgba(125,219,138,.35); }
.recommendation-evidence .readiness.in-progress { color:var(--warn); border-color:rgba(255,180,84,.35); }
.recommendation-evidence .gap { color:var(--warn); border-color:rgba(255,180,84,.35); }
.recommendation-evidence .ready-note { color:var(--ok); border-color:rgba(125,219,138,.35); }
.recommendation-evidence .source-note { color:var(--text-dim); }
.score-breakdown { display:flex; flex-wrap:wrap; gap:.35rem; margin-bottom:1rem; color:var(--text-dim); font: .64rem var(--font-en); }
.score-breakdown span { padding:.2rem .38rem; background:rgba(255,255,255,.035); }
@media(max-width:800px){.studio-heading,.pairing-heading{align-items:flex-start;flex-direction:column}.weapon-picker{width:100%}.weapon-focus{grid-template-columns:3.5rem 1fr}.focus-icon{width:3.5rem;height:3.5rem}.text-action{grid-column:2}.pairing-grid{grid-template-columns:1fr}.loadout-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.loadout-slot:nth-child(2){border-right:0}.loadout-slot:nth-child(n+3){border-top:1px solid var(--line-soft)}.loadout-slot:last-child{grid-column:1/-1}}
</style>
