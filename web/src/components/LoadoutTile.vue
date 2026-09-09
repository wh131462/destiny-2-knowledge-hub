<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  image: String, label: { type: String, required: true }, eyebrow: String, subtitle: String,
  description: String, badge: String, actionLabel: String, color: String,
  active: Boolean, disabled: Boolean, compact: Boolean, empty: Boolean, toggle: Boolean
})
const imageFailed = ref(false)
watch(() => props.image, () => { imageFailed.value = false })
</script>

<template>
  <button type="button" class="loadout-tile" :class="{ active, compact, empty }" :style="{ '--tile-accent': color || 'var(--gold)' }" :disabled="disabled" :aria-label="actionLabel || label" :aria-pressed="toggle ? active : undefined" :title="description || label">
    <span class="tile-art">
      <img v-if="image && !imageFailed" :src="image" alt="" loading="lazy" @error="imageFailed = true" />
      <span v-else class="tile-placeholder" aria-hidden="true">{{ empty ? '+' : '◇' }}</span>
      <span v-if="active" class="tile-check" aria-hidden="true">✓</span>
    </span>
    <span class="tile-copy"><small v-if="eyebrow" class="tile-eyebrow">{{ eyebrow }}</small><strong>{{ label }}</strong><small v-if="subtitle" class="tile-subtitle">{{ subtitle }}</small><span v-if="description && !compact" class="tile-description">{{ description }}</span><span v-if="badge" class="tile-badge">{{ badge }}</span></span>
  </button>
</template>

<style scoped>
.loadout-tile{width:100%;min-width:0;display:flex;align-items:flex-start;gap:.85rem;padding:.9rem;text-align:left;color:var(--text-main);background:#20242a;border:1px solid #383c43;cursor:pointer;transition:border-color .15s,background .15s}.loadout-tile:hover:not(:disabled){border-color:var(--tile-accent);background:#292d32}.loadout-tile:focus-visible{outline:2px solid var(--tile-accent);outline-offset:3px}.loadout-tile.active{border-color:var(--tile-accent);background:color-mix(in srgb,var(--tile-accent) 9%,#1b1e23)}.loadout-tile:disabled{cursor:not-allowed;opacity:.48}.tile-art{position:relative;flex:0 0 64px;width:64px;height:64px;display:grid;place-items:center;background:#111419;box-shadow:inset 0 0 0 1px #ffffff18;overflow:hidden}.tile-art img{width:100%;height:100%;object-fit:contain}.tile-placeholder{font:300 2rem var(--font-en);color:#7c8794}.tile-check{position:absolute;right:0;bottom:0;padding:0 .25rem;background:var(--tile-accent);color:#111;font-weight:800;font-size:.8rem}.tile-copy{display:grid;align-content:start;gap:.32rem;min-width:0;flex:1}.tile-copy strong{font-size:.86rem;line-height:1.45;font-weight:600;overflow-wrap:anywhere}.tile-eyebrow{color:#c7bb99;font-size:.64rem;letter-spacing:.03em}.tile-subtitle{color:#a1a8b1;font:.63rem/1.5 var(--font-en);overflow-wrap:anywhere}.tile-description{font-size:.73rem;line-height:1.65;color:#bdc2ca;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line}.tile-badge{font-size:.63rem;line-height:1.5;color:var(--tile-accent);margin-top:.15rem;overflow-wrap:anywhere}.compact{align-items:center;padding:.65rem;gap:.65rem}.compact .tile-art{flex-basis:48px;width:48px;height:48px}.compact .tile-copy strong{font-size:.76rem}.empty{border-style:dashed;background:#171b20}.empty .tile-art{background:#22272d}.empty .tile-copy strong{color:#b8c0ca}
@media(prefers-reduced-motion:reduce){.loadout-tile{transition:none}}@media(max-width:600px){.loadout-tile{padding:.7rem;gap:.65rem}.tile-art{flex-basis:56px;width:56px;height:56px}.tile-copy strong{font-size:.8rem}}
</style>
