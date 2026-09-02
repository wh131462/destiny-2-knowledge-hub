<script setup>
import { ref, computed } from 'vue'
import { glossary, glossaryCats } from '@/data/glossary'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const keyword = ref('')
const cat = ref('')

const filtered = computed(() =>
  glossary.filter(g =>
    (!cat.value || g.cat === cat.value) &&
    (!keyword.value ||
      g.term.includes(keyword.value) ||
      g.en.toLowerCase().includes(keyword.value.toLowerCase()))
  )
)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ t('pages.glossary.title') }}</h1>
      <p>{{ t('pages.glossary.subtitle') }}</p>
    </div>

    <div class="filters">
      <a-input v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="t('pages.glossary.search')" />
      <div class="cats">
        <button class="btn small" :class="{ active: !cat }" @click="cat = ''">{{ t('common.all') }}</button>
        <button
          v-for="c in glossaryCats"
          :key="c"
          class="btn small"
          :class="{ active: cat === c }"
          @click="cat = cat === c ? '' : c"
        >{{ c }}</button>
      </div>
    </div>

    <div class="grid grid-3">
      <div v-for="g in filtered" :key="g.term" class="card term-card">
        <div class="term-top">
          <h3>{{ g.term }}</h3>
          <span class="badge blue">{{ g.cat }}</span>
        </div>
        <span class="en-tag">{{ g.en.toUpperCase() }}</span>
        <p>{{ g.desc }}</p>
      </div>
    </div>
    <div v-if="!filtered.length" class="empty">未找到匹配的术语</div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 20px; }
.page-head h1 { margin-bottom: 6px; }
.page-head p { color: var(--text-dim); }
.filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.cats { display: flex; gap: 8px; flex-wrap: wrap; }
.term-card { color: var(--text-main); padding: 14px 16px; }
.term-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
.term-top h3 { margin: 0; font-size: 1rem; }
.en-tag {
  font-family: var(--font-en); font-size: 0.6rem; letter-spacing: 0.14em;
  color: var(--gold-dim); display: block; margin-bottom: 8px;
}
.term-card p { font-size: 0.85rem; }
</style>
