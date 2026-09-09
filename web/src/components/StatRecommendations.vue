<script setup>
import { ui } from '@/i18n'
import { statLabels, formatTarget } from '../../../packages/loadout-planner/index.js'
defineProps({ targets: { type: Object, default: () => ({}) }, editable: Boolean })
const emit = defineEmits(['change'])
const targetText = target => {
  if (typeof target === 'number') return String(target)
  if (target?.min != null && target?.max != null) return formatTarget(target)
  if (target?.min != null) return ui('至少 {0}', [target.min])
  if (target?.max != null) return ui('最多 {0}', [target.max])
  return ui('无要求')
}
</script>

<template>
  <div class="recommended-stats">
    <div v-for="(name, key) in statLabels" :key="key" class="recommended-stat">
      <span>{{ ui(name) }}</span><strong>{{ targetText(targets[key]) }}</strong>
      <div v-if="editable" class="target-inputs">
        <a-input-number :aria-label="ui(&quot;{0}建议下限&quot;, [ui(name)])" :value="targets[key]?.min" :min="0" :max="200" :precision="0" :placeholder="ui(&quot;下限&quot;)" @change="emit('change', key, 'min', $event)" />
        <span>–</span>
        <a-input-number :aria-label="ui(&quot;{0}建议上限&quot;, [ui(name)])" :value="targets[key]?.max" :min="0" :max="200" :precision="0" :placeholder="ui(&quot;上限&quot;)" @change="emit('change', key, 'max', $event)" />
      </div>
    </div>
  </div>
  <p class="target-caption">{{ ui("配装建议，不是已拥有护甲的实测值。留空表示无要求；支持 0–200，下限与上限相同表示指定目标。随机掉落与最终搭配需自行调整。") }}</p>
</template>

<style scoped>
.recommended-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line-soft)}
.recommended-stat{padding:1rem .65rem;display:grid;gap:.65rem;background:var(--bg-dark);min-width:0}.recommended-stat>span{color:var(--text-dim);font-size:.72rem}.recommended-stat>strong{font:600 1.15rem var(--font-cn);color:var(--gold-bright);white-space:nowrap}.target-inputs{display:flex;align-items:center;gap:3px}.target-inputs .ant-input-number{width:50%;min-width:0}.target-caption{font-size:.72rem;line-height:1.7;color:var(--text-dim);margin:.7rem 0 0}
@media(max-width:1000px){.recommended-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:460px){.recommended-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{.target-inputs{display:none}}
</style>
