<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  content: { type: String, required: true },
  tone: { type: String, default: 'neutral' },
  icon: { type: String, default: '' },
  title: { type: String, default: '' }
})
const open = ref(false)
const iconUrl = computed(() => {
  if (!props.icon) return ''
  return props.icon.startsWith('http') ? props.icon : `https://www.bungie.net${props.icon}`
})
const hasHeader = computed(() => Boolean(props.title || iconUrl.value))
</script>

<template>
  <a-tooltip v-model:open="open" :trigger="['hover', 'focus', 'click']" :destroy-tooltip-on-hide="true">
    <template #title>
      <div class="hint-popover">
        <div v-if="hasHeader" class="hint-popover-head">
          <img v-if="iconUrl" :src="iconUrl" alt="" loading="lazy" />
          <strong>{{ title }}</strong>
        </div>
        <span class="hint-content">{{ content }}</span>
      </div>
    </template>
    <button type="button" class="rotation-hint" :class="tone" @keydown.esc.stop.prevent="open = false">
      <img v-if="iconUrl" class="hint-chip-icon" :src="iconUrl" alt="" loading="lazy" />
      <span>{{ label }}</span>
    </button>
  </a-tooltip>
</template>

<style scoped>
.rotation-hint { max-width: 100%; display: inline-flex; align-items: center; gap: .4rem; border: 1px solid var(--line-soft); background: var(--bg-dark); color: var(--text-sub); font: inherit; font-size: .76rem; line-height: 1.6; padding: .3rem .6rem; border-radius: 3px; cursor: help; text-align: left; overflow-wrap: anywhere; text-decoration: underline dotted; text-underline-offset: 4px; text-decoration-color: var(--text-dim); }
.rotation-hint.challenge, .rotation-hint.reward { color: var(--gold); border-color: var(--line); background: rgba(232,193,90,.04); text-decoration-color: var(--gold-dim); }
.rotation-hint.champion { color: #6cc4ff; border-color: rgba(77,184,255,.35); background: rgba(77,184,255,.06); text-decoration-color: rgba(77,184,255,.55); }
.rotation-hint.subtle { padding: 0; border: 0; background: transparent; font-size: .72rem; }
.rotation-hint:hover, .rotation-hint:focus-visible { border-color: var(--gold-dim); color: var(--gold-bright); }
.hint-chip-icon { width: 18px; height: 18px; flex-shrink: 0; object-fit: contain; }
.hint-popover { max-width: 320px; }
.hint-popover-head { display: flex; align-items: center; gap: .5rem; margin-bottom: .35rem; }
.hint-popover-head img { width: 28px; height: 28px; flex-shrink: 0; object-fit: contain; }
.hint-popover-head strong { color: var(--text-main); font-size: .84rem; font-weight: 600; overflow-wrap: anywhere; }
.hint-content { white-space: pre-line; font-size: .8rem; line-height: 1.8; overflow-wrap: anywhere; color: var(--text-sub); }
@media (pointer: coarse) { .rotation-hint { min-height: 36px; } }
</style>
