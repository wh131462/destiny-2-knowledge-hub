<script setup>
import { ui } from '@/i18n'
import { computed } from 'vue'
import { usePublicBuilds } from '@/composables/usePublicBuilds'
import { editorialById } from '@/data/encyclopedia'
import { relatedBuilds } from '../../../packages/knowledge-links/index.js'
const props = defineProps({ item: { type: Object, required: true } })
const { publicBuilds } = usePublicBuilds()
const matches = computed(() => relatedBuilds(props.item, publicBuilds.value, editorialById))
</script>
<template>
  <section class="related-builds" :aria-label="ui(&quot;使用此条目的公开构筑&quot;)">
    <header><h2>{{ ui("相关构筑") }}</h2><span>{{ matches.length }} {{ ui("套") }}</span></header>
    <RouterLink v-for="build in matches" :key="build.id" :to="`/builds/${build.id}`"><strong>{{ build.name }} →</strong><p>{{ build.goal }}</p></RouterLink>
    <p v-if="!matches.length">{{ ui("暂时没有引用此条目的公开构筑。") }}</p>
    <RouterLink to="/builds">{{ ui("浏览公开构筑 →") }}</RouterLink>
  </section>
</template>
<style scoped>
.related-builds{padding-top:1.1rem;margin-top:1rem;border-top:1px solid var(--line-soft)}.related-builds header{display:flex;align-items:center;justify-content:space-between}.related-builds h2{font-size:1rem;margin:0}.related-builds header span{color:var(--gold-dim);font-size:.72rem}.related-builds a{display:block;padding:.7rem 0;font-size:.8rem;color:var(--gold)}.related-builds p{font-size:.78rem;line-height:1.7;color:var(--text-dim)}
</style>
