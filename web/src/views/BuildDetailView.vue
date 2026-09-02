<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { buildById, gearById, armorSetById, abilityById, aspectById, facetById, fragmentById, mechanicById, modById, calculateStats, calculateCombatProfile, validateBuild, planAcquisition, planUnlocks } from '@/data/v2'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import StatGrid from '@/components/StatGrid.vue'
import { useOwnedItems } from '@/composables/useOwnedItems'
import { useManifestAssets } from '@/composables/useManifestAssets'

const route = useRoute()
const build = computed(() => buildById[route.params.buildId])
const { ownedItemIds: owned, toggle: toggleOwned } = useOwnedItems()
const { iconFor } = useManifestAssets()
const stats = computed(() => build.value ? calculateStats(build.value) : null)
const combatMode = ref('pve')
const combatProfile = computed(() => build.value ? calculateCombatProfile(build.value, { mode: combatMode.value }) : null)
const validation = computed(() => build.value ? validateBuild(build.value) : null)
const acquisition = computed(() => build.value ? planAcquisition(build.value, owned.value) : [])
const unlocks = computed(() => build.value ? planUnlocks(build.value) : [])
const gearName=id=>gearById[id]?.name||id
const armorSetName=id=>armorSetById[id]?.name||id
const abilityName=id=>abilityById[id]?.name||id
const slotNames={helmet:'头盔',arms:'臂铠',chest:'胸甲',legs:'腿甲',classItem:'职业装备'}
const officialAcquisition = ref(null)
const officialModLinks = ref(null)
onMounted(async () => {
  try {
    const [response, modsResponse] = await Promise.all([fetch('/data/acquisition-sources.json'), fetch('/data/curated-mod-links.json')])
    if (response.ok) officialAcquisition.value = await response.json()
    if (modsResponse.ok) officialModLinks.value = await modsResponse.json()
  } catch {
    officialAcquisition.value = null
    officialModLinks.value = null
  }
})
const officialFor = id => officialAcquisition.value?.items?.find(item => item.id === id) || null
const officialModFor = id => officialModLinks.value?.items?.find(item => item.id === id) || null
const icon = item => iconFor(item)
</script>

<template>
  <div v-if="build" class="detail-page">
    <router-link to="/build-lab" class="back">← 返回构筑实验室</router-link>
    <header class="detail-head"><div><p>{{ build.subclassId.includes('prismatic') ? 'PRISMATIC' : 'SUBCLASS' }} / {{ build.difficulty }}</p><h1>{{ build.name }}</h1><span>{{ build.goal }}</span></div><div class="verify"><ConfidenceBadge :level="build.confidence" /><strong>{{ validation.valid ? '合法配置' : '配置有误' }}</strong><small>核验于 {{ build.verifiedAt }}</small><small class="manifest-hash">Manifest {{ build.manifestVersion }}</small></div></header>

    <section class="quick-config"><div v-for="abilityId in [build.abilities.superId, build.abilities.classAbilityId, build.abilities.meleeId, build.abilities.grenadeId]" :key="abilityId"><span>{{ abilityById[abilityId]?.kind === 'super' ? '超能力' : abilityById[abilityId]?.kind === 'classAbility' ? '职业技能' : abilityById[abilityId]?.kind === 'melee' ? '近战' : '手雷' }}</span><div class="quick-icon"><img v-if="icon(abilityById[abilityId])" :src="icon(abilityById[abilityId])" :alt="abilityName(abilityId)" /></div><b>{{ abilityName(abilityId) }}</b></div><div><span>护甲套装</span><div class="quick-icon armor-mark"><b>{{ armorSetName(build.armorSetId).slice(0, 1) }}</b></div><b>{{ armorSetName(build.armorSetId) }}</b></div></section>

    <div class="two-col">
      <section class="content-section"><div class="section-no">01</div><div><h2>完整子职业配置</h2><h3>星相</h3><div class="tokens"><span v-for="id in build.abilities.aspectIds" :key="id"><img v-if="icon(aspectById[id])" :src="icon(aspectById[id])" :alt="aspectById[id].name" /><strong>{{ aspectById[id].name }}</strong><small>{{ aspectById[id].en }}</small></span></div><h3>{{ build.abilities.facetIds?.length ? '棱镜特性' : '元素碎片' }}</h3><div v-if="build.abilities.facetIds?.length" class="tokens facets"><span v-for="id in build.abilities.facetIds" :key="id"><strong>{{ facetById[id].name }}</strong><small>{{ facetById[id].description }}</small></span></div><div v-else class="tokens facets"><span v-for="id in build.abilities.fragmentIds" :key="id"><strong>{{ fragmentById[id].name }}</strong><small>{{ fragmentById[id].description }}</small></span></div></div></section>
      <section class="content-section"><div class="section-no">02</div><div><h2>可实现属性</h2><StatGrid :result="stats" /><div class="target-checks"><span v-for="item in stats.targetChecks" :key="item.stat" :class="{ok:item.met}">{{ item.stat }} {{ item.actual }}/{{ item.target }}</span></div></div></section>
    </div>

    <section class="content-section full"><div class="section-no">03</div><div><h2>武器和职责</h2><div class="weapon-table"><article v-for="item in build.weapons" :key="item.itemId"><div class="weapon-art"><img v-if="icon(gearById[item.itemId])" :src="icon(gearById[item.itemId])" :alt="gearName(item.itemId)" /><span v-else>{{ gearName(item.itemId).slice(0, 1) }}</span></div><header><strong>{{ gearName(item.itemId) }}</strong><span>{{ gearById[item.itemId].slot }} / {{ gearById[item.itemId].ammo }}</span></header><p class="perks">{{ item.perks.join(' + ') || '固定异域特性' }}</p><p>{{ item.purpose }}</p></article></div></div></section>

    <section class="content-section full"><div class="section-no">04</div><div><h2>五个护甲部位模组</h2><div class="mod-slots"><article v-for="(mods,slot) in build.armorMods" :key="slot"><header><strong>{{ slotNames[slot] }}</strong><span>{{ mods.reduce((sum,id)=>sum+(modById[id]?.cost||0),0) }}/10</span></header><ul><li v-for="id in mods" :key="id"><b>{{ modById[id]?.name }}</b><span>{{ modById[id]?.cost }} 能量</span><p>{{ modById[id]?.effect || `+${modById[id]?.value} ${modById[id]?.stat}` }}</p><small v-if="officialModFor(id)?.primaryHash" class="manifest-hash">官方 Hash {{ officialModFor(id).primaryHash }}<span v-if="!officialModFor(id).consistent">：待复核</span></small></li></ul></article></div><p class="mod-note">基础属性代表装备与大师化完成后的输入；属性模组在此基础上逐项加入，规则引擎会检查每个部位不超过 10 点能量。模组官方 Hash 与槽位/能量一致性来自当前 Manifest 快照。</p></div></section>

    <section class="content-section full"><div class="section-no">05</div><div><h2>操作循环</h2><ol class="timeline"><li v-for="(step,index) in build.rotation" :key="step"><span>{{ String(index+1).padStart(2,'0') }}</span><p>{{ step }}</p></li></ol></div></section>

    <section class="content-section full"><div class="section-no">06</div><div><h2>机制和反冠军覆盖</h2><div class="mechanic-grid"><article v-for="id in build.mechanicIds" :key="id"><strong>{{ mechanicById[id].name }}</strong><span>{{ mechanicById[id].en }}</span><p>{{ mechanicById[id].values.effect || (mechanicById[id].values.standardPvePercent ? `标准 PvE 削弱 ${mechanicById[id].values.standardPvePercent}%` : '参与该构筑的技能链') }}</p></article></div><div v-if="combatProfile" class="combat-profile"><div class="profile-heading"><h3>已登记的基线数值与组合</h3><a-radio-group v-model:value="combatMode" class="mode-switch" button-style="solid" size="small" aria-label="数值模式"><a-radio-button value="pve">PvE</a-radio-button><a-radio-button value="pvp">PvP</a-radio-button></a-radio-group></div><div><span>受到伤害倍率</span><b>{{ combatProfile.incomingDamageMultiplier }}</b></div><div><span>武器伤害倍率</span><b>{{ combatProfile.weaponDamageMultiplier }}</b></div><div><span>目标承伤倍率</span><b>{{ combatProfile.targetDamageMultiplier }}</b></div><div><span>组合登记倍率</span><b>{{ combatProfile.combinedRegisteredMultiplier }}</b></div><div v-if="combatProfile.activeInteractions.length" class="interaction-list"><span>已触发机制组合</span><p v-for="interaction in combatProfile.activeInteractions" :key="interaction.id">{{ interaction.name }}：{{ interaction.effect }}</p></div><p>{{ combatProfile.note }}</p></div><div class="champions"><div v-for="type in ['barrier','overload','unstoppable']" :key="type"><span>{{ type }}</span><p v-if="build.championCoverage[type].length">{{ build.championCoverage[type].join('；') }}</p><p v-else class="gap">缺口：进入对应活动前必须更换武器或由队友覆盖</p></div></div></div></section>

    <section class="content-section full"><div class="section-no">07</div><div class="acquisition-head"><div><h2>从零实现这套构筑</h2><p>勾选已拥有装备，路线会自动跳过对应步骤；官方索引候选会单独标记。</p></div></div><div class="acquisition-list"><article v-for="item in acquisition" :key="item.itemId" :class="{owned:item.owned}"><label><a-checkbox :checked="owned.includes(item.itemId)" @change="toggleOwned(item.itemId)"></a-checkbox><span>{{ item.order }}</span><strong>{{ item.name }}</strong></label><div><b>{{ item.pathName }}</b><small>{{ item.deterministic ? '确定获取路径' : '随机掉落 / 需要刷取' }}：{{ item.access }}，编辑整理步骤</small><ol><li v-for="step in item.steps" :key="step">{{ step }}</li></ol><div v-if="officialFor(item.itemId)?.vendorSources?.length || officialFor(item.itemId)?.activitySources?.length" class="official-sources"><small>Manifest 官方来源证据</small><span v-for="source in [...(officialFor(item.itemId)?.vendorSources || []).slice(0, 2), ...(officialFor(item.itemId)?.activitySources || []).slice(0, 2)]" :key="`${source.vendorHash || source.activityHash}-${source.itemHash}`">{{ source.vendorName || source.activityName }}</span></div><small v-if="officialFor(item.itemId)?.manifestHashes?.length" class="manifest-hash">Hash {{ officialFor(item.itemId).primaryHash }}：{{ officialFor(item.itemId).manifestHashes.length }} 个版本</small></div></article></div></section>

    <section class="content-section full"><div class="section-no">08</div><div><h2>技能、星相与模组解锁路径</h2><div class="unlock-list"><article v-for="item in unlocks" :key="`${item.kind}-${item.id}`"><header><span>{{ item.kind }}</span><strong>{{ item.name }}</strong></header><ol><li v-for="step in item.steps" :key="step">{{ step }}</li></ol><small>{{ item.note }}</small></article></div></div></section>

    <section class="limits"><h2>已知限制</h2><ul><li v-for="item in build.limitations" :key="item">{{ item }}</li><li v-for="item in validation.warnings" :key="item.message">{{ item.message }}</li></ul></section>
  </div>
  <div v-else class="empty"><h1>未找到构筑</h1><router-link to="/build-lab">返回构筑实验室</router-link></div>
</template>

<style scoped>
.back{display:inline-block;margin-bottom:1.5rem;color:var(--text-sub)}.detail-head{display:flex;justify-content:space-between;gap:2rem;padding:2.5rem 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line-soft)}.detail-head p{color:var(--gold-dim);font:.7rem var(--font-en);letter-spacing:.2em}.detail-head h1{font-family:var(--font-cn);font-size:clamp(2rem,5vw,4rem);letter-spacing:-.04em}.detail-head>div>span{color:var(--text-sub)}.verify{min-width:10rem;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:.4rem}.verify small{color:var(--text-dim)}
.quick-config{display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--line-soft)}.quick-config div{padding:1rem;border-right:1px solid var(--line-soft)}.quick-config span{display:block;color:var(--text-dim);font-size:.68rem}.quick-config b{display:block;font-size:.83rem}.quick-icon{width:2.7rem;height:2.7rem;margin:.45rem 0;background:#101828;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.quick-icon img{width:100%;height:100%;object-fit:cover}.armor-mark b{color:var(--gold-bright);font:700 1.1rem var(--font-en)}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem}.content-section{display:grid;grid-template-columns:2rem 1fr;gap:1.2rem;padding:2.5rem 0;border-bottom:1px solid var(--line-soft)}.content-section.full{margin-top:0}.section-no{color:var(--gold-dim);font:.65rem var(--font-en)}.content-section h2{font-family:var(--font-cn);margin:0 0 1.2rem}.content-section h3{font-family:var(--font-cn);font-size:.75rem;color:var(--text-dim);margin:1rem 0 .5rem}.tokens{display:flex;flex-wrap:wrap;gap:.5rem}.tokens span{display:flex;flex-direction:column;gap:.25rem;padding:.65rem;border-left:1px solid var(--line);background:rgba(255,255,255,.025);font-size:.8rem}.tokens span img{width:2.4rem;height:2.4rem;object-fit:cover;background:#101828}.tokens strong{font-size:.76rem}.tokens small{display:block;color:var(--text-dim);font-size:.65rem;margin-top:.1rem}.tokens.facets span{flex:1 1 12rem}.target-checks{display:flex;gap:.5rem;margin-top:1rem}.target-checks span{padding:.3rem .55rem;border:1px solid var(--danger);color:var(--danger);font-size:.68rem}.target-checks span.ok{border-color:rgba(125,219,138,.3);color:var(--ok)}
.weapon-table{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft)}.weapon-table article{padding:1.2rem;background:var(--bg-dark)}.weapon-art{height:7rem;margin:-.2rem -.2rem .8rem;background:#0c1322;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden}.weapon-art img{width:100%;height:100%;object-fit:cover}.weapon-art span{font:700 2rem var(--font-en);color:var(--gold-dim)}.weapon-table header{display:flex;justify-content:space-between;gap:1rem}.weapon-table header span{color:var(--text-dim);font-size:.65rem}.weapon-table .perks{color:var(--gold-bright);font-size:.75rem;margin:.8rem 0}.weapon-table p:last-child{font-size:.78rem}.timeline{list-style:none;display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line-soft)}.timeline li{padding:1rem;background:var(--bg-deep)}.timeline span{color:var(--gold-dim);font:.7rem var(--font-en)}.timeline p{font-size:.78rem;margin-top:.8rem}.mechanic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem}.mechanic-grid article{padding:1rem;border-top:1px solid var(--line-soft);background:rgba(255,255,255,.02)}.mechanic-grid span{display:block;color:var(--text-dim);font:.6rem var(--font-en)}.mechanic-grid p{font-size:.74rem;margin-top:.5rem}.champions{display:grid;grid-template-columns:repeat(3,1fr);margin-top:1rem;border:1px solid var(--line-soft)}.champions div{padding:1rem;border-right:1px solid var(--line-soft)}.champions span{color:var(--gold-dim);font:.65rem var(--font-en);text-transform:uppercase}.champions p{font-size:.75rem;margin-top:.5rem}.champions .gap{color:var(--warn)}
.mod-slots{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line-soft)}.mod-slots article{background:var(--bg-dark)}.mod-slots header{display:flex;justify-content:space-between;padding:.8rem;border-bottom:1px solid var(--line-soft)}.mod-slots header span{color:var(--gold-bright);font:.7rem var(--font-en)}.mod-slots ul{list-style:none;padding:.5rem}.mod-slots li{padding:.5rem;border-bottom:1px solid var(--line-soft)}.mod-slots li span{float:right;color:var(--text-dim);font-size:.65rem}.mod-slots li p{font-size:.68rem;margin-top:.25rem}.mod-note{font-size:.75rem;margin-top:.8rem;color:var(--text-dim)}
.acquisition-list{display:grid;gap:.7rem}.acquisition-list article{display:grid;grid-template-columns:15rem 1fr;border:1px solid var(--line-soft)}.acquisition-list label{display:grid;grid-template-columns:auto 2rem 1fr;gap:.6rem;align-items:center;padding:1rem;border-right:1px solid var(--line-soft);cursor:pointer}.acquisition-list label span{color:var(--gold-dim);font:.7rem var(--font-en)}.acquisition-list article>div{padding:1rem}.acquisition-list small{display:block;color:var(--text-dim);margin:.2rem 0 .6rem}.acquisition-list ol{padding-left:1.1rem;color:var(--text-sub);font-size:.76rem}.acquisition-list article.owned{opacity:.55}.limits{margin-top:2rem;padding:1.5rem;border-left:3px solid var(--warn);background:rgba(255,180,84,.05)}.limits h2{font-family:var(--font-cn);margin:0}.limits ul{padding-left:1.2rem;color:var(--text-sub)}
.official-sources{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.8rem}.official-sources small{width:100%;margin:0;color:var(--gold-dim)}.official-sources span{padding:.25rem .45rem;border:1px solid var(--line-soft);font-size:.65rem;color:var(--text-sub)}.manifest-hash{font-family:var(--font-en);font-size:.62rem!important}
@media(max-width:800px){.detail-head{flex-direction:column}.verify{align-items:flex-start}.quick-config{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr;gap:0}.weapon-table,.timeline,.mechanic-grid,.champions,.mod-slots{grid-template-columns:1fr}.acquisition-list article{grid-template-columns:1fr}.acquisition-list label{border-right:0;border-bottom:1px solid var(--line-soft)}}
</style>
<style scoped>
.unlock-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line-soft); }
.unlock-list article { padding: 1rem; background: var(--bg-dark); }
.unlock-list header { display: flex; flex-direction: column; gap: .2rem; }
.unlock-list header span { color: var(--gold-dim); font: .62rem var(--font-en); }
.unlock-list header strong { font-size: .82rem; }
.unlock-list ol { margin: .7rem 0; padding-left: 1rem; color: var(--text-sub); font-size: .72rem; }
.unlock-list small { color: var(--text-dim); font-size: .65rem; }
@media (max-width: 800px) { .unlock-list { grid-template-columns: 1fr; } }
</style>
<style scoped>
.combat-profile { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 1.2rem 0; background: var(--line-soft); }
.combat-profile h3, .combat-profile p { grid-column: 1 / -1; padding: .75rem 1rem; margin: 0; background: var(--bg-dark); }
.profile-heading { grid-column: 1 / -1; display:flex; justify-content:space-between; align-items:center; padding:.75rem 1rem; background:var(--bg-dark); }
.profile-heading h3 { padding:0; }
.mode-switch { display:inline-flex; }
.mode-switch .ant-radio-button-wrapper { color:var(--text-sub); background:transparent; border-color:var(--line-soft); }
.mode-switch .ant-radio-button-wrapper-checked { color:var(--bg-deep); background:var(--gold); border-color:var(--gold); }
.combat-profile h3 { color: var(--gold-dim); font-size: .76rem; }
.combat-profile div { padding: .85rem 1rem; background: var(--bg-dark); }
.combat-profile span { display: block; color: var(--text-dim); font-size: .68rem; }
.combat-profile b { font: 700 1.25rem var(--font-en); color: var(--gold-bright); }
.combat-profile p { color: var(--text-dim); font-size: .68rem; }
.interaction-list { grid-column: 1 / -1; padding: .85rem 1rem; background: var(--bg-dark); }
.interaction-list p { margin-top: .35rem; color: var(--text-sub); }
@media (max-width: 800px) { .combat-profile { grid-template-columns: 1fr; } .combat-profile h3, .combat-profile p, .interaction-list, .profile-heading { grid-column: auto; } .profile-heading { align-items:flex-start; flex-direction:column; gap:.6rem; } }
</style>
