<script setup>
import { ui } from '@/i18n'
import { computed } from 'vue'
import { sources, DATA_VERSION } from '@/data/v2'
import ConfidenceBadge from './ConfidenceBadge.vue'
import StableDisclosure from './StableDisclosure.vue'
import { entryHistory } from '../../../packages/knowledge-links/index.js'
const props = defineProps({ item: { type: Object, required: true }, snapshot: { type: Object, default: () => ({}) }, official: Boolean, compact: Boolean })
const sourceRows = computed(() => (props.official ? ['bungie-manifest'] : props.item.sourceIds || []).map(id => sources.find(s => s.id === id) || { id, title: id }))
const history = computed(() => entryHistory(props.item))
const version = computed(() => props.item.manifestVersion || props.snapshot.manifestVersion || (props.official ? null : DATA_VERSION))
</script>
<template>
  <div class="provenance"><StableDisclosure :title="ui('来源与版本')" :width="680" trigger-class="provenance-trigger">
    <template #trigger><span>{{ ui("来源与版本") }}</span><small>{{ official ? ui("官方定义") : item.confidence ? ui("条目分级 {0}", [item.confidence]) : ui("查看依据") }}</small></template>
    <div class="provenance-body">
      <dl class="evidence-facts">
        <div><dt>{{ official ? ui("定义快照") : ui("资料版本") }}</dt><dd>{{ version || ui("未登记") }}</dd></div>
        <div><dt>{{ ui("快照同步") }}</dt><dd>{{ snapshot.syncedAt?.slice(0, 10) || ui("未登记") }}</dd></div>
        <div v-if="item.verifiedAt"><dt>{{ ui("条目核验") }}</dt><dd>{{ item.verifiedAt }}</dd></div>
      </dl>
      <p v-if="!official && item.confidence" class="entry-confidence">{{ ui("条目分级") }} <ConfidenceBadge :level="item.confidence" /></p>
      <ul class="source-list">
        <li v-for="source in sourceRows" :key="source.id"><div><ConfidenceBadge v-if="source.level" :level="source.level" /><a v-if="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a><strong v-else>{{ source.title }}</strong></div><small>{{ ui("来源检查：") }}{{ source.checkedAt || ui("未登记") }}</small><p v-if="source.note">{{ source.note }}</p></li>
      </ul>
      <p v-if="!sourceRows.length" class="evidence-empty">{{ ui("尚未登记条目来源。") }}</p>
      <section class="entry-history"><h3>{{ ui("条目变更记录") }} <span>{{ history.length }} {{ ui("条") }}</span></h3><ol v-if="history.length"><li v-for="(change, index) in history" :key="index"><time>{{ change.date }}</time><strong v-if="change.version">{{ change.version }}</strong><p>{{ change.summary }}</p></li></ol><p v-else class="evidence-empty">{{ ui("尚未登记逐条变更记录。快照同步时间不代表内容变更或实机核验。") }}</p></section>
    </div>
  </StableDisclosure></div>
</template>
<style scoped>
.provenance{display:block;margin-top:1rem;font-size:.76rem;min-width:0}.provenance :deep(.provenance-trigger){border-width:1px 0;padding:.8rem 0;background:transparent;color:var(--text-main);font-weight:600}.provenance :deep(.provenance-trigger>span){flex:1}.provenance :deep(.provenance-trigger>small){color:var(--gold-dim);font-size:.68rem;font-weight:400}.provenance-body{padding-bottom:.8rem}.evidence-facts{display:grid;gap:.7rem;margin:.25rem 0 1rem}.evidence-facts>div{display:grid;grid-template-columns:6rem minmax(0,1fr);gap:.75rem}.evidence-facts dt{color:var(--text-dim)}.evidence-facts dd{margin:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.source-list{list-style:none;padding:0;margin:0}.source-list li{padding:.7rem 0;border-top:1px solid var(--line-soft)}.source-list li>div{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}.source-list a{color:var(--gold)}.source-list p,.evidence-empty{font-size:.72rem;color:var(--text-dim);line-height:1.75;margin:.35rem 0}.source-list small{display:block;color:var(--text-dim);margin-top:.5rem}.entry-history{border-top:1px solid var(--line-soft);padding-top:.8rem}.entry-history h3{display:flex;justify-content:space-between;gap:1rem;margin:0;font-size:.78rem}.entry-history h3 span{color:var(--gold-dim);font-size:.68rem;font-weight:400}.entry-history ol{padding-left:1.2rem}.entry-history time{color:var(--gold-dim);margin-right:.75rem}.entry-confidence{display:flex;align-items:center;gap:.6rem}
</style>
