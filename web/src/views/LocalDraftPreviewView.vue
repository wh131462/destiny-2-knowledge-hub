<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { listLocalDrafts, draftFromEntry } from '@/utils/localDrafts'
import { classesV2, subclassById, abilityById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { createLoadoutExportModel } from '@/utils/loadoutExportModel'
import { ui, localized, useI18n } from '@/i18n'

const route = useRoute(), { formatDate, locale } = useI18n()
const { iconFor, equipmentItems, artifacts, manifestPerks, status: manifestStatus } = useManifestAssets()
const entry = computed(() => listLocalDrafts().find(item => item.id === route.params.draftId))
const draft = computed(() => { try { return entry.value ? draftFromEntry(entry.value, {}) : null } catch { return null } })
const subclass = computed(() => subclassById[draft.value?.subclassId])
const className = computed(() => classesV2.find(item => item.id === draft.value?.classId)?.name || '未选择职业')
const abilities = computed(() => Object.values(draft.value?.abilities || {}).slice(0, 5).map(id => abilityById[id]).filter(Boolean))
const weapons = computed(() => draft.value ? createLoadoutExportModel(draft.value, {
  locale: locale.value, equipment: equipmentItems.value, iconFor,
  perkByHash: new Map(manifestPerks.value.map(perk => [Number(perk.hash), perk]))
}).weapons : [])
const equipment = hash => equipmentItems.value.find(item => Number(item.hash) === Number(hash))
const artifact = computed(() => artifacts.value.find(item => Number(item.hash) === Number(draft.value?.artifactHash)))
const statLabels = { health: '生命值', melee: '近战', grenade: '手雷', class: '职业', super: '超能', weapons: '武器' }
</script>

<template>
  <div v-if="entry && draft" class="draft-preview build-flow">
    <router-link class="back" to="/builds">← 返回构筑方案</router-link>
    <header class="preview-head"><div><span class="draft-badge">{{ ui('本地草稿') }}</span><p class="eyebrow">LOCAL DRAFT / PREVIEW</p><h1>{{ entry.name }}</h1><p>{{ draft.notes || '这是一份保存在当前浏览器的构筑草稿。' }}</p><small>{{ ui('最后保存于') }} {{ formatDate(entry.updatedAt) }}</small></div><div class="flow-actions"><router-link class="btn primary" :to="`/manual-loadout?draft=${encodeURIComponent(entry.id)}`">{{ ui('继续编辑') }} →</router-link><router-link class="btn" to="/manual-loadout">{{ ui('创建新构筑') }}</router-link></div></header>
    <section id="preview-identity" class="preview-section identity-section"><div class="section-index">01</div><div><h2>{{ ui('职业与子职业') }}</h2><div class="identity-values"><div><span>{{ ui('职业') }}</span><strong>{{ className }}</strong></div><div><span>{{ ui('子职业') }}</span><strong>{{ localized(subclass) || '未选择' }}</strong></div></div></div></section>
    <section id="preview-talents" class="preview-section"><div class="section-index">02</div><div><h2>{{ ui('天赋与技能') }}</h2><div class="preview-grid"><article v-for="item in abilities" :key="item.id"><div class="preview-icon"><img v-if="iconFor(item)" :src="iconFor(item)" alt="" /></div><strong>{{ localized(item) }}</strong><small>{{ item.en }}</small></article><p v-if="!abilities.length" class="empty">尚未配置技能</p></div></div></section>
    <section id="preview-artifact" class="preview-section"><div class="section-index">03</div><div><h2>{{ ui('神器与节点') }}</h2><div class="artifact-preview"><strong>{{ localized(artifact) || '未指定神器' }}</strong><small>{{ draft.artifactNodeHashes?.length || 0 }} 个节点已选择</small></div></div></section>
    <section id="preview-weapons" class="preview-section"><div class="section-index">04</div><div>
      <h2>{{ ui('武器与 Perk 组合') }}</h2>
      <p v-if="manifestStatus !== 'ready'" class="empty" role="status">{{ manifestStatus === 'error' ? ui('装备名称与配图加载失败，原始配置仍已保留。') : ui('正在加载装备名称与配图…') }}</p>
      <div class="weapon-grid">
        <article v-for="(weapon, index) in weapons" :key="index" class="weapon-preview">
          <header><div class="preview-icon"><img v-if="weapon.image" :src="weapon.image" alt="" /></div><div><small>{{ weapon.caption }}</small><h3>{{ weapon.name }}</h3></div></header>
          <p v-if="weapon.notes" class="notes">{{ weapon.notes }}</p>
          <section v-for="(combo, comboIndex) in weapon.combinations" :key="comboIndex" class="perk-combination">
            <h4>{{ combo.name }}</h4>
            <dl><div v-for="(column, columnIndex) in combo.columns" :key="columnIndex"><dt>{{ column.name }}</dt><dd><span v-for="(perk, perkIndex) in column.items" :key="perkIndex" class="perk-item"><img v-if="perk.image" :src="perk.image" alt="" loading="lazy" />{{ perk.name }}</span></dd></div></dl>
            <p v-if="!combo.columns.length" class="empty">{{ ui('未指定；可在编辑副本中补充') }}</p>
            <p v-if="combo.notes" class="notes">{{ combo.notes }}</p>
          </section>
        </article>
      </div>
    </div></section>
    <section id="preview-armor" class="preview-section"><div class="section-index">05</div><div><h2>{{ ui('护甲与模组') }}</h2><div class="armor-list"><div v-for="(item, slot) in draft.armor" :key="slot"><span>{{ ({ helmet: '头盔', arms: '臂铠', chest: '胸甲', legs: '腿甲', classItem: '职业装备' })[slot] }}</span><strong>{{ equipment(item?.manifestHash) ? localized(equipment(item.manifestHash)) : item?.manifestHash ? `装备 #${item.manifestHash}` : '未指定' }}</strong><small>{{ draft.mods?.[slot]?.length || 0 }} 个模组</small></div></div></div></section>
    <section id="preview-stats" class="preview-section"><div class="section-index">06</div><div><h2>{{ ui('六维目标与刷装建议') }}</h2><div class="stats-grid"><div v-for="(target, key) in draft.statRecommendations" :key="key"><span>{{ statLabels[key] || key }}</span><strong>{{ target?.min != null || target?.max != null ? `${target.min ?? '—'}–${target.max ?? '—'}` : '无要求' }}</strong></div></div><p v-if="draft.farmingNotes" class="notes">{{ draft.farmingNotes }}</p></div></section>
    <section id="preview-notes" class="preview-section"><div class="section-index">07</div><div><h2>{{ ui('操作与补充说明') }}</h2><p class="notes">{{ draft.notes || '暂无备注。' }}</p></div></section>
  </div>
  <div v-else class="flow-empty"><h2>{{ ui('找不到这份本地草稿') }}</h2><router-link class="btn" to="/builds">返回构筑方案</router-link></div>
</template>

<style scoped>
.draft-preview { padding: 1rem 0 4rem; }.back { color: var(--gold-dim); font-size: .8rem; }.preview-head { display: flex; justify-content: space-between; align-items: end; gap: 2rem; padding: 2.5rem 0; border-bottom: 1px solid var(--line-soft); }.preview-head h1 { margin: .5rem 0 .75rem; font-family: var(--font-cn); font-size: clamp(2rem,5vw,4rem); overflow-wrap: anywhere; }.preview-head p { max-width: 48rem; }.preview-head small { display: block; margin-top: .8rem; color: var(--text-dim); }.draft-badge { display: inline-flex; padding: .25rem .55rem; margin-bottom: .65rem; border: 1px solid rgba(255,180,84,.45); border-radius: 4px; color: var(--warn); font-size: .7rem; }.preview-section { display:grid; grid-template-columns:2rem minmax(0,1fr); gap:1rem; padding:2rem 0; border-bottom:1px solid var(--line-soft); }.section-index { color:var(--gold-dim); font:.68rem var(--font-en); padding-top:.3rem; }.preview-section h2 { margin:0 0 1rem; font-family:var(--font-cn); font-size:1.15rem; }.preview-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.7rem; }.preview-grid article { display:grid; grid-template-columns:42px 1fr; align-items:center; gap:.6rem; padding:.8rem; border:1px solid var(--line-soft); border-radius:var(--radius-sm); background:var(--bg-dark); }.preview-grid article small { grid-column:2; }.preview-icon { width:42px; height:42px; grid-row:span 2; background:var(--bg-panel); }.preview-icon img { width:100%; height:100%; object-fit:contain; }.identity-values { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem; }.identity-values > div,.artifact-preview,.armor-list > div,.stats-grid > div { display:grid; gap:.35rem; padding:.8rem; border:1px solid var(--line-soft); border-radius:var(--radius-sm); background:var(--bg-dark); }.identity-values span,.stats-grid span,.artifact-preview small,.armor-list small { color:var(--text-dim); font-size:.7rem; }.identity-values strong,.artifact-preview strong,.stats-grid strong { color:var(--gold-bright); }.armor-list,.stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:.7rem; }.stats-grid { grid-template-columns:repeat(6,1fr); }.stats-grid strong { font-size:.85rem; }.notes { white-space:pre-wrap; line-height:1.85; }.empty { grid-column:1/-1; }.flow-actions { justify-content:flex-end; }.flow-actions .btn { border-radius:var(--radius-sm); }
@media(max-width:800px) { .preview-head { flex-direction:column; align-items:flex-start; }.preview-section { grid-template-columns:1.5rem minmax(0,1fr); }.identity-values { grid-template-columns:1fr; }.armor-list,.stats-grid { grid-template-columns:repeat(2,1fr); }.flow-actions { width:100%; }.flow-actions .btn { flex:1; text-align:center; } }
@media(max-width:600px) { .preview-section { grid-template-columns:1fr; gap:.35rem; }.section-index { padding-top:0; } }
</style>

<style scoped>
.weapon-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.7rem; }
.weapon-preview { min-width:0; padding:1rem; border:1px solid var(--line-soft); border-radius:var(--radius-sm); background:var(--bg-dark); overflow-wrap:anywhere; }
.weapon-preview header { display:flex; align-items:center; gap:.7rem; }.weapon-preview header>div:last-child { min-width:0; }.weapon-preview .preview-icon { flex-shrink:0; }
.weapon-preview h3 { font-size:1rem; margin:.3rem 0; }.weapon-preview small,.perk-combination dt,.perk-combination .empty { color:var(--text-dim); font-size:.75rem; }
.perk-combination { margin-top:1rem; padding-top:1rem; border-top:1px solid var(--line-soft); }.perk-combination h4 { margin:0 0 .8rem; font-size:.85rem; }
.perk-combination dl { display:grid; gap:.75rem; margin:0; }.perk-combination dd { display:flex; flex-wrap:wrap; gap:.5rem; margin:.3rem 0 0; }
.perk-item { display:inline-flex; align-items:center; gap:.35rem; font-size:.8rem; }.perk-item img { width:24px; height:24px; object-fit:contain; flex-shrink:0; }
.weapon-preview .notes { font-size:.8rem; margin-top:.75rem; }
@media(max-width:800px) { .weapon-grid { grid-template-columns:minmax(0,1fr); } }
</style>
