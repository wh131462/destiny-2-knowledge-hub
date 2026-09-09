<script setup>
import { ui } from '@/i18n'
import { variantName } from '@/i18n/metadata'
import { computed } from 'vue'
import { entityLocation } from '../../../packages/knowledge-links/index.js'
const props = defineProps({ item: Object, kind: { type: String, default: 'items' }, label: String, newTab: Boolean })
const to = computed(() => entityLocation(props.item, props.kind))
const text = computed(() => props.label || (props.item?.nameZh || props.item?.name ? variantName(props.item) : props.item?.en || ui('查看条目')))
</script>
<template>
  <RouterLink v-if="to" :to="to" class="entity-link" :target="newTab ? '_blank' : undefined" :rel="newTab ? 'noopener' : undefined" :aria-label="newTab ? ui(&quot;{0}（在新标签页查看百科）&quot;, [text]) : undefined">{{ text }}<span aria-hidden="true"> ↗</span></RouterLink>
  <span v-else>{{ text }}</span>
</template>
<style scoped>
.entity-link{color:var(--gold-bright);text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;overflow-wrap:anywhere}.entity-link:hover{text-decoration-color:currentColor}.entity-link:focus-visible{outline:2px solid var(--gold);outline-offset:4px}.entity-link>span{font-size:.7em;opacity:.65}
</style>
