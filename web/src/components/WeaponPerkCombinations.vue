<script setup>
import EntityLink from '@/components/EntityLink.vue'
import { computed, ref, watch } from 'vue'
import WeaponPerkEditor from './WeaponPerkEditor.vue'
import { useWeaponPerks } from '@/composables/useWeaponPerks'
import { MAX_PERK_COMBINATIONS, addPerkCombination, updatePerkCombination, removePerkCombination } from '../../../packages/loadout-planner/index.js'
import { weaponPerkColumns, resolvePerkSelections, perkLabel } from '../../../packages/loadout-planner/weapon-perks.js'

const props = defineProps({ weapon: Object, row: { type: Object, required: true }, weaponIndex: Number, manifestVersion: String })
const emit = defineEmits(['change'])
const activeId = ref(props.row.perkCombinations[0]?.id)
const pool = useWeaponPerks()
const compatible = computed(() => pool.state.value === 'ready' && pool.version.value === props.manifestVersion)
const columns = computed(() => weaponPerkColumns(compatible.value ? props.weapon : null, pool.byHash.value))
const atLimit = computed(() => props.row.perkCombinations.length >= MAX_PERK_COMBINATIONS)
const name = (combo, index) => combo.name.trim() || `组合 ${index + 1}`
const image = p => p?.icon ? (/^https?:/.test(p.icon) ? p.icon : `https://www.bungie.net${p.icon}`) : ''
function summary(combo) {
  const list = [...columns.value]
  for (const key of new Set([...Object.keys(combo.recommendedPerks), ...Object.keys(combo.recommendedPerkHashes || {})])) {
    if (!list.some(c => c.key === key)) list.push({ key, label: `原插槽 ${Number(key.slice(7)) + 1}`, options: [] })
  }
  return list.map(column => {
    const selected = resolvePerkSelections(combo, column)
    return { key: column.key, label: column.label, values: [
      ...selected.chosen.map(p => ({ text: perkLabel(p), image: image(p), item: p })),
      ...selected.manual.map(text => ({ text })),
      ...selected.unknownHashes.map(hash => ({ text: `#${hash}（待核对）` }))
    ] }
  }).filter(c => c.values.length)
}
function update(id, changes) { emit('change', updatePerkCombination(props.row, id, changes)) }
function add(copyId) {
  if (atLimit.value) return
  const next = addPerkCombination(props.row, copyId)
  activeId.value = next.perkCombinations.at(-1).id
  emit('change', next)
}
function remove(id) { emit('change', removePerkCombination(props.row, id)) }
watch(() => props.weapon?.hash, hash => { activeId.value = props.row.perkCombinations[0]?.id; if (hash) pool.load() }, { immediate: true })
watch(() => props.row.perkCombinations.map(c => c.id).join('|'), () => {
  if (activeId.value && !props.row.perkCombinations.some(c => c.id === activeId.value)) activeId.value = props.row.perkCombinations[0]?.id
})
</script>

<template>
  <div class="perk-combinations">
    <header class="combinations-toolbar">
      <span>PERK SETS <b>{{ row.perkCombinations.length }} 组独立备选</b></span>
      <button type="button" :disabled="atLimit" :aria-label="`武器${weaponIndex + 1}新增空白组合`" @click="add()">＋ 新增空白组合</button>
    </header>
    <p v-if="atLimit" class="combination-hint">每把武器最多 {{ MAX_PERK_COMBINATIONS }} 组。</p>
    <template v-for="(combo, index) in row.perkCombinations" :key="combo.id">
      <div v-if="index" class="combination-or" aria-hidden="true">或 / OR</div>
      <section class="perk-combination" :class="{ editing: activeId === combo.id }" :aria-label="`武器${weaponIndex + 1}推荐组合${index + 1}`">
        <header class="combination-header">
          <span class="combination-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3>{{ name(combo, index) }}</h3>
          <div class="combination-actions">
            <button type="button" :aria-expanded="activeId === combo.id" :aria-controls="`weapon-${weaponIndex}-${combo.id}-editor`" @click="activeId = activeId === combo.id ? null : combo.id">{{ activeId === combo.id ? '收起' : '编辑' }}</button>
            <button type="button" :disabled="atLimit" :aria-label="`复制组合${index + 1}`" @click="add(combo.id)">复制</button>
            <a-popconfirm title="删除这一组推荐？其他组合不会改变。" ok-text="删除组合" cancel-text="保留" :disabled="row.perkCombinations.length === 1" @confirm="remove(combo.id)">
              <button type="button" :disabled="row.perkCombinations.length === 1" :aria-label="`删除组合${index + 1}`">删除</button>
            </a-popconfirm>
          </div>
        </header>
        <dl v-if="summary(combo).length" class="combination-summary">
          <div v-for="column in summary(combo)" :key="column.key" class="combination-slot">
            <dt>{{ column.label }}</dt>
            <dd><template v-for="(value, valueIndex) in column.values" :key="valueIndex"><span v-if="valueIndex" class="choice-or">/</span><span class="summary-perk"><img v-if="value.image" :src="value.image" alt="" /><EntityLink v-if="value.item" :item="value.item" kind="plugs" :label="value.text" new-tab /><span v-else>{{ value.text }}</span></span></template></dd>
          </div>
        </dl>
        <p v-else class="combination-hint">尚未配置词条 · 在这一组内选择一套完整搭配</p>
        <p v-if="combo.notes" class="combination-notes">{{ combo.notes }}</p>
        <div v-if="activeId === combo.id" :id="`weapon-${weaponIndex}-${combo.id}-editor`" class="combination-editor">
          <div class="combination-meta">
            <label>组合名称<a-input :value="combo.name" :aria-label="`武器${weaponIndex + 1}组合${index + 1}名称`" :maxlength="80" placeholder="例如：回弹续航 / 手雷循环" @update:value="update(combo.id, { name: $event })" /></label>
            <label>本组合用途<a-textarea :value="combo.notes" :aria-label="`武器${weaponIndex + 1}组合${index + 1}备注`" :maxlength="3000" :auto-size="{ minRows: 1, maxRows: 4 }" placeholder="适用场景、触发方式或替换条件" @update:value="update(combo.id, { notes: $event })" /></label>
          </div>
          <WeaponPerkEditor :weapon="weapon" :row="combo" :weapon-index="weaponIndex" :combination-name="name(combo, index)" :manifest-version="manifestVersion" @change="update(combo.id, $event)" />
          <p class="combination-hint">当前仅编辑「{{ name(combo, index) }}」。组内同栏的 / 表示可互换；需要特定配对时请另建一组。</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.perk-combinations{min-width:0}.combinations-toolbar{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.7rem}.combinations-toolbar>span{font-size:.6rem;letter-spacing:.1em;color:var(--gold)}.combinations-toolbar b{margin-left:.55rem;letter-spacing:0;font-weight:400;color:var(--text-sub)}button{border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);padding:.4rem .55rem;font-size:.68rem;cursor:pointer}button:disabled{opacity:.4;cursor:default}button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.combinations-toolbar button{color:var(--gold);border-color:var(--gold-dim)}.perk-combination{border:1px solid var(--line-soft);background:#171b20;padding:.85rem;min-width:0}.perk-combination.editing{border-left:2px solid var(--gold)}.combination-header{display:flex;align-items:center;gap:.65rem}.combination-number{font:500 1.1rem var(--font-en);color:var(--gold);opacity:.8}.combination-header h3{flex:1;min-width:0;overflow-wrap:anywhere;font-size:.83rem;font-weight:500;margin:0}.combination-actions{display:flex;gap:.3rem}.combination-or{display:flex;align-items:center;gap:.7rem;margin:.45rem 0;font-size:.58rem;letter-spacing:.15em;color:var(--text-dim)}.combination-or::before,.combination-or::after{content:'';height:1px;background:var(--line-soft);flex:1}.combination-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin:.8rem 0 0}.combination-slot{padding:.55rem;background:#20252a;min-width:0}.combination-slot dt{font-size:.61rem;color:var(--text-dim);margin-bottom:.3rem}.combination-slot dd{margin:0;display:flex;align-items:center;flex-wrap:wrap;gap:.3rem;font-size:.75rem}.summary-perk{display:inline-flex;align-items:center;gap:.35rem;overflow-wrap:anywhere}.summary-perk img{width:26px;height:26px;object-fit:contain;background:#11151a}.choice-or{color:var(--gold)}.combination-notes{font-size:.72rem;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--text-sub);margin:.7rem 0 0}.combination-editor{margin-top:.8rem;padding-top:.8rem;border-top:1px solid var(--line-soft)}.combination-meta{display:grid;grid-template-columns:1fr 1.4fr;gap:.65rem;margin-bottom:.8rem}.combination-meta label{display:grid;align-content:start;gap:.35rem;font-size:.65rem;color:var(--text-dim);min-width:0}.combination-hint{font-size:.66rem;line-height:1.7;color:var(--text-dim);margin:.65rem 0 0}.combination-editor>.combination-hint{margin-top:.8rem}@media(max-width:720px){.combinations-toolbar{align-items:flex-start}.combinations-toolbar>span{display:grid;gap:.25rem}.combinations-toolbar b{margin-left:0}.perk-combination{padding:.65rem}.combination-header{flex-wrap:wrap;gap:.4rem}.combination-actions{margin-left:auto}.combination-meta,.combination-summary{grid-template-columns:1fr}.summary-perk img{width:28px;height:28px}}@media print{.combinations-toolbar button,.combination-actions,.combination-editor{display:none!important}.perk-combination{break-inside:avoid;border-color:#aaa;background:transparent}.combination-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.combination-slot{background:transparent;border:1px solid #ddd}.combination-summary dd,.combination-header h3,.combination-notes{color:#111}.combination-summary dt{color:#555}}
</style>
