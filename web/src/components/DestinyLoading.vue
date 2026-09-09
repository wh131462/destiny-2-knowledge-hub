<script setup>
import { useI18n, uiMessage } from '@/i18n'

defineProps({ label: String, detail: String, compact: Boolean, fullscreen: Boolean })
const { t } = useI18n()
const mark = `${import.meta.env.BASE_URL}destiny-loader.svg`
</script>

<template>
  <div class="destiny-loading" :class="{ 'destiny-loading--compact': compact, 'destiny-loading--screen': fullscreen }" role="status" aria-live="polite">
    <img class="destiny-loading__mark" :src="mark" alt="" aria-hidden="true" width="96" height="96" />
    <div class="destiny-loading__copy">
      <span v-if="fullscreen" class="destiny-loading__brand" aria-hidden="true">DESTINY 2 · KNOWLEDGE HUB</span>
      <span class="destiny-loading__label">{{ uiMessage(label) || t('common.loading') }}</span>
      <span v-if="detail" class="destiny-loading__detail">{{ uiMessage(detail) }}</span>
    </div>
  </div>
</template>
