<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { activityById, classesV2, gearById, subclassById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { usePublicBuilds } from '@/composables/usePublicBuilds'

const route = useRoute()
const { publicBuilds, status, snapshot, error, refresh, config } = usePublicBuilds()
const { iconFor, equipmentItems } = useManifestAssets()

const keyword = ref(String(route.query.q || ''))
const classId = ref(String(route.query.class || ''))
const activityId = ref(String(route.query.activity || ''))
const hasPublicBuilds = computed(() => publicBuilds.value.length > 0)

const classOptions = computed(() => classesV2.filter(item => publicBuilds.value.some(build => build.classId === item.id)))
const activityOptions = computed(() => {
  const ids = new Set(publicBuilds.value.flatMap(build => build.activityIds || []))
  return [...ids].map(id => activityById[id]).filter(Boolean)
})
const results = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return publicBuilds.value.filter(build => {
    const searchable = [build.name, build.goal, build.tags, build.author?.displayName, subclassById[build.subclassId]?.name].flat().filter(Boolean).join(' ').toLowerCase()
    return (!query || searchable.includes(query))
      && (!classId.value || build.classId === classId.value)
      && (!activityId.value || build.activityIds?.includes(activityId.value))
  })
})

const clearFilters = () => {
  keyword.value = ''
  classId.value = ''
  activityId.value = ''
}
const equipment = hash => { const item = equipmentItems.value.find(e => e.hash === hash); return item ? { ...item, name: item.nameZh || item.name } : (hash ? { hash, name: `装备 #${hash}` } : null) }
const coreArmor = build => build.source === 'community' ? Object.values(build.submission.loadout.armor).map(a => equipment(a?.manifestHash)).find(a => a?.tierTypeHash === 2759499571) : gearById[build.exoticArmorId]
const weaponItems = build => build.source === 'community' ? build.submission.loadout.weapons.map(w => equipment(w.manifestHash)).filter(Boolean) : (build.weapons || []).map(item => gearById[item.itemId]).filter(Boolean)
</script>

<template>
  <div class="build-gallery">
    <header class="gallery-head">
      <div>
        <p class="eyebrow">PUBLIC BUILDS / 构筑方案</p>
        <h1>构筑方案</h1>
      <p>发现守护者分享的装备、天赋与玩法循环。在配装台创作，通过 GitHub 发布你的方案。社区投稿通过配置检查，不代表经过实机验证。</p>
      </div>
      <router-link to="/manual-loadout" class="btn primary">创建构筑</router-link>
    </header>

    <div class="community-status" aria-live="polite">
      <span v-if="status === 'unconfigured'">社区投稿尚未启用，可以先在本地创建构筑。</span>
      <span v-else-if="error" role="alert">{{ error }} {{ snapshot ? '当前显示上次成功同步的数据。' : '' }}</span>
      <span v-else>{{ snapshot ? `数据更新于 ${new Date(snapshot.generatedAt).toLocaleString()}` : '正在读取社区构筑…' }} GitHub 操作将在同步完成后显示</span>
      <button v-if="config.enabled" type="button" class="btn" :disabled="status === 'loading'" @click="refresh">{{ status === 'loading' ? '刷新中…' : '刷新列表' }}</button>
    </div>
    <section v-if="hasPublicBuilds" class="gallery-controls" aria-label="筛选公开构筑">
      <label class="search-control"><span>搜索方案</span><a-input v-model:value="keyword" allow-clear placeholder="名称、玩法、作者或关键词…" /></label>
      <label><span>职业</span><a-select v-model:value="classId"><a-select-option value="">全部职业</a-select-option><a-select-option v-for="item in classOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option></a-select></label>
      <label><span>适用玩法</span><a-select v-model:value="activityId"><a-select-option value="">全部玩法</a-select-option><a-select-option v-for="item in activityOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option></a-select></label>
      <button type="button" class="clear-filters" @click="clearFilters">清除筛选</button>
    </section>

    <div v-if="hasPublicBuilds" class="result-line">
      <span>{{ results.length }} 份公开方案</span>
      <small>社区投稿 保留完整词条组合与作者备注</small>
    </div>

    <div v-if="status === 'loading'" class="build-list loading" aria-label="正在加载构筑">
      <i v-for="n in 4" :key="n"></i>
    </div>
    <div v-else-if="results.length" class="build-list">
      <article v-for="build in results" :key="build.id" class="build-row">
        <div class="build-identity">
          <span>{{ subclassById[build.subclassId]?.name || build.subclassId }}</span>
          <h2>{{ build.name }}</h2>
          <p>{{ build.goal }}</p>
          <div class="build-meta">
            <span>{{ build.author?.displayName || '匿名守护者' }}</span>
            <span v-if="build.publishedAt">更新于 {{ new Date(build.publishedAt).toLocaleDateString() }}</span>
            <span>{{ build.source === 'community' ? '社区投稿' : build.difficulty }}</span>
          </div>
        </div>
        <div class="build-loadout" aria-label="核心装备">
          <div v-if="coreArmor(build)">
            <img v-if="iconFor(coreArmor(build))" :src="iconFor(coreArmor(build))" :alt="coreArmor(build).name" />
            <span><small>核心护甲</small><strong>{{ coreArmor(build).name }}</strong></span>
          </div>
          <div v-for="weapon in weaponItems(build).slice(0, 3)" :key="weapon.hash || weapon.id">
            <img v-if="iconFor(weapon)" :src="iconFor(weapon)" :alt="weapon.name" />
            <span><small>{{ weapon.slot }}</small><strong>{{ weapon.name }}</strong></span>
          </div>
        </div>
        <footer>
          <div class="activity-tags"><span v-for="id in build.activityIds" :key="id">{{ activityById[id]?.name || id }}</span></div>
          <router-link :to="build.detailPath">查看完整方案 <span aria-hidden="true">→</span></router-link>
        </footer>
      </article>
    </div>
    <section v-else-if="status !== 'error'" class="empty-state">
      <span>{{ hasPublicBuilds ? 'NO MATCHES' : 'YOUR BUILD COULD BE FIRST' }}</span>
      <h2>{{ hasPublicBuilds ? '没有符合筛选的构筑' : '暂时没有公开构筑方案' }}</h2>
      <p>创建一份自己的构筑，分享装备选择与玩法思路。</p>
      <div><button type="button" class="btn" @click="clearFilters">清除筛选</button><router-link to="/manual-loadout" class="btn primary">创建构筑</router-link></div>
    </section>
  </div>
</template>

<style scoped>
.community-status{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;color:var(--text-dim);font-size:.75rem}.community-status [role=alert]{color:var(--warn)}.community-status button{flex-shrink:0}.build-identity h2,.build-identity p{overflow-wrap:anywhere}

.build-gallery{padding:1rem 0 4rem}.gallery-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2rem;align-items:end;padding:2.5rem 0 2.2rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line-soft)}.gallery-head>div{max-width:48rem}.eyebrow{color:var(--gold-dim);font:600 .65rem var(--font-en);letter-spacing:.2em}.gallery-head h1{margin:.45rem 0 .7rem;font-family:var(--font-cn);font-size:clamp(2.5rem,6vw,4.6rem);line-height:1;letter-spacing:-.05em}.gallery-head p:not(.eyebrow){max-width:44rem;text-wrap:pretty}.gallery-controls{display:grid;grid-template-columns:minmax(16rem,1fr) 12rem 15rem auto;gap:.7rem;align-items:end;padding:1rem 0;border-bottom:1px solid var(--line-soft)}.gallery-controls label{display:grid;gap:.35rem;color:var(--text-dim);font-size:.65rem}.gallery-controls .ant-select{width:100%}.clear-filters{height:42px;padding:0 1rem;border:1px solid var(--line-soft);background:transparent;color:var(--gold-dim);font:inherit;font-size:.68rem;cursor:pointer;transition:.2s}.clear-filters:hover{border-color:var(--line);color:var(--gold-bright);background:rgba(232,193,90,.06)}.result-line{display:flex;justify-content:space-between;gap:1rem;padding:1.1rem 0;color:var(--gold-bright);font-size:.78rem}.result-line small{color:var(--text-dim)}.build-list{display:grid;gap:1px;background:var(--line-soft)}.build-row{display:grid;grid-template-columns:minmax(18rem,.9fr) minmax(25rem,1.1fr);gap:1.5rem;padding:1.35rem;background:var(--bg-dark);transition:background .2s,transform .2s}.build-row:hover{position:relative;background:#111b2c;transform:translateX(2px)}.build-identity>span{color:var(--gold-dim);font:.62rem var(--font-en);letter-spacing:.08em}.build-identity h2{margin:.35rem 0 .5rem;font-family:var(--font-cn);font-size:1.25rem}.build-identity>p{font-size:.78rem;line-height:1.7}.build-meta{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.8rem;color:var(--text-dim);font-size:.62rem}.build-loadout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}.build-loadout>div{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:.55rem;align-items:center;min-width:0;padding:.5rem;background:rgba(255,255,255,.025)}.build-loadout img{width:3rem;height:3rem;object-fit:cover;background:#0b111d}.build-loadout span,.build-loadout strong,.build-loadout small{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.build-loadout small{color:var(--text-dim);font-size:.56rem}.build-loadout strong{font-size:.68rem}.build-row footer{grid-column:1/-1;display:flex;align-items:center;gap:1rem;padding-top:.8rem;border-top:1px solid var(--line-soft)}.activity-tags{display:flex;gap:.35rem;flex-wrap:wrap;margin-right:auto}.activity-tags span{padding:.25rem .45rem;border-left:1px solid var(--gold-dim);background:rgba(232,193,90,.045);color:var(--text-sub);font-size:.6rem}.build-row footer>a{color:var(--gold-bright);font-size:.72rem}.loading{background:transparent}.loading i{height:12rem;background:linear-gradient(90deg,var(--bg-dark) 25%,var(--bg-card) 45%,var(--bg-dark) 65%);background-size:200% 100%;animation:shimmer 1.4s infinite linear}@keyframes shimmer{to{background-position:-200% 0}}.empty-state{padding:4rem 1.5rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.02);text-align:center}.empty-state>span{color:var(--gold-dim);font:.6rem var(--font-en);letter-spacing:.2em}.empty-state h2{margin:.6rem 0;font-family:var(--font-cn)}.empty-state>div{display:flex;justify-content:center;gap:.6rem;margin-top:1.3rem}
@media(max-width:850px){.gallery-controls{grid-template-columns:1fr 1fr}.search-control{grid-column:1/-1}.build-row{grid-template-columns:1fr}.build-row footer{grid-column:auto}.gallery-head{align-items:start}}
@media(max-width:600px){.gallery-head{grid-template-columns:1fr}.gallery-controls{grid-template-columns:1fr}.search-control{grid-column:auto}.build-loadout{grid-template-columns:1fr}.build-row footer{align-items:flex-start;flex-direction:column}.activity-tags{margin-right:0}.result-line small{display:none}}
</style>
