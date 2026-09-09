<script setup>
import { ui } from '@/i18n'
import { computed } from 'vue'
import { recommendedColumns } from '@/utils/curatedDraft'
import { perkColumns } from '../../../packages/loadout-planner/index.js'
const props = defineProps({ selection: { type: Object, required: true }, equipment: { type: Array, default: () => [] } })
const recommendation = computed(() => recommendedColumns(props.selection, props.equipment))
</script>
<template>
  <dl class="perk-recommendations"><template v-for="column in perkColumns" :key="column.key"><div v-if="recommendation.columns[column.key].length"><dt>{{ ui(column.label) }}</dt><dd><template v-for="(name, index) in recommendation.columns[column.key]" :key="name"><span v-if="index"> / </span><RouterLink :to="{ path: '/manifest', query: { type: 'plugs', q: name, filter: 'all' } }">{{ name }} ↗</RouterLink></template></dd></div></template><div v-if="recommendation.unassigned.length"><dt>{{ ui("待核对栏目") }}</dt><dd>{{ recommendation.unassigned.join(' / ') }}</dd></div><div v-if="!selection.perks?.length"><dt>{{ ui("词条建议") }}</dt><dd>{{ ui("未指定；可在编辑副本中补充") }}</dd></div></dl>
</template>
<style scoped>
.perk-recommendations{margin:.5rem 0;display:grid;gap:.35rem}.perk-recommendations>div{display:grid;grid-template-columns:7rem 1fr;gap:.5rem;font-size:.68rem}.perk-recommendations dt{color:var(--text-dim)}.perk-recommendations dd{margin:0;color:var(--text-sub)}
</style>
