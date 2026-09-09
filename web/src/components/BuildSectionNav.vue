<script setup>
import { ui } from '@/i18n'
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({ sections: { type: Array, required: true }, label: { type: String, default: '构筑分区导航' } })
const root = ref(null), active = ref('')
let resizeObserver, frame = 0

function update() {
  const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0
  const navHeight = root.value?.getBoundingClientRect().height || 0
  const page = root.value?.closest('.build-flow')
  page?.style.setProperty('--build-header-height', `${headerHeight}px`)
  page?.style.setProperty('--build-nav-height', `${navHeight}px`)
  const sections = props.sections.map(s => document.getElementById(s.id)).filter(Boolean)
  const current = sections.filter(s => s.getBoundingClientRect().top <= headerHeight + navHeight + 32).at(-1) || sections[0]
  active.value = current?.id || ''
}
function schedule() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(update)
}
function jump(id) {
  const target = document.getElementById(id)
  if (!target) return
  update()
  target.focus({ preventScroll: true })
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
}
watch(() => props.sections, async () => { await nextTick(); schedule() }, { deep: true })
onMounted(() => {
  update()
  resizeObserver = new ResizeObserver(schedule)
  const header = document.querySelector('.site-header')
  if (header) resizeObserver.observe(header)
  resizeObserver.observe(root.value)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
})
</script>

<template>
  <nav ref="root" class="build-section-nav" :aria-label="ui(label)">
    <button v-for="(section, index) in sections" :key="section.id" type="button" :aria-current="active === section.id ? 'location' : undefined" @click="jump(section.id)">
      <span aria-hidden="true">{{ section.number || String(index + 1).padStart(2, '0') }}</span>{{ ui(section.label) }}
    </button>
  </nav>
</template>

<style scoped>
.build-section-nav { position: sticky; top: var(--build-header-height); z-index: 20; display: flex; gap: .25rem; overflow-x: auto; overscroll-behavior-x: contain; padding: .45rem; margin: 1.4rem 0; border: 1px solid var(--line-soft); border-radius: var(--radius-sm); background: rgba(10,15,30,.96); backdrop-filter: blur(14px); scrollbar-width: thin; }
button { flex: 1 0 auto; display: flex; align-items: center; justify-content: center; gap: .5rem; min-height: 42px; padding: .5rem .8rem; border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--text-sub); font: 500 .8rem var(--font-cn); cursor: pointer; transition: background .2s, color .2s; }
button span { font: .58rem var(--font-en); color: var(--text-dim); }
button:hover { background: var(--bg-hover); color: var(--text-main); }
button[aria-current] { background: rgba(232,193,90,.1); border-color: var(--line); color: var(--gold-bright); }
button[aria-current] span { color: var(--gold-dim); }
@media (max-width: 600px) { .build-section-nav { border-radius: 0; margin-inline: -14px; padding-inline: 14px; } button { flex: 0 0 auto; } }
</style>
