<script setup>
import { ref, computed, onMounted } from 'vue'
import { DATA_VERSION, MANIFEST_VERSION, RULES_VERSION, dataPolicy, sources, classesV2, subclasses, abilities, aspects, facets, fragments, mechanics, gearItems, armorSets, exoticClassItemTraits, armorMods, activitiesV2, curatedBuilds } from '@/data/v2'
import ConfidenceBadge from '@/components/ConfidenceBadge.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const manifestStatus = ref(null)
const normalized = ref({ equipment: null, abilities: null, mods: null, modLinks: null, activities: null, vendors: null, activityRewards: null, itemSets: null, drops: null, links: null })
onMounted(async () => {
  try {
    const [statusResponse, equipmentResponse, modsResponse, abilityResponse, modLinksResponse, activitiesResponse, vendorsResponse, activityRewardsResponse, itemSetsResponse, dropsResponse, linksResponse] = await Promise.all([
      fetch('/data/manifest-status.json'), fetch('/data/manifest-equipment-catalog.json'), fetch('/data/manifest-mods.json'),
      fetch('/data/manifest-abilities.json'), fetch('/data/curated-mod-links.json'), fetch('/data/manifest-activities.json'), fetch('/data/manifest-vendor-inventory.json'), fetch('/data/manifest-activity-rewards.json'), fetch('/data/manifest-item-sets.json'), fetch('/data/manifest-drop-coverage.json'), fetch('/data/curated-manifest-links.json')
    ])
    if (statusResponse.ok) manifestStatus.value = await statusResponse.json()
    normalized.value = {
      equipment: equipmentResponse.ok ? await equipmentResponse.json() : null,
      abilities: abilityResponse.ok ? await abilityResponse.json() : null,
      mods: modsResponse.ok ? await modsResponse.json() : null,
      modLinks: modLinksResponse.ok ? await modLinksResponse.json() : null,
      activities: activitiesResponse.ok ? await activitiesResponse.json() : null,
      vendors: vendorsResponse.ok ? await vendorsResponse.json() : null,
      activityRewards: activityRewardsResponse.ok ? await activityRewardsResponse.json() : null,
      itemSets: itemSetsResponse.ok ? await itemSetsResponse.json() : null,
      drops: dropsResponse.ok ? await dropsResponse.json() : null,
      links: linksResponse.ok ? await linksResponse.json() : null
    }
  } catch {
    manifestStatus.value = null
  }
})

const unmatched = computed(() => Object.entries(normalized.value.links?.links || {}).filter(([, item]) => !item.matched).map(([id]) => id))
const modLinkGaps = computed(() => normalized.value.modLinks ? normalized.value.modLinks.count - normalized.value.modLinks.matched : 0)

const metrics = [
  ['职业', classesV2.length], ['普通子职业', subclasses.filter(i=>i.type==='mono').length], ['棱镜职业', subclasses.filter(i=>i.type==='prismatic').length],
  ['技能', abilities.length], ['星相', aspects.length], ['棱镜特性', facets.length], ['元素碎片', fragments.length], ['机制', mechanics.length],
  ['装备实体', gearItems.length], ['护甲套装', armorSets.length], ['异域职业物品特性', exoticClassItemTraits.length], ['模组', armorMods.length], ['活动场景', activitiesV2.length], ['已验证构筑', curatedBuilds.length]
]

const gaps = [
  '当前是可核验的《终焉之形》棱镜基线，不宣称已镜像全量游戏清单。',
  'Bungie Manifest 已接入组件级快照，网站会展示最近同步版本与条目数。',
  '普通五系的可用手雷、星相与碎片入口已覆盖；逐版本变体和解锁状态仍需继续同步。',
  '全量武器、全部异域和逐补丁沙盒数值需要持续同步。',
  '异域职业物品特性池已建模，但没有发布未经实测的双特性推荐。',
  '没有可靠版本化测试时，不展示虚假的精确 DPS。'
]
</script>

<template>
  <div>
    <header class="status-head"><p>DATA TRANSPARENCY</p><h1>{{ t('pages.dataStatus.title') }}</h1><span>{{ t('pages.dataStatus.subtitle') }}</span></header>
    <section class="versions"><div><span>数据快照</span><strong>{{ DATA_VERSION }}</strong></div><div><span>Manifest 版本</span><strong>{{ MANIFEST_VERSION }}</strong></div><div><span>规则引擎 / 构筑</span><strong>{{ RULES_VERSION }}：{{ curatedBuilds.length }}</strong></div></section>
    <section><div class="section-title"><h2>当前覆盖</h2><span class="en">COVERAGE</span></div><div class="metrics"><div v-for="item in metrics" :key="item[0]"><strong>{{ item[1] }}</strong><span>{{ item[0] }}</span></div></div></section>
    <section><div class="section-title"><h2>已知缺口</h2><span class="en">KNOWN GAPS</span></div><ol class="gaps"><li v-for="item in gaps" :key="item">{{ item }}</li></ol></section>
    <section><div class="section-title"><h2>来源登记</h2><span class="en">SOURCES</span></div><div class="sources"><article v-for="source in sources" :key="source.id"><ConfidenceBadge :level="source.level" /><div><h3>{{ source.title }}</h3><p>{{ source.note }}</p><small>{{ source.publisher }}：核验 {{ source.checkedAt }}</small></div><a v-if="source.url" :href="source.url" target="_blank" rel="noreferrer">打开 ↗</a></article></div></section>
    <section v-if="manifestStatus" class="manifest-block"><div class="section-title"><h2>Manifest 快照</h2><span class="en">OFFICIAL SYNC</span></div><div class="manifest-meta"><div><span>版本</span><strong>{{ manifestStatus.manifestVersion }}</strong></div><div><span>同步时间</span><strong>{{ manifestStatus.syncedAt }}</strong></div><div><span>语言</span><strong>{{ manifestStatus.locale }}</strong></div></div><div class="manifest-components"><span v-for="item in manifestStatus.components" :key="item.component">{{ item.component }}：{{ item.count }}</span></div></section>
    <section v-if="normalized.equipment || normalized.mods" class="manifest-block"><div class="section-title"><h2>标准化与映射覆盖</h2><span class="en">NORMALIZATION</span></div><div class="normalization-grid"><div><strong>{{ normalized.equipment?.count?.toLocaleString?.() || '—' }}</strong><span>可分类武器 / 护甲</span></div><div><strong>{{ normalized.abilities?.count?.toLocaleString?.() || '—' }}</strong><span>官方技能定义</span></div><div><strong>{{ normalized.activities?.count?.toLocaleString?.() || '—' }}</strong><span>官方活动定义</span></div><div><strong>{{ normalized.mods?.count?.toLocaleString?.() || '—' }}</strong><span>可用装备模组</span></div><div><strong>{{ normalized.modLinks ? `${normalized.modLinks.matched}/${normalized.modLinks.count}` : '—' }}</strong><span>站内模组官方匹配</span></div><div><strong>{{ normalized.modLinks?.consistent ?? '—' }}</strong><span>槽位 / 能量一致</span></div><div><strong>{{ normalized.vendors?.count?.toLocaleString?.() || '—' }}</strong><span>供应商库存条目</span></div><div><strong>{{ normalized.activityRewards?.count?.toLocaleString?.() || '—' }}</strong><span>活动奖励关系</span></div><div><strong>{{ normalized.itemSets?.count?.toLocaleString?.() || '—' }}</strong><span>官方装备套装</span></div><div><strong>{{ normalized.links ? `${normalized.links.matched}/${normalized.links.count}` : '—' }}</strong><span>站内实体 Manifest 映射</span></div><div><strong>{{ normalized.drops?.withVendorSource?.toLocaleString?.() || '0' }}</strong><span>具有供应商来源的装备</span></div><div><strong>{{ normalized.drops?.withActivityReward?.toLocaleString?.() || '0' }}</strong><span>具有活动奖励来源的装备</span></div><div><strong>{{ normalized.drops ? `${normalized.drops.withRewardMapping}/${normalized.drops.count}` : '—' }}</strong><span>RewardMapping 关联</span></div></div><p class="coverage-note">装备分类、官方技能与活动定义、武器 Socket 词条池、模组能量、Sandbox Perk、供应商库存、活动奖励和官方装备套装已从官方定义生成。RewardMappingDefinition 仍没有可用关联，因此无法从它推导更细的遭遇战掉落条件。</p><p v-if="modLinkGaps" class="coverage-note warning">{{ modLinkGaps }} 个站内模组在当前 Manifest 中没有可确认的同名实体，保留编辑基线并标记为待复核。</p><p v-if="unmatched.length" class="coverage-note warning">未匹配实体：{{ unmatched.join('、') }}</p></section>
    <div class="policy">{{ dataPolicy.disclaimer }}</div>
  </div>
</template>

<style scoped>
.status-head{padding:3rem 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line-soft)}.status-head p{color:var(--gold-dim);font:.7rem var(--font-en);letter-spacing:.22em}.status-head h1{font-family:var(--font-cn);font-size:clamp(2.3rem,6vw,4.5rem);letter-spacing:-.05em}.status-head span{color:var(--text-sub)}.versions{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line-soft)}.versions div{padding:1.2rem;border-right:1px solid var(--line-soft)}.versions span{display:block;color:var(--text-dim);font-size:.7rem}.versions strong{font:600 .9rem var(--font-en)}.metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line-soft)}.metrics div{padding:1.2rem;background:var(--bg-dark)}.metrics strong{display:block;font:700 1.8rem var(--font-en);color:var(--gold-bright)}.metrics span{font-size:.72rem;color:var(--text-dim)}.gaps{list-style:none;counter-reset:gap;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line-soft)}.gaps li{counter-increment:gap;padding:1.2rem;background:var(--bg-deep);color:var(--text-sub);font-size:.84rem}.gaps li:before{content:counter(gap,decimal-leading-zero);display:block;color:var(--warn);font:.65rem var(--font-en);margin-bottom:.4rem}.sources{display:grid}.sources article{display:grid;grid-template-columns:8rem 1fr auto;gap:1rem;align-items:start;padding:1.2rem 0;border-top:1px solid var(--line-soft)}.sources h3{font-family:var(--font-cn)}.sources p{font-size:.8rem}.sources small{color:var(--text-dim)}.sources a{font-size:.75rem}.manifest-block{margin-top:2rem}.manifest-meta{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line-soft)}.manifest-meta div{padding:1rem;border-right:1px solid var(--line-soft)}.manifest-meta div:last-child{border-right:0}.manifest-meta span{display:block;color:var(--text-dim);font-size:.7rem}.manifest-meta strong{display:block;margin-top:.35rem;font:600 .78rem var(--font-en);overflow-wrap:anywhere}.manifest-components{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}.manifest-components span{padding:.4rem .65rem;border:1px solid var(--line-soft);color:var(--text-sub);font:.7rem var(--font-en)}.policy{margin-top:2rem;padding:1rem;border-left:3px solid var(--gold);background:rgba(232,193,90,.05);color:var(--text-sub);font-size:.8rem}@media(max-width:800px){.metrics{grid-template-columns:repeat(3,1fr)}.gaps{grid-template-columns:1fr}.sources article{grid-template-columns:1fr}.versions,.manifest-meta{grid-template-columns:1fr}}
.normalization-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--line-soft)}.normalization-grid div{padding:1rem;background:var(--bg-dark)}.normalization-grid strong{display:block;color:var(--gold-bright);font:700 1.35rem var(--font-en);overflow-wrap:anywhere}.normalization-grid span{display:block;margin-top:.3rem;color:var(--text-dim);font-size:.7rem}.coverage-note{margin:.8rem 0 0;color:var(--text-sub);font-size:.78rem}.coverage-note.warning{color:var(--warn)}@media(max-width:1000px){.normalization-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.normalization-grid{grid-template-columns:1fr 1fr}}
</style>
