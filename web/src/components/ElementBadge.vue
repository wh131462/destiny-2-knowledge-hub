<script setup>
import { computed } from 'vue'
import { elements } from '@/data/classes'
import { localized } from '@/i18n'

const props = defineProps({
  element: { type: String, required: true }
})

const el = computed(() => elements[props.element] || { name: props.element, cls: '', color: '' })
</script>

<template>
  <span class="el-badge" :class="el.cls">
    <span class="dot" :style="{ background: el.color }"></span>
    {{ localized(el) }}
  </span>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px currentColor;
}
</style>
