<script setup>
import { verificationLevels } from '@/data/v2'
import { useI18n } from '@/i18n'

const { locale } = useI18n()

const englishLabels = { A: 'Official data', B: 'Reproducible test', C: 'Community consensus', D: 'Editorial recommendation' }
const englishDescriptions = { A: 'From Bungie official pages, patches, or the Manifest.', B: 'Can be reproduced in-game using recorded steps.', C: 'Stable community reference; verify against the current version.', D: 'Strategic or subjective advice, not official numbers.' }

defineProps({
  level: { type: String, required: true }
})
</script>

<template>
  <span class="confidence" :class="`level-${level.toLowerCase()}`" :title="locale === 'en' ? englishDescriptions[level] : verificationLevels[level]?.description">
    {{ level }}：{{ locale === 'en' ? (englishLabels[level] || 'Unverified') : (verificationLevels[level]?.label || '待核验') }}
  </span>
</template>

<style scoped>
.confidence {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--line-soft);
  border-radius: 0.35rem;
  color: var(--text-sub);
  background: rgba(255, 255, 255, 0.035);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.level-a { color: var(--ok); border-color: rgba(125, 219, 138, 0.32); }
.level-b { color: var(--blue); border-color: rgba(77, 184, 255, 0.32); }
.level-c { color: var(--warn); border-color: rgba(255, 180, 84, 0.32); }
.level-d { color: var(--text-sub); }
</style>
