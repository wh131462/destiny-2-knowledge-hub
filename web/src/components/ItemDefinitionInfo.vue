<script setup>
import { ui, localizedField } from '@/i18n'
import { computed } from 'vue'
import { versionLabels, itemConditions, craftingConditions } from '@/i18n/metadata'
const props = defineProps({ item: Object, compact: Boolean })
const labels = computed(() => versionLabels(props.item))
const conditions = computed(() => itemConditions(props.item))
const crafting = computed(() => [...new Set(craftingConditions(props.item).map(row => row.text))])
</script>

<template>
  <div v-if="labels.length || conditions.length || crafting.length || (!compact && item?.tooltipNotifications?.length)" class="definition-info" :class="{ compact }">
    <div v-if="labels.length" class="definition-tags" :aria-label="ui(&quot;版本特征&quot;)"><span v-for="label in labels" :key="label">{{ label }}</span></div>
    <template v-if="compact">
      <span v-if="conditions.length" class="condition-brief">{{ conditions.find(rule => /Artifact|Adept|Shaped|specific activities|Expired/i.test(rule.original))?.text || conditions[0].text }}<span v-if="conditions.length > 1"> {{ ui("· 共") }} {{ conditions.length }} {{ ui("项条件") }}</span></span>
      <span v-for="text in crafting" :key="text" class="condition-brief">{{ text }}</span>
    </template>
    <template v-else>
      <div v-if="conditions.length" class="definition-conditions"><strong>{{ ui("安装与生效条件") }}</strong><p>{{ ui("以下为前置条件；当前账号解锁、活动和实物状态需在游戏中核对。") }}</p><ul><li v-for="rule in conditions" :key="rule.original"><small>{{ rule.kind }}</small> {{ rule.text }}</li></ul></div>
      <div v-if="crafting.length" class="definition-conditions"><strong>{{ ui("该武器此插槽的锻造条件") }}</strong><p>{{ ui("仅适用于锻造，不是随机掉落的等级要求；可提前规划目标词条。") }}</p><ul><li v-for="text in crafting" :key="text">{{ text }}</li></ul></div>
      <p v-if="item?.versionInfo?.recipeItemHash" class="definition-caption">{{ ui("该定义关联锻造配方；不表示账号已解锁图样。") }}</p>
      <p v-if="item?.versionInfo?.socketFeatures?.some(feature => feature.lockedByDefault)" class="definition-caption">{{ ui("含默认锁定插槽，实际解锁状态以持有装备为准。") }}</p>
      <details v-if="item?.tooltipNotifications?.length" class="definition-conditions"><summary>{{ ui("官方情境提示") }}</summary><p>{{ ui("定义包含不同情境下的提示，以下文字不表示这些状态同时成立。") }}</p><ul><li v-for="(notice, index) in item.tooltipNotifications" :key="index">{{ localizedField(notice, 'displayString') }}</li></ul></details>
    </template>
  </div>
</template>

<style scoped>
.definition-info{min-width:0;margin:.65rem 0;color:var(--text-sub);text-align:left;font-size:.74rem;line-height:1.7;white-space:normal}.definition-tags{display:flex;flex-wrap:wrap;gap:.3rem}.definition-tags>span{padding:.14rem .45rem;border:1px solid var(--line-soft);color:var(--gold-bright);background:var(--bg-card);font-size:.65rem;overflow-wrap:anywhere}.definition-conditions{margin-top:.7rem;padding-top:.6rem;border-top:1px solid var(--line-soft)}.definition-conditions strong,.definition-conditions summary{color:var(--gold-bright);font-size:.75rem}.definition-conditions summary{cursor:pointer}.definition-info p,.definition-caption{font-size:.7rem;color:var(--text-dim);margin:.35rem 0}.definition-info ul{padding-left:1.15rem;margin:.4rem 0}.definition-info li{overflow-wrap:anywhere}.definition-info small{color:var(--text-dim)}.condition-brief{display:block;margin-top:.35rem;color:var(--text-sub);font-size:.68rem;overflow-wrap:anywhere}.compact{margin:.45rem 0}.definition-info :focus-visible{outline:2px solid var(--gold);outline-offset:3px}
</style>
