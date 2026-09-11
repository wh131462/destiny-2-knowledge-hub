<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { ui } from '@/i18n'
import LoadoutImageExport from './LoadoutImageExport.vue'

const props = defineProps({ prepare: { type: Function, required: true }, disabled: Boolean })
const open = ref(false), loading = ref(false), error = ref(''), model = shallowRef(null)
let request = 0
async function generate() {
  const current = ++request
  open.value = true; loading.value = true; error.value = ''; model.value = null
  try {
    const prepared = await props.prepare()
    if (current !== request) return
    if (!prepared) throw new Error('准备一图流失败，请重试。')
    // Export the snapshot the user opened; later page refreshes stay separate.
    model.value = JSON.parse(JSON.stringify(prepared))
  } catch (e) {
    if (current === request) error.value = e.message || '准备一图流失败，请重试。'
  } finally {
    if (current === request) loading.value = false
  }
}
function close() { request++; open.value = false; loading.value = false; model.value = null }
onBeforeUnmount(close)
</script>

<template>
  <button class="btn" type="button" :disabled="disabled || loading" @click="generate">{{ ui('导出一图流') }}</button>
  <LoadoutImageExport :open="open" :model="model" :loading="loading" :preparation-error="error" @close="close" @retry="generate" />
</template>
