<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { ui, localizedOptions, useI18n, localized, uiMessage } from '@/i18n'
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import CommunityPublishGuide from '@/components/CommunityPublishGuide.vue'
import { useRoute, useRouter } from 'vue-router'
import { activityById, classesV2, gearById, subclassById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { usePublicBuilds } from '@/composables/usePublicBuilds'
import { listLocalDrafts, removeLocalDraft } from '@/utils/localDrafts'

const { locale, formatDate } = useI18n()
const route = useRoute()
const router = useRouter()
const { publicBuilds, status, snapshot, error, refresh, config } = usePublicBuilds()
const { iconFor, equipmentItems } = useManifestAssets()
const localDrafts = ref(listLocalDrafts())
const refreshDrafts = () => { localDrafts.value = listLocalDrafts() }
const deleteTarget = ref(null), deleteError = ref('')
function requestDelete(build) { deleteError.value = ''; deleteTarget.value = { id: build.id, name: build.name } }
function deleteDraft() {
  if (!deleteTarget.value) return
  try { removeLocalDraft(deleteTarget.value.id); refreshDrafts(); deleteTarget.value = null }
  catch { deleteError.value = locale.value === 'en' ? 'Could not delete this draft. Please try again.' : '删除失败，请重试。' }
}
// Local storage is not reactive; remove deleted rows from the cached public projection.
const visibleBuilds = computed(() => publicBuilds.value.filter(build => build.source !== 'local-draft' || localDrafts.value.some(entry => entry.id === build.id)))
window.addEventListener('storage', refreshDrafts)
onBeforeUnmount(() => window.removeEventListener('storage', refreshDrafts))

const keyword = ref(String(route.query.q || ''))
const classId = ref(String(route.query.class || ''))
const activityId = ref(String(route.query.activity || ''))
const sort = ref(String(route.query.sort || 'updated'))
const filtersActive = computed(() => Boolean(keyword.value || classId.value || activityId.value))
const listQuery = computed(() => ({ ...route.query, q: keyword.value || undefined, class: classId.value || undefined, activity: activityId.value || undefined, sort: sort.value === 'updated' ? undefined : sort.value }))
watch([keyword, classId, activityId, sort], () => router.replace({ query: listQuery.value }))
watch(() => route.query, query => { keyword.value = String(query.q || ''); classId.value = String(query.class || ''); activityId.value = String(query.activity || ''); sort.value = String(query.sort || 'updated') })
const detailLink = build => ({ path: build.detailPath, query: { from: router.resolve({ path: '/builds', query: listQuery.value }).fullPath } })
const hasPublicBuilds = computed(() => visibleBuilds.value.length > 0)

const classOptions = computed(() => classesV2.filter(item => visibleBuilds.value.some(build => build.classId === item.id)))
const activityOptions = computed(() => {
  const ids = new Set(visibleBuilds.value.flatMap(build => build.activityIds || []))
  return [...ids].map(id => activityById[id]).filter(Boolean)
})
const results = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return visibleBuilds.value.filter(build => {
    const searchable = [build.name, build.goal, build.tags, build.author?.displayName, subclassById[build.subclassId]?.name].flat().filter(Boolean).join(' ').toLowerCase()
    return (!query || searchable.includes(query))
      && (!classId.value || build.classId === classId.value)
      && (!activityId.value || build.activityIds?.includes(activityId.value))
  }).sort((a, b) => sort.value === 'name' ? a.name.localeCompare(b.name, locale.value === 'en' ? 'en' : 'zh-CN') : (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
})

const clearFilters = () => {
  keyword.value = ''
  classId.value = ''
  activityId.value = ''
}
const equipmentByHash = computed(() => new Map(equipmentItems.value.map(item => [Number(item.hash), item])))
const equipment = hash => { const item = equipmentByHash.value.get(Number(hash)); return item ? { ...item, name: localized(item) } : (hash ? { hash, name: `装备 #${hash}` } : null) }
const loadoutFor = build => build.source === 'community' ? build.submission.loadout : build.source === 'local-draft' ? build : null
const coreArmor = build => build.source === 'community' || build.source === 'local-draft' ? Object.values(loadoutFor(build)?.armor || {}).map(a => equipment(a?.manifestHash)).find(a => a?.tierTypeHash === 2759499571) : gearById[build.exoticArmorId]
const weaponItems = build => build.source === 'community' || build.source === 'local-draft' ? (loadoutFor(build)?.weapons || []).map(w => equipment(w.manifestHash)).filter(Boolean) : (build.weapons || []).map(item => gearById[item.itemId]).filter(Boolean)
</script>

<template>
  <div class="build-gallery build-flow">
    <header class="gallery-head">
      <div>
        <p class="eyebrow">{{ ui("PUBLIC BUILDS / 构筑方案") }}</p>
        <h1>{{ ui("构筑方案") }}</h1>
      <p>{{ ui("找到适合你的下一套配装。查看装备与玩法循环，创建副本，把它变成自己的构筑。") }}</p>
      </div>
      <router-link to="/manual-loadout" class="btn primary">{{ ui("创建构筑") }}</router-link>
    </header>

    <div class="community-status" aria-live="polite">
      <span v-if="status === 'unconfigured'">{{ ui("当前页面尚未启用列表同步；可以创建构筑并通过 GitHub 提交。") }}</span>
      <span v-else-if="error" role="alert">{{ uiMessage(error) }} {{ snapshot ? ui("当前显示上次成功同步的数据。") : '' }}</span>
      <span v-else>{{ snapshot ? ui("数据更新于 {0}", [formatDate(snapshot.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })]) : ui("正在读取社区构筑…") }} {{ ui("投稿与更新会在同步完成后显示") }}</span>
      <button v-if="config.enabled" type="button" class="btn" :disabled="status === 'loading'" @click="refresh">{{ status === 'loading' ? ui("刷新中…") : ui("刷新列表") }}</button>
    </div>
    <section v-if="hasPublicBuilds" class="gallery-controls" :aria-label="ui(&quot;筛选公开构筑&quot;)">
      <label class="search-control"><span>{{ ui("搜索方案") }}</span><a-input :aria-label="ui(&quot;搜索方案&quot;)" v-model:value="keyword" allow-clear :placeholder="ui(&quot;名称、玩法、作者或关键词…&quot;)" /></label>
      <label><span>{{ ui("职业") }}</span><a-select popup-class-name="build-select-popup" :aria-label="ui(&quot;筛选职业&quot;)" v-model:value="classId"><a-select-option value="">{{ ui("全部职业") }}</a-select-option><a-select-option v-for="item in classOptions" :key="item.id" :value="item.id">{{ localized(item) }}</a-select-option></a-select></label>
      <label><span>{{ ui("适用玩法") }}</span><a-select popup-class-name="build-select-popup" :aria-label="ui(&quot;筛选玩法&quot;)" v-model:value="activityId"><a-select-option value="">{{ ui("全部玩法") }}</a-select-option><a-select-option v-for="item in activityOptions" :key="item.id" :value="item.id">{{ localized(item) }}</a-select-option></a-select></label>
      <button type="button" class="clear-filters" :disabled="!filtersActive" @click="clearFilters">{{ ui("清除筛选") }}</button>
    </section>

    <div v-if="hasPublicBuilds" class="result-line">
      <span role="status" aria-live="polite"><strong>{{ results.length }}</strong> {{ ui("份方案") }} <small v-if="filtersActive"> {{ ui("/ 共") }} {{ visibleBuilds.length }} {{ ui("份") }}</small></span>
      <label class="sort-control"><span>{{ ui("排序") }}</span><a-select popup-class-name="build-select-popup" v-model:value="sort" :aria-label="ui(&quot;方案排序&quot;)" :options="localizedOptions([{ value: 'updated', label: ui(&quot;最近更新&quot;) }, { value: 'name', label: ui(&quot;名称排序&quot;) }])" /></label>
    </div>

    <DestinyLoading v-if="status === 'loading' && !hasPublicBuilds" :label="ui('正在加载构筑')" />
    <div v-else-if="results.length" class="build-list">
      <article v-for="build in results" :key="build.id" class="build-row" :class="{ 'is-local-draft': build.source === 'local-draft' }">
        <div class="build-identity">
          <span><em v-if="build.source === 'local-draft'" class="draft-badge">{{ ui('本地草稿') }}</em>{{ localized(subclassById[build.subclassId]) || build.subclassId || ui('未选择子职业') }}</span>
          <h2><router-link :class="{ 'draft-preview-link': build.source === 'local-draft' }" :to="build.source === 'local-draft' ? build.detailPath : detailLink(build)">{{ build.name }}</router-link></h2>
          <p>{{ build.goal }}</p>
          <div class="build-meta">
            <span>{{ build.author?.displayName || ui("匿名守护者") }}</span>
            <span v-if="build.publishedAt">{{ ui("更新于") }} {{ formatDate(build.publishedAt) }}</span>
            <span>{{ build.source === 'community' ? ui("社区投稿") : build.difficulty }}</span>
          </div>
        </div>
        <div class="build-loadout" :aria-label="ui(&quot;核心装备&quot;)">
          <div v-if="coreArmor(build)">
            <img v-if="iconFor(coreArmor(build))" :src="iconFor(coreArmor(build))" :alt="coreArmor(build).name" />
            <span><small>{{ ui("核心护甲") }}</small><strong>{{ localized(coreArmor(build)) }}</strong></span>
          </div>
          <div v-for="weapon in weaponItems(build).slice(0, 3)" :key="weapon.hash || weapon.id">
            <img v-if="iconFor(weapon)" :src="iconFor(weapon)" :alt="weapon.name" />
            <span><small>{{ ({ kinetic: ui("动能栏位"), energy: ui("能量栏位"), power: ui("威能栏位") })[weapon.ammoSlot || weapon.slot] || weapon.slot || ui("推荐武器") }}</small><strong>{{ localized(weapon) }}</strong></span>
          </div>
        </div>
        <footer>
          <div class="activity-tags"><span v-for="id in build.activityIds" :key="id">{{ localized(activityById[id]) || id }}</span></div>
          <div v-if="build.source === 'local-draft'" class="draft-actions">
            <router-link class="draft-edit-action" :to="build.editPath">{{ ui('继续编辑') }} <span aria-hidden="true">→</span></router-link>
            <a-dropdown :trigger="['click']" placement="bottomRight">
              <a-button class="draft-more-action" :aria-label="`${ui('更多操作')}：${build.name}`" :title="ui('更多操作')" aria-haspopup="menu">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
              </a-button>
              <template #overlay><a-menu>
                <a-menu-item key="preview"><router-link :to="build.detailPath">{{ ui('查看预览') }}</router-link></a-menu-item>
                <a-menu-divider />
                <a-menu-item key="delete" danger @click="requestDelete(build)">{{ ui('删除草稿') }}</a-menu-item>
              </a-menu></template>
            </a-dropdown>
          </div>
          <router-link v-else :to="detailLink(build)">{{ ui("查看完整方案") }} <span aria-hidden="true">→</span></router-link>
        </footer>
      </article>
    </div>
    <section v-else-if="status !== 'error'" class="empty-state flow-empty">
      <span>{{ hasPublicBuilds ? 'NO MATCHES' : 'YOUR BUILD COULD BE FIRST' }}</span>
      <h2>{{ hasPublicBuilds ? ui("没有符合筛选的构筑") : ui("暂时没有公开构筑方案") }}</h2>
      <p>{{ hasPublicBuilds ? ui("试试其他关键词，或清除筛选，重新发现适合你的方案。") : ui("从职业与技能开始，记录你的装备搭配与玩法思路。") }}</p>
      <div><button v-if="filtersActive" type="button" class="btn" @click="clearFilters">{{ ui("清除筛选") }}</button><router-link to="/manual-loadout" class="btn primary">{{ ui("创建构筑") }}</router-link></div>
    </section>
    <section v-else class="flow-empty"><span class="flow-kicker">CONNECTION INTERRUPTED</span><h2>{{ ui("暂时无法读取构筑") }}</h2><p>{{ ui("请检查网络后重试。你也可以先创建自己的构筑。") }}</p><div class="flow-actions"><button v-if="config.enabled" class="btn" type="button" @click="refresh">{{ ui("重新加载") }}</button><router-link to="/manual-loadout" class="btn primary">{{ ui("创建构筑") }}</router-link></div></section>
    <a-modal :open="Boolean(deleteTarget)" :title="ui('删除这份本地草稿？')" :ok-text="ui('删除')" :cancel-text="ui('保留')" :ok-button-props="{ danger: true }" @ok="deleteDraft" @cancel="deleteTarget = null">
      <p class="delete-draft-name">{{ deleteTarget?.name }}</p><p>{{ ui('删除后无法从本站恢复。') }}</p>
      <p v-if="deleteError" role="alert">{{ deleteError }}</p>
    </a-modal>
    <CommunityPublishGuide />
    <p class="gallery-disclaimer">{{ ui("社区方案保留完整词条组合与作者备注。通过配置检查不代表经过实机验证。") }}</p>
  </div>
</template>

<style scoped>
.community-status{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;color:var(--text-dim);font-size:.75rem}.community-status [role=alert]{color:var(--warn)}.community-status button{flex-shrink:0}.build-identity h2,.build-identity p{overflow-wrap:anywhere}

.build-gallery{padding:1rem 0 4rem}.gallery-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2rem;align-items:end;padding:2.5rem 0 2.2rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line-soft)}.gallery-head>div{max-width:48rem}.eyebrow{color:var(--gold-dim);font:600 .65rem var(--font-en);letter-spacing:.2em}.gallery-head h1{margin:.45rem 0 .7rem;font-family:var(--font-cn);font-size:clamp(2.5rem,6vw,4.6rem);line-height:1;letter-spacing:-.05em}.gallery-head p:not(.eyebrow){max-width:44rem;text-wrap:pretty}.gallery-controls{display:grid;grid-template-columns:minmax(16rem,1fr) 12rem 15rem auto;gap:.7rem;align-items:end;padding:1rem 0;border-bottom:1px solid var(--line-soft)}.gallery-controls label{display:grid;gap:.35rem;color:var(--text-dim);font-size:.65rem}.gallery-controls .ant-select{width:100%}.clear-filters{height:42px;padding:0 1rem;border:1px solid var(--line-soft);background:transparent;color:var(--gold-dim);font:inherit;font-size:.68rem;cursor:pointer;transition:.2s}.clear-filters:hover{border-color:var(--line);color:var(--gold-bright);background:rgba(232,193,90,.06)}.result-line{display:flex;justify-content:space-between;gap:1rem;padding:1.1rem 0;color:var(--gold-bright);font-size:.78rem}.result-line small{color:var(--text-dim)}.build-list{display:grid;gap:1px;background:var(--line-soft)}.build-row{display:grid;grid-template-columns:minmax(18rem,.9fr) minmax(25rem,1.1fr);gap:1.5rem;padding:1.35rem;background:var(--bg-dark);transition:background .2s,transform .2s}.build-row:hover{position:relative;background:#111b2c;transform:translateX(2px)}.build-identity>span{color:var(--gold-dim);font:.62rem var(--font-en);letter-spacing:.08em}.build-identity h2{margin:.35rem 0 .5rem;font-family:var(--font-cn);font-size:1.25rem}.build-identity>p{font-size:.78rem;line-height:1.7}.build-meta{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.8rem;color:var(--text-dim);font-size:.62rem}.build-loadout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}.build-loadout>div{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:.55rem;align-items:center;min-width:0;padding:.5rem;background:rgba(255,255,255,.025)}.build-loadout img{width:3rem;height:3rem;object-fit:cover;background:#0b111d}.build-loadout span,.build-loadout strong,.build-loadout small{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.build-loadout small{color:var(--text-dim);font-size:.56rem}.build-loadout strong{font-size:.68rem}.build-row footer{grid-column:1/-1;display:flex;align-items:center;gap:1rem;padding-top:.8rem;border-top:1px solid var(--line-soft)}.activity-tags{display:flex;gap:.35rem;flex-wrap:wrap;margin-right:auto}.activity-tags span{padding:.25rem .45rem;border-left:1px solid var(--gold-dim);background:rgba(232,193,90,.045);color:var(--text-sub);font-size:.6rem}.build-row footer>a{color:var(--gold-bright);font-size:.72rem}.loading{background:transparent}.empty-state{padding:4rem 1.5rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.02);text-align:center}.empty-state>span{color:var(--gold-dim);font:.6rem var(--font-en);letter-spacing:.2em}.empty-state h2{margin:.6rem 0;font-family:var(--font-cn)}.empty-state>div{display:flex;justify-content:center;gap:.6rem;margin-top:1.3rem}
@media(max-width:850px){.gallery-controls{grid-template-columns:1fr 1fr}.search-control{grid-column:1/-1}.build-row{grid-template-columns:1fr}.build-row footer{grid-column:auto}.gallery-head{align-items:start}}
@media(max-width:600px){.gallery-head{grid-template-columns:1fr}.gallery-controls{grid-template-columns:1fr}.search-control{grid-column:auto}.build-loadout{grid-template-columns:1fr}.build-row footer{align-items:flex-start;flex-direction:column}.activity-tags{margin-right:0}.result-line small{display:none}}
</style>

<style scoped>
.gallery-head { align-items: center; padding: 2.2rem 0 2.6rem; border-top: 0; }
.gallery-head h1 { font-size: clamp(2.25rem,5vw,3.6rem); letter-spacing: -.035em; line-height: 1.2; }
.gallery-head .btn { border-radius: var(--radius-sm); min-width: 136px; }
.gallery-head p:not(.eyebrow) { max-width: 36rem; font-size: .9rem; }
.community-status { padding: 1rem 0; color: var(--text-sub); font-size: .75rem; }
.community-status .btn { padding: .45rem .75rem; border-radius: var(--radius-sm); font-size: .75rem; }
.gallery-controls { background: var(--bg-dark); border: 1px solid var(--line-soft); border-radius: var(--radius); padding: 1.15rem; grid-template-columns: minmax(0,1fr) minmax(0,12rem) minmax(0,14rem) auto; gap: 1rem; }
.gallery-controls label { color: var(--text-sub); font-size: .75rem; min-width: 0; }
.gallery-controls .ant-select { min-width: 0; }
.clear-filters { border-radius: var(--radius-sm); color: var(--text-sub); font-size: .75rem; }
.clear-filters:disabled { opacity: .35; cursor: default; }
.result-line { align-items: center; color: var(--text-sub); padding: 1.25rem 0; }
.result-line strong { color: var(--text-main); font: 1.3rem var(--font-en); margin-right: .25rem; }
.sort-control { display: flex; align-items: center; gap: .65rem; font-size: .75rem; }.result-line .ant-select { width: 135px; }
.build-list { gap: 1rem; background: transparent; }
.build-row { border: 1px solid var(--line-soft); border-radius: var(--radius); padding: 1.5rem; transition: border-color .2s, background .2s; }
.build-row:hover, .build-row:focus-within { transform: none; border-color: var(--line); background: var(--bg-panel); }
.build-identity > span { color: var(--gold); font: .75rem var(--font-cn); }
.build-identity h2 { font-size: 1.35rem; line-height: 1.45; margin: .5rem 0; }
.build-identity h2 a { color: var(--text-main); }
.build-identity h2 a:hover { color: var(--gold-bright); }
.build-identity > p { font-size: .85rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.build-meta { font-size: .72rem; color: var(--text-sub); }
.build-loadout > div { border: 1px solid var(--line-soft); border-radius: var(--radius-sm); }
.build-loadout small { font-size: .65rem; color: var(--text-sub); }
.build-loadout strong { font-size: .78rem; }
.build-loadout img { border-radius: 4px; }
.build-row footer > a { padding: .5rem 0 .5rem 1rem; font-size: .82rem; white-space: nowrap; }
.activity-tags span { border: 1px solid var(--line-soft); border-radius: 4px; font-size: .7rem; }
.gallery-disclaimer { font-size: .75rem; margin-top: 1rem; }
.draft-badge { display: inline-flex; padding: .15rem .45rem; margin-right: .45rem; border: 1px solid rgba(255,180,84,.45); border-radius: 4px; color: var(--warn); font: 600 .62rem var(--font-cn); font-style: normal; vertical-align: middle; }
.is-local-draft { border-left: 2px solid var(--warn); }
.is-local-draft { position: relative; }
.draft-preview-link::after { content: ''; position: absolute; inset: 0; border-radius: var(--radius); z-index: 1; }
.draft-preview-link:focus-visible { outline: none; }
.draft-preview-link:focus-visible::after { outline: 2px solid var(--gold); outline-offset: 3px; }
.draft-actions { position: relative; z-index: 2; display: flex; align-items: center; gap: .5rem; margin-left: auto; }
.draft-edit-action { display: inline-flex; align-items: center; justify-content: center; gap: .65rem; min-height: 44px; padding: .6rem 1rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: rgba(232,193,90,.08); color: var(--gold-bright); font-size: .82rem; font-weight: 600; }
.draft-edit-action:hover { border-color: var(--gold-dim); background: rgba(232,193,90,.16); }
.draft-more-action.ant-btn { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0; border-radius: var(--radius-sm); }
.delete-draft-name { color: var(--text-main); font-weight: 600; margin-bottom: .5rem; overflow-wrap: anywhere; }
@media(max-width:600px) { .is-local-draft footer { flex-direction: row; flex-wrap: wrap; }.is-local-draft .activity-tags:empty { display: none; }.draft-actions { width: 100%; }.draft-edit-action { flex: 1; } }
@media(max-width:950px) { .gallery-controls { grid-template-columns: 1fr 1fr; } .search-control { grid-column: 1/-1; } .clear-filters { grid-column: 1/-1; } .build-row { grid-template-columns: 1fr; } }
@media(max-width:600px) { .gallery-head { gap: 1.2rem; padding-top: .8rem; } .gallery-head .btn { width: 100%; } .gallery-controls { padding: .85rem; gap: .75rem; } .search-control { grid-column: 1/-1; } .build-row { padding: 1rem; gap: 1rem; } .build-loadout { grid-template-columns: repeat(2,minmax(0,1fr)); } .build-loadout > div { grid-template-columns: 2.25rem minmax(0,1fr); padding: .4rem; gap: .4rem; } .build-loadout img { width: 2.25rem; height: 2.25rem; } .build-loadout strong { font-size: .72rem; } .build-row footer { gap: .6rem; } .build-row footer > a { width: 100%; text-align: center; padding: .65rem; background: rgba(232,193,90,.07); border-radius: var(--radius-sm); } }
</style>
