<script setup>
import { ref, computed } from 'vue'
import { armorSlots, setBonusGuide } from '@/data/armor'
import { armorSets, classesV2, gearItems, acquisitionById } from '@/data/v2'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const keyword = ref('')
const classFilter = ref('')

const classOptions = classesV2.map(c => ({ id: c.id, name: c.name }))

const filteredSets = computed(() =>
  armorSets.filter(s => {
    const query = keyword.value.trim().toLowerCase()
    if (!query) return true

    // 标准套装目录使用 bonus 作为描述字段，旧版编辑数据才有 desc。
    // 统一拼接可搜索文本，避免缺少可选字段时在页面渲染阶段抛异常。
    return [s.name, s.en, s.source, s.desc, s.bonus, ...(s.stats || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
)

const filteredExos = computed(() => {
  const canonical = gearItems.filter(item => item.type === 'armor' && item.rarity === 'exotic')
  return canonical.filter(item =>
    (!classFilter.value || item.classId === classFilter.value) &&
    (!keyword.value || item.name.includes(keyword.value) || item.en.toLowerCase().includes(keyword.value.toLowerCase()))
  )
})

const classNames = Object.fromEntries(classesV2.map(c => [c.id, c.name]))
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ t('pages.armor.title') }}</h1>
      <p>{{ t('pages.armor.subtitle') }}</p>
    </div>

    <div class="filters">
      <a-input v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="t('pages.armor.search')" />
    </div>

    <!-- 护甲部位说明 -->
    <div class="section-title"><h2>{{ t('pages.armor.slots') }}</h2><span class="en">SLOTS</span></div>
    <div class="slot-grid">
      <div v-for="s in armorSlots" :key="s.key" class="slot-chip">{{ localized(s) }}</div>
    </div>

    <!-- 代表套装 -->
    <div class="section-title"><h2>{{ t('pages.armor.sets') }}</h2><span class="en">ARMOR SETS</span></div>
    <div class="grid grid-3">
      <div v-for="s in filteredSets" :key="s.id" class="card set-card">
        <div class="set-top">
          <span class="badge blue">{{ s.source }}</span>
        </div>
        <h3>{{ localized(s) }}</h3>
        <span v-if="locale === 'zh'" class="en-tag">{{ s.en.toUpperCase() }}</span>
        <p class="desc">{{ s.desc || `${s.source} 套装；${s.bonus}` }}</p>
        <ul class="tight">
          <li><strong style="color: var(--gold-bright);">套装加成：</strong>{{ s.bonus }}</li>
          <li><strong>属性倾向：</strong>{{ s.stats.join('、') }}</li>
        </ul>
      </div>
    </div>
    <div v-if="!filteredSets.length" class="empty">未找到匹配的套装</div>

    <!-- 异域护甲 -->
    <div class="section-title">
      <h2>{{ t('pages.armor.exotics') }}</h2>
      <span class="en">EXOTIC ARMOR</span>
      <div class="class-tabs">
        <button class="btn small" :class="{ active: !classFilter }" @click="classFilter = ''">全部</button>
        <button
          v-for="c in classOptions"
          :key="c.id"
          class="btn small"
          :class="{ active: classFilter === c.id }"
          @click="classFilter = classFilter === c.id ? '' : c.id"
        >{{ c.name }}</button>
      </div>
    </div>
    <div class="grid grid-3">
      <div v-for="a in filteredExos" :key="a.id" class="card exotic-armor">
        <div class="exo-top">
          <span class="badge gold">{{ classNames[a.classId] }}：异域</span>
          <span v-if="a.slot" class="el-mini">{{ a.slot }}</span>
        </div>
        <h3>✦ {{ localized(a) }}</h3>
        <span v-if="locale === 'zh'" class="en-tag">{{ a.en.toUpperCase() }}</span>
        <p>{{ a.desc || '官方 Manifest 装备定义；具体特性请结合当前补丁复核。' }}</p>
        <div class="how">获取路径：{{ acquisitionById[a.acquisitionId]?.name || '待补充' }}</div>
      </div>
    </div>
    <div v-if="!filteredExos.length" class="empty">未找到匹配的异域护甲</div>

    <!-- 套装加成指南 -->
    <div class="panel">
      <h3>套装配置指南</h3>
      <p style="white-space: pre-line; font-size: 0.9rem;">{{ setBonusGuide }}</p>
      <div class="note gold">
        💡 构筑公式：高 Tier 套装（凑 2/4/6 件加成）+ 1 件异域优化核心部位 + 属性拉到 100 档位。
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 20px; }
.page-head h1 { margin-bottom: 6px; }
.page-head p { color: var(--text-dim); }
.filters { margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap; }
.slot-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.slot-chip {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.03);
  font-size: 0.88rem;
  color: var(--text-sub);
}
.set-card { color: var(--text-main); }
.set-top { margin-bottom: 8px; }
.en-tag {
  font-family: var(--font-en); font-size: 0.66rem; letter-spacing: 0.18em;
  color: var(--gold-dim); display: block; margin-bottom: 8px;
}
.desc { font-size: 0.88rem; margin-bottom: 10px; }
.exotic-armor { border-color: rgba(232,193,90,0.2); color: var(--text-main); }
.exotic-armor:hover { border-color: rgba(232,193,90,0.55); }
.exo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.el-mini {
  font-size: 0.72rem; color: rgba(232,193,90,0.7);
  border: 1px solid rgba(232,193,90,0.4); padding: 2px 8px; border-radius: 999px;
}
.class-tabs { margin-left: auto; display: flex; gap: 8px; }
@media (max-width: 640px) {
  .class-tabs { margin-left: 0; }
}
</style>
