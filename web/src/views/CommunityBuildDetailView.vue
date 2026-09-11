<script setup>
import DestinyLoading from '@/components/DestinyLoading.vue'
import { ui, uiMessage, useI18n, localized, formatDate } from '@/i18n'
import { computed, ref, watch, onMounted } from 'vue'
import LoadoutSheet from '@/components/LoadoutSheet.vue'
import LoadoutExportButton from '@/components/LoadoutExportButton.vue'
import { useRoute } from 'vue-router'
import { usePublicBuilds } from '@/composables/usePublicBuilds'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { useLoadoutVisuals } from '@/composables/useLoadoutVisuals'
import { abilities, aspects, facets, fragments, subclasses, classById, activityById } from '@/data/v2'
import { createLoadoutExportModel } from '@/utils/loadoutExportModel'
import { encodeDraft } from '../../../packages/loadout-planner/index.js'

const route = useRoute(), message = ref(''), copiedCode = ref(''), manualCopy = ref(false)
const { snapshot, status, error, refresh, config } = usePublicBuilds()
const { locale } = useI18n()
const manifest = useManifestAssets()
const perkPool = useWeaponPerks()
onMounted(perkPool.load)
const perkByHash = computed(() => perkPool.state.value === 'ready' && perkPool.version.value === manifest.snapshot.value.manifestVersion ? perkPool.byHash.value : new Map())
const build = computed(() => snapshot.value?.builds.find(b => b.number === Number(route.params.issueNumber)))
const draft = computed(() => build.value?.submission.loadout)
watch(build, () => { copiedCode.value = ''; message.value = ''; manualCopy.value = false })
const returnLink = computed(() => /^\/builds(?:\?|$)/.test(String(route.query.from || '')) ? String(route.query.from) : '/builds')
const subclass = computed(() => subclasses.find(s => s.id === draft.value?.subclassId))
const { visualIcon, visualDescription } = useLoadoutVisuals(manifest, subclass)
const model = computed(() => draft.value ? createLoadoutExportModel(draft.value, { locale: locale.value,
  equipment: manifest.equipmentItems.value, mods: manifest.manifestMods.value, artifacts: manifest.artifacts.value,
  itemSets: manifest.itemSets.value, subclasses, abilities, aspects, facets, fragments, classes: classById,
  snapshot: manifest.snapshot.value, iconFor: visualIcon, descriptionFor: visualDescription,
  perkByHash: perkByHash.value, issues: build.value.warnings
}) : null)
const editorLink = edit => ({ path: '/manual-loadout', query: { community: build.value.number, from: returnLink.value, ...(edit ? { mode: 'edit' } : {}) } })
async function copyCode() {
  copiedCode.value = encodeDraft(draft.value)
  try { await navigator.clipboard.writeText(copiedCode.value); manualCopy.value = false; message.value = '配装代码已复制，包含全部词条组合和备注。' }
  catch { manualCopy.value = true; message.value = '自动复制不可用，可在下方全选复制配装代码。' }
}
async function prepareImageExport() {
  await perkPool.load()
  const prepared = model.value
  if (!prepared) return null
  const compatible = perkPool.state.value === 'ready' && perkPool.version.value === manifest.snapshot.value.manifestVersion
  return { ...prepared, warnings: [...prepared.warnings, ...(compatible ? [] : [ui('Perk 图标数据未就绪或版本不一致，已保留原推荐文字与 Hash，请核对。')])] }
}
</script>

<template>
  <div class="community-detail build-flow">
    <router-link class="back" :to="returnLink">{{ ui("← 返回构筑方案") }}</router-link>
    <div class="sync-line"><span>{{ snapshot ? ui("社区数据更新于 {0}", [formatDate(snapshot.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })]) : ui("社区构筑") }}</span><button v-if="config.enabled" type="button" class="btn" :disabled="status === 'loading'" @click="refresh">{{ status === 'loading' ? ui("刷新中…") : ui("刷新构筑") }}</button></div>
    <p v-if="error" class="notice" role="alert">{{ uiMessage(error) }} {{ snapshot ? ui("当前是上次成功同步的数据。") : '' }}</p>
    <DestinyLoading v-if="status === 'loading' && !snapshot" :label="ui('正在读取构筑…')" />
    <template v-else-if="build">
      <header class="detail-header"><div><span class="eyebrow">{{ ui("COMMUNITY BUILD / 社区投稿 #") }}{{ build.number }}</span><h1>{{ draft.name }}</h1><p>{{ build.submission.summary }}</p><div class="byline"><span>@{{ build.author.login }}</span><span>{{ localized(classById[draft.classId]) }} {{ localized(subclass) }}</span><span>{{ ui("更新于") }} {{ formatDate(build.updatedAt) }}</span></div></div><div class="verification"><b>{{ ui("社区投稿") }}</b><span>{{ ui("通过配置检查") }}</span><small>{{ ui("不代表实机验证") }}</small></div></header>
      <nav class="detail-actions flow-actions" :aria-label="ui(&quot;构筑操作&quot;)"><router-link class="btn primary" :to="editorLink(false)">{{ ui("以此创建副本") }}</router-link><router-link class="btn" :to="editorLink(true)">{{ ui("修改原投稿") }}</router-link><LoadoutExportButton :key="build.number" :disabled="manifest.status.value !== 'ready'" :prepare="prepareImageExport" /><button type="button" class="btn" @click="copyCode">{{ ui("复制配装代码") }}</button><a class="btn" :href="build.issueUrl" target="_blank" rel="noopener noreferrer">{{ ui("GitHub 原文 / 下架与恢复 ↗") }}</a></nav>
      <details class="management-help"><summary>{{ ui("投稿管理与同步说明") }}</summary><p class="help">{{ ui("作者可在 GitHub 关闭或重开 Issue；被屏蔽的投稿需由管理者解除屏蔽。更新将在同步成功后显示，关闭不使原文私密。") }}</p></details>
      <p v-if="message" class="flow-notice" role="status">{{ uiMessage(message) }}</p><details v-if="copiedCode" :open="manualCopy"><summary>{{ ui("查看配装代码") }}</summary><a-textarea :value="copiedCode" readonly :aria-label="ui(&quot;配装代码&quot;)" :rows="3" /></details>
      <div class="tags"><span v-for="id in build.submission.activityIds" :key="id">{{ activityById[id]?.name || id }}</span><span v-for="tag in build.submission.tags" :key="tag">{{ tag }}</span></div>
      <details class="management-help"><summary>{{ ui("版本与配置提示") }} <span v-if="model.warnings.length">（{{ model.warnings.length }}）</span></summary><p class="help">{{ ui("校验快照：") }}{{ snapshot.manifestVersion }} {{ ui("原稿版本：") }}{{ draft.manifestVersion || ui("未提供") }}</p><p v-for="warning in model.warnings" :key="warning" class="notice">{{ uiMessage(warning) }}</p></details>
      <p v-if="manifest.status.value !== 'ready'" class="notice">{{ manifest.status.value === 'error' ? ui("装备名称与配图加载失败，原始配置仍已保留。") : ui("正在加载装备名称与配图…") }}</p>
      <section class="export-sheet-section"><h2>{{ ui("配装一图流") }}</h2><LoadoutSheet :model="model" /></section>
      <footer class="detail-end"><div><h2>{{ ui("从这套构筑，开始你的下一次尝试") }}</h2><p>{{ ui("完整保留装备、词条和备注，在副本中自由调整。") }}</p></div><router-link class="btn primary" :to="editorLink(false)">{{ ui("以此创建副本 →") }}</router-link></footer>
    </template>
    <section v-else class="unavailable"><span class="eyebrow">BUILD UNAVAILABLE</span><h1>{{ status === 'unconfigured' ? ui("当前页面尚未启用列表同步") : ui("这份构筑暂不可用") }}</h1><p>{{ ui("投稿可能尚未同步、已经下架或需要修复。请刷新列表查看最新结果。") }}</p><router-link to="/builds" class="btn">{{ ui("返回构筑方案") }}</router-link></section>
  </div>
</template>

<style scoped>
.community-detail{padding:1rem 0 4rem}.back{color:var(--gold-dim);font-size:.8rem}.sync-line{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;color:var(--text-dim);font-size:.7rem}.detail-header{display:grid;grid-template-columns:1fr auto;gap:2rem;padding:2.5rem 0;border-block:1px solid var(--line-soft)}.eyebrow{font:.65rem var(--font-en);letter-spacing:.15em;color:var(--gold-dim)}h1{font-size:clamp(2rem,5vw,4rem);line-height:1.2;margin:.6rem 0 1rem;overflow-wrap:anywhere}.detail-header p,.notes{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}.byline{display:flex;gap:1rem;flex-wrap:wrap;color:var(--text-dim);font-size:.75rem;margin-top:1rem}.verification{display:flex;flex-direction:column;gap:.5rem;justify-content:center;color:var(--gold)}.verification small{color:var(--text-dim)}.detail-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin:1.5rem 0 .75rem}.help{font-size:.72rem;color:var(--text-dim);line-height:1.8}.notice{border-left:2px solid var(--warn);padding:.7rem 1rem;color:var(--warn);font-size:.78rem}.tags{display:flex;gap:.5rem;flex-wrap:wrap;margin:1rem 0}.tags span{border:1px solid var(--line-soft);padding:.3rem .6rem;font-size:.7rem}.section{padding:1.75rem 0;border-bottom:1px solid var(--line-soft)}h2{font-size:1.1rem;margin:0 0 1rem}h3{font-size:.85rem;margin:.3rem 0;overflow-wrap:anywhere}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:.65rem}.card{display:flex;align-items:flex-start;gap:.75rem;padding:.9rem;background:var(--bg-card);min-width:0}.card img{width:48px;height:48px;object-fit:contain;flex-shrink:0}.card p{font-size:.75rem;line-height:1.7;white-space:pre-wrap}.card small,li small{color:var(--text-dim);font-size:.65rem}.weapons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.weapons>article,.armor>article{border:1px solid var(--line-soft);min-width:0}.combination{padding:.8rem;border-top:1px solid var(--line-soft)}h4{color:var(--gold);font-size:.78rem;margin:0 0 .6rem}dl{margin:0}dl>div{display:grid;grid-template-columns:5rem 1fr;gap:.5rem;padding:.3rem 0;font-size:.72rem}dt{color:var(--text-dim)}dd{margin:0;overflow-wrap:anywhere}.notes{font-size:.8rem;padding:.7rem}.armor{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:.6rem}.armor ul{padding:0 1rem;list-style:none;font-size:.75rem;line-height:2}.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line-soft)}.stats>div{display:grid;gap:.5rem;padding:1rem;background:var(--bg-card)}.stats span{font-size:.72rem;color:var(--text-dim)}.stats strong{color:var(--gold);font-size:.9rem}.set{padding:1rem;font-size:.75rem}.unavailable{text-align:center;padding:4rem 1rem}textarea{width:100%;box-sizing:border-box;background:var(--bg-card);color:var(--text-sub);border:1px solid var(--line-soft);padding:.7rem}.community-detail [role=status]{color:var(--gold);font-size:.75rem}@media(max-width:850px){.weapons{grid-template-columns:1fr}.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.detail-header{grid-template-columns:1fr}.verification{flex-direction:row;flex-wrap:wrap;justify-content:flex-start}.detail-actions>*{flex:1 1 42%;text-align:center}.sync-line>span{max-width:65%}}
</style>

<style scoped>
.detail-header { border-top-color: var(--line); grid-template-columns: minmax(0,1fr) auto; }
.detail-header h1 { font-family: var(--font-cn); letter-spacing: -.035em; }
.detail-header > div:first-child { max-width: 51rem; }
.verification { align-self: center; border-left: 1px solid var(--line); padding-left: 1.5rem; font-size: .8rem; }
.detail-actions { margin-bottom: 1rem; }
.management-help { margin: .75rem 0; color: var(--text-sub); font-size: .75rem; }
.management-help summary { cursor: pointer; padding: .35rem 0; }
.management-help .help { padding: .5rem 1rem; border-left: 1px solid var(--line); }
.section { padding: 2rem 0; }
.section h2 { display: flex; align-items: center; gap: .7rem; font-size: 1.2rem; }
.section h2::before { content: ''; width: 3px; height: 18px; background: var(--gold); }
.card:hover { transform: none; box-shadow: none; border-color: var(--line-soft); }
.card { background: var(--bg-panel); border-radius: var(--radius-sm); }
.card p, .armor ul, dl > div { font-size: .8rem; }
.card small, li small { font-size: .72rem; color: var(--text-sub); }
.weapons > article, .armor > article { border-radius: var(--radius); overflow: hidden; background: var(--bg-dark); }
.weapons > article > .card, .armor > article > .card { border: 0; border-radius: 0; padding: 1rem; border-bottom: 1px solid var(--line-soft); }
.combination { padding: 1rem; }
.combination dl > div { padding: .5rem 0; border-bottom: 1px solid var(--line-soft); }
.armor ul { padding: .75rem 1rem; }
.notes { font-size: .85rem; }
.stats { gap: .6rem; background: transparent; }
.stats > div { border: 1px solid var(--line-soft); border-radius: var(--radius-sm); }
.detail-end { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 2rem; margin-top: 2rem; border: 1px solid var(--line); border-radius: var(--radius); background: rgba(232,193,90,.04); }
.detail-end h2 { margin-bottom: .45rem; }.detail-end p { font-size: .8rem; }.detail-end .btn { flex-shrink: 0; border-radius: var(--radius-sm); }
@media(max-width:600px) { .detail-header { grid-template-columns: 1fr; padding: 1.5rem 0; gap: 1.25rem; }.verification { border-left: 0; padding-left: 0; }.detail-actions { display: grid; grid-template-columns: 1fr 1fr; }.detail-actions .primary { grid-column: 1/-1; }.detail-actions > a:last-child { grid-column: 1/-1; font-size: .8rem; }.detail-end { flex-direction: column; align-items: stretch; padding: 1.25rem; } }
</style>
<style scoped>
.export-sheet-section{padding:1.5rem 0}.export-sheet-section h2{margin:0 0 1rem}
</style>
