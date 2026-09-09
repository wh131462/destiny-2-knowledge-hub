<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicBuilds } from '@/composables/usePublicBuilds'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useLoadoutVisuals } from '@/composables/useLoadoutVisuals'
import { abilities, aspects, facets, fragments, subclasses, classById, activityById } from '@/data/v2'
import { createLoadoutExportModel } from '@/utils/loadoutExportModel'
import { encodeDraft } from '../../../packages/loadout-planner/index.js'

const route = useRoute(), message = ref(''), copiedCode = ref('')
const { snapshot, status, error, refresh, config } = usePublicBuilds()
const manifest = useManifestAssets()
const build = computed(() => snapshot.value?.builds.find(b => b.number === Number(route.params.issueNumber)))
const draft = computed(() => build.value?.submission.loadout)
watch(build, () => { copiedCode.value = ''; message.value = '' })
const hideImage = event => { event.currentTarget.hidden = true }
const subclass = computed(() => subclasses.find(s => s.id === draft.value?.subclassId))
const { visualIcon, visualDescription } = useLoadoutVisuals(manifest, subclass)
const model = computed(() => draft.value ? createLoadoutExportModel(draft.value, {
  equipment: manifest.equipmentItems.value, mods: manifest.manifestMods.value, artifacts: manifest.artifacts.value,
  itemSets: manifest.itemSets.value, subclasses, abilities, aspects, facets, fragments, classes: classById,
  snapshot: manifest.snapshot.value, iconFor: visualIcon, descriptionFor: visualDescription,
  perkByHash: new Map(manifest.manifestPerks.value.map(p => [Number(p.hash), p])), issues: build.value.warnings
}) : null)
const editorLink = edit => ({ path: '/manual-loadout', query: { community: build.value.number, ...(edit ? { mode: 'edit' } : {}) } })
async function copyCode() {
  copiedCode.value = encodeDraft(draft.value)
  try { await navigator.clipboard.writeText(copiedCode.value); message.value = '配装代码已复制，包含全部词条组合和备注。' }
  catch { message.value = '自动复制不可用，可在下方全选复制配装代码。' }
}
</script>

<template>
  <div class="community-detail">
    <router-link class="back" to="/builds">← 返回构筑方案</router-link>
    <div class="sync-line"><span>{{ snapshot ? `社区数据更新于 ${new Date(snapshot.generatedAt).toLocaleString()}` : '社区构筑' }}</span><button v-if="config.enabled" type="button" class="btn" :disabled="status === 'loading'" @click="refresh">{{ status === 'loading' ? '刷新中…' : '刷新构筑' }}</button></div>
    <p v-if="error" class="notice" role="alert">{{ error }} {{ snapshot ? '当前是上次成功同步的数据。' : '' }}</p>
    <p v-if="status === 'loading' && !snapshot" role="status">正在读取构筑…</p>
    <template v-else-if="build">
      <header class="detail-header"><div><span class="eyebrow">COMMUNITY BUILD / 社区投稿 #{{ build.number }}</span><h1>{{ draft.name }}</h1><p>{{ build.submission.summary }}</p><div class="byline"><span>@{{ build.author.login }}</span><span>{{ classById[draft.classId]?.name }} {{ subclass?.name }}</span><span>更新于 {{ new Date(build.updatedAt).toLocaleDateString() }}</span></div></div><div class="verification"><b>社区投稿</b><span>通过配置检查</span><small>不代表实机验证</small></div></header>
      <nav class="detail-actions" aria-label="构筑操作"><router-link class="btn primary" :to="editorLink(false)">以此创建副本</router-link><router-link class="btn" :to="editorLink(true)">修改原投稿</router-link><button type="button" class="btn" @click="copyCode">复制配装代码</button><a class="btn" :href="build.issueUrl" target="_blank" rel="noopener noreferrer">GitHub 原文 / 下架与恢复 ↗</a></nav>
      <p class="help">作者可在 GitHub 关闭或重开 Issue；被屏蔽的投稿需由管理者解除屏蔽。更新将在同步成功后显示，关闭不使原文私密。</p>
      <p role="status">{{ message }}</p><textarea v-if="copiedCode" :value="copiedCode" readonly aria-label="配装代码" rows="3" />
      <div class="tags"><span v-for="id in build.submission.activityIds" :key="id">{{ activityById[id]?.name || id }}</span><span v-for="tag in build.submission.tags" :key="tag">{{ tag }}</span></div>
      <p class="help">校验快照：{{ snapshot.manifestVersion }} 原稿版本：{{ draft.manifestVersion || '未提供' }}</p>
      <p v-if="manifest.status.value !== 'ready'" class="notice">{{ manifest.status.value === 'error' ? '装备名称与配图加载失败，原始配置仍已保留。' : '正在加载装备名称与配图…' }}</p>
      <p v-for="warning in model.warnings" :key="warning" class="notice">{{ warning }}</p>

      <section v-for="group in model.talentGroups" :key="group.name" class="section"><h2>{{ group.name }}</h2><div class="cards"><article v-for="(item, i) in group.items" :key="i" class="card"><img @error="hideImage" v-if="item.image" :src="item.image" alt="" loading="lazy" /><div><small>{{ item.caption }}</small><h3>{{ item.name }}</h3><p v-if="item.description">{{ item.description }}</p></div></article></div></section>
      <section class="section"><h2>武器与词条组合</h2><div class="weapons"><article v-for="(weapon, i) in model.weapons" :key="i"><div class="card"><img @error="hideImage" v-if="weapon.image" :src="weapon.image" alt="" loading="lazy" /><div><small>{{ weapon.caption }}</small><h3>{{ weapon.name }}</h3><small v-if="weapon.hash">#{{ weapon.hash }}</small></div></div><p v-if="weapon.notes" class="notes">{{ weapon.notes }}</p><div v-for="(combo, j) in weapon.combinations" :key="j" class="combination"><h4>{{ combo.name }}</h4><dl><div v-for="column in combo.columns" :key="column.name"><dt>{{ column.name }}</dt><dd><span v-for="(perk, k) in column.items" :key="k">{{ perk.name }}{{ k < column.items.length - 1 ? ' / ' : '' }}</span></dd></div></dl><p v-if="combo.notes" class="notes">{{ combo.notes }}</p></div></article></div></section>
      <section class="section"><h2>护甲与模组</h2><div class="armor"><article v-for="(item, i) in model.armor" :key="i"><div class="card"><img @error="hideImage" v-if="item.image" :src="item.image" alt="" loading="lazy" /><div><small>{{ item.caption }}</small><h3>{{ item.name }}</h3></div></div><ul><li v-for="(mod, j) in item.mods" :key="j"><small>{{ mod.caption }}</small> {{ mod.name }}</li></ul></article></div><p v-if="model.armorNotes" class="notes">{{ model.armorNotes }}</p><article v-for="set in model.sets" :key="set.name" class="set"><h3>{{ set.name }} {{ set.count }} 件</h3><p v-for="effect in set.effects" :key="effect">{{ effect }}</p></article></section>
      <section class="section"><h2>神器与节点</h2><div class="card"><img @error="hideImage" v-if="model.artifact.image" :src="model.artifact.image" alt="" /><h3>{{ model.artifact.name }}</h3></div><div class="cards"><article v-for="(node, i) in model.artifactNodes" :key="i" class="card"><img @error="hideImage" v-if="node.image" :src="node.image" alt="" loading="lazy" /><div><small>{{ node.caption }}</small><h3>{{ node.name }}</h3></div></article></div></section>
      <section class="section"><h2>属性建议与获取思路</h2><div class="stats"><div v-for="stat in model.stats" :key="stat.name"><span>{{ stat.name }}</span><strong>{{ stat.value }}</strong></div></div><p v-if="model.statNotes" class="notes">{{ model.statNotes }}</p><div v-if="model.ghost" class="card"><img @error="hideImage" v-if="model.ghost.image" :src="model.ghost.image" alt="" /><div><h3>{{ model.ghost.name }}</h3><p>{{ model.ghost.description }}</p></div></div><p v-if="model.farmingNotes" class="notes">{{ model.farmingNotes }}</p></section>
      <section v-if="model.notes" class="section"><h2>作者备注</h2><p class="notes">{{ model.notes }}</p></section>
    </template>
    <section v-else-if="status !== 'error'" class="unavailable"><span class="eyebrow">BUILD UNAVAILABLE</span><h1>{{ status === 'unconfigured' ? '当前页面尚未启用列表同步' : '这份构筑暂不可用' }}</h1><p>投稿可能尚未同步、已经下架或需要修复。请刷新列表查看最新结果。</p><router-link to="/builds" class="btn">返回构筑方案</router-link></section>
  </div>
</template>

<style scoped>
.community-detail{padding:1rem 0 4rem}.back{color:var(--gold-dim);font-size:.8rem}.sync-line{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;color:var(--text-dim);font-size:.7rem}.detail-header{display:grid;grid-template-columns:1fr auto;gap:2rem;padding:2.5rem 0;border-block:1px solid var(--line-soft)}.eyebrow{font:.65rem var(--font-en);letter-spacing:.15em;color:var(--gold-dim)}h1{font-size:clamp(2rem,5vw,4rem);line-height:1.2;margin:.6rem 0 1rem;overflow-wrap:anywhere}.detail-header p,.notes{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}.byline{display:flex;gap:1rem;flex-wrap:wrap;color:var(--text-dim);font-size:.75rem;margin-top:1rem}.verification{display:flex;flex-direction:column;gap:.5rem;justify-content:center;color:var(--gold)}.verification small{color:var(--text-dim)}.detail-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin:1.5rem 0 .75rem}.help{font-size:.72rem;color:var(--text-dim);line-height:1.8}.notice{border-left:2px solid var(--warn);padding:.7rem 1rem;color:var(--warn);font-size:.78rem}.tags{display:flex;gap:.5rem;flex-wrap:wrap;margin:1rem 0}.tags span{border:1px solid var(--line-soft);padding:.3rem .6rem;font-size:.7rem}.section{padding:1.75rem 0;border-bottom:1px solid var(--line-soft)}h2{font-size:1.1rem;margin:0 0 1rem}h3{font-size:.85rem;margin:.3rem 0;overflow-wrap:anywhere}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:.65rem}.card{display:flex;align-items:flex-start;gap:.75rem;padding:.9rem;background:var(--bg-card);min-width:0}.card img{width:48px;height:48px;object-fit:contain;flex-shrink:0}.card p{font-size:.75rem;line-height:1.7;white-space:pre-wrap}.card small,li small{color:var(--text-dim);font-size:.65rem}.weapons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.weapons>article,.armor>article{border:1px solid var(--line-soft);min-width:0}.combination{padding:.8rem;border-top:1px solid var(--line-soft)}h4{color:var(--gold);font-size:.78rem;margin:0 0 .6rem}dl{margin:0}dl>div{display:grid;grid-template-columns:5rem 1fr;gap:.5rem;padding:.3rem 0;font-size:.72rem}dt{color:var(--text-dim)}dd{margin:0;overflow-wrap:anywhere}.notes{font-size:.8rem;padding:.7rem}.armor{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:.6rem}.armor ul{padding:0 1rem;list-style:none;font-size:.75rem;line-height:2}.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line-soft)}.stats>div{display:grid;gap:.5rem;padding:1rem;background:var(--bg-card)}.stats span{font-size:.72rem;color:var(--text-dim)}.stats strong{color:var(--gold);font-size:.9rem}.set{padding:1rem;font-size:.75rem}.unavailable{text-align:center;padding:4rem 1rem}textarea{width:100%;box-sizing:border-box;background:var(--bg-card);color:var(--text-sub);border:1px solid var(--line-soft);padding:.7rem}.community-detail [role=status]{color:var(--gold);font-size:.75rem}@media(max-width:850px){.weapons{grid-template-columns:1fr}.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.detail-header{grid-template-columns:1fr}.verification{flex-direction:row;flex-wrap:wrap;justify-content:flex-start}.detail-actions>*{flex:1 1 42%;text-align:center}.sync-line>span{max-width:65%}}
</style>
