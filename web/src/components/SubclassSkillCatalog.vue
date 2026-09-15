<script setup>
import { ui, localized, localizedField } from '@/i18n'
import EntityLink from '@/components/EntityLink.vue'
import StableDisclosure from '@/components/StableDisclosure.vue'
import { computed, ref } from 'vue'
import { abilityById, aspectById, facetById, fragmentById } from '@/data/v2'
import { useManifestAssets } from '@/composables/useManifestAssets'
import { useLoadoutVisuals } from '@/composables/useLoadoutVisuals'

const props = defineProps({ subclass: { type: Object, required: true } })
const search = ref('')
const manifest = useManifestAssets()
const { visualIcon, visualDescription } = useLoadoutVisuals(manifest, computed(() => props.subclass))
const byId = { ...abilityById, ...aspectById, ...facetById, ...fragmentById }
const pools = [
  ['superIds', '超能'], ['classAbilityIds', '职业技能'], ['movementIds', '跳跃 / 移动'],
  ['meleeIds', '近战'], ['grenadeIds', '手雷'], ['aspectIds', '星相'],
  ['fragmentIds', '元素碎片'], ['facetIds', '棱镜特性'],
  ['transcendenceIds', '超越 固定能力'], ['transcendenceGrenadeIds', '超越手雷 固定能力']
]
const groups = computed(() => pools.map(([key, label]) => {
  const all = (props.subclass[key] || []).map(id => byId[id]).filter(Boolean)
  const query = search.value.trim().toLowerCase()
  return { key, label, total: all.length, items: all.filter(item => (item.name + ' ' + item.en + ' ' + (item.officialName || '')).toLowerCase().includes(query)) }
}).filter(group => group.total))
</script>

<template>
  <section class="skill-catalog" :aria-label="ui(&quot;完整技能图鉴&quot;)">
    <header><div><h3>{{ ui("完整技能图鉴") }}</h3><p>{{ ui("快照") }} {{ subclass.verifiedAt }} {{ ui("按该子职业的官方插槽列出全部选项；点击卡片查看效果。账号解锁条件请在游戏内查看。") }}</p></div><a-input v-model:value="search" :aria-label="ui(&quot;搜索职业技能图鉴&quot;)" :placeholder="ui(&quot;搜索中文 / 英文技能&quot;)" allow-clear /></header>
    <p role="status" aria-live="polite" class="search-count">{{ groups.reduce((sum, group) => sum + group.items.length, 0) }} / {{ groups.reduce((sum, group) => sum + group.total, 0) }} {{ ui("个技能") }}</p>
    <section v-for="group in groups.filter(g => !search.trim() || g.items.length)" :key="group.key" class="catalog-group">
      <h4>{{ ui(group.label) }} <small>{{ group.items.length }} / {{ group.total }}</small></h4>
      <div class="catalog-cards"><StableDisclosure v-for="item in group.items" :key="item.id" :title="localized(item)" :width="620" trigger-class="skill-detail-trigger">
        <template #trigger><img v-if="visualIcon(item)" :src="visualIcon(item)" alt="" loading="lazy" /><span><strong>{{ localized(item) }}</strong><small>{{ item.en }}</small></span></template>
        <div class="skill-detail-content"><img v-if="visualIcon(item)" :src="visualIcon(item)" alt="" /><div><p>{{ visualDescription(item) || localizedField(item, 'description') || ui("当前定义未提供效果说明。") }}</p><EntityLink :item="item" :label="ui(&quot;来源、版本与相关构筑&quot;)" /></div></div>
      </StableDisclosure></div>
      <p v-if="!group.items.length" class="no-match">{{ ui("此分组没有匹配项") }}</p>
    </section>
  </section>
</template>

<style scoped>
.search-count{color:var(--gold-dim);font-size:.72rem}.skill-catalog{margin-top:1.5rem;border-top:1px solid var(--line-soft);padding-top:1.4rem}.skill-catalog>header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.skill-catalog h3{margin:0;font:600 1.15rem var(--font-cn)}.skill-catalog header p,.no-match{font-size:.75rem;color:var(--text-dim);line-height:1.7;margin:.4rem 0}.skill-catalog header>.ant-input-affix-wrapper{max-width:300px}.catalog-group{margin-top:1.2rem}.catalog-group h4{font-size:.85rem;display:flex;justify-content:space-between;margin:0 0 .6rem}.catalog-group h4 small{font-size:.7rem;color:var(--gold-dim)}.catalog-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;align-items:start}.catalog-cards :deep(.skill-detail-trigger){min-height:76px;padding:.7rem;background:#1b2027}.catalog-cards :deep(.skill-detail-trigger>img){width:48px;height:48px;object-fit:contain;flex-shrink:0;background:#101419}.catalog-cards :deep(.skill-detail-trigger>span){min-width:0;flex:1}.catalog-cards :deep(.skill-detail-trigger strong){font-size:.8rem;display:block}.catalog-cards :deep(.skill-detail-trigger small){font-size:.62rem;color:var(--text-dim);display:block;line-height:1.5;margin-top:.3rem}.skill-detail-content{display:grid;grid-template-columns:64px minmax(0,1fr);gap:1rem}.skill-detail-content>img{width:64px;height:64px;object-fit:contain;background:#101419}.skill-detail-content p{white-space:pre-line;font-size:.78rem;line-height:1.85;margin:0 0 1rem;color:var(--text-sub)}
@media(max-width:900px){.catalog-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.skill-catalog>header{align-items:stretch;flex-direction:column}.skill-catalog header>.ant-input-affix-wrapper{max-width:none}.catalog-cards{grid-template-columns:1fr}}
</style>
