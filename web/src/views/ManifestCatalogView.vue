<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from '@/i18n'

const { t, locale } = useI18n()

const displayName = item => locale.value === 'zh' ? (item?.nameZh || item?.name || '') : (item?.name || item?.nameZh || '')
const displayDescription = item => locale.value === 'zh' ? (item?.descriptionZh || item?.description || '') : (item?.description || item?.descriptionZh || '')
const secondaryName = item => locale.value === 'zh' ? item?.name : item?.nameZh
const secondaryDescription = item => locale.value === 'zh' ? item?.description : item?.descriptionZh
const displayPerks = item => {
  if (dataset.value === 'mods') return (item?.perkDetails || []).map(perk => ({ name: locale.value === 'zh' ? (perk.nameZh || perk.name) : perk.name, secondary: locale.value === 'zh' ? perk.name : perk.nameZh, detail: locale.value === 'zh' ? (perk.descriptionZh || perk.description) : (perk.description || perk.descriptionZh) })).filter(perk => perk.name)
  const primary = locale.value === 'zh' ? (item?.perkOptionsZh?.length ? item.perkOptionsZh : item?.perkOptions) : item?.perkOptions
  const secondary = locale.value === 'zh' ? item?.perkOptions : item?.perkOptionsZh
  return (primary || []).slice(0, 18).map((name, index) => ({ name, secondary: secondary?.[index] })).filter(perk => perk.name)
}
const sourceName = source => locale.value === 'zh' ? (source.vendorNameZh || source.activityNameZh || source.vendorName || source.activityName) : (source.vendorName || source.activityName || source.vendorNameZh || source.activityNameZh)
const sourceSecondaryName = source => locale.value === 'zh' ? source.vendorName || source.activityName : source.vendorNameZh || source.activityNameZh
const localizedField = value => {
  if (!value) return ''
  if (locale.value === 'en') return value
  const labels = {
    'Auto Rifle': '自动步枪', 'Hand Cannon': '手炮', 'Pulse Rifle': '脉冲步枪', 'Scout Rifle': '斥候步枪',
    'Fusion Rifle': '融合步枪', 'Sniper Rifle': '狙击枪', Shotgun: '霰弹枪', 'Machine Gun': '机枪',
    'Rocket Launcher': '火箭筒', Sidearm: '手枪', Sword: '剑', 'Grenade Launchers': '榴弹发射器',
    'Linear Fusion Rifles': '线性融合步枪', 'Trace Rifles': '追踪步枪', Bows: '弓', Glaives: '长戟', 'Submachine Guns': '冲锋枪',
    helmet: '头盔', arms: '臂铠', chest: '胸甲', legs: '腿甲', classItem: '职业装备',
    kinetic: '动能', energy: '能量', power: '重型', titan: '泰坦', hunter: '猎人', warlock: '术士', neutral: '中性'
  }
  if (labels[value]) return labels[value]
  return value
    .replace(/\bSolar\b/gi, '炽阳').replace(/\bArc\b/gi, '电弧').replace(/\bVoid\b/gi, '虚空')
    .replace(/\bStasis\b/gi, '冰凝').replace(/\bStrand\b/gi, '缚丝').replace(/\bPrismatic\b/gi, '棱镜')
    .replace(/\bSuper Ability\b/gi, '超能力').replace(/\bClass Ability\b/gi, '职业技能')
    .replace(/\bGrenade\b/gi, '手雷').replace(/\bMelee\b/gi, '近战').replace(/\bAspect\b/gi, '星相')
}
const descriptionOrFallback = item => displayDescription(item) || (locale.value === 'zh' ? '官方 Manifest 未提供详细描述；可用词条与来源见下方。' : 'No detailed description is provided by the official Manifest; see perks and sources below.')

const items = ref([])
const mods = ref([])
const activities = ref([])
const abilities = ref([])
const loading = ref(true)
const error = ref('')
const keyword = ref('')
const kind = ref('all')
const dataset = ref('equipment')
const modSlot = ref('all')
const page = ref(1)
const pageSize = 60

onMounted(async () => {
  try {
    const [response, modResponse, activityResponse, abilityResponse] = await Promise.all([fetch('/data/manifest-equipment-catalog.json'), fetch('/data/manifest-mods.json'), fetch('/data/manifest-activities.json'), fetch('/data/manifest-abilities.json')])
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json()
    items.value = payload.items || []
    if (modResponse.ok) mods.value = (await modResponse.json()).items || []
    if (activityResponse.ok) activities.value = (await activityResponse.json()).activities || []
    if (abilityResponse.ok) abilities.value = (await abilityResponse.json()).items || []
  } catch (reason) {
    error.value = `官方装备索引加载失败：${reason.message}`
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (dataset.value === 'mods') return mods.value.filter(item => {
    const matchesSlot = modSlot.value === 'all' || item.slot === modSlot.value
    const matchesQuery = !query || `${item.name} ${item.nameZh || ''} ${item.category} ${item.description || ''} ${item.descriptionZh || ''} ${item.perkDetails.map(perk => perk.name).join(' ')}`.toLowerCase().includes(query)
    return matchesSlot && matchesQuery
  })
  if (dataset.value === 'activities') return activities.value.filter(item => {
    const matchesQuery = !query || `${item.name} ${item.nameZh || ''} ${item.description || ''} ${item.descriptionZh || ''} ${item.activityTypeHash} ${item.isPvP ? 'pvp' : 'pve'}`.toLowerCase().includes(query)
    return matchesQuery
  })
  if (dataset.value === 'abilities') return abilities.value.filter(item => {
    const matchesQuery = !query || `${item.name} ${item.nameZh || ''} ${item.description || ''} ${item.descriptionZh || ''} ${item.typeName} ${item.element} ${item.classId || ''}`.toLowerCase().includes(query)
    return matchesQuery
  })
  return items.value.filter(item => {
    const matchesKind = kind.value === 'all' || (kind.value === 'weapon' ? item.itemType === 3 : item.itemType === 2)
    const matchesQuery = !query || `${item.name} ${item.nameZh || ''} ${item.weaponFamily} ${item.armorSlot} ${item.description || ''} ${item.descriptionZh || ''} ${(item.vendorSources || []).map(source => source.vendorName).join(' ')}`.toLowerCase().includes(query)
    return matchesKind && matchesQuery
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const setKind = (value) => { kind.value = value; page.value = 1 }
const setDataset = (value) => { dataset.value = value; page.value = 1; keyword.value = ''; modSlot.value = 'all'; kind.value = 'all' }
const search = () => { page.value = 1 }
</script>

<template>
  <div>
    <header class="catalog-head"><p class="eyebrow">BUNGIE MANIFEST / NORMALIZED INDEX</p><h1>{{ t('pages.manifest.title') }}</h1><p>{{ t('pages.manifest.subtitle') }}</p></header>
    <section class="catalog-tools" aria-label="官方实体筛选"><div class="dataset-tabs"><button :class="{ active: dataset === 'equipment' }" @click="setDataset('equipment')">武器与护甲</button><button :class="{ active: dataset === 'mods' }" @click="setDataset('mods')">装备模组</button><button :class="{ active: dataset === 'abilities' }" @click="setDataset('abilities')">官方技能</button><button :class="{ active: dataset === 'activities' }" @click="setDataset('activities')">官方活动</button></div><a-input v-model:value="keyword" class="search-box" size="large" allow-clear :placeholder="dataset === 'activities' ? '搜索活动名称、描述或 Hash…' : dataset === 'abilities' ? '搜索技能名称、元素或职业…' : '搜索英文名称、原型或描述…'" @input="search" /><div v-if="dataset === 'equipment'" class="kind-tabs"><button :class="{ active: kind === 'all' }" @click="setKind('all')">全部</button><button :class="{ active: kind === 'weapon' }" @click="setKind('weapon')">武器</button><button :class="{ active: kind === 'armor' }" @click="setKind('armor')">护甲</button></div><div v-else-if="dataset === 'mods'" class="kind-tabs"><button :class="{ active: modSlot === 'all' }" @click="modSlot = 'all'; page = 1">全部</button><button :class="{ active: modSlot === 'helmet' }" @click="modSlot = 'helmet'; page = 1">头盔</button><button :class="{ active: modSlot === 'arms' }" @click="modSlot = 'arms'; page = 1">臂铠</button><button :class="{ active: modSlot === 'chest' }" @click="modSlot = 'chest'; page = 1">胸甲</button><button :class="{ active: modSlot === 'legs' }" @click="modSlot = 'legs'; page = 1">腿甲</button><button :class="{ active: modSlot === 'classItem' }" @click="modSlot = 'classItem'; page = 1">职业装备</button></div></section>
    <p v-if="loading" class="empty">正在加载官方装备索引…</p>
    <p v-else-if="error" class="empty error">{{ error }}</p>
    <template v-else>
      <div class="result-line"><span>{{ filtered.length.toLocaleString() }} 条实体</span><small>第 {{ page }} / {{ pageCount }} 页</small></div>
      <div class="catalog-grid"><article v-for="item in visible" :key="item.hash" class="catalog-item"><img v-if="item.icon" :src="`https://www.bungie.net${item.icon}`" alt="" loading="lazy" /><div><h2>{{ displayName(item) }}</h2><small v-if="secondaryName(item) && secondaryName(item) !== displayName(item)" class="manifest-alias">{{ secondaryName(item) }}</small><p v-if="dataset === 'equipment'">{{ localizedField(item.weaponFamily) || (item.armorSlot ? `${locale === 'zh' ? '护甲' : 'Armor'}：${localizedField(item.armorSlot)}` : (locale === 'zh' ? '装备定义' : 'Equipment definition')) }}：{{ localizedField(item.ammoSlot || item.classId) || (locale === 'zh' ? '通用' : 'General') }}</p><p v-else-if="dataset === 'mods'">{{ localizedField(item.slot) }}：{{ item.energyCost == null ? (locale === 'zh' ? '固定插槽' : 'Fixed socket') : `${item.energyCost} ${locale === 'zh' ? '能量' : 'energy'}` }}</p><p v-else-if="dataset === 'abilities'">{{ localizedField(item.typeName) }} / {{ localizedField(item.element) }} / {{ localizedField(item.classId) || (locale === 'zh' ? '通用' : 'General') }}</p><p v-else>{{ item.isPvP ? 'PvP 活动' : 'PvE / 混合活动' }}：{{ item.matchmaking?.maxParty ? `${item.matchmaking.minParty}-${item.matchmaking.maxParty} ${locale === 'zh' ? '人' : 'players'}` : (locale === 'zh' ? '人数未登记' : 'Party size unknown') }}</p><p class="catalog-description">{{ descriptionOrFallback(item) }}</p><small v-if="secondaryDescription(item) && secondaryDescription(item) !== displayDescription(item)" class="catalog-secondary-description">{{ secondaryDescription(item) }}</small><div v-if="displayPerks(item).length" class="catalog-perks"><span class="perk-label">Perks / 词条</span><span v-for="perk in displayPerks(item)" :key="`${item.hash}-${perk.name}`" class="perk-chip">{{ perk.name }}<small v-if="perk.secondary && perk.secondary !== perk.name">{{ perk.secondary }}</small><small v-if="perk.detail" class="perk-detail">{{ perk.detail }}</small></span></div><small>Manifest Hash {{ item.hash }}</small><small v-if="dataset === 'equipment' && item.vendorSources?.length">供应商 / Vendors：{{ item.vendorSources.slice(0, 2).map(sourceName).join('、') }}<template v-for="source in item.vendorSources.slice(0, 2)" :key="`vendor-${source.vendorHash}`"><em v-if="sourceSecondaryName(source) && sourceSecondaryName(source) !== sourceName(source)">，{{ sourceSecondaryName(source) }}</em></template></small><small v-if="dataset === 'equipment' && item.activitySources?.length">活动奖励 / Activity rewards：{{ item.activitySources.slice(0, 2).map(sourceName).join('、') }}<template v-for="source in item.activitySources.slice(0, 2)" :key="`activity-${source.activityHash}`"><em v-if="sourceSecondaryName(source) && sourceSecondaryName(source) !== sourceName(source)">，{{ sourceSecondaryName(source) }}</em></template></small></div></article></div>
      <div v-if="!visible.length" class="empty">没有匹配的官方实体。</div>
      <nav v-else class="pagination" aria-label="分页"><button :disabled="page === 1" @click="page--">上一页</button><button :disabled="page === pageCount" @click="page++">下一页</button></nav>
    </template>
  </div>
</template>

<style scoped>
.catalog-head{padding:2.5rem 0 2rem;border-bottom:1px solid var(--line-soft)}.eyebrow{color:var(--gold-dim);font:600 .7rem var(--font-en);letter-spacing:.2em}.catalog-head h1{margin:.35rem 0 .6rem}.catalog-head p:last-child{max-width:48rem;color:var(--text-sub)}.catalog-tools{display:flex;gap:1rem;align-items:center;margin:1.5rem 0;flex-wrap:wrap}.catalog-tools .search-box{flex:1;min-width:14rem}.dataset-tabs,.kind-tabs{display:flex;gap:.4rem;flex-wrap:wrap}.dataset-tabs button,.kind-tabs button,.pagination button{padding:.65rem .9rem;border:1px solid var(--line-soft);background:transparent;color:var(--text-sub);cursor:pointer}.dataset-tabs button.active,.kind-tabs button.active{background:var(--gold);border-color:var(--gold);color:var(--bg-deep)}.result-line{display:flex;justify-content:space-between;align-items:center;margin:1rem 0;color:var(--gold-bright);font:600 .75rem var(--font-en)}.result-line small{color:var(--text-dim);font-weight:400}.catalog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line-soft)}.catalog-item{min-height:86px;display:flex;gap:.75rem;padding:.8rem;background:var(--bg-dark)}.catalog-item img{width:56px;height:56px;object-fit:cover;background:var(--bg-card)}.catalog-item h2{font-size:.85rem;margin:0 0 .25rem;overflow-wrap:anywhere}.catalog-item p{font-size:.72rem;color:var(--text-sub);margin:0}.catalog-item small{display:block;font: .62rem var(--font-en);color:var(--text-dim)}.catalog-item em{font-style:normal;color:var(--text-dim)}.catalog-item .manifest-alias{color:var(--gold-dim);font-size:.6rem;margin:-.1rem 0 .25rem}.catalog-description{margin-top:.55rem!important;color:var(--text-sub)!important;line-height:1.45}.catalog-secondary-description{margin-top:.2rem;color:var(--text-dim)!important;line-height:1.35}.catalog-perks{display:flex;flex-wrap:wrap;gap:.3rem;margin:.6rem 0}.perk-label{width:100%;color:var(--gold-dim);font:600 .6rem var(--font-en);letter-spacing:.1em}.perk-chip{padding:.24rem .38rem;border:1px solid var(--line-soft);color:var(--text-main);font-size:.64rem;line-height:1.25}.perk-chip small{margin-top:.12rem;color:var(--text-dim);font-size:.56rem}.perk-chip .perk-detail{color:var(--text-sub);font-family:var(--font-cn);line-height:1.35}.pagination{display:flex;justify-content:center;gap:.75rem;margin:1.5rem 0}.pagination button:disabled{opacity:.4;cursor:not-allowed}.error{color:var(--warn)}@media(max-width:800px){.catalog-tools{align-items:stretch;flex-direction:column}.catalog-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.catalog-grid{grid-template-columns:1fr}}
</style>
