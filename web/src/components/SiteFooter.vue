<script setup>
import { useI18n } from '@/i18n'
const { t } = useI18n()
const links = [
  { to: '/classes', key: 'classes' }, { to: '/prismatic', key: 'prismatic' }, { to: '/weapons', key: 'weapons' },
  { to: '/armor', key: 'armor' }, { to: '/activities', key: 'activities' }, { to: '/lore', key: 'lore' },
  { to: '/build-lab', key: 'buildLab' }, { to: '/build-workbench', key: 'workbench' }, { to: '/manual-loadout', key: 'manualLoadout' }, { to: '/manifest', key: 'manifest' },
  { to: '/glossary', key: 'glossary' }, { to: '/data-status', key: 'dataStatus' }
]
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="brand">
        <div class="title">{{ t('footer.brand') }} <span class="en">DESTINY 2 HUB</span></div>
      </div>
      <div class="links">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="link">{{ t(`common.${l.key}`) }}</router-link>
      </div>
      <p class="disclaimer">
        {{ t('footer.disclaimer') }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--line-soft);
  background: rgba(6, 10, 20, 0.6);
  padding: 32px 20px 24px;
  margin-top: auto;
}
.footer-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.title {
  font-family: var(--font-en);
  font-weight: 700;
  font-size: 1rem;
  color: var(--gold-bright);
}
.title .en { font-size: 0.7rem; color: var(--gold-dim); letter-spacing: 0.2em; margin-left: 8px; }
p { font-size: 0.78rem; color: var(--text-dim); }
.links { display: flex; flex-wrap: wrap; gap: 16px; }
.link { font-size: 0.85rem; color: var(--text-sub); }
.link:hover { color: var(--gold-bright); }
.disclaimer { border-top: 1px dashed var(--line-soft); padding-top: 14px; }
</style>
