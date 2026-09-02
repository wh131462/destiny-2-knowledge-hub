<script setup>
import { ref, computed } from 'vue'
import { enemyRaces, characters, expansions, sagas } from '@/data/world'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const tab = ref('sagas')
const keyword = ref('')

const tabs = [
  { id: 'sagas', label: '两大传奇' },
  { id: 'factions', label: '势力与敌人' },
  { id: 'characters', label: '重要角色' },
  { id: 'expansions', label: '资料片年表' }
]

const filteredRaces = computed(() =>
  enemyRaces.filter(r => !keyword.value || r.name.includes(keyword.value) || r.en.toLowerCase().includes(keyword.value.toLowerCase()))
)
const filteredChars = computed(() =>
  characters.filter(c => !keyword.value || c.name.includes(keyword.value) || c.en.toLowerCase().includes(keyword.value.toLowerCase()))
)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ t('pages.lore.title') }}</h1>
      <p>{{ t('pages.lore.subtitle') }}</p>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >{{ t.label }}</button>
    </div>

    <a-input v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="t('pages.lore.search')" style="margin: 16px 0;" />

    <!-- 两大传奇 -->
    <template v-if="tab === 'sagas'">
      <div class="grid grid-2">
        <div v-for="s in sagas" :key="s.id" class="card saga-card">
          <div class="saga-head">
            <h2>{{ localized(s) }}</h2>
            <span class="badge gold">{{ s.years }}</span>
          </div>
          <span v-if="locale === 'zh'" class="en-tag">{{ s.en.toUpperCase() }}</span>
          <p class="desc">{{ s.desc }}</p>
          <div class="keys">
            <span v-for="k in s.key" :key="k" class="chip">{{ k }}</span>
          </div>
        </div>
      </div>
      <div class="note gold">
        📖 光与暗传奇（2014–2024）以击败见证者收官；命运传奇（2025–2026）随《凯旋纪念碑》收官，后续《碎裂循环》《炼金术士》取消。
      </div>
    </template>

    <!-- 势力与敌人 -->
    <template v-if="tab === 'factions'">
      <div class="grid grid-2">
        <div v-for="r in filteredRaces" :key="r.id" class="card enemy-card">
          <div class="enemy-top">
            <h3>{{ localized(r) }}</h3>
            <span class="badge blue">{{ r.type }}</span>
          </div>
          <span v-if="locale === 'zh'" class="en-tag">{{ r.en.toUpperCase() }}</span>
          <p class="desc">{{ r.desc }}</p>
          <div class="units">
            <span v-for="u in r.units" :key="u" class="unit-chip">{{ u }}</span>
          </div>
        </div>
      </div>
      <div v-if="!filteredRaces.length" class="empty">未找到匹配的势力</div>
    </template>

    <!-- 角色 -->
    <template v-if="tab === 'characters'">
      <div class="grid grid-3">
        <div v-for="c in filteredChars" :key="c.id" class="card char-card" :class="{ villain: c.villain }">
          <div class="char-top">
            <h3>{{ localized(c) }}</h3>
            <span class="badge" :class="c.villain ? 'gold' : 'blue'">{{ c.role }}</span>
          </div>
          <span v-if="locale === 'zh'" class="en-tag">{{ c.en.toUpperCase() }}</span>
          <p>{{ c.desc }}</p>
        </div>
      </div>
      <div v-if="!filteredChars.length" class="empty">未找到匹配的角色</div>
    </template>

    <!-- 资料片 -->
    <template v-if="tab === 'expansions'">
      <div class="panel">
        <table>
          <tr><th>年份</th><th>资料片</th><th>核心系统</th><th>目的地</th><th>传奇</th></tr>
          <tr v-for="e in expansions" :key="e.year + e.name" :class="{ fate: e.saga }">
            <td>{{ e.year }}</td>
            <td>{{ e.name }}<span class="en-inline">{{ e.en }}</span></td>
            <td>{{ e.feature }}</td>
            <td>{{ e.destination }}</td>
            <td><span v-if="e.saga" class="badge blue">{{ e.saga }}</span><span v-else class="dim">光与暗</span></td>
          </tr>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 20px; }
.page-head h1 { margin-bottom: 6px; }
.page-head p { color: var(--text-dim); }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.tab {
  padding: 8px 18px; border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.02);
  color: var(--text-sub); cursor: pointer;
  font-size: 0.88rem; transition: all 0.2s; font-family: var(--font-cn);
}
.tab:hover { color: var(--gold-bright); border-color: var(--line); }
.tab.active { color: var(--gold-bright); border-color: var(--line); background: rgba(232,193,90,0.12); }
.saga-card h2 { margin: 0; }
.saga-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
.en-tag {
  font-family: var(--font-en); font-size: 0.66rem; letter-spacing: 0.18em;
  color: var(--gold-dim); display: block; margin-bottom: 8px;
}
.desc { font-size: 0.88rem; line-height: 1.7; margin-bottom: 12px; }
.keys, .units { display: flex; flex-wrap: wrap; gap: 8px; }
.chip, .unit-chip {
  padding: 3px 10px; border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid var(--line-soft);
  color: var(--text-sub);
  background: rgba(255,255,255,0.03);
}
.enemy-card, .char-card { color: var(--text-main); }
.char-card.villain { border-color: rgba(255,107,107,0.25); }
.char-top, .enemy-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
.char-top h3, .enemy-top h3 { margin: 0; font-size: 1.05rem; }
.en-inline {
  font-family: var(--font-en); font-size: 0.66rem; color: var(--text-dim);
  margin-left: 6px; letter-spacing: 0.08em;
}
.dim { color: var(--text-dim); font-size: 0.78rem; }
tr.fate td { background: rgba(77,184,255,0.05); }
</style>
