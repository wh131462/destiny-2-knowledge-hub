<script setup>
import { ref, computed } from 'vue'
import { currentStatus } from '@/data/activities'
import { activitiesV2 } from '@/data/v2'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const tab = ref('ops')
const keyword = ref('')

const opsTypes = computed(() => activitiesV2.filter(item => ['pve', 'pvp'].includes(item.category)).map(item => ({
  id: item.id, name: item.name, nameEn: item.name, en: item.category.toUpperCase(), size: item.fireteam, time: '按活动轮换', score: '规则评分', desc: `官方活动目录：${item.name}`
})))
const raids = computed(() => activitiesV2.filter(item => item.category === 'raid').map(item => ({ ...item, nameEn: item.name, en: 'RAID', source: '官方目录', desc: `${item.name}：6人突袭机制与首领输出场景` })))
const dungeons = computed(() => activitiesV2.filter(item => item.category === 'dungeon').map(item => ({ ...item, nameEn: item.name, en: 'DUNGEON', source: '官方目录', desc: `${item.name}：1–3人地牢，包含遭遇战与首领输出` })))
const events = computed(() => activitiesV2.filter(item => item.category === 'event').map(item => ({ ...item, nameEn: item.name, en: 'EVENT', time: '轮换', desc: `${item.name}：以当前活动轮换为准` })))

const tabs = [
  { id: 'ops', label: '门户行动' },
  { id: 'raids', label: '突袭' },
  { id: 'dungeons', label: '地牢' },
  { id: 'events', label: '限时事件' },
  { id: 'status', label: '当前状态' }
]

const filteredRaids = computed(() =>
  raids.value.filter(r => !keyword.value || r.name.includes(keyword.value) || r.en.toLowerCase().includes(keyword.value.toLowerCase()))
)
const filteredDungeons = computed(() =>
  dungeons.value.filter(d => !keyword.value || d.name.includes(keyword.value) || d.en.toLowerCase().includes(keyword.value.toLowerCase()))
)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>{{ t('pages.activities.title') }}</h1>
      <p>{{ t('pages.activities.subtitle') }}</p>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >{{ locale === 'en' ? ({ ops: 'Portal Ops', raids: 'Raids', dungeons: 'Dungeons', events: 'Limited Events', status: 'Current Status' }[t.id] || t.label) : t.label }}</button>
    </div>

    <a-input v-if="['raids', 'dungeons'].includes(tab)" v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="t('pages.activities.search')" style="margin: 16px 0;" />

    <!-- 门户行动 -->
    <template v-if="tab === 'ops'">
      <div class="section-title"><h2>{{ t('pages.activities.ops') }}</h2><span class="en">OPS</span></div>
      <div class="grid grid-2">
        <div v-for="op in opsTypes" :key="op.id" class="card op-card">
          <div class="op-top">
            <h3>{{ localized(op) }}</h3>
            <span class="badge gold">{{ op.en }}</span>
          </div>
          <table>
            <tr><td class="k">人数</td><td>{{ op.size }}</td></tr>
            <tr><td class="k">时长</td><td>{{ op.time }}</td></tr>
            <tr><td class="k">计分</td><td>{{ op.score }}</td></tr>
          </table>
          <p class="desc">{{ op.desc }}</p>
        </div>
      </div>
      <div class="note">
        💡 门户（Portal）自《宿命边缘》上线，是活动主界面；《凯旋纪念碑》后已并入星图（Director）。每日有"加成聚焦"（Bonus Focus）的轮换活动。
      </div>
    </template>

    <!-- 突袭 -->
    <template v-if="tab === 'raids'">
      <div class="section-title"><h2>{{ t('pages.activities.raids') }}</h2><span class="en">RAIDS</span></div>
      <div class="grid grid-2">
        <div v-for="r in filteredRaids" :key="r.id" class="card raid-card" :class="{ new: r.new }">
          <div class="raid-top">
            <span class="badge gold">{{ r.source }}</span>
            <span v-if="r.new" class="badge blue">最新</span>
          </div>
          <h3>{{ localized(r) }}</h3>
          <span class="en-tag">{{ r.en.toUpperCase() }}</span>
          <p>{{ r.desc }}</p>
        </div>
      </div>
      <div v-if="!filteredRaids.length" class="empty">未找到匹配的突袭</div>
      <div class="note">
        💡 突袭需6人组队（无随机匹配），可用官方火力战队搜索器。老突袭每周轮换。最新突袭《永恒荒漠》含史诗（Epic）版本。
      </div>
    </template>

    <!-- 地牢 -->
    <template v-if="tab === 'dungeons'">
      <div class="section-title"><h2>{{ t('pages.activities.dungeons') }}</h2><span class="en">DUNGEONS</span></div>
      <div class="grid grid-2">
        <div v-for="d in filteredDungeons" :key="d.id" class="card dungeon-card" :class="{ new: d.new }">
          <div class="raid-top">
            <span class="badge gold">{{ d.source }}</span>
            <span v-if="d.new" class="badge blue">最新</span>
          </div>
          <h3>{{ localized(d) }}</h3>
          <span class="en-tag">{{ d.en.toUpperCase() }}</span>
          <p>{{ d.desc }}</p>
        </div>
      </div>
      <div v-if="!filteredDungeons.length" class="empty">未找到匹配的地牢</div>
      <div class="note">💡 地牢为3人机制副本，难度介于突袭与打击之间，每周有轮换。</div>
    </template>

    <!-- 事件 -->
    <template v-if="tab === 'events'">
      <div class="section-title"><h2>{{ t('pages.activities.events') }}</h2><span class="en">EVENTS</span></div>
      <div class="grid grid-3">
        <div v-for="e in events" :key="e.id" class="card event-card">
          <span class="badge blue">{{ e.time }}</span>
          <h3>{{ localized(e) }}</h3>
          <span class="en-tag">{{ e.en.toUpperCase() }}</span>
          <p>{{ e.desc }}</p>
        </div>
      </div>
    </template>

    <!-- 当前状态 -->
    <template v-if="tab === 'status'">
      <div class="panel status-panel">
        <h3>{{ t('pages.activities.status') }}</h3>
        <table>
          <tr><td class="k">版本</td><td>{{ currentStatus.version }}（{{ currentStatus.versionDate }}）</td></tr>
          <tr><td class="k">状态</td><td>{{ currentStatus.status }}</td></tr>
          <tr><td class="k">最终更新</td><td>{{ currentStatus.finalUpdate }}</td></tr>
        </table>
        <p class="note-text">{{ currentStatus.note }}</p>
      </div>
      <div class="panel">
        <h3>2026年更新时间线</h3>
        <table>
          <tr><th>日期</th><th>版本</th><th>内容</th></tr>
          <tr><td>2026-07-08</td><td>9.7.0.3</td><td>重新启用《永恒荒漠》中的无线系链机制</td></tr>
          <tr><td>2026-06-24</td><td>9.7.0.2</td><td>十字弓弩弹发射首领修复</td></tr>
          <tr><td>2026-06-17</td><td>9.7.0.1</td><td>"权利的真相"套装加成修复</td></tr>
          <tr><td>2026-06-09</td><td>9.7.0.0</td><td>最终内容更新《凯旋纪念碑》</td></tr>
          <tr><td>2026-05-21</td><td>—</td><td>官方宣布终止持续内容更新</td></tr>
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
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.02);
  color: var(--text-sub);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s;
  font-family: var(--font-cn);
}
.tab:hover { color: var(--gold-bright); border-color: var(--line); }
.tab.active { color: var(--gold-bright); border-color: var(--line); background: rgba(232,193,90,0.12); }
.op-card h3 { margin: 0; }
.op-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
.op-card td.k, .status-panel td.k { color: var(--gold-dim); width: 90px; font-size: 0.8rem; }
.desc { font-size: 0.88rem; line-height: 1.7; }
.raid-card, .dungeon-card, .event-card { color: var(--text-main); }
.raid-top { display: flex; gap: 8px; margin-bottom: 8px; }
.en-tag {
  font-family: var(--font-en); font-size: 0.66rem; letter-spacing: 0.18em;
  color: var(--gold-dim); display: block; margin-bottom: 8px;
}
.raid-card.new, .dungeon-card.new { border-color: rgba(77,184,255,0.3); }
.note-text { margin-top: 10px; font-size: 0.9rem; }
.status-panel { margin-bottom: 16px; }
</style>
