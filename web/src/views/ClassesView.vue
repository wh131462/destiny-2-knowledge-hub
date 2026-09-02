<script setup>
import { ref, computed } from 'vue'
import { classes, elements } from '@/data/classes'
import ElementBadge from '@/components/ElementBadge.vue'
import { subclasses } from '@/data/v2'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const keyword = ref('')
const filterElement = ref('')

const classList = computed(() => {
  return classes.map(c => ({
    ...c,
    subclasses: c.subclasses.filter(s => s.type !== 'prismatic' &&
      (!filterElement.value || s.element === filterElement.value) &&
      (!keyword.value || s.branch.includes(keyword.value) || c.name.includes(keyword.value))
    ).concat(subclasses.filter(s => s.classId === c.id && s.type === 'prismatic').filter(s =>
      (!filterElement.value || filterElement.value === 'prismatic') &&
      (!keyword.value || s.name.includes(keyword.value) || s.en.toLowerCase().includes(keyword.value.toLowerCase()))
    ))
  })).filter(c => c.subclasses.length > 0)
})

const elementKeys = Object.keys(elements)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ t('pages.classes.title') }}</h1>
      <p>{{ t('pages.classes.subtitle') }}</p>
    </div>

    <div class="filters">
      <a-input v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="t('pages.classes.search')" />
      <div class="el-filters">
        <button class="btn small" :class="{ active: !filterElement }" @click="filterElement = ''">{{ t('common.all') }}</button>
        <button
          v-for="(el, key) in elements"
          :key="key"
          class="btn small el-filter"
          :class="[el.cls, { active: filterElement === key }]"
          @click="filterElement = filterElement === key ? '' : key"
        >{{ localized(el) }}</button>
      </div>
    </div>

    <div v-if="classList.length" class="grid" style="gap: 24px;">
      <div v-for="c in classList" :key="c.id" class="card class-block">
        <div class="class-title">
          <router-link :to="`/classes/${c.id}`" class="class-name">
            {{ localized(c) }} <span v-if="locale === 'zh'" class="en">{{ c.en }}</span>
          </router-link>
          <span class="badge gold">{{ c.role }}</span>
        </div>
        <p class="desc">{{ c.desc }}</p>

        <div class="sub-grid">
          <router-link
            v-for="s in c.subclasses"
            :key="s.id"
            :to="s.type === 'prismatic' ? '/prismatic' : `/classes/${c.id}?el=${s.element}`"
            class="sub-card"
            :class="{ prismatic: s.type === 'prismatic' }"
          >
            <div class="sub-top">
              <span v-if="s.type === 'prismatic'" class="prism-badge">棱镜</span>
              <ElementBadge v-else :element="s.element" />
              <span class="branch">{{ localized(s) }}</span>
            </div>
              <div v-if="s.type !== 'prismatic'" class="super">
                <span class="lbl">超能力</span> {{ s.super }}
              </div>
              <p v-if="s.type !== 'prismatic'" class="focus">{{ s.focus }}</p>
              <p v-else class="focus">跨元素技能池、超越、21 个棱镜特性</p>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="empty">未找到匹配的内容，试试其他关键词或元素。</div>

    <div class="note gold">
      💡 点击职业名进入详情页；五大元素对应五色徽标：
      <span v-for="(el, key) in elements" :key="key">
        <ElementBadge :element="key" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 20px; }
.page-head h1 { margin-bottom: 6px; }
.page-head p { color: var(--text-dim); }
.filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 22px; }
.el-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.class-block { padding: 22px; }
.class-title { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.class-name { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
.class-name .en {
  font-family: var(--font-en);
  font-size: 0.75rem;
  color: var(--gold-dim);
  margin-left: 8px;
  letter-spacing: 0.15em;
}
.desc { font-size: 0.9rem; margin-bottom: 16px; }
.sub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.sub-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 12px;
  color: var(--text-main);
  transition: all 0.2s;
  display: block;
}
.sub-card:hover {
  border-color: var(--line);
  background: rgba(232,193,90,0.05);
  transform: translateY(-2px);
}
.sub-card.prismatic { border-color: rgba(180,107,255,.38); background: linear-gradient(120deg, rgba(180,107,255,.09), rgba(77,184,255,.04)); }
.prism-badge { padding: 3px 8px; border: 1px solid rgba(180,107,255,.45); color: #d8b5ff; font-size: .72rem; }
.sub-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.branch { font-size: 0.9rem; font-weight: 700; }
.super { font-size: 0.78rem; color: var(--text-sub); margin-bottom: 6px; }
.super .lbl { color: var(--gold-dim); font-size: 0.68rem; letter-spacing: 0.1em; }
.focus { font-size: 0.8rem; color: var(--text-sub); }
</style>
