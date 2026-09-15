<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import ClassEmblem from '@/components/ClassEmblem.vue'
import titan from '@/assets/guardians/titan.webp'
import hunter from '@/assets/guardians/hunter.webp'
import warlock from '@/assets/guardians/warlock.webp'

const props = defineProps({ classId: { type: String, required: true }, name: String, eager: Boolean })
const { locale } = useI18n()
const failed = ref(false)
const portraits = { titan, hunter, warlock }
watch(() => props.classId, () => { failed.value = false })
</script>

<template>
  <figure class="class-portrait" :class="`class-portrait--${classId}`">
    <div class="portrait-orbit" aria-hidden="true"></div>
    <span class="portrait-designation" aria-hidden="true">GUARDIAN / {{ classId.toUpperCase() }}</span>
    <img v-if="!failed && portraits[classId]" :src="portraits[classId]" :alt="locale === 'en' ? `${name} — official Bungie character artwork` : `${name} — Bungie 官方人物立绘`" :loading="eager ? 'eager' : 'lazy'" decoding="async" @error="failed = true" />
    <div v-else class="portrait-fallback"><ClassEmblem :class-id="classId" /><span>{{ name }}</span></div>
    <figcaption><a href="https://www.bungie.net/7/en/Destiny/NewLight#guardians" target="_blank" rel="noreferrer">{{ locale === 'en' ? 'Artwork © Bungie / Source ↗' : '人物立绘 © Bungie / 官网来源 ↗' }}</a></figcaption>
  </figure>
</template>

<style scoped>
.class-portrait { position: relative; isolation: isolate; display: flex; align-items: center; justify-content: center; min-width: 0; height: 440px; margin: 0; overflow: hidden; background: radial-gradient(ellipse at 50% 48%, color-mix(in srgb, var(--portrait-accent) 15%, transparent), transparent 68%), #0a1120; }
.class-portrait--titan { --portrait-accent: var(--gold); }
.class-portrait--hunter { --portrait-accent: var(--blue); }
.class-portrait--warlock { --portrait-accent: var(--void); }
.portrait-orbit { position: absolute; z-index: -1; width: 88%; aspect-ratio: 1; border: 1px solid color-mix(in srgb, var(--portrait-accent) 18%, transparent); border-radius: 50%; }
.portrait-orbit::after { content: ''; position: absolute; inset: 16%; border: 1px solid color-mix(in srgb, var(--portrait-accent) 12%, transparent); transform: rotate(45deg); }
.portrait-designation { position: absolute; top: 18px; left: 20px; color: var(--portrait-accent); opacity: .7; font: .55rem var(--font-en); letter-spacing: .15em; }
.class-portrait img { position: absolute; top: 38px; left: 0; display: block; width: 100%; height: calc(100% - 76px); object-fit: contain; filter: drop-shadow(0 12px 20px #0008); transition: transform .4s var(--ease-out); }
.class-portrait:hover img { transform: translateY(-3px); }
.portrait-fallback { display: grid; justify-items: center; gap: 16px; color: var(--portrait-accent); }
.portrait-fallback :deep(.class-emblem) { width: 72px; height: 72px; }
figcaption { position: absolute; bottom: 15px; inset-inline: 12px; text-align: center; }
figcaption a { color: var(--text-sub); font-size: .6rem; }
figcaption a:hover { color: var(--gold-bright); }
</style>
