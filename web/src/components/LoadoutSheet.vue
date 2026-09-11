<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { renderLoadoutContent, sheetCss } from '../../../packages/loadout-export/index.js'

const props = defineProps({ model: { type: Object, required: true } })
const host = ref(null)
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
`
let root
function imageFailed(event) {
  const img = event.target
  if (img?.tagName !== 'IMG') return
  const placeholder = document.createElement('span')
  placeholder.className = 'art placeholder'
  placeholder.textContent = img.dataset.placeholder || '◇'
  img.replaceWith(placeholder)
}
watch([host, () => props.model], () => {
  if (!host.value) return
  if (!root) {
    root = host.value.attachShadow({ mode: 'open' })
    root.addEventListener('error', imageFailed, true)
  }
  // The shared renderer escapes every user string and allowlists image URLs.
  root.innerHTML = `<style>${css}</style>${renderLoadoutContent(props.model, new Map(), { preview: true })}`
}, { flush: 'post', deep: true })
onBeforeUnmount(() => root?.removeEventListener('error', imageFailed, true))
</script>

<template><div ref="host" :lang="model.locale === 'en' ? 'en' : 'zh-CN'" /></template>
