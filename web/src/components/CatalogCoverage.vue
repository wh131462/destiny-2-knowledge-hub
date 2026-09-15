<script setup>
import { ui, uiMessage } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import { dataUrl } from '@/utils/dataUrl'
import StableDisclosure from '@/components/StableDisclosure.vue'
const report = ref(null), error = ref(''), query = ref('')
const rows = computed(() => (report.value?.rows || []).filter(row => `${row.label} ${row.scope}`.toLowerCase().includes(query.value.trim().toLowerCase())))
onMounted(async () => {
  try {
    const response = await fetch(dataUrl('manifest-coverage.json'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    report.value = await response.json()
    if (!Array.isArray(report.value.rows)) throw new Error('对账报告格式不正确')
  } catch (e) { error.value = `完整性报告加载失败：${e.message}`; report.value = null }
})
</script>
<template>
  <section class="catalog-coverage">
    <h2>{{ ui("官方目录逐类型对账") }}</h2>
    <p v-if="error" role="alert">{{ uiMessage(error) }}</p>
    <template v-else-if="report">
      <p>{{ report.scope }} {{ ui("下表的“完整”只针对各行明确的收录范围。") }}</p>
      <p>{{ ui("结果：") }}{{ report.status === 'passed' ? ui("对账通过") : ui("存在缺失，请勿据此声明完整") }} {{ ui("原始快照") }} {{ report.syncedAt?.slice(0, 10) }} {{ ui("审计") }} {{ report.auditedAt?.slice(0, 10) }}</p>
      <div class="coverage-controls">
        <input v-model="query" type="search" :aria-label="ui(&quot;筛选数据类型&quot;)" :placeholder="ui(&quot;搜索类型或收录范围&quot;)" />
        <StableDisclosure :title="ui('原始字段缺口')" :width="760" trigger-class="coverage-gap-trigger">
          <div class="coverage-gap-list"><article v-for="row in rows" :key="row.id"><strong>{{ row.label }}</strong><span>{{ ui("缺图") }} {{ row.missingIcons }}</span><span>{{ ui("缺中文名") }} {{ row.missingChineseNames }}</span></article></div>
        </StableDisclosure>
        <span role="status" aria-live="polite">{{ rows.length }} / {{ report.rows.length }} {{ ui("类") }}</span>
      </div>
      <div class="table-scroll" tabindex="0" role="region" :aria-label="ui(&quot;目录覆盖对比&quot;)"><table><caption class="sr-only">{{ ui("官方目录的收录数量及范围") }}</caption><thead><tr><th>{{ ui("类型") }}</th><th>{{ ui("已收录 / 应收录") }}</th><th>{{ ui("范围与限制") }}</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><th>{{ row.label }}</th><td :class="{ error: row.status !== 'complete-in-scope' }">{{ row.actual.toLocaleString() }} / {{ row.expected.toLocaleString() }}</td><td>{{ row.scope }}</td></tr></tbody></table><p v-if="!rows.length" class="coverage-empty">{{ ui("没有匹配的数据类型。") }}</p></div>
      <ul><li v-for="note in report.limitations" :key="note">{{ note }}</li></ul>
      <p v-for="problem in report.errors" :key="problem" class="error">{{ uiMessage(problem) }}</p>
      <RouterLink to="/manifest">{{ ui("打开完整配图目录 →") }}</RouterLink>
    </template>
    <p v-else>{{ ui("正在读取完整性报告…") }}</p>
  </section>
</template>
<style scoped>
.catalog-coverage{margin:2rem 0}.catalog-coverage p,.catalog-coverage li{font-size:.78rem;color:var(--text-sub);line-height:1.7}.table-scroll{overflow-x:auto;border:1px solid var(--line-soft)}table{width:100%;min-width:720px;border-collapse:collapse;font-size:.73rem}th,td{padding:.75rem;border-bottom:1px solid var(--line-soft);text-align:left}thead{color:var(--gold)}tbody th{min-width:8rem}td:nth-child(2){white-space:nowrap;color:var(--gold);font-variant-numeric:tabular-nums}td:last-child{min-width:8rem;color:var(--text-dim)}.error{color:var(--warn)!important}a{font-size:.8rem;color:var(--gold)}
</style>

<style scoped>
.coverage-controls{display:flex;align-items:center;gap:.7rem;margin:1rem 0;font-size:.76rem}.coverage-controls input{flex:1;min-width:0;padding:.7rem;background:var(--bg-card);color:var(--text-main);border:1px solid var(--line-soft)}.coverage-controls :deep(.coverage-gap-trigger){width:auto;white-space:nowrap;color:var(--gold)}.coverage-controls>span{color:var(--text-dim)}.coverage-gap-list{display:grid;gap:1px;background:var(--line-soft)}.coverage-gap-list article{display:grid;grid-template-columns:minmax(8rem,1fr) auto auto;gap:1rem;padding:.75rem;background:var(--bg-dark)}.coverage-gap-list span{color:var(--text-dim)}.table-scroll{max-height:65vh;overflow:auto}table{min-width:520px;border-collapse:separate;border-spacing:0}thead th{position:sticky;top:0;background:#182232;z-index:2}tbody th{position:sticky;left:0;background:var(--bg-dark);font-weight:500}tbody tr:nth-child(even) td{background:#ffffff03}tbody tr:hover td{background:#e8c15a08}td:last-child{color:var(--text-sub)}.coverage-empty{padding:1rem}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}input:focus-visible,button:focus-visible,.table-scroll:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:600px){.coverage-controls{flex-wrap:wrap}.coverage-controls input{flex-basis:100%}.coverage-controls :deep(.coverage-gap-trigger){flex:1}.coverage-gap-list article{grid-template-columns:1fr}.coverage-gap-list article span{font-size:.7rem}table{min-width:0;font-size:.72rem}th,td{padding:.65rem .45rem}tbody th{min-width:0;width:24%}td:last-child{min-width:0}}
</style>
