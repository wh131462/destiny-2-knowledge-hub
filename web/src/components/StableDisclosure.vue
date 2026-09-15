<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  open: { type: Boolean, default: undefined },
  width: { type: [Number, String], default: 720 },
  triggerClass: { type: [String, Array, Object], default: '' },
  wrapClassName: { type: String, default: '' },
  destroyOnClose: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open', 'open', 'close'])
const localOpen = ref(false)
const controlled = computed(() => props.open !== undefined)
const visible = computed(() => controlled.value ? props.open : localOpen.value)

function setOpen(value) {
  if (!controlled.value) localOpen.value = value
  emit('update:open', value)
  emit(value ? 'open' : 'close')
}
</script>

<template>
  <button type="button" class="stable-disclosure-trigger" :class="triggerClass" :aria-haspopup="'dialog'" :aria-expanded="visible" @click="setOpen(true)">
    <slot name="trigger"><span>{{ title }}</span></slot>
  </button>
  <a-modal
    :open="visible"
    :title="title"
    :width="width"
    :footer="null"
    :destroy-on-close="destroyOnClose"
    :wrap-class-name="['stable-detail-modal', wrapClassName].filter(Boolean).join(' ')"
    @cancel="setOpen(false)"
  >
    <div class="stable-detail-body"><slot /></div>
  </a-modal>
</template>

<style scoped>
.stable-disclosure-trigger{display:flex;align-items:center;justify-content:space-between;gap:.75rem;width:100%;min-width:0;min-height:2.6rem;padding:.58rem .68rem;border:1px solid var(--line-soft);background:rgba(255,255,255,.025);color:var(--text-sub);font:inherit;text-align:left;cursor:pointer;transition:border-color .18s,background .18s,color .18s}
.stable-disclosure-trigger:hover{border-color:var(--gold-dim);background:rgba(232,193,90,.055);color:var(--text-main)}
.stable-disclosure-trigger:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.stable-detail-body{min-width:0;color:var(--text-sub);font-size:.78rem;line-height:1.8}
.stable-detail-body :deep(p:first-child){margin-top:0}
.stable-detail-body :deep(p:last-child){margin-bottom:0}
</style>

<style>
.stable-detail-modal .ant-modal{max-width:calc(100vw - 32px);padding-bottom:24px}
.stable-detail-modal .ant-modal-content{overflow:hidden;border:1px solid var(--line);border-radius:2px;background:var(--bg-dark);box-shadow:0 24px 72px rgba(0,0,0,.62)}
.stable-detail-modal .ant-modal-header{margin:0;padding:18px 52px 15px 20px;border-bottom:1px solid var(--line-soft);background:var(--bg-dark)}
.stable-detail-modal .ant-modal-title{color:var(--text-main);font-family:var(--font-cn);font-size:1rem;line-height:1.45}
.stable-detail-modal .ant-modal-close{top:10px;right:10px;color:var(--text-sub)}
.stable-detail-modal .ant-modal-close:hover{background:rgba(232,193,90,.08);color:var(--gold-bright)}
.stable-detail-modal .ant-modal-body{max-height:min(72vh,720px);overflow:auto;padding:20px;scrollbar-color:var(--gold-dim) var(--bg-deep)}
@media(max-width:620px){.stable-detail-modal .ant-modal{top:8px;max-width:calc(100vw - 16px);margin:0 auto;padding-bottom:8px}.stable-detail-modal .ant-modal-header{padding:15px 46px 13px 16px}.stable-detail-modal .ant-modal-body{max-height:calc(100dvh - 82px);padding:16px}}
</style>
