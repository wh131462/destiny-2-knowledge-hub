<script setup>
import EntityLink from '@/components/EntityLink.vue'
import { computed, ref, watch } from 'vue'
import LoadoutTile from '@/components/LoadoutTile.vue'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { manifestText } from '@/utils/manifestText'
import { weaponPerkColumns, perkLabel, isEnhancedPerk, resolvePerkSelections, togglePerkRecommendation, manualPerkRecommendation } from '../../../packages/loadout-planner/weapon-perks.js'

const props = defineProps({ weapon: Object, row: { type: Object, required: true }, weaponIndex: Number, combinationName: String, manifestVersion: String })
const emit = defineEmits(['change'])
const pool = useWeaponPerks()
const activeKey = ref(null), search = ref(''), variant = ref('all'), page = ref(1), preview = ref(null)
const compatible = computed(() => pool.state.value === 'ready' && pool.version.value === props.manifestVersion)
const mismatch = computed(() => pool.state.value === 'ready' && props.manifestVersion && !compatible.value)
const columns = computed(() => {
  const list = weaponPerkColumns(compatible.value ? props.weapon : null, pool.byHash.value)
  // Preserve old or cross-version extra-socket notes even if the new weapon pool
  // no longer defines that socket. Never silently hide an imported recommendation.
  const savedKeys = new Set([...Object.keys(props.row.recommendedPerks || {}), ...Object.keys(props.row.recommendedPerkHashes || {})])
  for (const key of savedKeys) if (/^socket-\d{1,2}$/.test(key) && !list.some(c => c.key === key)) list.push({ key, label: `原插槽 ${Number(key.slice(7)) + 1}`, options: [] })
  return list
})
const current = computed(() => columns.value.find(c => c.key === activeKey.value))
const selection = c => resolvePerkSelections(props.row, c)
const text = key => (props.row.recommendedPerks?.[key] || []).join(' / ')
const icon = p => p?.icon ? (/^https?:/.test(p.icon) ? p.icon : 'https://www.bungie.net' + p.icon) : ''
const description = p => manifestText([p?.descriptionZh || p?.description, ...(p?.perkDetails || []).filter(d => d.visibility !== 2).map(d => d.descriptionZh || d.description)].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('\n\n'))
const candidates = computed(() => (current.value?.options || []).filter(p => (variant.value === 'all' || isEnhancedPerk(p) === (variant.value === 'enhanced')) && `${p.name} ${p.nameZh || ''} ${p.hash} ${description(p)}`.toLowerCase().includes(search.value.trim().toLowerCase())))
const pageSize = 24
const pages = computed(() => Math.max(1, Math.ceil(candidates.value.length / pageSize)))
const visible = computed(() => candidates.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const chosen = computed(() => current.value ? selection(current.value) : { chosen: [], manual: [], unknownHashes: [] })
const detail = computed(() => preview.value || visible.value[0])
const isSelected = p => chosen.value.chosen.some(c => c.hash === p.hash)
function open(key) { activeKey.value = key; search.value = ''; variant.value = 'all'; page.value = 1; preview.value = null }
function toggle(p) { if (compatible.value && current.value) emit('change', togglePerkRecommendation(props.row, current.value, p)); preview.value = p }
function clear() { emit('change', { recommendedPerks: { ...props.row.recommendedPerks, [activeKey.value]: [] }, recommendedPerkHashes: { ...props.row.recommendedPerkHashes, [activeKey.value]: [] } }) }
watch(() => props.weapon?.hash, hash => { activeKey.value = null; if (hash) pool.load() }, { immediate: true })
watch([search, variant], () => { page.value = 1; preview.value = null })
</script>

<template>
  <div class="weapon-perk-editor">
    <p v-if="weapon && pool.state.value === 'loading'" class="pool-status" role="status">正在加载该武器的官方 Perk 候选…</p>
    <p v-if="pool.state.value === 'error'" class="pool-status error" role="alert">Perk 数据加载失败：{{ pool.error.value }}。手动推荐仍可编辑。<button type="button" @click="pool.load">重试</button></p>
    <p v-if="mismatch" class="pool-status error" role="alert">词条与装备快照版本不一致，请刷新后重试；暂不提供可能错配的候选。</p>
    <div class="perk-fields">
      <div v-for="column in columns" :key="column.key" class="perk-column">
        <label :for="`weapon-${weaponIndex}-${column.key}`">{{ column.label }}</label>
        <button type="button" class="perk-choice" :disabled="!compatible || !column.options.length" :aria-label="`武器${weaponIndex + 1}选择${column.label}Perk`" @click="open(column.key)">
          <span class="perk-icons"><img v-for="p in selection(column).chosen.slice(0, 3)" :key="p.hash" :src="icon(p)" alt="" /><span v-if="!selection(column).chosen.length" aria-hidden="true">＋</span></span>
          <span>{{ column.options.length ? (selection(column).chosen.length ? `${selection(column).chosen.length} 个推荐 · 更改` : `选择 Perk · ${column.options.length} 个候选`) : !weapon ? '先选择武器' : column.key === 'masterwork' ? '大师之作保留手动建议' : '无可选择数据 · 可手填' }}</span>
        </button>
        <a-input :id="`weapon-${weaponIndex}-${column.key}`" :value="text(column.key)" :aria-label="`武器${weaponIndex + 1}${column.label}`" placeholder="选择或手填，/ 分隔备选" :maxlength="3000" @blur="emit('change', manualPerkRecommendation(row, column.key, $event.target.value))" />
        <small v-if="column.missingHashes?.length" class="error">{{ column.missingHashes.length }} 个候选缺少公开详情，暂不可选</small>
        <small v-if="compatible && selection(column).unknownHashes.length" class="error">保留的旧词条 Hash 不在当前池中：{{ selection(column).unknownHashes.join(' / ') }}，请核对</small>
      </div>
    </div>
    <a-modal :open="Boolean(current)" :title="`${weapon?.nameZh || weapon?.name || ''} · ${combinationName || '当前组合'} · ${current?.label || ''}`" width="1120px" :footer="null" wrap-class-name="weapon-perk-modal" @cancel="activeKey = null">
      <div v-if="current" class="perk-modal-content">
        <p class="pool-caption">仅修改「{{ combinationName || '当前组合' }}」 · 武器 #{{ weapon.hash }} · 实际插槽 {{ current.socketIndex + 1 }} · {{ current.options.length }} 个候选。同栏多选以 / 表示组内可互换，不会影响其他组合。</p>
        <p class="pool-caption">普通与强化词条分别标记。静态候选可能受强化、锻造、解锁等条件限制，不等于随机掉落池；不按账号是否拥有过滤。</p>
        <nav class="perk-column-tabs" aria-label="推荐词条栏目"><button v-for="c in columns.filter(c => c.options.length)" :key="c.key" type="button" :aria-pressed="current.key === c.key" @click="open(c.key)">{{ c.label }} <small>{{ c.options.length }}</small></button></nav>
        <div class="perk-search"><a-input v-model:value="search" aria-label="搜索武器Perk" placeholder="搜索中文、英文、效果或 Hash" allow-clear /><div class="perk-variants" role="group" aria-label="词条版本"><button v-for="[key, label] in [['all','全部'],['normal','普通'],['enhanced','强化']]" :key="key" type="button" :aria-pressed="variant === key" @click="variant = key">{{ label }}</button></div></div>
        <p class="pool-caption" role="status" aria-live="polite">{{ candidates.length }} / {{ current.options.length }} 个词条</p>
        <p v-if="current.missingHashes?.length" class="error pool-caption">{{ current.missingHashes.length }} 个原始候选没有公开词条详情，未将其当成可选 Perk。</p>
        <div class="perk-browser">
          <div class="perk-results"><div class="perk-grid"><LoadoutTile v-for="p in visible" :key="p.hash" :image="icon(p)" :label="perkLabel(p)" :subtitle="p.name" :description="description(p)" :badge="`${isEnhancedPerk(p) ? '强化词条' : current.options.length === 1 ? '固定选项' : '普通词条'} · #${p.hash}`" toggle :active="isSelected(p)" @click="toggle(p)" @mouseenter="preview = p" @focus="preview = p" /></div><p v-if="!visible.length" class="pool-caption">没有匹配项，清空搜索或切换词条版本。</p></div>
          <aside v-if="detail" class="perk-detail" aria-label="武器Perk详情"><img v-if="icon(detail)" :src="icon(detail)" alt="" /><h3>{{ perkLabel(detail) }}</h3><small>{{ detail.name }} · #{{ detail.hash }}</small><p>{{ description(detail) || '官方没有提供详细效果文本。' }}</p><EntityLink :item="detail" kind="plugs" label="查看百科与来源" new-tab /></aside>
        </div>
        <div class="selected-perks" aria-label="本栏推荐"><span v-if="!chosen.chosen.length && !chosen.manual.length">本栏尚未指定推荐</span><button v-for="p in chosen.chosen" :key="p.hash" type="button" :aria-label="`取消推荐${perkLabel(p)}`" @click="toggle(p)"><img v-if="icon(p)" :src="icon(p)" alt="" />{{ perkLabel(p) }} ×</button></div>
        <p v-if="chosen.manual.length || chosen.unknownHashes.length" class="pool-caption">保留的手填 / 未匹配旧推荐：{{ [...chosen.manual, ...chosen.unknownHashes.map(h => `#${h}`)].join(' / ') }}。选择其他 Perk 不会删除它们。</p>
        <footer class="perk-footer"><button type="button" @click="clear">清空本栏推荐</button><div class="perk-pages"><button type="button" :disabled="page === 1" @click="page--; preview = null">上一页</button><span>{{ page }} / {{ pages }}</span><button type="button" :disabled="page === pages" @click="page++; preview = null">下一页</button></div><a-button type="primary" @click="activeKey = null">完成推荐</a-button></footer>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.perk-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.perk-column{min-width:0;display:grid;gap:.4rem;align-content:start}.perk-column label{font-size:.68rem;color:var(--text-sub)}.perk-choice{display:flex;align-items:center;gap:.5rem;min-height:44px;padding:.45rem .55rem;border:1px solid #494638;background:#24241f;color:var(--gold);text-align:left;font-size:.68rem;cursor:pointer}.perk-choice:disabled{color:var(--text-dim);border-color:var(--line-soft);background:transparent;cursor:default}.perk-icons{display:flex;flex-shrink:0;align-items:center}.perk-icons img{width:26px;height:26px;object-fit:contain}.perk-icons img+img{margin-left:-6px;border-left:1px solid #34352f}.perk-icons>span{font-size:1.2rem}.pool-status,.pool-caption{font-size:.74rem;line-height:1.7;color:var(--text-dim)}.error{color:var(--warn)}.perk-column-tabs,.perk-variants{display:flex;gap:.4rem;flex-wrap:wrap}.perk-column-tabs{margin:1rem 0}.perk-column-tabs button,.perk-variants button,.perk-footer>button,.perk-pages button{padding:.45rem .65rem;background:#20242a;border:1px solid var(--line-soft);color:var(--text-sub);font-size:.74rem;cursor:pointer}.perk-column-tabs button[aria-pressed=true],.perk-variants button[aria-pressed=true]{border-color:var(--gold);color:var(--gold)}.perk-column-tabs small{margin-left:.35rem;opacity:.6}.perk-search{display:flex;align-items:center;gap:.8rem}.perk-search>.ant-input-affix-wrapper{flex:1}.perk-browser{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:1rem;margin-top:1rem}.perk-results{max-height:47vh;overflow-y:auto;padding:3px}.perk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.perk-detail{padding:1rem;background:#1b2026;border-left:2px solid var(--gold);max-height:47vh;overflow-y:auto}.perk-detail>img{width:80px;height:80px;object-fit:contain;background:#0c1016}.perk-detail h3{font:600 1rem var(--font-cn);margin:.8rem 0 .4rem}.perk-detail small{font-size:.65rem;color:var(--text-dim)}.perk-detail p{font-size:.78rem;line-height:1.8;white-space:pre-line}.selected-perks{display:flex;gap:.4rem;flex-wrap:wrap;margin:1rem 0;font-size:.74rem;color:var(--text-dim)}.selected-perks button{display:flex;align-items:center;gap:.4rem;padding:.3rem .5rem;background:#302d23;border:1px solid var(--gold-dim);color:var(--text-main);cursor:pointer}.selected-perks img{width:24px;height:24px}.perk-footer{display:flex;align-items:center;justify-content:space-between;gap:.8rem;border-top:1px solid var(--line-soft);padding-top:.8rem}.perk-pages{display:flex;align-items:center;gap:.7rem;font-size:.72rem}.perk-pages button:disabled{opacity:.4;cursor:default}button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}:global(.weapon-perk-modal .ant-modal){top:24px;padding-bottom:24px}@media(max-width:720px){.perk-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.perk-browser{grid-template-columns:1fr}.perk-detail{display:none}.perk-grid{grid-template-columns:1fr}.perk-grid :deep(.tile-description){display:block;-webkit-line-clamp:unset}.perk-search{flex-direction:column;align-items:stretch}.perk-footer{flex-wrap:wrap}.perk-pages{order:3;justify-content:center;width:100%}.perk-results{max-height:45dvh}.perk-choice{min-height:50px;font-size:.65rem}}@media print{.perk-choice,.pool-status{display:none}}
@media (max-width: 720px) {
  .perk-modal-content { max-height: calc(100dvh - 128px); overflow-y: auto; padding-right: 3px; }
  .perk-results { max-height: none; overflow: visible; }
  .perk-footer { position: sticky; bottom: 0; z-index: 2; padding: .75rem 0 .3rem; background: #14192b; }
}
</style>
