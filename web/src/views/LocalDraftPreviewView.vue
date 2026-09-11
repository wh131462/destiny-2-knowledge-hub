<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listLocalDrafts, draftFromEntry } from '@/utils/localDrafts'
import { subclassById, subclasses, abilities, aspects, facets, fragments, classById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { useLoadoutVisuals } from '@/composables/useLoadoutVisuals'
import { createLoadoutExportModel } from '@/utils/loadoutExportModel'
import { ui, useI18n } from '@/i18n'
import LoadoutSheet from '@/components/LoadoutSheet.vue'
import LoadoutExportButton from '@/components/LoadoutExportButton.vue'

const route = useRoute(), { formatDate, locale } = useI18n()
const manifest = useManifestAssets()
const perkPool = useWeaponPerks()
onMounted(perkPool.load)
const perkByHash = computed(() => perkPool.state.value === 'ready' && perkPool.version.value === manifest.snapshot.value.manifestVersion ? perkPool.byHash.value : new Map())
const entry = computed(() => listLocalDrafts().find(item => item.id === route.params.draftId))
const draft = computed(() => { try { return entry.value ? draftFromEntry(entry.value, {}) : null } catch { return null } })
const subclass = computed(() => subclassById[draft.value?.subclassId])
const { visualIcon, visualDescription } = useLoadoutVisuals(manifest, subclass)
const exportModel = computed(() => draft.value ? createLoadoutExportModel(draft.value, {
  locale: locale.value, equipment: manifest.equipmentItems.value, mods: manifest.manifestMods.value, artifacts: manifest.artifacts.value,
  itemSets: manifest.itemSets.value, subclasses, abilities, aspects, facets, fragments, classes: classById,
  snapshot: manifest.snapshot.value, perkByHash: perkByHash.value,
  iconFor: visualIcon, descriptionFor: visualDescription
}) : null)
async function prepareImageExport() {
  await perkPool.load()
  const prepared = exportModel.value
  if (!prepared) return null
  const compatible = perkPool.state.value === 'ready' && perkPool.version.value === manifest.snapshot.value.manifestVersion
  return { ...prepared, warnings: [...prepared.warnings, ...(compatible ? [] : [ui('Perk 图标数据未就绪或版本不一致，已保留原推荐文字与 Hash，请核对。')])] }
}
</script>

<template>
  <div v-if="entry && draft" class="draft-preview build-flow">
    <router-link class="back" to="/builds">← 返回构筑方案</router-link>
    <header class="preview-head"><div><span class="draft-badge">{{ ui('本地草稿') }}</span><p class="eyebrow">LOCAL DRAFT / PREVIEW</p><h1>{{ entry.name }}</h1><p>{{ draft.notes || '这是一份保存在当前浏览器的构筑草稿。' }}</p><small>{{ ui('最后保存于') }} {{ formatDate(entry.updatedAt) }}</small></div><div class="flow-actions"><router-link class="btn primary" :to="`/manual-loadout?draft=${encodeURIComponent(entry.id)}`">{{ ui('继续编辑') }} →</router-link><LoadoutExportButton :key="entry.id" :disabled="manifest.status.value !== 'ready'" :prepare="prepareImageExport" /><router-link class="btn" to="/manual-loadout">{{ ui('创建新构筑') }}</router-link></div></header>
    <p v-if="manifest.status.value !== 'ready'" role="status">{{ manifest.status.value === 'error' ? ui('装备名称与配图加载失败，原始配置仍已保留。') : ui('正在加载装备名称与配图…') }}</p>
    <LoadoutSheet v-if="exportModel" class="draft-sheet" :model="exportModel" />
  </div>
  <div v-else class="flow-empty"><h2>{{ ui('找不到这份本地草稿') }}</h2><router-link class="btn" to="/builds">返回构筑方案</router-link></div>
</template>

<style scoped>
.draft-preview{padding:1rem 0 4rem;min-width:0}.back{color:var(--gold-dim);font-size:.8rem}
.preview-head{display:flex;justify-content:space-between;align-items:end;gap:2rem;padding:2rem 0}.preview-head>div{min-width:0}
.preview-head h1{margin:.5rem 0 .75rem;font-family:var(--font-cn);font-size:clamp(2rem,5vw,4rem);overflow-wrap:anywhere}
.preview-head p{max-width:48rem;overflow-wrap:anywhere}.preview-head small{display:block;margin-top:.8rem;color:var(--text-dim)}
.draft-badge{display:inline-flex;padding:.25rem .55rem;margin-bottom:.65rem;border:1px solid rgba(255,180,84,.45);border-radius:4px;color:var(--warn);font-size:.7rem}
.flow-actions{justify-content:flex-end;flex-shrink:0}.flow-actions :deep(.btn){white-space:nowrap}.flow-actions .btn{border-radius:var(--radius-sm)}.draft-sheet{margin-top:1rem}
@media(max-width:800px){.preview-head{flex-direction:column;align-items:flex-start}.flow-actions{width:100%}.flow-actions .btn{flex:1;text-align:center}}
</style>
