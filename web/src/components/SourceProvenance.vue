<script setup>
import { computed } from 'vue'
import { sources, DATA_VERSION } from '@/data/v2'
import ConfidenceBadge from './ConfidenceBadge.vue'
import { entryHistory } from '../../../packages/knowledge-links/index.js'
const props = defineProps({ item: { type: Object, required: true }, snapshot: { type: Object, default: () => ({}) }, official: Boolean, compact: Boolean })
const sourceRows = computed(() => (props.official ? ['bungie-manifest'] : props.item.sourceIds || []).map(id => sources.find(s => s.id === id) || { id, title: id }))
const history = computed(() => entryHistory(props.item))
const version = computed(() => props.item.manifestVersion || props.snapshot.manifestVersion || (props.official ? null : DATA_VERSION))
</script>
<template>
  <details class="provenance" :open="!compact">
    <summary>来源与版本 <span>{{ official ? '官方定义' : item.confidence ? `条目分级 ${item.confidence}` : '查看依据' }}</span></summary>
    <div class="provenance-body">
      <dl class="evidence-facts">
        <div><dt>{{ official ? '定义快照' : '资料版本' }}</dt><dd>{{ version || '未登记' }}</dd></div>
        <div><dt>快照同步</dt><dd>{{ snapshot.syncedAt?.slice(0, 10) || '未登记' }}</dd></div>
        <div><dt>条目核验</dt><dd>{{ item.verifiedAt || '未登记独立核验时间' }}</dd></div>
      </dl>
      <p v-if="!official && item.confidence" class="entry-confidence">条目分级 <ConfidenceBadge :level="item.confidence" /></p>
      <ul class="source-list">
        <li v-for="source in sourceRows" :key="source.id"><div><ConfidenceBadge v-if="source.level" :level="source.level" /><a v-if="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a><strong v-else>{{ source.title }}</strong></div><small>来源检查：{{ source.checkedAt || '未登记' }}</small><p v-if="source.note">{{ source.note }}</p></li>
      </ul>
      <p v-if="!sourceRows.length" class="evidence-empty">尚未登记条目来源。</p>
      <details class="entry-history"><summary>条目变更记录 <span>{{ history.length }} 条</span></summary><ol v-if="history.length"><li v-for="(change, index) in history" :key="index"><time>{{ change.date }}</time><strong v-if="change.version">{{ change.version }}</strong><p>{{ change.summary }}</p></li></ol><p v-else class="evidence-empty">尚未登记逐条变更记录。快照同步时间不代表内容变更或实机核验。</p></details>
    </div>
  </details>
</template>
<style scoped>
.provenance{margin-top:1rem;border-top:1px solid var(--line-soft);font-size:.76rem;min-width:0}.provenance summary{cursor:pointer;padding:.8rem 0;color:var(--text-main);font-weight:600}.provenance summary span{font-weight:400;color:var(--gold-dim);margin-left:.6rem;font-size:.68rem}.provenance-body{padding-bottom:.8rem}.evidence-facts{display:grid;gap:.7rem;margin:.25rem 0 1rem}.evidence-facts>div{display:grid;grid-template-columns:6rem minmax(0,1fr);gap:.75rem}.evidence-facts dt{color:var(--text-dim)}.evidence-facts dd{margin:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.source-list{list-style:none;padding:0;margin:0}.source-list li{padding:.7rem 0;border-top:1px solid var(--line-soft)}.source-list li>div{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}.source-list a{color:var(--gold)}.source-list p,.evidence-empty{font-size:.72rem;color:var(--text-dim);line-height:1.75;margin:.35rem 0}.source-list small{display:block;color:var(--text-dim);margin-top:.5rem}.entry-history{border-top:1px solid var(--line-soft)}.entry-history ol{padding-left:1.2rem}.entry-history time{color:var(--gold-dim);margin-right:.75rem}.entry-confidence{display:flex;align-items:center;gap:.6rem}.provenance summary:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
</style>
