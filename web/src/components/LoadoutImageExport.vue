<script setup>
import { translateUi } from '@/i18n/messages'
import DestinyLoading from '@/components/DestinyLoading.vue'
import { ui, uiMessage } from '@/i18n'
import { ref, watch, onBeforeUnmount } from 'vue'
import { embedLoadoutImages, rasterizeLoadoutHtml } from '@/utils/loadoutImage'
import { renderLoadoutHtml, exportFilename } from '../../../packages/loadout-export/index.js'

const props = defineProps({ open: Boolean, model: Object, loading: Boolean, preparationError: String })
const emit = defineEmits(['close', 'retry'])
const busy = ref(false), progress = ref(''), error = ref(''), warning = ref('')
const pngUrl = ref(''), htmlUrl = ref(''), dimensions = ref(''), filename = ref('配装一图流')
let controller = null, sequence = 0
function dispose() {
  controller?.abort(); controller = null; sequence++
  for (const url of [pngUrl.value, htmlUrl.value]) if (url) URL.revokeObjectURL(url)
  pngUrl.value = ''; htmlUrl.value = ''; dimensions.value = ''; busy.value = false
}
async function generate() {
  dispose(); error.value = ''; warning.value = ''
  if (!props.open || !props.model) return
  const model = props.model, request = sequence
  controller = new AbortController()
  const signal = controller.signal
  busy.value = true; progress.value = '正在准备配图…'
  filename.value = exportFilename(model.title)
  try {
    const { assets, failed } = await embedLoadoutImages(model, { signal, onProgress: (done, total) => { if (request === sequence) progress.value = `正在内嵌配图 ${done} / ${total}` } })
    if (request !== sequence) return
    const warnings = failed.length ? [...model.warnings, translateUi('{0} 张配图加载失败，已用文字占位；推荐内容完整保留。', model.locale, [failed.length])] : model.warnings
    if (failed.length) warning.value = `${failed.length} 张配图加载失败，已用文字占位。可重新生成以重试。`
    const html = renderLoadoutHtml({ ...model, warnings }, assets)
    htmlUrl.value = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    progress.value = '正在将独立 HTML 生成为 PNG 长图…'
    const result = await rasterizeLoadoutHtml(html, { signal })
    if (request !== sequence) return
    pngUrl.value = URL.createObjectURL(result.blob)
    dimensions.value = `${result.pixelWidth} × ${result.pixelHeight} px ${(result.blob.size / 1024 / 1024).toFixed(1)} MB`
  } catch (e) {
    if (request === sequence && e.name !== 'AbortError') error.value = e.message || '长图生成失败，请重试。'
  } finally { if (request === sequence) busy.value = false }
}
watch(() => [props.open, props.model], generate, { immediate: true })
onBeforeUnmount(dispose)
</script>

<template>
  <a-modal :open="open" :title="ui(&quot;导出配装一图流&quot;)" width="1080px" :footer="null" wrap-class-name="loadout-image-modal" @cancel="emit('close')">
    <div class="image-export">
      <p class="export-caption">{{ ui("独立排版的 PNG 长图，不含编辑控件。所有 Perk 组合和备注均会展开；也可保存内嵌配图的 HTML，离线查看或自行截图。") }}</p>
      <DestinyLoading v-if="loading || busy" compact :label="loading ? ui('正在准备配装数据…') : uiMessage(progress)" />
      <p v-if="preparationError || error" role="alert" class="export-error">{{ uiMessage(preparationError || error) }}</p>
      <p v-if="warning" role="status" class="export-warning">{{ uiMessage(warning) }}</p>
      <div v-if="pngUrl" class="image-preview"><img :src="pngUrl" :alt="ui(&quot;配装一图流 PNG 预览&quot;)" /></div>
      <div v-else class="export-placeholder">{{ loading || busy ? ui("正在生成一图流，请稍候") : ui("暂无 PNG 预览，可重试或保存完整 HTML") }}</div>
      <footer class="export-actions">
        <span>{{ dimensions || ui("独立 HTML 固定排版宽度 1200 px") }}</span>
        <button type="button" :disabled="busy || loading" @click="emit('retry')">{{ ui("重新生成") }}</button>
        <a v-if="htmlUrl" :href="htmlUrl" :download="`${filename}.html`">{{ ui("保存独立 HTML") }}</a>
        <a v-if="pngUrl" class="download-png" :href="pngUrl" :download="`${filename}.png`">{{ ui("下载 PNG 长图") }}</a>
      </footer>
      <p class="export-caption">{{ ui("生成在本地浏览器完成，不上传配装。关闭预览后继续编辑；再次打开会生成最新内容。") }}</p>
    </div>
  </a-modal>
</template>

<style scoped>
:global(.loadout-image-modal .ant-modal){top:24px;padding-bottom:24px}
@media(max-width:650px){:global(.loadout-image-modal .ant-modal){top:16px;padding-bottom:16px}.image-export .image-preview{max-height:calc(100dvh - 360px)}}
.export-caption{font-size:.74rem;line-height:1.8;color:var(--text-dim)}.export-progress{font-size:.82rem;color:var(--gold)}.export-error,.export-warning{font-size:.8rem;line-height:1.8;color:var(--warn)}.image-preview{max-height:65dvh;overflow:auto;background:#0e1319;border:1px solid var(--line-soft)}.image-preview img{display:block;width:100%;height:auto}.export-placeholder{padding:4rem 1rem;text-align:center;background:#111820;color:var(--text-dim);font-size:.8rem}.export-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.65rem;padding-top:1rem}.export-actions>span{margin-right:auto;font-size:.72rem;color:var(--text-dim)}.export-actions button,.export-actions a{padding:.55rem .75rem;color:var(--text-sub);border:1px solid var(--line-soft);background:#1c242c;font-size:.76rem;cursor:pointer;text-decoration:none}.export-actions .download-png{color:#111820;background:var(--gold);border-color:var(--gold)}.export-actions button:disabled{opacity:.45;cursor:default}.export-actions :focus-visible{outline:2px solid var(--gold);outline-offset:3px}@media(max-width:650px){.export-actions>span{flex-basis:100%}.export-actions a,.export-actions button{flex:1;text-align:center;font-size:.7rem}.image-preview{max-height:58dvh}}
</style>
