<script setup>
import { computed, ref } from 'vue'
import { handCannonTierList, tierMeta } from '@/data/weaponTierList'
import { useManifestAssets } from '@/composables/useManifestAssets'

const { equipmentItems, weaponItems, status, iconFor, entityForHash } = useManifestAssets()

const keyword = ref('')
const tierFilter = ref('')
const rpmFilter = ref('')
const selectedWeapon = ref(null)

const statLabels = { Impact: '伤害', Range: '射程', Stability: '稳定性', Handling: '操控性', 'Reload Speed': '填装速度', 'Aim Assistance': '辅助瞄准', Zoom: '变焦', 'Recoil Direction': '后坐方向', Magazine: '弹匣', 'Rounds Per Minute': '射速', 'Airborne Effectiveness': '空中效率' }
const equipmentByHash = computed(() => new Map(equipmentItems.value.map(item => [String(item.hash), item])))
const tierCounts = computed(() => Object.fromEntries(Object.keys(tierMeta).map(tier => [tier, handCannonTierList.filter(item => item.tier === tier).length])))
const rows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return handCannonTierList.map(entry => {
    const item = equipmentByHash.value.get(String(entry.hash)) || weaponItems.value.find(candidate => candidate.name === entry.name)
    const perks = initialWeaponPerks(item)
    return {
      ...entry,
      item,
      rpm: item?.baseStats?.['Rounds Per Minute'] || '—',
      element: elementLabel(item),
      elementClass: elementClass(item),
      frame: intrinsicLabel(item),
      barrel: perks[0] || '—', magazine: perks[1] || '—', perk1: perks[2] || '—', perk2: perks[3] || '—', origin: perks[4] || '—'
    }
  }).filter(row => (!tierFilter.value || row.tier === tierFilter.value)
    && (!rpmFilter.value || String(row.rpm) === rpmFilter.value)
    && (!query || `${row.nameZh} ${row.name} ${row.frame} ${row.note}`.toLowerCase().includes(query)))
})

function socketName(socket) { return entityForHash(socket?.initialItemHash)?.nameZh || socket?.plugNamesZh?.[0] || entityForHash(socket?.initialItemHash)?.name || socket?.plugNames?.[0] || '' }
function initialWeaponPerks(item) { return (item?.socketPools || []).filter(socket => /WEAPON PERKS/i.test(socket.socketCategory || '')).map(socketName).filter(Boolean) }
function intrinsicLabel(item) { return socketName((item?.socketPools || []).find(socket => /INTRINSIC TRAITS/i.test(socket.socketCategory || ''))) || '未登记' }
function elementLabel(item) { return ({ 1: '动能', 2: '电弧', 3: '烈日', 4: '虚空', 6: '冰影', 7: '缚丝' })[item?.damageType] || '动能' }
function elementClass(item) { return ({ 2: 'arc', 3: 'solar', 4: 'void', 6: 'stasis', 7: 'strand' })[item?.damageType] || 'kinetic' }
function icon(item) { const value = iconFor(item); return value || (item?.icon ? `https://www.bungie.net${item.icon}` : '') }
function stats(item) { return Object.entries(item?.baseStats || {}).map(([key, value]) => ({ key, value, label: statLabels[key] || key })).filter(stat => Number.isFinite(stat.value) && stat.value > 0 && !['Attack', 'Power'].includes(stat.key)).slice(0, 8) }
function resetFilters() { keyword.value = ''; tierFilter.value = ''; rpmFilter.value = '' }
</script>

<template>
  <div class="tier-page">
    <nav class="tier-breadcrumb" aria-label="面包屑"><router-link to="/weapons">武器百科</router-link><span>/</span><strong>竞技天梯</strong></nav>

    <section class="tier-intro">
      <div>
        <p class="tier-kicker">CRUCIBLE FIELD INDEX · 2026.09</p>
        <h1>手炮竞技天梯</h1>
        <p>将射速、属性、框架、初始词条与实战判断放进同一张横向天梯。排名按竞技场泛用性整理，点击武器可查看 Manifest 详情。</p>
      </div>
      <div class="tier-total"><span>收录</span><strong>{{ handCannonTierList.length }}</strong><small>HAND CANNONS</small></div>
    </section>

    <section class="tier-controls" aria-label="天梯筛选">
      <label class="tier-search"><span>检索武器</span><input v-model="keyword" type="search" placeholder="名称、框架或评语…" /></label>
      <label><span>梯级</span><select v-model="tierFilter"><option value="">全部梯级</option><option v-for="(_, tier) in tierMeta" :key="tier" :value="tier">{{ tier }} · {{ tierMeta[tier].label }}</option></select></label>
      <label><span>射速</span><select v-model="rpmFilter"><option value="">全部射速</option><option value="120">120 RPM</option><option value="140">140 RPM</option><option value="150">150 RPM</option><option value="180">180 RPM</option></select></label>
      <button type="button" class="tier-reset" @click="resetFilters">清除筛选</button>
    </section>

    <div class="tier-legend" aria-label="梯级说明">
      <button v-for="(meta, tier) in tierMeta" :key="tier" type="button" :class="['legend-item', `tier-${tier.toLowerCase()}`, { active: tierFilter === tier }]" @click="tierFilter = tierFilter === tier ? '' : tier">
        <b>{{ tier }}</b><span><strong>{{ meta.label }}</strong><small>{{ meta.summary }}</small></span><em>{{ tierCounts[tier] }}</em>
      </button>
    </div>

    <section class="tier-board-shell" aria-labelledby="tier-board-title">
      <header class="tier-board-head"><div><span>LIVE COMPARISON BOARD</span><h2 id="tier-board-title">武器横向对比</h2></div><p>当前显示 <b>{{ rows.length }}</b> 件 · 表格可横向滚动</p></header>
      <div v-if="status === 'loading'" class="tier-loading"><i v-for="n in 8" :key="n"></i></div>
      <div v-else-if="status === 'error'" class="empty error">Manifest 加载失败，暂时无法生成天梯详情。</div>
      <div v-else class="tier-table-scroll">
        <table class="tier-table">
          <colgroup><col class="col-weapon" /><col class="col-rpm" /><col class="col-element" /><col class="col-frame" /><col class="col-source" /><col class="col-barrel" /><col class="col-magazine" /><col class="col-perk" /><col class="col-perk" /><col class="col-origin" /><col class="col-comment" /><col class="col-rank" /><col class="col-tier" /></colgroup>
          <thead>
            <tr class="column-groups"><th>武器</th><th colspan="4">INFO · 基础信息</th><th colspan="5">TRAITS · 配置</th><th colspan="3">ANALYSIS · 分析</th></tr>
            <tr><th class="sticky-weapon">武器 / Weapon</th><th>射速</th><th>属性</th><th>框架</th><th>来源</th><th>枪管</th><th>弹匣</th><th>特性 1</th><th>特性 2</th><th>固有 / 原始</th><th>实战评语</th><th class="sticky-rank">排名</th><th class="sticky-tier">T级</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.rank" :class="`row-tier-${row.tier.toLowerCase()}`">
              <td class="sticky-weapon weapon-cell"><button type="button" :disabled="!row.item" @click="selectedWeapon = row.item"><span class="tier-weapon-icon"><img v-if="icon(row.item)" :src="icon(row.item)" :alt="`${row.nameZh} 武器图标`" loading="lazy" /><i v-else>HC</i></span><span><strong>{{ row.nameZh }}</strong><small>{{ row.name }}</small></span></button></td>
              <td class="numeric">{{ row.rpm }}</td><td><span :class="['element-dot', row.elementClass]"></span>{{ row.element }}</td><td>{{ row.frame }}</td><td>{{ row.source }}</td><td>{{ row.barrel }}</td><td>{{ row.magazine }}</td><td>{{ row.perk1 }}</td><td>{{ row.perk2 }}</td><td>{{ row.origin }}</td><td class="comment-cell">{{ row.note }}</td><td class="sticky-rank numeric">{{ row.rank }}</td><td :class="['sticky-tier', `tier-${row.tier.toLowerCase()}`]"><strong>{{ row.tier }}</strong></td>
            </tr>
          </tbody>
        </table>
        <div v-if="!rows.length" class="empty">没有符合当前条件的手炮。</div>
      </div>
      <footer class="tier-method"><span>判定维度：有效射程 · 击杀容错 · 操控手感 · 词条上限 · 获取成本</span><span>排名为编辑评估，基础数据来自当前 Bungie Manifest 快照</span></footer>
    </section>

    <div v-if="selectedWeapon" class="weapon-overlay" @click.self="selectedWeapon = null">
      <section class="weapon-dialog" role="dialog" aria-modal="true" :aria-label="`${selectedWeapon.nameZh || selectedWeapon.name} weapon details`">
        <button type="button" class="detail-close" aria-label="关闭详情" @click="selectedWeapon = null">×</button>
        <header class="detail-head"><img v-if="icon(selectedWeapon)" :src="icon(selectedWeapon)" :alt="`${selectedWeapon.nameZh || selectedWeapon.name} 武器图标`" /><div><small>MANIFEST WEAPON</small><h2>{{ selectedWeapon.nameZh || selectedWeapon.name }}</h2><p>{{ selectedWeapon.name }}</p><span>Hash {{ selectedWeapon.hash }} · {{ selectedWeapon.weaponFamily }}</span></div></header>
        <div class="stat-grid"><div v-for="stat in stats(selectedWeapon)" :key="stat.key"><span>{{ stat.label }}<small>{{ stat.key }}</small></span><strong>{{ stat.value }}</strong><i><b :style="{ width: `${Math.min(100, stat.value)}%` }"></b></i></div></div>
        <footer><router-link :to="`/manifest?q=${encodeURIComponent(selectedWeapon.name)}`">在官方目录中查看 →</router-link></footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tier-page{padding-bottom:4rem}.tier-breadcrumb{display:flex;gap:.55rem;align-items:center;margin:.15rem 0 1rem;color:var(--text-dim);font-size:.65rem}.tier-breadcrumb a{color:var(--gold-dim)}.tier-breadcrumb strong{color:var(--text-sub);font-weight:500}.tier-intro{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2.5rem;align-items:end;margin-bottom:1.1rem;padding:1.9rem 2rem 2.1rem;overflow:hidden;background:radial-gradient(45rem 18rem at 86% -20%,rgba(232,193,90,.19),transparent 62%),linear-gradient(135deg,#172237,#0b111f);border-top:1px solid rgba(255,255,255,.13);border-bottom:1px solid var(--line)}.tier-intro::after{content:"";position:absolute;right:11rem;bottom:-3.8rem;width:14rem;height:14rem;border:1px solid rgba(232,193,90,.13);transform:rotate(45deg)}.tier-kicker{color:var(--gold-dim);font:.56rem var(--font-en);letter-spacing:.2em}.tier-intro h1{margin:.28rem 0 .5rem;font-size:clamp(2rem,4vw,3.2rem);line-height:1.05;letter-spacing:-.035em}.tier-intro>div:first-child>p:last-child{max-width:50rem;font-size:.73rem;line-height:1.75}.tier-total{position:relative;z-index:1;min-width:8rem;padding-left:1rem;border-left:1px solid var(--line)}.tier-total span,.tier-total small{display:block;color:var(--text-dim);font-size:.56rem}.tier-total strong{display:block;color:var(--gold-bright);font:700 2.3rem/1 var(--font-en);font-variant-numeric:tabular-nums}.tier-total small{margin-top:.25rem;font-family:var(--font-en);letter-spacing:.13em}
.tier-controls{display:grid;grid-template-columns:minmax(16rem,1fr) 10rem 10rem auto;gap:.65rem;align-items:end;margin-bottom:.8rem}.tier-controls label{display:grid;gap:.28rem}.tier-controls label>span{color:var(--text-dim);font-size:.56rem;letter-spacing:.08em}.tier-controls input,.tier-controls select{width:100%;height:2.65rem;padding:0 .8rem;border:1px solid var(--line-soft);border-radius:0;background:#0e1626;color:var(--text-main);font:inherit;font-size:.7rem;outline:none;transition:border-color .2s,box-shadow .2s}.tier-controls input:focus,.tier-controls select:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,193,90,.1)}.tier-controls input::placeholder{color:var(--text-dim)}.tier-reset{height:2.65rem;padding:0 1rem;border:1px solid var(--line-soft);background:transparent;color:var(--gold-dim);font:inherit;font-size:.65rem;cursor:pointer}.tier-reset:hover{background:rgba(232,193,90,.08);color:var(--gold-bright)}
.tier-legend{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;margin-bottom:1rem;background:var(--line-soft)}.legend-item{display:grid;grid-template-columns:2rem 1fr auto;gap:.55rem;align-items:center;min-width:0;padding:.6rem .7rem;border:0;border-top:2px solid currentColor;background:#0d1524;color:var(--text-sub);text-align:left;cursor:pointer}.legend-item:hover,.legend-item.active{background:#172238;filter:brightness(1.12)}.legend-item>b{font:800 1.3rem var(--font-en)}.legend-item span{min-width:0}.legend-item span strong,.legend-item span small{display:block}.legend-item span strong{color:var(--text-main);font-size:.62rem}.legend-item span small{margin-top:.1rem;color:var(--text-dim);font-size:.49rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.legend-item em{font:normal .58rem var(--font-en)}.tier-s{color:#60d2a1!important}.tier-a{color:#a9cf70!important}.tier-b{color:#e5bd54!important}.tier-c{color:#df913f!important}.tier-d{color:#d96861!important}
.tier-board-shell{position:relative;left:50%;width:min(100rem,calc(100vw - 2rem));transform:translateX(-50%);border:1px solid rgba(255,255,255,.11);background:#0b111d;box-shadow:0 1.4rem 4rem rgba(1,5,12,.35)}.tier-board-head{display:flex;justify-content:space-between;align-items:end;gap:1rem;padding:.9rem 1rem;background:linear-gradient(90deg,#151f32,#0c1422)}.tier-board-head span{color:var(--gold-dim);font:.5rem var(--font-en);letter-spacing:.16em}.tier-board-head h2{margin:.15rem 0 0;font-size:.88rem}.tier-board-head p{font-size:.59rem}.tier-board-head p b{color:var(--gold-bright);font-family:var(--font-en)}.tier-table-scroll{max-height:68rem;overflow:auto;overscroll-behavior:contain}.tier-table{width:100%;min-width:91rem;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:.6rem}.tier-table .col-weapon{width:15.5rem}.tier-table .col-rpm{width:3.4rem}.tier-table .col-element{width:4rem}.tier-table .col-frame{width:6rem}.tier-table .col-source{width:7rem}.tier-table .col-barrel,.tier-table .col-magazine{width:6rem}.tier-table .col-perk{width:6.6rem}.tier-table .col-origin{width:6.8rem}.tier-table .col-comment{width:18rem}.tier-table .col-rank{width:3.4rem}.tier-table .col-tier{width:3.2rem}.tier-table th,.tier-table td{padding:.46rem .48rem;border-right:1px solid rgba(255,255,255,.055);border-bottom:1px solid rgba(255,255,255,.065);vertical-align:middle}.tier-table th{position:sticky;top:1.75rem;z-index:7;height:2.45rem;background:#152033;color:#c8d1e0;font:600 .55rem var(--font-cn);letter-spacing:.04em;text-align:center;text-transform:none;white-space:nowrap}.tier-table thead tr:nth-child(2) th:first-child{text-align:left}.column-groups th{top:0;height:1.75rem!important;padding:.25rem .5rem!important;background:#101827!important;color:var(--gold-dim)!important;font:.48rem var(--font-en)!important;letter-spacing:.14em!important}.column-groups th:first-child{background:#571d1b!important;color:#f2c7bd!important}.column-groups th:nth-child(2){background:#5d3d10!important;color:#f3d99a!important}.column-groups th:nth-child(3){background:#163d30!important;color:#a5dec3!important}.column-groups th:last-child{background:#2f2057!important;color:#c9b9f2!important}.tier-table td{height:3.9rem;background:#0e1624;color:#aeb9cc;text-align:center;line-height:1.38}.tier-table tbody tr:hover td{background:#162237}.sticky-weapon{position:sticky;left:0;z-index:6;background:#111b2b!important;text-align:left!important}.tier-table thead .sticky-weapon{z-index:9;background:#172337!important}.sticky-rank{position:sticky;right:3.2rem;z-index:5;background:#111a29!important}.tier-table thead .sticky-rank{z-index:9;background:#172337!important}.sticky-tier{position:sticky;right:0;z-index:5;background:#111a29}.tier-table thead .sticky-tier{z-index:9;background:#172337}.weapon-cell{padding:.35rem!important}.weapon-cell button{display:grid;grid-template-columns:3.1rem minmax(0,1fr);gap:.65rem;align-items:center;width:100%;padding:0;border:0;background:none;color:inherit;text-align:left;cursor:pointer}.tier-weapon-icon{display:grid;place-items:center;width:3.1rem;height:3.1rem;overflow:hidden;background:#151a24;border:1px solid rgba(255,255,255,.1)}.tier-weapon-icon img{width:100%;height:100%;object-fit:contain}.tier-weapon-icon i{color:var(--text-dim);font:.56rem var(--font-en)}.weapon-cell strong,.weapon-cell small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.weapon-cell strong{color:#edf1f8;font-size:.68rem}.weapon-cell small{color:var(--text-dim);font:.48rem var(--font-en)}.numeric{font-family:var(--font-en);font-variant-numeric:tabular-nums}.element-dot{display:inline-block;width:.43rem;height:.43rem;margin-right:.28rem;border-radius:50%;background:#d6d8d9;box-shadow:0 0 .5rem currentColor}.element-dot.arc{color:#6fd8ff;background:currentColor}.element-dot.solar{color:#f27d2a;background:currentColor}.element-dot.void{color:#b46bff;background:currentColor}.element-dot.stasis{color:#7de3f7;background:currentColor}.element-dot.strand{color:#9cf28a;background:currentColor}.comment-cell{text-align:left!important;color:#c3ccda!important;font-size:.59rem;line-height:1.55!important}.sticky-tier strong{font:800 1rem var(--font-en)}.row-tier-s .weapon-cell{box-shadow:inset 3px 0 #60d2a1}.row-tier-a .weapon-cell{box-shadow:inset 3px 0 #a9cf70}.row-tier-b .weapon-cell{box-shadow:inset 3px 0 #e5bd54}.row-tier-c .weapon-cell{box-shadow:inset 3px 0 #df913f}.row-tier-d .weapon-cell{box-shadow:inset 3px 0 #d96861}.tier-table td.tier-s{background:rgba(52,133,100,.94)}.tier-table td.tier-a{background:rgba(96,126,55,.94)}.tier-table td.tier-b{background:rgba(142,105,28,.94)}.tier-table td.tier-c{background:rgba(139,77,27,.94)}.tier-table td.tier-d{background:rgba(132,54,51,.94)}.tier-table td.sticky-tier{color:#fff!important}.tier-method{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 1rem;color:var(--text-dim);font-size:.53rem}.tier-loading{display:grid;gap:1px}.tier-loading i{height:3.9rem;background:linear-gradient(90deg,#0e1624 25%,#182236 45%,#0e1624 65%);background-size:200% 100%;animation:shimmer 1.4s infinite linear}@keyframes shimmer{to{background-position:-200% 0}}
.weapon-overlay{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:1.2rem;background:rgba(3,6,12,.82);backdrop-filter:blur(8px)}.weapon-dialog{position:relative;width:min(38rem,100%);max-height:calc(100dvh - 2.4rem);overflow:auto;padding:1.25rem;background:linear-gradient(155deg,#202b43,#0c1220);border:1px solid var(--line);box-shadow:0 24px 80px rgba(0,0,0,.6)}.detail-close{position:absolute;right:.7rem;top:.55rem;width:2rem;height:2rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);font-size:1.35rem;cursor:pointer}.detail-head{display:grid;grid-template-columns:6rem 1fr;gap:1rem;align-items:center;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}.detail-head>img{width:6rem;height:6rem;object-fit:contain;background:#111}.detail-head small{color:var(--gold-dim);font:.54rem var(--font-en);letter-spacing:.12em}.detail-head h2{margin:.25rem 0 0;font-size:1.3rem}.detail-head p{color:var(--gold-dim);font:.62rem var(--font-en)}.detail-head span{color:var(--text-dim);font-size:.55rem}.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.65rem 1rem;margin-top:1rem}.stat-grid>div{display:grid;grid-template-columns:1fr auto;gap:.25rem}.stat-grid span{font-size:.65rem}.stat-grid span small{display:block;color:var(--text-dim);font:.48rem var(--font-en)}.stat-grid strong{font:700 .7rem var(--font-en)}.stat-grid i{grid-column:1/-1;height:3px;background:rgba(255,255,255,.08)}.stat-grid i b{display:block;height:100%;background:var(--gold)}.weapon-dialog footer{margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--line-soft);font-size:.65rem}
@media(max-width:900px){.tier-controls{grid-template-columns:minmax(14rem,1fr) repeat(2,9rem)}.tier-reset{grid-column:1/-1}.tier-legend{grid-template-columns:repeat(5,minmax(7rem,1fr));overflow-x:auto}}
@media(max-width:620px){.tier-intro{grid-template-columns:1fr;padding:1.2rem}.tier-total{display:grid;grid-template-columns:auto 1fr auto;gap:.6rem;align-items:end;padding:.7rem 0 0;border-top:1px solid var(--line);border-left:0}.tier-total strong{font-size:1.65rem}.tier-controls{grid-template-columns:1fr 1fr}.tier-search,.tier-reset{grid-column:1/-1}.tier-board-shell{width:calc(100vw - 1rem)}.tier-board-head,.tier-method{align-items:flex-start;flex-direction:column}.tier-legend{width:calc(100vw - 2rem)}.legend-item{min-width:8.5rem}.tier-table{min-width:86rem}.tier-table .col-weapon{width:10.5rem}.tier-table td.sticky-rank{position:static}.tier-table thead .sticky-rank{right:auto;z-index:7}.weapon-cell button{grid-template-columns:2.45rem minmax(0,1fr);gap:.45rem}.tier-weapon-icon{width:2.45rem;height:2.45rem}.detail-head{grid-template-columns:4.5rem 1fr}.detail-head>img{width:4.5rem;height:4.5rem}.stat-grid{grid-template-columns:1fr}}
</style>
