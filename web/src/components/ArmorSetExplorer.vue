<script setup>
import { armorName, armorDescription } from '@/i18n/metadata'
import { useI18n, ui, localizedOptions, localized } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { armorSlots, armorGroups, armorSetPreview } from '../../../packages/manifest-catalog/armor.js'
import { manifestText } from '@/utils/manifestText'
import EntityLink from './EntityLink.vue'
import ItemDefinitionInfo from './ItemDefinitionInfo.vue'

const { locale } = useI18n()
const props = defineProps({
  catalog: { type: Object, required: true },
  classId: { type: String, required: true },
  query: { type: String, default: '' },
  mode: { type: String, default: 'sets', validator: value => ['sets', 'planner'].includes(value) }
})
const emit = defineEmits(['open-armor', 'open-planner'])
const router = useRouter()
const transferOpen = ref(false)
const selectedHash = ref(894715166)
const secondaryHash = ref('')
const assignments = ref({})
const strategy = ref('4+1')
const exoticHash = ref(undefined)
const icon = item => item?.icon ? `https://www.bungie.net${item.icon}` : ''
const byHash = computed(() => new Map(props.catalog.items.map(item => [item.hash, item])))
const members = set => (set?.itemHashes || []).map(hash => byHash.value.get(hash)).filter(item => item?.classId === props.classId)
const availableSets = computed(() => props.catalog.sets.filter(set => members(set).length).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh')))
const filteredSets = computed(() => availableSets.value.filter(set => [set.name, set.nameZh, String(set.hash), ...set.perks.flatMap(p => [p.name, p.nameZh, p.description, p.descriptionZh])].join(' ').toLowerCase().includes(props.query.trim().toLowerCase())))
const selected = computed(() => props.mode === 'sets'
  ? filteredSets.value.find(set => set.hash === selectedHash.value) || filteredSets.value[0]
  : availableSets.value.find(set => set.hash === selectedHash.value) || availableSets.value[0])
const selectedMembers = computed(() => armorSlots.map(slot => ({ ...slot, item: members(selected.value).find(item => item.armorSlot === slot.id) })))
const alternateSets = computed(() => availableSets.value.filter(set => set.hash !== selected.value?.hash))
const exoticGroups = computed(() => armorGroups(props.catalog.items.filter(item => item.classId === props.classId && item.tierTypeHash === 2759499571 && armorSlots.some(slot => slot.id === item.armorSlot))))
const exoticChoices = computed(() => exoticGroups.value.map(group => group[0]).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh') || a.hash - b.hash))
const selectedExotic = computed(() => exoticChoices.value.find(item => item.hash === exoticHash.value))
const exoticOptions = computed(() => armorSlots.map(slot => ({
  label: localized(slot),
  options: exoticChoices.value.filter(item => item.armorSlot === slot.id).map(item => ({ value: item.hash, label: armorName(item), title: `${armorName(item)} ${item.name || ''}` }))
})).filter(group => group.options.length))
const effectiveAssignments = computed(() => ({ ...assignments.value, ...(selectedExotic.value ? { [selectedExotic.value.armorSlot]: `exotic:${selectedExotic.value.hash}` } : {}) }))
const preview = computed(() => armorSetPreview(effectiveAssignments.value, props.catalog.sets, props.catalog.items, props.classId))
const activeCount = computed(() => preview.value.sets.reduce((sum, set) => sum + set.perks.filter(perk => perk.active).length, 0))
const setOptions = computed(() => availableSets.value.map(set => ({ value: set.hash, label: armorName(set) })))
const strategyOptions = computed(() => [
  { value: '4+1', label: ui('4 件套 + 1 个自由位') },
  { value: '2+2+1', label: ui('2 + 2 + 异域') },
  { value: '5', label: ui('5 件同套') }
])

function applyStrategy(value = strategy.value) {
  strategy.value = value
  if (!selected.value) { assignments.value = {}; return }
  const second = alternateSets.value.find(set => String(set.hash) === String(secondaryHash.value)) || alternateSets.value[0]
  secondaryHash.value = second ? String(second.hash) : ''
  if (value === '5') exoticHash.value = undefined
  const exoticSlot = selectedExotic.value?.armorSlot
  let legendaryIndex = 0
  assignments.value = Object.fromEntries(armorSlots.map((slot, index) => {
    if (slot.id === exoticSlot) return [slot.id, '']
    if (value === '4+1' && !selectedExotic.value && index === armorSlots.length - 1) return [slot.id, '']
    const setHash = value === '2+2+1' && legendaryIndex >= 2 ? secondaryHash.value : String(selected.value.hash)
    legendaryIndex++
    return [slot.id, optionsFor(slot.id).some(set => String(set.hash) === setHash) ? setHash : '']
  }))
}
function chooseSet(hash) { selectedHash.value = Number(hash) }
function chooseExotic(hash) {
  exoticHash.value = hash
  if (strategy.value === '5') strategy.value = '4+1'
  applyStrategy(strategy.value)
}
function assign(slot, value) {
  assignments.value = { ...assignments.value, [slot]: value }
  strategy.value = 'custom'
}
function openPlanner() {
  if (selected.value) selectedHash.value = selected.value.hash
  emit('open-planner')
}
function requestTransfer() { transferOpen.value = true }
function confirmTransfer() {
  const armor = Object.fromEntries(armorSlots.map(slot => [slot.id, preview.value.slots.find(item => item.id === slot.id)?.item?.hash || null]))
  sessionStorage.setItem('d2hub-armor-transfer-v1', JSON.stringify({ classId: props.classId, armor, setName: armorName(selected.value), exoticName: selectedExotic.value ? armorName(selectedExotic.value) : '' }))
  transferOpen.value = false
  router.push('/manual-loadout')
}
function optionsFor(slot) { return availableSets.value.filter(set => members(set).some(item => item.armorSlot === slot && item.tierTypeHash !== 2759499571)) }

watch(() => props.classId, () => {
  const next = availableSets.value[0]
  selectedHash.value = next?.hash
  exoticHash.value = undefined
  strategy.value = '4+1'
  applyStrategy()
}, { flush: 'sync' })
watch(() => selected.value?.hash, () => applyStrategy(strategy.value === 'custom' ? '4+1' : strategy.value), { immediate: true })
</script>

<template>
  <div class="set-workflow" :class="`mode-${mode}`">
    <template v-if="mode === 'sets'">
      <aside class="set-index" :aria-label="ui('套装目录')">
        <div class="index-heading"><strong>{{ ui('套装目录') }}</strong><span role="status">{{ filteredSets.length }} / {{ availableSets.length }}</span></div>
        <div class="set-list">
          <button v-for="set in filteredSets" :key="set.hash" type="button" :aria-pressed="selected?.hash === set.hash" @click="selectedHash = set.hash">
            <img v-if="icon(set)" :src="icon(set)" alt="" loading="lazy" />
            <span><strong>{{ armorName(set) }}</strong><small>{{ set.name }}</small></span>
            <span class="set-counts">{{ set.perks.map(perk => perk.requiredSetCount).join(' / ') }}</span>
          </button>
          <p v-if="!filteredSets.length" class="empty-copy">{{ ui('未找到匹配套装。试试名称或效果关键词，如「手雷」「治疗」。') }}</p>
        </div>
      </aside>

      <section v-if="selected" class="set-detail">
        <header class="set-heading">
          <div><span class="overline">SET RECORD</span><h2>{{ armorName(selected) }}</h2><p>{{ selected.name }}</p></div>
          <EntityLink :item="selected" kind="sets" :label="ui('百科详情')" />
        </header>
        <div class="set-pieces">
          <button v-for="slot in selectedMembers" :key="slot.id" type="button" :disabled="!slot.item" :aria-label="slot.item ? ui('查看{0}', [armorName(slot.item)]) : ui('{0}未收录', [localized(slot)])" @click="emit('open-armor', slot.item)">
            <div class="piece-image"><img v-if="icon(slot.item)" :src="icon(slot.item)" :alt="armorName(slot.item)" /><span v-else>—</span></div>
            <span>{{ localized(slot) }}</span><small>{{ slot.item ? armorName(slot.item) : ui('未收录') }}</small>
          </button>
        </div>
        <div class="set-bonuses">
          <article v-for="perk in selected.perks" :key="perk.sandboxPerkHash" class="bonus-row">
            <div class="bonus-number"><strong>{{ perk.requiredSetCount }}</strong><small>{{ ui('件套') }}</small></div>
            <div><h3>{{ armorName(perk) }}</h3><p>{{ manifestText(armorDescription(perk), locale) || ui('效果说明尚未收录。') }}</p></div>
          </article>
          <p v-if="!selected.perks.length" class="empty-copy">{{ ui('当前定义未提供套装加成。') }}</p>
        </div>
        <div class="set-action-bar"><p>{{ ui('同名旧版与幻化外观不会自动获得这里的套装效果。') }}</p><button type="button" class="primary-action" @click="openPlanner">{{ ui('用这套开始搭配') }} <span aria-hidden="true">→</span></button></div>
      </section>
      <div v-else class="no-set"><strong>{{ ui('没有匹配的套装') }}</strong><p>{{ ui('更换职业或清空搜索后继续浏览。') }}</p></div>
    </template>

    <section v-else class="set-planner" :aria-label="ui('套装搭配预览')">
      <header class="planner-heading">
        <div><span class="overline">ARMOR ALLOCATION</span><h2>{{ ui('五个部位，一套清楚的搭配') }}</h2><p>{{ ui('先选择主套装和分配策略，再决定异域核心与每个部位。') }}</p></div>
        <span class="active-total" role="status">{{ activeCount }} <small>{{ ui('项已激活') }}</small></span>
      </header>
      <div class="planner-controls">
        <label>{{ ui('主套装') }}<a-select :value="selected?.hash" :options="setOptions" show-search option-filter-prop="label" :aria-label="ui('主套装')" @change="chooseSet" /></label>
        <label>{{ ui('搭配策略') }}<a-select :value="strategy === 'custom' ? undefined : strategy" :options="strategyOptions" :placeholder="strategy === 'custom' ? ui('自定义分配') : undefined" :aria-label="ui('搭配策略')" @change="applyStrategy" /></label>
        <label>{{ ui('异域护甲') }}<a-select :value="exoticHash" :options="localizedOptions(exoticOptions)" popup-class-name="exotic-version-options" show-search option-filter-prop="label" allow-clear :aria-label="ui('异域护甲')" :placeholder="ui('选择异域护甲（同名版本已合并）')" @change="chooseExotic" /></label>
        <label v-if="strategy === '2+2+1'">{{ ui('第二套装') }}<a-select v-model:value="secondaryHash" :aria-label="ui('第二套装')" @change="applyStrategy('2+2+1')"><a-select-option v-for="set in alternateSets" :key="set.hash" :value="String(set.hash)">{{ armorName(set) }}</a-select-option></a-select></label>
      </div>

      <div v-if="selectedExotic" class="exotic-summary-row">
        <button type="button" class="exotic-summary" @click="emit('open-armor', selectedExotic)"><img v-if="icon(selectedExotic)" :src="icon(selectedExotic)" alt="" /><span><strong>{{ armorName(selectedExotic) }}</strong><small>{{ localized(armorSlots.find(slot => slot.id === selectedExotic.armorSlot)) }} / {{ ui('查看异域特性') }}</small></span></button>
        <ItemDefinitionInfo :item="selectedExotic" compact />
      </div>

      <div class="planner-body">
        <div class="planner-slots">
          <label v-for="slot in preview.slots" :key="slot.id" :for="`armor-set-${slot.id}`" :class="{ 'exotic-slot': slot.exotic, 'free-slot': !slot.item && !slot.exotic }">
            <span>{{ localized(slot) }}</span>
            <div class="planner-image"><img v-if="slot.item?.icon" :src="icon(slot.item)" alt="" /><span v-else class="slot-placeholder">{{ slot.exotic ? '◇' : '+' }}</span></div>
            <span v-if="slot.exotic" class="slot-choice exotic-choice">{{ armorName(slot.item) }}<small>{{ ui('异域 1 / 1') }}</small></span>
            <a-select v-else :id="`armor-set-${slot.id}`" :value="assignments[slot.id] || ''" :aria-label="ui('{0}套装分配', [localized(slot)])" @change="assign(slot.id, $event)"><a-select-option value="">{{ ui('自由位') }}</a-select-option><a-select-option v-for="set in optionsFor(slot.id)" :key="set.hash" :value="String(set.hash)">{{ armorName(set) }}</a-select-option></a-select>
          </label>
        </div>
        <div class="activation-list" aria-live="polite">
          <div v-for="set in preview.sets" :key="set.hash" class="activation-set">
            <header><strong>{{ armorName(set) }}</strong><span>{{ set.count }} {{ ui('件') }}</span></header>
            <div v-for="perk in set.perks" :key="perk.sandboxPerkHash" :class="['activation-perk', { activated: perk.active }]"><span aria-hidden="true">{{ perk.active ? '✓' : '○' }}</span><span>{{ perk.requiredSetCount }} {{ ui('件') }} {{ armorName(perk) }}</span><small>{{ perk.active ? ui('已激活') : ui('还差 {0} 件', [perk.requiredSetCount - set.count]) }}</small></div>
          </div>
          <p v-if="!preview.sets.length" class="empty-copy">{{ ui('选择套装后，这里会显示效果的激活进度。') }}</p>
        </div>
      </div>
      <div class="planner-footer"><p>{{ ui('异域护甲不计入传说套装件数；自由位不会贡献套装效果。') }}</p><button type="button" class="build-link" @click="requestTransfer"><span>{{ ui('带入构筑工具') }}</span><span aria-hidden="true">↗</span></button></div>
      <a-modal v-model:open="transferOpen" :title="ui('带入这套防具配置？')" :ok-text="ui('确定并覆盖')" :cancel-text="ui('取消')" @ok="confirmTransfer"><p>{{ ui('确认后会将当前五个部位（包含已选异域）带入构筑页面，并覆盖其中已有的防具选择与防具模组。') }}</p><p class="transfer-note">{{ ui('武器、技能、神器和其他配置会保留不变。') }}</p></a-modal>
    </section>
  </div>
</template>

<style scoped>
.set-workflow{min-width:0}.set-workflow.mode-sets{display:grid;grid-template-columns:17.5rem minmax(0,1fr);gap:1px;align-items:start;background:var(--line-soft);border:1px solid var(--line-soft)}
.set-index{position:sticky;top:5.6rem;min-width:0;background:var(--bg-dark)}.index-heading{display:flex;justify-content:space-between;padding:1rem;border-bottom:1px solid var(--line-soft);font-size:.76rem}.index-heading span{color:var(--text-dim);font-variant-numeric:tabular-nums}.set-list{max-height:43rem;overflow:auto;scrollbar-width:thin;scrollbar-color:#38445b transparent}.set-list button{display:flex;align-items:center;gap:.7rem;width:100%;min-width:0;padding:.7rem .8rem;border:0;border-bottom:1px solid rgba(255,255,255,.025);border-left:3px solid transparent;background:transparent;color:var(--text-main);text-align:left;cursor:pointer}.set-list button:hover{background:var(--bg-hover)}.set-list button:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}.set-list button[aria-pressed=true]{border-left-color:var(--gold);background:rgba(232,193,90,.08)}.set-list img{width:2.35rem;height:2.35rem;object-fit:cover}.set-list button>span:nth-child(2){flex:1;min-width:0}.set-list strong,.set-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.set-list strong{font-size:.75rem}.set-list small{margin-top:.15rem;color:var(--text-dim);font-size:.56rem}.set-counts{color:var(--gold-dim);font:.6rem var(--font-en);white-space:nowrap}
.set-detail,.set-planner{min-width:0;background:var(--bg-panel)}.set-detail{padding:1.4rem}.set-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.overline{color:var(--gold-dim);font:.55rem var(--font-en);letter-spacing:0}.set-heading h2,.planner-heading h2{margin:.35rem 0 .12rem;font-family:var(--font-cn)}.set-heading h2{font-size:1.5rem}.set-heading p,.planner-heading p{margin:0;color:var(--text-sub);font-size:.7rem}.set-heading :deep(a){font-size:.68rem;white-space:nowrap}.set-pieces{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;margin-top:1.25rem;background:var(--line-soft)}.set-pieces button{min-width:0;padding:.8rem .35rem;border:0;background:var(--bg-dark);color:var(--text-sub);cursor:pointer}.set-pieces button:hover .piece-image{border-color:var(--gold)}.set-pieces button:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}.piece-image{width:min(4.4rem,100%);aspect-ratio:1;margin:0 auto .45rem;border:1px solid var(--line-soft);background:var(--bg-deep);padding:2px}.piece-image img{width:100%;height:100%;object-fit:cover}.set-pieces span,.set-pieces small{display:block;font-size:.62rem;overflow-wrap:anywhere}.set-pieces small{margin-top:.2rem;color:var(--text-dim);font-size:.54rem}.bonus-row{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:1rem;padding:1.15rem 0;border-bottom:1px solid var(--line-soft)}.bonus-number{display:grid;place-items:center;align-content:center;height:3.7rem;border:1px solid rgba(232,193,90,.32);color:var(--gold);background:rgba(232,193,90,.04)}.bonus-number strong{font:700 1.25rem var(--font-en)}.bonus-number small{font-size:.55rem}.bonus-row h3{margin:0 0 .35rem;color:var(--gold-bright);font-size:.86rem}.bonus-row p{margin:0;color:var(--text-sub);font-size:.73rem;line-height:1.75;white-space:pre-line}.set-action-bar{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding-top:1rem}.set-action-bar p,.planner-footer p{margin:0;color:var(--text-dim);font-size:.63rem;line-height:1.6}.primary-action,.build-link{flex:none;padding:.65rem .85rem;border:1px solid var(--gold-dim);background:rgba(232,193,90,.08);color:var(--gold-bright);font:600 .7rem var(--font-cn);cursor:pointer}.primary-action:hover,.build-link:hover{border-color:var(--gold);background:rgba(232,193,90,.14)}.primary-action:focus-visible,.build-link:focus-visible{outline:2px solid var(--gold-bright);outline-offset:2px}
.set-planner{padding:1.4rem;border:1px solid var(--line-soft)}.planner-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.planner-heading h2{font-size:1.25rem}.active-total{color:var(--gold-bright);font:700 1.55rem var(--font-en);text-align:right;white-space:nowrap}.active-total small{display:block;color:var(--text-dim);font:400 .56rem var(--font-cn)}.planner-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin-top:1.2rem}.planner-controls label{display:grid;gap:.35rem;min-width:0;color:var(--text-dim);font-size:.63rem}.planner-controls .ant-select{width:100%;min-width:0}.exotic-summary-row{display:flex;align-items:center;gap:1rem;margin-top:.8rem;padding:.65rem;border-left:2px solid var(--gold);background:rgba(232,193,90,.05)}.exotic-summary{display:flex;align-items:center;gap:.65rem;min-width:0;border:0;background:transparent;color:var(--gold-bright);text-align:left;cursor:pointer}.exotic-summary img{width:2.8rem;height:2.8rem}.exotic-summary strong,.exotic-summary small{display:block;overflow-wrap:anywhere}.exotic-summary small{margin-top:.2rem;color:var(--text-dim);font-size:.56rem}.planner-body{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(15rem,.75fr);gap:1.2rem;margin-top:1.2rem}.planner-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line-soft)}.planner-slots>label{min-width:0;padding:.75rem .5rem;background:var(--bg-dark)}.planner-slots label>span:first-child{display:block;margin-bottom:.5rem;color:var(--text-sub);font-size:.61rem;text-align:center}.planner-image{display:grid;place-items:center;width:3.4rem;height:3.4rem;margin:0 auto .55rem;background:var(--bg-deep)}.planner-image img{width:100%;height:100%;object-fit:cover}.slot-placeholder{color:var(--text-dim);font:300 1.5rem var(--font-en)}.planner-slots .ant-select{width:100%;min-width:0;font-size:.62rem}.exotic-slot{box-shadow:inset 0 2px 0 var(--gold)}.free-slot{box-shadow:inset 0 2px 0 var(--text-dim)}.slot-choice{display:block;color:var(--gold-bright);font-size:.61rem;text-align:center;overflow-wrap:anywhere}.slot-choice small{display:block;margin-top:.2rem;color:var(--gold-dim);font-size:.52rem}.activation-list{display:grid;align-content:start;gap:.8rem}.activation-set{padding:.75rem;background:var(--bg-dark)}.activation-set header{display:flex;justify-content:space-between;gap:.5rem;padding-bottom:.55rem;border-bottom:1px solid var(--line-soft);font-size:.68rem}.activation-set header span{color:var(--gold-dim)}.activation-perk{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.4rem;align-items:center;padding:.45rem 0;color:var(--text-dim);font-size:.63rem}.activation-perk small{font-size:.55rem;white-space:nowrap}.activation-perk.activated{color:#b5d7b5}.planner-footer{display:flex;justify-content:space-between;gap:1rem;align-items:center;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line-soft)}.build-link{display:flex;gap:.8rem;align-items:center}.empty-copy,.no-set{padding:1rem;color:var(--text-dim);font-size:.7rem}.no-set{background:var(--bg-panel)}
:global(.exotic-version-options .ant-select-item-option-content){white-space:normal;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:1000px){.set-workflow.mode-sets{grid-template-columns:14rem minmax(0,1fr)}.planner-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.planner-body{grid-template-columns:1fr}.set-pieces small{display:none}}
@media(max-width:760px){.set-workflow.mode-sets{display:block;background:transparent;border:0}.set-index{position:static;border:1px solid var(--line-soft)}.set-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:14rem}.set-list button{padding:.6rem}.set-counts{display:none}.set-detail{margin-top:.75rem;padding:1rem;border:1px solid var(--line-soft)}.set-pieces{grid-template-columns:repeat(5,minmax(3.5rem,1fr));overflow:auto}.set-action-bar,.planner-footer{align-items:stretch;flex-direction:column}.primary-action,.build-link{width:100%;justify-content:space-between}.set-planner{padding:1rem}.planner-slots{grid-template-columns:repeat(2,minmax(0,1fr))}.planner-controls{grid-template-columns:1fr}.exotic-summary-row{align-items:flex-start;flex-direction:column}}
@media(max-width:430px){.set-list{grid-template-columns:1fr}.set-heading{align-items:flex-start}.set-heading h2{font-size:1.2rem}.set-pieces{grid-template-columns:repeat(5,3.8rem)}.bonus-row{grid-template-columns:2.6rem minmax(0,1fr);gap:.7rem}.bonus-number{height:3.25rem}.planner-heading h2{font-size:1.05rem}.active-total{font-size:1.2rem}.planner-slots{gap:1px}.activation-perk{grid-template-columns:auto minmax(0,1fr)}.activation-perk small{grid-column:2;white-space:normal}}
</style>
