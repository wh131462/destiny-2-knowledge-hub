<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { classes, elements } from '@/data/classes'
import { builds, weaponRecs, loadoutRules, getBuildsByFilter } from '@/data/builds'
import ElementBadge from '@/components/ElementBadge.vue'
import { useI18n, localized } from '@/i18n'

const { locale, t } = useI18n()

const route = useRoute()

const activeTool = ref('build')

const tools = [
  { id: 'build', label: '构筑推荐器', icon: '🧬' },
  { id: 'loadout', label: '套装配置器', icon: '🛡️' },
  { id: 'weapon', label: '武器推荐器', icon: '🔫' }
]

/* ===== 构筑推荐器 ===== */
const bClass = ref('')
const bElement = ref('')
const bMode = ref('')
const result = ref(null)

/* ===== 套装配置器 ===== */
const lClass = ref('')
const lMode = ref('pve')

/* ===== 武器推荐器 ===== */
const wMode = ref('pve-general')

// 支持 URL 参数深链接：#/tools?class=titan&element=arc&mode=pve&tool=weapon|loadout&weapon=pve-raid
if (route.query.class) { bClass.value = route.query.class; lClass.value = route.query.class }
if (route.query.element) bElement.value = route.query.element
if (route.query.mode) { bMode.value = route.query.mode; lMode.value = route.query.mode }
if (route.query.tool && ['build', 'loadout', 'weapon'].includes(route.query.tool)) activeTool.value = route.query.tool
if (route.query.weapon && weaponRecs.find(w => w.id === route.query.weapon)) wMode.value = route.query.weapon
if (bClass.value && bElement.value && bMode.value) {
  setTimeout(generateBuild, 0)
}

const classOptions = classes.map(c => ({ id: c.id, name: c.name }))
const elementCandidates = computed(() => {
  if (!bClass.value) {
    const all = {}
    classes.forEach(c => c.subclasses.forEach(s => (all[s.element] = true)))
    return Object.keys(all)
  }
  const c = classes.find(x => x.id === bClass.value)
  return c ? c.subclasses.map(s => s.element) : []
})

const canGenerate = computed(() => bClass.value && bElement.value && bMode.value)

function selectClass(id) {
  bClass.value = id
  bElement.value = ''
  result.value = null
}
function selectElement(el) {
  bElement.value = el
  result.value = null
}
function selectMode(m) {
  bMode.value = m
  result.value = null
}

function generateBuild() {
  const list = getBuildsByFilter(bClass.value, bElement.value, bMode.value)
  if (list.length) {
    result.value = list[0]
  } else {
    // 宽松匹配：忽略某一维度
    const fallback = builds.find(b => b.classId === bClass.value && b.element === bElement.value) ||
                     builds.find(b => b.element === bElement.value && b.mode === bMode.value) ||
                     null
    result.value = fallback
  }
}

function resetBuild() {
  bClass.value = ''; bElement.value = ''; bMode.value = ''; result.value = null
}

/* ===== 套装配置器 ===== */
const lResult = computed(() => {
  if (!lClass.value) return null
  return builds.find(b => b.classId === lClass.value && b.mode === lMode.value)
})

/* ===== 武器推荐器 ===== */
const wResult = computed(() => weaponRecs.find(w => w.id === wMode.value))

const modeName = (id) => weaponRecs.find(w => w.id === id)?.activity || ''
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ locale === 'en' ? 'Recommendation Tools' : '推荐工具' }}</h1>
      <p>{{ locale === 'en' ? 'Build recommendations / loadout planning / weapon recommendations — powered by the knowledge-base rules.' : '构筑推荐、套装配置、武器推荐 —— 基于知识库规则库（数据真实可信）' }}</p>
    </div>

    <div class="tool-tabs">
      <button
        v-for="t in tools"
        :key="t.id"
        class="tool-tab"
        :class="{ active: activeTool === t.id }"
        @click="activeTool = t.id"
      >
        <span class="icon">{{ t.icon }}</span>{{ t.label }}
      </button>
    </div>

    <!-- ========== 构筑推荐器 ========== -->
    <section v-if="activeTool === 'build'" class="tool-panel">
      <h2>🧬 构筑推荐器</h2>
      <p class="hint">选择 职业 × 元素 × 玩法，生成推荐构筑方案</p>

      <div class="selector-row">
        <div class="sel-group">
          <label>职业</label>
          <div class="sel-options">
            <button
              v-for="c in classOptions"
              :key="c.id"
              class="btn small"
              :class="{ active: bClass === c.id }"
              @click="bClass = c.id; bElement = ''; result = null"
            >{{ locale === 'en' ? ({ titan: 'Titan', hunter: 'Hunter', warlock: 'Warlock' }[c.id] || c.name) : c.name }}</button>
          </div>
        </div>
        <div class="sel-group">
          <label>元素</label>
          <div class="sel-options">
            <button
              v-for="el in elementCandidates"
              :key="el"
              class="btn small"
              :class="{ active: bElement === el }"
              @click="bElement = el; result = null"
            >{{ bClass ? (classes.find(c => c.id === bClass)?.subclasses.find(s => s.element === el)?.branch || (locale === 'en' ? elements[el]?.en : elements[el]?.name) || el) : (locale === 'en' ? elements[el]?.en : elements[el]?.name) || el }}</button>
          </div>
        </div>
        <div class="sel-group">
          <label>玩法</label>
          <div class="sel-options">
            <button class="btn small" :class="{ active: bMode === 'pve' }" @click="bMode = 'pve'; result = null">PVE</button>
            <button class="btn small" :class="{ active: bMode === 'pvp' }" @click="bMode = 'pvp'; result = null">PVP</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" :disabled="!canGenerate" @click="generateBuild">⚡ 生成推荐</button>
        <button class="btn" @click="resetBuild">重置</button>
      </div>

      <div v-if="result" class="build-result">
        <div class="result-head">
          <h3>{{ result.name }}</h3>
          <div class="tags">
            <span class="badge gold" v-for="t in result.tags" :key="t">{{ t }}</span>
          </div>
        </div>
        <div class="result-grid">
          <div class="result-block exotic">
            <h4>✦ 异域护甲</h4>
            <p>{{ result.exoticArmor }}</p>
          </div>
          <div class="result-block">
            <h4>🛡️ 推荐套装</h4>
            <p>{{ result.armorSet }}</p>
          </div>
          <div class="result-block">
            <h4>📊 属性目标</h4>
            <ul class="tight">
              <li v-for="s in result.stats" :key="s">{{ s }}</li>
            </ul>
          </div>
          <div class="result-block">
            <h4>🔫 武器搭配</h4>
            <ul class="tight">
              <li v-for="w in result.weapons" :key="w">{{ w }}</li>
            </ul>
          </div>
        </div>
        <div class="why-box">
          <div class="why-label">为什么推荐这套？</div>
          <p>{{ result.why }}</p>
          <div class="meta">
            <span class="badge">难度：{{ result.difficulty }}</span>
            <span class="badge">职业：{{ classOptions.find(c => c.id === result.classId)?.name }}</span>
            <ElementBadge :element="result.element" />
          </div>
        </div>
      </div>
      <div v-else class="empty" style="padding: 60px 0;">
        👆 选择职业、元素与玩法后点击「生成推荐」
      </div>
    </section>

    <!-- ========== 套装配置器 ========== -->
    <section v-if="activeTool === 'loadout'" class="tool-panel">
      <h2>🛡️ 套装配置器</h2>
      <p class="hint">选择职业与玩法，查看推荐的套装搭配与模组思路</p>

      <div class="selector-row">
        <div class="sel-group">
          <label>职业</label>
          <div class="sel-options">
            <button
              v-for="c in classOptions"
              :key="c.id"
              class="btn small"
              :class="{ active: lClass === c.id }"
              @click="lClass = c.id"
            >{{ locale === 'en' ? ({ titan: 'Titan', hunter: 'Hunter', warlock: 'Warlock' }[c.id] || c.name) : c.name }}</button>
          </div>
        </div>
        <div class="sel-group">
          <label>玩法</label>
          <div class="sel-options">
            <button class="btn small" :class="{ active: lMode === 'pve' }" @click="lMode = 'pve'">PVE</button>
            <button class="btn small" :class="{ active: lMode === 'pvp' }" @click="lMode = 'pvp'">PVP</button>
          </div>
        </div>
      </div>

      <div v-if="lResult" class="loadout-result">
        <div class="result-head">
          <h3>{{ lResult.name }}</h3>
          <span class="badge blue">{{ locale === 'en' ? ({ titan: 'Titan', hunter: 'Hunter', warlock: 'Warlock' }[lResult.classId] || lResult.classId) : classOptions.find(c => c.id === lResult.classId)?.name }}</span>
        </div>

        <h4 class="sub-title">属性优先级</h4>
        <div class="stat-line">
          <span v-for="s in loadoutRules.statPriority[lMode]" :key="s" class="stat-chip">{{ s }}</span>
        </div>

        <h4 class="sub-title">模组思路（按部位）</h4>
        <ul class="tight mod-list">
          <li v-for="tip in loadoutRules.slotTips" :key="tip">{{ tip }}</li>
        </ul>

        <h4 class="sub-title">套装协同要点</h4>
        <ul class="tight mod-list">
          <li v-for="tip in loadoutRules.setBonusTips" :key="tip">{{ tip }}</li>
        </ul>

        <div class="why-box">
          <div class="why-label">推荐理由</div>
          <p>{{ lResult.why }}</p>
          <p class="exo-line">✦ 异域核心：{{ lResult.exoticArmor }}</p>
        </div>
      </div>
      <div v-else class="empty" style="padding: 60px 0;">
        👆 选择职业以查看套装配置建议
      </div>
    </section>

    <!-- ========== 武器推荐器 ========== -->
    <section v-if="activeTool === 'weapon'" class="tool-panel">
      <h2>🔫 武器推荐器</h2>
      <p class="hint">按活动场景选择，查看各槽位推荐武器与理由</p>

      <div class="selector-row">
        <div class="sel-group">
          <label>活动场景</label>
          <div class="sel-options">
            <button
              v-for="w in weaponRecs"
              :key="w.id"
              class="btn small"
              :class="{ active: wMode === w.id }"
              @click="wMode = w.id"
            >{{ w.activity }}</button>
          </div>
        </div>
      </div>

      <div v-if="wResult" class="weapon-result">
        <div class="result-head">
          <h3>{{ wResult.activity }}</h3>
          <span class="badge gold">推荐组合</span>
        </div>
        <div class="result-grid">
          <div class="result-block">
            <h4>动能槽 Kinetic</h4>
            <p>{{ wResult.kinetic }}</p>
          </div>
          <div class="result-block">
            <h4>能量槽 Energy</h4>
            <p>{{ wResult.energy }}</p>
          </div>
          <div class="result-block">
            <h4>重型槽 Power</h4>
            <p>{{ wResult.heavy }}</p>
          </div>
        </div>
        <div class="why-box">
          <div class="why-label">推荐理由</div>
          <p>{{ wResult.why }}</p>
        </div>
      </div>
    </section>

    <div class="note">
      ℹ️ 以上推荐基于《命运2知识库》提炼的规则库生成，为非官方内容。实际搭配请以游戏内版本为准（当前 9.7.0.3）。产物设计为可扩展：在 <code>src/data/builds.js</code> 中追加规则即可扩充推荐。
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 20px; }
.page-head h1 { margin-bottom: 6px; }
.page-head p { color: var(--text-dim); }
.tool-tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.tool-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px;
  border-radius: 14px;
  border: 1px solid var(--line-soft);
  background: var(--bg-card);
  color: var(--text-sub);
  font-size: 0.95rem; font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  font-family: var(--font-cn);
}
.tool-tab .icon { font-size: 1.15rem; }
.tool-tab:hover { border-color: var(--line); transform: translateY(-2px); }
.tool-tab.active {
  color: var(--gold-bright);
  border-color: var(--line);
  background: linear-gradient(160deg, rgba(232,193,90,0.15), rgba(232,193,90,0.05));
  box-shadow: 0 6px 24px rgba(232,193,90,0.12);
}
.tool-panel {
  background: linear-gradient(160deg, var(--bg-card), var(--bg-dark));
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  padding: 26px;
  margin-bottom: 20px;
}
.tool-panel h2 { margin-top: 0; }
.hint { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 18px; }
.selector-row { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.sel-group label { display: block; font-size: 0.78rem; color: var(--gold-dim); letter-spacing: 0.1em; margin-bottom: 8px; }
.sel-options { display: flex; gap: 8px; flex-wrap: wrap; }
.actions { display: flex; gap: 12px; margin-bottom: 24px; }
.build-result, .loadout-result, .weapon-result {
  border-top: 1px dashed var(--line);
  padding-top: 22px;
}
.result-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.result-head h3 { font-size: 1.4rem; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
.result-block {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 14px;
}
.result-block h4 { color: var(--gold-dim); font-family: var(--font-cn); font-size: 0.8rem; letter-spacing: 0.1em; margin-bottom: 8px; }
.result-block p { font-size: 0.9rem; line-height: 1.7; }
.result-block.exotic { border-color: rgba(232,193,90,0.35); background: rgba(232,193,90,0.05); }
.result-block.exotic p { color: var(--gold-bright); }
.why-box {
  background: rgba(77,184,255,0.05);
  border: 1px solid rgba(77,184,255,0.2);
  border-radius: 12px;
  padding: 16px;
}
.why-label { color: var(--blue); font-size: 0.8rem; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 600; }
.why-box p { font-size: 0.92rem; line-height: 1.8; }
.meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
.sub-title { color: var(--gold-dim); font-family: var(--font-cn); font-size: 0.85rem; margin: 18px 0 8px; letter-spacing: 0.05em; }
.stat-line { display: flex; gap: 8px; flex-wrap: wrap; }
.stat-chip {
  padding: 6px 14px; border-radius: 999px;
  background: rgba(232,193,90,0.1); border: 1px solid var(--line);
  color: var(--gold-bright); font-size: 0.85rem; font-weight: 600;
}
.mod-list { margin-bottom: 4px; }
.exo-line { margin-top: 10px; color: var(--gold-bright); }
code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 5px; font-size: 0.8em; color: var(--blue); }
</style>
