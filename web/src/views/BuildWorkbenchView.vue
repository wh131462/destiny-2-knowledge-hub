<script setup>
import { computed, ref, watch } from 'vue'
import {
  MANIFEST_VERSION,
  RULES_VERSION,
  curatedBuilds,
  buildById,
  calculateStats,
  calculateCombatProfile,
  planAcquisition,
  planUnlocks,
  validateBuild,
  gearById,
  armorSetById,
  subclassById
} from '@/data/v2'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import StatGrid from '@/components/StatGrid.vue'
import { useI18n, localized } from '@/i18n'
import { useManifestAssets } from '@/composables/useManifestAssets'

const { locale, t } = useI18n()
const { iconFor } = useManifestAssets()

const storageKey = 'd2hub-custom-builds-v1'
const defaultBuild = curatedBuilds[0]
const draftText = ref(JSON.stringify(defaultBuild, null, 2))
const selectedExample = ref(defaultBuild?.id || '')
const savedBuilds = ref(loadSaved())
const savedId = ref('')
const parseError = ref('')
const savedMessage = ref('')
const combatMode = ref('pve')
const fileInput = ref(null)

function loadSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function parseDraft() {
  try {
    const value = JSON.parse(draftText.value)
    parseError.value = value && typeof value === 'object' && !Array.isArray(value) ? '' : 'JSON 根节点必须是对象。'
    return parseError.value ? null : value
  } catch (error) {
    parseError.value = `JSON 格式错误：${error.message}`
    return null
  }
}

const currentBuild = computed(parseDraft)
const validation = computed(() => currentBuild.value ? validateBuild(currentBuild.value) : null)
const isValid = computed(() => Boolean(validation.value?.valid))
const stats = computed(() => isValid.value ? calculateStats(currentBuild.value) : null)
const combatProfile = computed(() => isValid.value ? calculateCombatProfile(currentBuild.value, { mode: combatMode.value }) : null)
const acquisition = computed(() => currentBuild.value ? planAcquisition(currentBuild.value) : [])
const unlocks = computed(() => isValid.value ? planUnlocks(currentBuild.value) : [])
const subclassName = computed(() => localized(subclassById[currentBuild.value?.subclassId]) || currentBuild.value?.subclassId || (locale.value === 'en' ? 'Not selected' : '未选择'))

watch(draftText, () => { savedMessage.value = '' })

function useExample() {
  const example = curatedBuilds.find(item => item.id === selectedExample.value)
  if (!example) return
  draftText.value = JSON.stringify(example, null, 2)
  savedId.value = ''
  savedMessage.value = `已载入示例：${example.name}`
}

function formatDraft() {
  const parsed = parseDraft()
  if (parsed) draftText.value = JSON.stringify(parsed, null, 2)
}

function clearDraft() {
  draftText.value = '{}'
  savedId.value = ''
  savedMessage.value = '已清空草稿。'
}

function saveDraft() {
  const parsed = parseDraft()
  if (!parsed) return
  const id = savedId.value || `custom-${Date.now()}`
  const entry = { id, name: parsed.name || '未命名构筑', updatedAt: new Date().toISOString(), build: parsed }
  const next = [entry, ...savedBuilds.value.filter(item => item.id !== id)]
  savedBuilds.value = next
  savedId.value = id
  localStorage.setItem(storageKey, JSON.stringify(next))
  savedMessage.value = `已保存“${entry.name}”。`
}

function loadSavedBuild(entry) {
  draftText.value = JSON.stringify(entry.build, null, 2)
  savedId.value = entry.id
  savedMessage.value = `已载入本地版本：${entry.name}`
}

function deleteSavedBuild(id) {
  savedBuilds.value = savedBuilds.value.filter(item => item.id !== id)
  localStorage.setItem(storageKey, JSON.stringify(savedBuilds.value))
  if (savedId.value === id) savedId.value = ''
  savedMessage.value = '已删除本地版本。'
}

function exportDraft() {
  const parsed = parseDraft()
  if (!parsed) return
  const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${(parsed.name || 'destiny-2-build').replace(/[^\w\-\u4e00-\u9fff]+/g, '-').slice(0, 80)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  savedMessage.value = '已导出 JSON 文件。'
}

function importFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    draftText.value = String(reader.result || '')
    savedId.value = ''
    savedMessage.value = `已导入：${file.name}`
  }
  reader.readAsText(file)
  event.target.value = ''
}

const displayGear = id => localized(gearById[id]) || localized(armorSetById[id]) || id
const errorLabel = item => `${item.path || 'root'}：${item.message}`
const confidenceSummary = computed(() => {
  const values = acquisition.value.filter(item => !item.owned).map(item => item.confidence)
  return values.length ? [...new Set(values)].join('、') : '无待获取项'
})
const previewIcon = item => iconFor(item)
const previewWeapons = computed(() => (currentBuild.value?.weapons || []).map(item => ({ ...item, gear: gearById[item.itemId] })).filter(item => item.gear))
const previewSlotNames = { kinetic: '动能槽', energy: '能量槽', power: '重型槽' }
</script>

<template>
  <div class="workbench">
    <header class="workbench-head">
      <div>
        <p class="eyebrow">CUSTOM BUILD WORKBENCH / RULES {{ RULES_VERSION }}</p>
        <h1>{{ t('pages.workbench.title') }}</h1>
        <p>{{ t('pages.workbench.subtitle') }}</p>
      </div>
      <router-link to="/build-lab" class="back-link">返回推荐实验室 ↗</router-link>
    </header>

    <section v-if="currentBuild" class="workbench-preview" aria-label="当前构筑预览">
      <div class="preview-heading"><div><span class="eyebrow">IN-GAME LOADOUT PREVIEW</span><h2>{{ currentBuild.name || '未命名构筑' }}</h2><p>编辑配置时，槽位、图标和词条会同步更新。</p></div><router-link v-if="buildById[currentBuild.id]" :to="`/builds/${currentBuild.id}`" class="back-link">打开详情 ↗</router-link></div>
      <div class="preview-slots">
        <div class="preview-slot exotic"><span>异域护甲</span><div class="preview-art"><img v-if="previewIcon(gearById[currentBuild.exoticArmorId])" :src="previewIcon(gearById[currentBuild.exoticArmorId])" :alt="displayGear(currentBuild.exoticArmorId)" /><b v-else>{{ displayGear(currentBuild.exoticArmorId).slice(0, 1) }}</b></div><strong>{{ displayGear(currentBuild.exoticArmorId) }}</strong></div>
        <div v-for="item in previewWeapons" :key="item.itemId" class="preview-slot"><span>{{ previewSlotNames[item.gear.slot] }}</span><div class="preview-art"><img v-if="previewIcon(item.gear)" :src="previewIcon(item.gear)" :alt="item.gear.name" /><b v-else>{{ item.gear.name.slice(0, 1) }}</b></div><strong>{{ item.gear.name }}</strong><small>{{ item.perks.join('、') || '固定异域特性' }}</small></div>
        <div class="preview-slot subclass"><span>子职业核心</span><div class="subclass-lines"><strong>{{ subclassName }}</strong><small>{{ currentBuild.abilities?.aspectIds?.map(id => id).join('、') || '等待星相配置' }}</small><small>{{ currentBuild.abilities?.facetIds?.length || 0 }} 个棱镜特性</small></div></div>
      </div>
    </section>

    <section class="editor-layout">
      <div class="editor-pane">
        <div class="toolbar">
          <label><span>{{ locale === 'en' ? 'Advanced JSON editor' : '高级 JSON 编辑器' }}</span><a-select v-model:value="selectedExample" class="example-select" @change="useExample"><a-select-option v-for="build in curatedBuilds" :key="build.id" :value="build.id">{{ build.name }}</a-select-option></a-select></label>
          <div class="toolbar-actions"><a-button size="small" @click="fileInput?.click()">导入文件</a-button><input ref="fileInput" type="file" accept="application/json,.json" hidden @change="importFile" /><a-button size="small" @click="formatDraft">格式化</a-button><a-button size="small" danger @click="clearDraft">清空</a-button></div>
        </div>
        <a-textarea v-model:value="draftText" class="json-editor" :auto-size="{ minRows: 24 }" spellcheck="false" aria-label="构筑 JSON 编辑器" />
        <div class="editor-footer"><span>Manifest {{ MANIFEST_VERSION }}：需要完整构筑对象</span><div><a-button type="primary" size="small" @click="saveDraft">保存到本地</a-button><a-button size="small" @click="exportDraft">导出 JSON</a-button></div></div>
        <p v-if="savedMessage" class="saved-message" role="status">{{ savedMessage }}</p>
      </div>

      <aside class="saved-pane">
        <h2>本地版本</h2>
        <p v-if="!savedBuilds.length" class="muted">还没有保存的自定义构筑。</p>
        <ul v-else>
          <li v-for="entry in savedBuilds" :key="entry.id"><button type="button" class="saved-load" @click="loadSavedBuild(entry)"><strong>{{ entry.name }}</strong><small>{{ new Date(entry.updatedAt).toLocaleString('zh-CN') }}</small></button><a-button type="text" danger size="small" class="delete" title="删除本地版本" @click="deleteSavedBuild(entry.id)">×</a-button></li>
        </ul>
      </aside>
    </section>

    <section class="validation-panel" :class="{ valid: isValid, invalid: validation && !validation.valid }">
      <div class="validation-title"><div><span class="eyebrow">LIVE VALIDATION</span><h2>{{ parseError ? '无法解析构筑' : (isValid ? '配置合法，可计算' : '配置尚未通过校验') }}</h2></div><ConfidenceBadge v-if="currentBuild?.confidence" :level="currentBuild.confidence" /></div>
      <p v-if="parseError" class="parse-error">{{ parseError }}</p>
      <template v-else-if="validation">
        <div v-if="validation.errors.length" class="issue-list"><h3>必须修复（{{ validation.errors.length }}）</h3><button v-for="item in validation.errors" :key="`${item.code}-${item.path}`" type="button" @click="savedMessage = `请检查 ${item.path || 'root'}`"><code>{{ item.path || 'root' }}</code><span>{{ item.message }}</span></button></div>
        <div v-if="validation.warnings.length" class="issue-list warnings"><h3>场景提醒（{{ validation.warnings.length }}）</h3><p v-for="item in validation.warnings" :key="item.message"><code>{{ item.code }}</code><span>{{ item.message }}</span></p></div>
        <p v-if="!validation.errors.length && !validation.warnings.length" class="ok-text">全部结构、职业池、技能类型、槽位、词条和模组容量检查通过。</p>
      </template>
      <p v-else class="muted">开始编辑或导入 JSON 后，这里会实时显示校验结果。</p>
    </section>

    <section v-if="isValid" class="analysis-grid">
      <article class="analysis-card identity"><span class="eyebrow">BUILD PROFILE</span><h2>{{ currentBuild.name || '未命名构筑' }}</h2><p>{{ subclassName }}：{{ currentBuild.goal || '未填写目标' }}</p><div class="chips"><span>{{ currentBuild.classId }}</span><span>{{ acquisition.length }} 件核心装备</span><span>{{ unlocks.length }} 项解锁</span></div></article>
      <article class="analysis-card"><h2>最终属性</h2><StatGrid :result="stats" /></article>
      <article class="analysis-card"><h2>已登记机制倍率</h2><a-radio-group v-model:value="combatMode" class="mode-tabs" button-style="solid" size="small"><a-radio-button value="pve">PvE</a-radio-button><a-radio-button value="pvp">PvP</a-radio-button></a-radio-group><dl class="metric-list"><div><dt>受到伤害</dt><dd>{{ combatProfile.incomingDamageMultiplier }}</dd></div><div><dt>武器伤害</dt><dd>{{ combatProfile.weaponDamageMultiplier }}</dd></div><div><dt>目标承伤</dt><dd>{{ combatProfile.targetDamageMultiplier }}</dd></div><div><dt>组合倍率</dt><dd>{{ combatProfile.combinedRegisteredMultiplier }}</dd></div></dl><p class="muted">{{ combatProfile.note }}</p></article>
      <article class="analysis-card acquisition-card"><h2>实现路径</h2><p class="muted">未拥有核心装备的获取可信度：{{ confidenceSummary }}</p><ol><li v-for="item in acquisition" :key="`${item.itemId}-${item.order}`" :class="{ owned: item.owned }"><strong>{{ displayGear(item.itemId) }}</strong><span>{{ item.owned ? '已拥有' : item.pathName }}</span><small>{{ item.owned ? '跳过获取' : `${item.deterministic ? '确定路径' : '需要刷取'}：可信度 ${item.confidence}` }}</small></li></ol></article>
    </section>
  </div>
</template>

<style scoped>
.workbench-head{display:flex;justify-content:space-between;align-items:end;gap:2rem;padding:2.5rem 0 2rem;border-bottom:1px solid var(--line-soft)}.workbench-head>div{max-width:50rem}.workbench-head h1{font-family:var(--font-cn);margin:.3rem 0 .7rem}.workbench-head p:not(.eyebrow){max-width:48rem}.eyebrow{color:var(--gold-dim);font:600 .68rem var(--font-en);letter-spacing:.2em}.back-link{color:var(--gold-bright);white-space:nowrap;border-bottom:1px solid var(--line);padding-bottom:.35rem}
.workbench-preview{margin:1.5rem 0 2rem;border:1px solid var(--line);background:linear-gradient(135deg,rgba(232,193,90,.08),rgba(10,15,30,.82) 42%);padding:1.1rem}.preview-heading{display:flex;justify-content:space-between;align-items:end;gap:1rem}.preview-heading h2{font-family:var(--font-cn);font-size:1.2rem;margin:.3rem 0}.preview-heading p{font-size:.7rem}.preview-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin-top:1rem;border:1px solid var(--line-soft);background:rgba(6,10,20,.5)}.preview-slot{min-width:0;padding:.7rem;border-right:1px solid var(--line-soft)}.preview-slot:last-child{border-right:0}.preview-slot>span{display:block;color:var(--text-dim);font-size:.6rem;margin-bottom:.45rem}.preview-art{width:100%;aspect-ratio:1.5;max-height:4.6rem;background:#0c1322;border:1px solid var(--line-soft);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:.45rem}.preview-art img{width:100%;height:100%;object-fit:cover}.preview-art b{font:700 1.2rem var(--font-en);color:var(--gold-bright)}.preview-slot>strong{display:block;font-size:.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.preview-slot>small{display:block;margin-top:.2rem;color:var(--gold-dim);font-size:.58rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.subclass-lines{display:grid;gap:.45rem;min-height:4.6rem}.subclass-lines strong{font-size:.74rem}.subclass-lines small{color:var(--text-sub);font-size:.6rem;line-height:1.35;overflow:hidden}.subclass-lines small:last-child{color:var(--gold-dim)}
.editor-layout{display:grid;grid-template-columns:minmax(0,1fr) 18rem;gap:1rem;margin:2rem 0}.editor-pane,.saved-pane,.validation-panel,.analysis-card{border:1px solid var(--line-soft);background:rgba(10,15,30,.72)}.editor-pane{padding:1rem}.toolbar{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:.8rem}.toolbar label{display:flex;align-items:center;gap:.6rem;color:var(--text-dim);font-size:.7rem}.example-select{min-width:14rem}.toolbar-actions,.editor-footer>div{display:flex;gap:.4rem}.json-editor{display:block;width:100%;font: .74rem/1.55 var(--font-en)}.json-editor textarea{tab-size:2}.editor-footer{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:.8rem;color:var(--text-dim);font-size:.65rem}.saved-message{margin:.6rem 0 0;color:var(--gold-bright);font-size:.7rem}
.saved-pane{padding:1rem}.saved-pane h2{font-family:var(--font-cn);font-size:1rem;margin:0 0 .8rem}.saved-pane ul{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}.saved-pane li{display:grid;grid-template-columns:1fr auto;border-bottom:1px solid var(--line-soft);padding-bottom:.5rem}.saved-load{display:flex;flex-direction:column;align-items:flex-start;gap:.2rem;border:0;background:transparent;color:var(--text-main);cursor:pointer;text-align:left;padding:0}.saved-load strong{font-size:.75rem}.saved-load small{color:var(--text-dim);font-size:.62rem}.delete{border:0;background:transparent;color:var(--text-dim);cursor:pointer;font-size:1rem}.delete:hover{color:var(--danger)}
.validation-panel{padding:1.2rem;margin:1rem 0 2rem}.validation-panel.valid{border-color:rgba(125,219,138,.36)}.validation-panel.invalid{border-color:rgba(255,180,84,.4)}.validation-title{display:flex;justify-content:space-between;align-items:start;gap:1rem}.validation-title h2{font-family:var(--font-cn);margin:.35rem 0 0;font-size:1.2rem}.parse-error,.issue-list{margin-top:1rem}.parse-error{color:var(--danger)}.issue-list h3{font-size:.8rem;color:var(--warn);margin:0 0 .5rem}.issue-list button,.issue-list p{width:100%;display:flex;gap:.8rem;align-items:baseline;padding:.55rem 0;border:0;border-bottom:1px solid var(--line-soft);background:transparent;color:var(--text-sub);text-align:left;font-size:.72rem}.issue-list button{cursor:pointer}.issue-list button:hover span{color:var(--gold-bright)}.issue-list code{flex:0 0 13rem;color:var(--gold-dim);font: .66rem var(--font-en);overflow-wrap:anywhere}.issue-list.warnings h3{color:var(--blue)}.issue-list.warnings p{color:var(--text-sub)}.issue-list.warnings code{color:var(--blue)}.ok-text{color:var(--ok);font-size:.75rem;margin-top:1rem}.muted{color:var(--text-dim);font-size:.7rem}
.analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:3rem}.analysis-card{padding:1.2rem}.analysis-card h2{font-family:var(--font-cn);font-size:1rem;margin:0 0 1rem}.identity{grid-column:1/-1}.identity h2{font-size:1.5rem;margin:.35rem 0}.identity p{color:var(--text-sub);font-size:.78rem}.chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:1rem}.chips span{padding:.3rem .5rem;border:1px solid var(--line-soft);color:var(--text-dim);font-size:.65rem}.mode-tabs{display:inline-flex;margin-bottom:.8rem}.mode-tabs .ant-radio-button-wrapper{color:var(--text-sub);background:transparent;border-color:var(--line-soft)}.mode-tabs .ant-radio-button-wrapper-checked{color:var(--bg-deep);background:var(--gold);border-color:var(--gold)}.metric-list{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line-soft);margin:0}.metric-list div{padding:.65rem;background:var(--bg-deep)}.metric-list dt{color:var(--text-dim);font-size:.62rem}.metric-list dd{margin:.3rem 0 0;color:var(--gold-bright);font:700 1.15rem var(--font-en)}.analysis-card>.muted{margin-top:.8rem}.acquisition-card{grid-column:1/-1}.acquisition-card ol{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line-soft);list-style:none;padding:0;margin:0}.acquisition-card li{display:flex;flex-direction:column;gap:.25rem;padding:.8rem;background:var(--bg-deep)}.acquisition-card li.owned{opacity:.5}.acquisition-card li strong{font-size:.75rem}.acquisition-card li span{color:var(--gold-bright);font-size:.68rem}.acquisition-card li small{color:var(--text-dim);font-size:.62rem}
@media(max-width:850px){.workbench-head{flex-direction:column;align-items:flex-start}.preview-heading{align-items:flex-start;flex-direction:column}.preview-slots{grid-template-columns:repeat(2,minmax(0,1fr))}.preview-slot:nth-child(2){border-right:0}.preview-slot:nth-child(n+3){border-top:1px solid var(--line-soft)}.preview-slot:last-child{grid-column:1/-1}.editor-layout,.analysis-grid{grid-template-columns:1fr}.identity,.acquisition-card{grid-column:auto}.toolbar{align-items:stretch;flex-direction:column}.toolbar label{align-items:flex-start;flex-direction:column}.example-select{width:100%}.toolbar-actions{flex-wrap:wrap}.editor-footer{align-items:flex-start;flex-direction:column}.issue-list code{flex-basis:8rem}.metric-list{grid-template-columns:1fr 1fr}.acquisition-card ol{grid-template-columns:1fr 1fr}}
</style>
