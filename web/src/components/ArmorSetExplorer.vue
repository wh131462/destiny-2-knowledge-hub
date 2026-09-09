<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { armorSlots, armorGroups, armorName, armorDescription, armorSetPreview } from '../../../packages/manifest-catalog/armor.js'
import { manifestText } from '@/utils/manifestText'
import EntityLink from './EntityLink.vue'

const props = defineProps({ catalog: { type: Object, required: true }, classId: { type: String, required: true }, query: { type: String, default: '' } })
const emit = defineEmits(['open-armor'])
const router = useRouter()
const transferOpen = ref(false)
const selectedHash = ref(894715166)
const secondaryHash = ref('')
const assignments = ref({})
const mode = ref('5')
const exoticHash = ref(undefined)
const icon = item => item?.icon ? `https://www.bungie.net${item.icon}` : ''
const byHash = computed(() => new Map(props.catalog.items.map(item => [item.hash, item])))
const members = set => (set?.itemHashes || []).map(hash => byHash.value.get(hash)).filter(item => item?.classId === props.classId)
const availableSets = computed(() => props.catalog.sets.filter(set => members(set).length).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh')))
const filteredSets = computed(() => availableSets.value.filter(set => [set.name, set.nameZh, String(set.hash), ...set.perks.flatMap(p => [p.name, p.nameZh, p.description, p.descriptionZh])].join(' ').toLowerCase().includes(props.query.trim().toLowerCase())))
const selected = computed(() => filteredSets.value.find(set => set.hash === selectedHash.value) || filteredSets.value[0])
const selectedMembers = computed(() => armorSlots.map(slot => ({ ...slot, item: members(selected.value).find(item => item.armorSlot === slot.id) })))
const alternateSets = computed(() => availableSets.value.filter(set => set.hash !== selected.value?.hash))
const exoticChoices = computed(() => armorGroups(props.catalog.items.filter(item => item.classId === props.classId && item.tierTypeHash === 2759499571 && armorSlots.some(slot => slot.id === item.armorSlot))).map(group => group[0]).sort((a, b) => armorName(a).localeCompare(armorName(b), 'zh')))
const selectedExotic = computed(() => exoticChoices.value.find(item => item.hash === exoticHash.value))
const exoticOptions = computed(() => armorSlots.map(slot => ({ label: slot.name, options: exoticChoices.value.filter(item => item.armorSlot === slot.id).map(item => ({ value: item.hash, label: `${armorName(item)} ${slot.name}`, title: armorName(item) })) })).filter(group => group.options.length))
const effectiveAssignments = computed(() => ({ ...assignments.value, ...(selectedExotic.value ? { [selectedExotic.value.armorSlot]: `exotic:${selectedExotic.value.hash}` } : {}) }))
const preview = computed(() => armorSetPreview(effectiveAssignments.value, props.catalog.sets, props.catalog.items, props.classId))
const activeCount = computed(() => preview.value.sets.reduce((sum, set) => sum + set.perks.filter(p => p.active).length, 0))

function applyPreset(value = mode.value) {
  mode.value = value
  if (!selected.value) { assignments.value = {}; return }
  const second = alternateSets.value.find(set => String(set.hash) === String(secondaryHash.value)) || alternateSets.value[0]
  secondaryHash.value = second ? String(second.hash) : ''
  if (value === '5') exoticHash.value = undefined
  let legendaryIndex = 0
  assignments.value = Object.fromEntries(armorSlots.map(slot => {
    const excluded = slot.id === selectedExotic.value?.armorSlot
    const setHash = value === '2+2+1' && !excluded && legendaryIndex >= 2 ? secondaryHash.value : String(selected.value.hash)
    if (!excluded) legendaryIndex++
    return [slot.id, optionsFor(slot.id).some(set => String(set.hash) === setHash) ? setHash : '']
  }))
}
function chooseExotic(hash) {
  exoticHash.value = hash
  if (mode.value !== 'custom') applyPreset(hash ? (mode.value === '5' ? '4+1' : mode.value) : '5')
}
function assign(slot, value) {
  assignments.value[slot] = value
  mode.value = 'custom'
}
function requestTransfer() { transferOpen.value = true }
function confirmTransfer() {
  const armor = Object.fromEntries(armorSlots.map(slot => [slot.id, preview.value.slots.find(item => item.id === slot.id)?.item?.hash || null]))
  sessionStorage.setItem('d2hub-armor-transfer-v1', JSON.stringify({ classId: props.classId, armor, setName: armorName(selected.value), exoticName: selectedExotic.value ? armorName(selectedExotic.value) : '' }))
  transferOpen.value = false
  router.push('/manual-loadout')
}
function optionsFor(slot) { return availableSets.value.filter(set => members(set).some(item => item.armorSlot === slot && item.tierTypeHash !== 2759499571)) }
watch(() => props.classId, () => { exoticHash.value = undefined; applyPreset('5') }, { flush: 'sync' })
watch(() => selected.value?.hash, () => applyPreset(selectedExotic.value ? '4+1' : '5'), { immediate: true })
</script>

<template>
  <div class="set-explorer">
    <aside class="set-index" aria-label="套装目录">
      <div class="index-heading"><strong>套装目录</strong><span role="status">{{ filteredSets.length }} / {{ availableSets.length }}</span></div>
      <div class="set-list">
        <button v-for="set in filteredSets" :key="set.hash" type="button" :aria-pressed="selected?.hash === set.hash" @click="selectedHash = set.hash">
          <img v-if="icon(set)" :src="icon(set)" alt="" loading="lazy" />
          <span><strong>{{ armorName(set) }}</strong><small>{{ set.name }}</small></span>
          <span class="set-counts">{{ set.perks.map(p => p.requiredSetCount).join(' / ') }}</span>
        </button>
        <p v-if="!filteredSets.length" class="empty-copy">未找到匹配套装。试试名称或效果关键词，如「手雷」「治疗」。</p>
      </div>
    </aside>

    <div v-if="selected" class="set-content">
      <section class="set-detail">
        <header class="set-heading"><div><span class="overline">SET INTELLIGENCE</span><h2>{{ armorName(selected) }}</h2><p>{{ selected.name }}</p></div><EntityLink :item="selected" kind="sets" label="百科详情" /></header>
        <div class="set-pieces">
          <button v-for="slot in selectedMembers" :key="slot.id" type="button" :disabled="!slot.item" :aria-label="slot.item ? `查看${armorName(slot.item)}` : `${slot.name}未收录`" @click="emit('open-armor', slot.item)">
            <div class="piece-image"><img v-if="icon(slot.item)" :src="icon(slot.item)" :alt="armorName(slot.item)" /><span v-else>—</span></div>
            <span>{{ slot.name }}</span><small>{{ slot.item ? armorName(slot.item) : '未收录' }}</small>
          </button>
        </div>
        <div class="set-bonuses">
          <article v-for="perk in selected.perks" :key="perk.sandboxPerkHash" class="bonus-row">
            <div class="bonus-number"><strong>{{ perk.requiredSetCount }}</strong><small>件套</small></div>
            <div><h3>{{ armorName(perk) }}</h3><p>{{ manifestText(armorDescription(perk)) || '效果说明尚未收录。' }}</p></div>
          </article>
          <p v-if="!selected.perks.length" class="empty-copy">当前定义未提供套装加成。</p>
        </div>
        <p class="definition-note">按该版本的实际装备计数；同名旧版与幻化外观不会自动获得这里的套装效果。</p>
      </section>

      <section class="set-planner" aria-label="套装搭配预览">
        <header class="planner-heading"><div><span class="overline">FIVE SLOTS. YOUR COMBINATION.</span><h2>试一套搭配</h2><p>先选异域护甲，再为其余部位搭配套装，查看已激活的效果。</p></div><span class="active-total" role="status">{{ activeCount }} <small>项已激活</small></span></header>
        <div class="exotic-picker">
          <div class="exotic-picker-heading"><label for="planner-exotic">异域护甲</label><strong role="status">{{ selectedExotic ? '1 / 1' : '0 / 1' }}</strong></div>
          <a-select id="planner-exotic" :value="exoticHash" :options="exoticOptions" show-search option-filter-prop="label" allow-clear placeholder="选择异域护甲（可搜索名称）" @change="chooseExotic" />
          <p>五个防具部位合计最多装备一件异域护甲。选择后自动占用对应部位，更换会替换原异域。</p>
          <button v-if="selectedExotic" type="button" class="exotic-summary" @click="emit('open-armor', selectedExotic)"><img v-if="icon(selectedExotic)" :src="icon(selectedExotic)" alt="" /><span><strong>{{ armorName(selectedExotic) }}</strong><small>{{ armorSlots.find(slot => slot.id === selectedExotic.armorSlot)?.name }} 查看异域特性 ↗</small></span></button>
        </div>
        <div class="preset-row"><button v-for="preset in ['4+1', '2+2+1', '5']" :key="preset" type="button" :aria-pressed="mode === preset" :disabled="preset !== '5' && !selectedExotic" @click="applyPreset(preset)">{{ preset === '4+1' ? '4 件套 + 异域' : preset === '2+2+1' ? '2 + 2 + 异域' : '5 件同套' }}</button></div>
        <p v-if="!selectedExotic" class="definition-note">当前未装备异域；选择一件后，可使用「4 件套 + 异域」或「2 + 2 + 异域」。</p>
        <label v-if="mode === '2+2+1'" class="secondary-set" for="armor-secondary-set">第二套装<a-select id="armor-secondary-set" aria-label="第二套装" v-model:value="secondaryHash" @change="applyPreset('2+2+1')"><a-select-option v-for="set in alternateSets" :key="set.hash" :value="String(set.hash)">{{ armorName(set) }}</a-select-option></a-select></label>
        <div class="planner-slots">
          <label v-for="slot in preview.slots" :key="slot.id" :for="`armor-set-${slot.id}`" :class="{ 'exotic-slot': slot.exotic }"><span>{{ slot.name }}</span><div class="planner-image"><img v-if="slot.item?.icon" :src="icon(slot.item)" alt="" /><span v-else class="slot-placeholder">{{ slot.exotic ? '◇' : '＋' }}</span></div><span v-if="slot.exotic" class="equipped-exotic">{{ armorName(slot.item) }}<small>已装备异域 1 / 1</small></span><a-select v-else :id="`armor-set-${slot.id}`" :value="assignments[slot.id] || ''" :aria-label="`${slot.name}套装分配`" @change="assign(slot.id, $event)"><a-select-option value="">空部位</a-select-option><a-select-option v-for="set in optionsFor(slot.id)" :key="set.hash" :value="String(set.hash)">{{ armorName(set) }}</a-select-option></a-select></label>
        </div>
        <div class="activation-list" aria-live="polite">
          <div v-for="set in preview.sets" :key="set.hash" class="activation-set"><header><strong>{{ armorName(set) }}</strong><span>{{ set.count }} 件</span></header><div v-for="perk in set.perks" :key="perk.sandboxPerkHash" :class="['activation-perk', { activated: perk.active }]"><span aria-hidden="true">{{ perk.active ? '✓' : '○' }}</span><span>{{ perk.requiredSetCount }} 件 {{ armorName(perk) }}</span><small>{{ perk.active ? '已激活' : `还差 ${perk.requiredSetCount - set.count} 件` }}</small></div></div>
          <p v-if="!preview.sets.length" class="empty-copy">选择套装后，这里会显示效果的激活进度。</p>
        </div>
        <p class="definition-note">异域护甲不计入传说套装件数。职业装备上的双异域特性仍属于一件护甲；具体词条组合、子职业适用条件、随机属性与模组请在完整构筑中配置。</p>
        <button type="button" class="build-link" @click="requestTransfer">打开构筑工具，自行配置完整方案 <span>↗</span></button>
        <a-modal v-model:open="transferOpen" title="带入这套防具配置？" ok-text="确定并覆盖" cancel-text="取消" @ok="confirmTransfer"><p>确认后会将当前五个部位（包含已选异域）带入构筑页面，并覆盖其中已有的防具选择与防具模组。</p><p class="transfer-note">武器、技能、神器和其他配置会保留不变。</p></a-modal>
      </section>
    </div>
    <div v-else class="no-set"><strong>没有匹配的套装</strong><p>更换职业或清空搜索后继续浏览。</p></div>
  </div>
</template>

<style scoped>
.exotic-picker{margin-top:22px;padding:16px;border:1px solid #e8c15a44;background:#e8c15a05}.exotic-picker-heading{display:flex;justify-content:space-between;margin-bottom:10px;font-size:.85rem}.exotic-picker-heading strong{color:var(--gold)}.exotic-picker>.ant-select{width:100%;min-width:0}.exotic-picker>p{font-size:.73rem;line-height:1.8;margin-top:10px}.exotic-summary{display:flex;gap:12px;align-items:center;background:transparent;border:0;padding:14px 0 0;color:var(--gold);text-align:left;cursor:pointer}.exotic-summary img{width:44px;height:44px}.exotic-summary strong{font-size:.82rem}.exotic-summary small,.equipped-exotic small{display:block;font-size:.65rem;margin-top:5px;color:#b5a67e}.equipped-exotic{overflow-wrap:anywhere;color:var(--gold)!important}.preset-row button:disabled{opacity:.45;cursor:not-allowed}

.set-explorer{display:grid;grid-template-columns:280px minmax(0,1fr);gap:24px;align-items:start}.set-index{border:1px solid var(--line-soft);background:#0c1422;position:sticky;top:90px}.index-heading{display:flex;justify-content:space-between;padding:18px;border-bottom:1px solid var(--line-soft);font-size:.85rem}.index-heading span{color:#a7b4c9;font-variant-numeric:tabular-nums}.set-list{max-height:740px;overflow:auto;scrollbar-width:thin;scrollbar-color:#38445b transparent}.set-list button{width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;text-align:left;background:transparent;color:var(--text-main);border:0;border-left:2px solid transparent;border-bottom:1px solid #ffffff06;cursor:pointer}.set-list button:hover{background:#ffffff05}.set-list button[aria-pressed=true]{background:#e8c15a0c;border-left-color:var(--gold)}.set-list img{width:40px;height:40px;object-fit:cover}.set-list button>span:nth-child(2){flex:1;min-width:0}.set-list strong{font-size:.82rem;font-weight:500}.set-list small{display:block;color:#8e9cb4;font-size:.65rem;margin-top:3px}.set-counts{color:#bfa465;font-size:.68rem;white-space:nowrap}.overline{color:#b8a477;font-size:.62rem;letter-spacing:.17em;font-family:var(--font-en)}.set-detail,.set-planner{background:linear-gradient(135deg,#141f30,#0c1422);border:1px solid var(--line-soft);padding:28px}.set-heading{display:flex;justify-content:space-between;gap:12px;align-items:center}.set-heading h2{font-family:var(--font-cn);font-size:1.8rem;margin:7px 0 3px}.set-heading p{font-size:.76rem;letter-spacing:.04em}.set-heading :deep(a){font-size:.73rem;white-space:nowrap}.set-pieces{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;padding:26px 0;border-bottom:1px solid var(--line-soft)}.set-pieces button{background:transparent;border:0;color:#bcc6d8;cursor:pointer;min-width:0}.piece-image{width:72px;max-width:100%;aspect-ratio:1;margin:0 auto 9px;background:#ffffff06;border:1px solid #ffffff20;padding:3px}.piece-image img{width:100%;height:100%;object-fit:cover}.set-pieces button:hover .piece-image{border-color:var(--gold)}.set-pieces span{font-size:.72rem}.set-pieces small{display:block;font-size:.62rem;color:#8c9cb3;margin-top:3px;overflow-wrap:anywhere}.bonus-row{display:grid;grid-template-columns:45px minmax(0,1fr);gap:18px;padding:24px 0;border-bottom:1px solid var(--line-soft)}.bonus-number{display:flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:59px;border:1px solid #e8c15a44;color:var(--gold);background:#e8c15a05}.bonus-number strong{font-family:var(--font-en);font-size:1.4rem;line-height:1.1}.bonus-number small{font-size:.6rem;margin-top:5px}.bonus-row h3{font-size:.95rem;color:#e9d8aa;margin:0 0 8px;font-family:var(--font-cn)}.bonus-row p{font-size:.81rem;line-height:1.9;white-space:pre-line}.definition-note{font-size:.7rem;line-height:1.85;color:#96a5bb;margin:17px 0 0}.set-planner{margin-top:22px;background:#0e1826}.planner-heading{display:flex;justify-content:space-between;gap:12px}.planner-heading h2{font-family:var(--font-cn);font-size:1.3rem;margin:7px 0}.planner-heading p{font-size:.75rem}.active-total{font-family:var(--font-en);color:var(--gold);font-size:1.7rem;white-space:nowrap;align-self:center}.active-total small{display:block;font-family:var(--font-cn);font-size:.65rem;color:#acb9cd}.preset-row{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 18px}.preset-row button{font:inherit;font-size:.75rem;padding:8px 12px;border:1px solid #ffffff20;background:transparent;color:#b4c1d4;cursor:pointer}.preset-row button[aria-pressed=true]{color:var(--gold);border-color:#e8c15a88;background:#e8c15a09}.secondary-set{display:flex;gap:12px;align-items:center;font-size:.75rem;color:#a9b6c9;margin-bottom:15px}.secondary-set .ant-select{width:220px;min-width:0;max-width:100%}.planner-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.planner-slots label>span{display:block;text-align:center;color:#bac5d6;font-size:.68rem;margin-bottom:8px}.planner-image{width:54px;height:54px;margin:0 auto 10px;background:#ffffff06;display:grid;place-items:center}.planner-image img{width:100%;height:100%}.slot-placeholder{font-size:1.8rem;color:#6b7d99}.exotic-slot .planner-image{border:1px solid #e8c15a66;background:#e8c15a0c}.exotic-slot .slot-placeholder{color:var(--gold)}.planner-slots>label{min-width:0}.planner-slots .ant-select{width:100%;min-width:0;font-size:.66rem}.activation-list{display:grid;gap:14px;margin-top:24px}.activation-set{border-top:1px solid var(--line-soft);padding-top:14px}.activation-set header{display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:9px}.activation-set header span{color:#b2a27e}.activation-perk{display:flex;align-items:center;gap:8px;color:#9aa7bd;font-size:.73rem;padding:5px 0}.activation-perk small{margin-left:auto;white-space:nowrap;font-size:.65rem}.activated{color:#b5d7b5}.build-link{display:flex;justify-content:space-between;width:100%;font:inherit;text-align:left;cursor:pointer;justify-content:space-between;font-size:.78rem;margin-top:20px;border-top:1px solid var(--line-soft);padding-top:17px;color:var(--gold)}.empty-copy,.no-set{padding:24px;font-size:.82rem;color:#a9b6c9}.no-set{border:1px dashed var(--line-soft)}
@media(max-width:1000px){.set-explorer{grid-template-columns:230px minmax(0,1fr);gap:16px}.set-detail,.set-planner{padding:20px}.set-pieces{gap:8px}.set-counts{display:none}}
@media(max-width:760px){.set-explorer{grid-template-columns:1fr}.set-index{position:static}.set-list{max-height:230px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.set-list button{padding:10px}.set-list img{width:32px;height:32px}.set-pieces small{display:none}.set-heading h2{font-size:1.45rem}.set-detail,.set-planner{padding:18px}.planner-slots{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.planner-heading .overline{font-size:.5rem}.planner-image{width:44px;height:44px}.activation-perk{font-size:.68rem}.set-heading :deep(a){font-size:.65rem}}
</style>
