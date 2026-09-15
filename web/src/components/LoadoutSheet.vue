<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { renderLoadoutContent, sheetCss } from '../../../packages/loadout-export/index.js'

const props = defineProps({ model: { type: Object, required: true } })
const host = ref(null)
const selectedDetail = ref(null)
// Shadow DOM isolates export typography from page-wide card/heading styles,
// while keeping content in normal document flow (no nested scroll container).
const css = sheetCss.replace('html,body', ':host').replace('body{width:1200px}', '') + `
:host{display:block;min-width:0;width:100%;container-type:inline-size}
#loadout-export{width:100%;overflow:visible}
.hero-main>h1,.mod>div{min-width:0}
.notes-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
@container(max-width:1000px){
 .skill-grid,.node-grid,.armor-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
 .talent-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .weapon{grid-template-columns:180px minmax(0,1fr)}
 .perk-columns{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@container(max-width:600px){
 .hero,.section,.footer{padding:16px}
 .hero h1{font-size:24px}.eyebrow{font-size:12px;letter-spacing:1px}
 .stats{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px;row-gap:12px}
 .stat:nth-child(3){border:0}
 .skill-grid,.node-grid,.armor-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .talent-grid,.aspects-grid,.weapon,.perk-columns{grid-template-columns:minmax(0,1fr)}
 .weapon-head{flex-direction:row;align-items:center}
 .card-name{font-size:16px}.card-top{gap:6px}
 .art{width:40px;height:40px;flex-basis:40px}
 .section h2{font-size:19px}
}
@container(max-width:360px){
 .skill-grid,.node-grid,.armor-grid{grid-template-columns:minmax(0,1fr)}
}
[data-detail-key]{cursor:pointer;transition:box-shadow .18s,background-color .18s}
[data-detail-key]:hover{box-shadow:inset 0 0 0 1px #d5b872}
[data-detail-key]:focus-visible{outline:2px solid #d5b872;outline-offset:-2px}
.perk[data-detail-key]:hover{background:rgba(213,184,114,.1)}
`
let root
let details = new Map()
function imageFailed(event) {
  const img = event.target
  if (img?.tagName !== 'IMG') return
  const placeholder = document.createElement('span')
  placeholder.className = 'art placeholder'
  placeholder.textContent = img.dataset.placeholder || '◇'
  img.replaceWith(placeholder)
}
function indexDetails(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)
  if (value.detail?.key) details.set(value.detail.key, value.detail)
  for (const nested of Object.values(value)) indexDetails(nested, seen)
}
function detailTarget(event) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement
  return target?.closest?.('[data-detail-key]') || null
}
function openDetail(event) {
  const target = detailTarget(event)
  const detail = target ? details.get(target.dataset.detailKey) : null
  if (detail) selectedDetail.value = detail
}
function detailKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  if (!detailTarget(event)) return
  event.preventDefault()
  openDetail(event)
}
function closeDetailOnEscape(event) {
  if (event.key === 'Escape' && selectedDetail.value) selectedDetail.value = null
}
function detailImage(detail) {
  return /^https:\/\/www\.bungie\.net\/common\/destiny2_content\/[^\s"<>]+$/.test(detail?.image || '') ? detail.image : ''
}
watch([host, () => props.model], () => {
  if (!host.value) return
  if (!root) {
    root = host.value.attachShadow({ mode: 'open' })
    root.addEventListener('error', imageFailed, true)
    root.addEventListener('click', openDetail)
    root.addEventListener('keydown', detailKeydown)
  }
  details = new Map()
  indexDetails(props.model)
  if (selectedDetail.value) selectedDetail.value = details.get(selectedDetail.value.key) || null
  // The shared renderer escapes every user string and allowlists image URLs.
  root.innerHTML = `<style>${css}</style>${renderLoadoutContent(props.model, new Map(), { preview: true })}`
}, { flush: 'post', deep: true })
onMounted(() => document.addEventListener('keydown', closeDetailOnEscape))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', closeDetailOnEscape)
  root?.removeEventListener('error', imageFailed, true)
  root?.removeEventListener('click', openDetail)
  root?.removeEventListener('keydown', detailKeydown)
})
</script>

<template>
  <div class="loadout-sheet-shell">
    <div ref="host" :lang="model.locale === 'en' ? 'en' : 'zh-CN'" />
    <a-modal
      :open="Boolean(selectedDetail)"
      :title="selectedDetail?.name || ''"
      :footer="null"
      :width="640"
      wrap-class-name="loadout-entry-modal"
      @cancel="selectedDetail = null"
    >
      <article v-if="selectedDetail" class="loadout-entry-detail">
        <header>
          <img v-if="detailImage(selectedDetail)" :src="detailImage(selectedDetail)" alt="" />
          <div>
            <p v-if="selectedDetail.caption" class="detail-caption">{{ selectedDetail.caption }}</p>
            <p v-if="selectedDetail.alternateName && selectedDetail.alternateName !== selectedDetail.name" class="detail-alternate">{{ selectedDetail.alternateName }}</p>
          </div>
        </header>
        <dl v-if="selectedDetail.typeName || selectedDetail.hash !== ''" class="detail-facts">
          <div v-if="selectedDetail.typeName"><dt>{{ model.locale === 'en' ? 'Type' : '类型' }}</dt><dd>{{ selectedDetail.typeName }}</dd></div>
          <div v-if="selectedDetail.hash !== ''"><dt>Manifest Hash</dt><dd>{{ selectedDetail.hash }}</dd></div>
        </dl>
        <p v-if="selectedDetail.description" class="detail-description">{{ selectedDetail.description }}</p>
        <p v-else class="detail-missing">{{ model.locale === 'en' ? 'The current definition does not provide a detailed description.' : '当前定义未提供详细说明。' }}</p>
      </article>
    </a-modal>
  </div>
</template>

<style scoped>
.loadout-sheet-shell{min-width:0;width:100%}
.loadout-entry-detail{min-width:0;color:var(--text-sub)}
.loadout-entry-detail header{display:flex;align-items:center;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line-soft)}
.loadout-entry-detail header img{width:64px;height:64px;flex:0 0 64px;object-fit:contain;background:var(--bg-card);border:1px solid var(--line-soft)}
.loadout-entry-detail header>div{min-width:0}
.detail-caption,.detail-alternate{margin:0;color:var(--text-dim);font-size:.75rem;overflow-wrap:anywhere}
.detail-alternate{margin-top:.25rem}
.detail-facts{margin:1rem 0 0}
.detail-facts>div{display:flex;justify-content:space-between;gap:1rem;padding:.55rem 0;border-bottom:1px solid var(--line-soft);font-size:.76rem}
.detail-facts dt{color:var(--text-dim)}
.detail-facts dd{margin:0;text-align:right;overflow-wrap:anywhere}
.detail-description,.detail-missing{margin:1rem 0;white-space:pre-line;overflow-wrap:anywhere;font-size:.84rem;line-height:1.85}
.detail-missing{color:var(--text-dim)}
</style>

<style>
.loadout-entry-modal .ant-modal{max-width:calc(100vw - 32px);padding-bottom:24px}
.loadout-entry-modal .ant-modal-content{overflow:hidden;border:1px solid var(--line);border-radius:2px;background:var(--bg-dark);box-shadow:0 24px 72px rgba(0,0,0,.62)}
.loadout-entry-modal .ant-modal-header{margin:0;padding:18px 52px 15px 20px;border-bottom:1px solid var(--line-soft);background:var(--bg-dark)}
.loadout-entry-modal .ant-modal-title{color:var(--text-main);font-family:var(--font-cn);font-size:1rem;line-height:1.45}
.loadout-entry-modal .ant-modal-close{top:10px;right:10px;color:var(--text-sub)}
.loadout-entry-modal .ant-modal-close:hover{background:rgba(232,193,90,.08);color:var(--gold-bright)}
.loadout-entry-modal .ant-modal-body{max-height:min(72vh,720px);overflow:auto;padding:20px;scrollbar-color:var(--gold-dim) var(--bg-deep)}
@media(max-width:620px){.loadout-entry-modal .ant-modal{top:8px;max-width:calc(100vw - 16px);margin:0 auto;padding-bottom:8px}.loadout-entry-modal .ant-modal-header{padding:15px 46px 13px 16px}.loadout-entry-modal .ant-modal-body{max-height:calc(100dvh - 82px);padding:16px}}
</style>
