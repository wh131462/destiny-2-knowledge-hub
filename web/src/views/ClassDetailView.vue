<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { classes, stats } from '@/data/classes'
import ElementBadge from '@/components/ElementBadge.vue'
import { useI18n, localized } from '@/i18n'

const { locale } = useI18n()

const route = useRoute()

const classObj = computed(() => classes.find(c => c.id === route.params.classId))

const activeEl = ref(route.query.el || classObj.value?.subclasses[0]?.element || 'solar')

watch(() => route.query.el, (v) => {
  if (v) activeEl.value = v
})

const activeSub = computed(() =>
  classObj.value?.subclasses.find(s => s.type !== 'prismatic' && s.element === activeEl.value)
)
</script>

<template>
  <div v-if="classObj">
    <router-link to="/classes" class="back">← 返回职业百科</router-link>

    <div class="class-hero" :style="{ borderColor: classObj.color }">
      <div class="class-icon" :style="{ borderColor: classObj.color, color: classObj.color }">
        {{ classObj.name[0] }}
      </div>
      <div>
        <h1>{{ localized(classObj) }} <span v-if="locale === 'zh'" class="en">{{ classObj.en }}</span></h1>
        <p class="role">{{ classObj.role }}</p>
        <p class="desc">{{ classObj.desc }}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="panel">
        <h3>职业技能</h3>
        <p>{{ classObj.classAbility }}</p>
        <h3>职业特长</h3>
        <ul class="tight">
          <li v-for="t in classObj.traits" :key="t">{{ t }}</li>
        </ul>
        <h3>属性倾向</h3>
        <p>{{ classObj.stats.join(' → ') }}</p>
      </div>

      <div class="panel">
        <h3>元素选择</h3>
        <div class="el-tabs">
          <button
            v-for="s in classObj.subclasses"
            :key="s.element"
            class="el-tab"
            :class="[{ active: activeEl === s.element }]"
            @click="activeEl = s.element"
          >
            <ElementBadge :element="s.element" />
            <span class="branch">{{ s.branch }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeSub" class="panel sub-detail">
      <div class="sub-head">
        <ElementBadge :element="activeSub.element" />
        <h2>{{ activeSub.branch }}</h2>
        <span class="badge blue">{{ localized(classObj) }}：{{ activeSub.element }}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-col">
          <h4>超能力 Super</h4>
          <p class="super">{{ activeSub.super }}</p>
          <h4>定位</h4>
          <p>{{ activeSub.focus }}</p>
          <h4>天赋 Aspects</h4>
          <div class="aspects">
            <span v-for="a in activeSub.aspects" :key="a" class="aspect">{{ a }}</span>
          </div>
        </div>
        <div class="detail-col">
          <h4>推荐构筑方向</h4>
          <div class="build-suggest">
            {{ activeSub.build }}
          </div>
        </div>
      </div>
    </div>

    <div class="note">
      属性快捷参考：
      <span v-for="s in stats.slice(0, 3)" :key="s.key" class="stat-chip">{{ s.name }}</span>
      （详情见防具与套装页）
    </div>
  </div>

  <div v-else class="empty">未找到该职业</div>
</template>

<style scoped>
.back { font-size: 0.85rem; color: var(--text-sub); }
.back:hover { color: var(--gold-bright); }
.class-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--line-soft);
  border-left-width: 4px;
  border-radius: var(--radius);
  background: linear-gradient(160deg, var(--bg-card), var(--bg-dark));
  margin: 14px 0 18px;
}
.class-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 800;
  background: rgba(255,255,255,0.03);
  flex-shrink: 0;
}
.class-hero .en { font-family: var(--font-en); font-size: 0.9rem; color: var(--gold-dim); letter-spacing: 0.2em; }
.role { color: var(--gold-bright); font-size: 0.9rem; margin: 2px 0 6px; }
.desc { font-size: 0.9rem; line-height: 1.7; }
.info-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 14px; margin-bottom: 16px; }
.el-tabs { display: flex; flex-direction: column; gap: 8px; }
.el-tab {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.02);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-cn);
}
.el-tab:hover { border-color: var(--line); }
.el-tab.active { border-color: var(--gold-dim); background: rgba(232,193,90,0.08); }
.el-tab .branch { font-size: 0.9rem; font-weight: 600; }
.sub-detail { margin-bottom: 16px; }
.sub-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.sub-head h2 { margin: 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-col h4 { color: var(--gold-dim); font-family: var(--font-cn); font-size: 0.8rem; letter-spacing: 0.1em; margin-bottom: 8px; }
.super { font-size: 1rem; color: var(--text-main); margin-bottom: 14px; }
.aspects { display: flex; flex-wrap: wrap; gap: 8px; }
.aspect {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 0.78rem;
  color: var(--gold-bright);
}
.build-suggest {
  background: rgba(77,184,255,0.05);
  border: 1px solid rgba(77,184,255,0.2);
  border-radius: 10px;
  padding: 14px;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-sub);
}
.stat-chip {
  display: inline-block;
  margin: 0 4px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(232,193,90,0.1);
  border: 1px solid var(--line);
  color: var(--gold-bright);
  font-size: 0.78rem;
}
@media (max-width: 700px) {
  .info-grid, .detail-grid { grid-template-columns: 1fr; }
}
</style>
