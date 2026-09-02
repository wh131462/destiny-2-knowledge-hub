import { computed, ref } from 'vue'

const STORAGE_KEY = 'd2-hub-locale'
const initialLocale = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) || 'zh' : 'zh'
const locale = ref(initialLocale === 'en' ? 'en' : 'zh')

const messages = {
  zh: {
    common: {
      home: '首页', classes: '职业百科', prismatic: '棱镜', weapons: '武器百科', armor: '防具与套装', manualLoadout: '手动配装',
      activities: '活动图鉴', lore: '世界观', buildLab: '构筑实验室', workbench: '自定义工作台',
      manifest: '官方目录', glossary: '术语表', dataStatus: '数据状态', language: '语言', chinese: '中文', english: 'English',
      all: '全部', search: '搜索…', open: '打开 ↗', back: '返回', none: '暂无数据', pending: '待补充',
      official: '官方', verified: '已核验', source: '来源', description: '说明', save: '保存', reset: '重置',
      pve: 'PvE', pvp: 'PvP', confirm: '确认', close: '关闭', page: '页', total: '条',
      skipToMain: '跳到主要内容', notFound: '未找到页面', menu: '目录', clear: '清除', searchPlaceholder: '搜索职业、武器、活动、术语或构筑…', searchNoResults: '没有找到匹配内容', searchCatalog: '在官方目录中搜索完整 Manifest'
    },
    nav: { home: '首页', knowledge: '知识图鉴', build: '构筑工具', data: '数据中心', classes: '职业百科', prismatic: '棱镜', weaponTierList: '武器天梯', weapons: '武器百科', armor: '防具与套装', activities: '活动图鉴', lore: '世界观', buildLab: '构筑实验室', workbench: '自定义工作台', smartLoadout: '智能配装', manualLoadout: '手动配装', manifest: '官方目录', glossary: '术语表', dataStatus: '数据状态' },
    searchTypes: { classes: '职业', subclasses: '子职业', weapons: '武器', armor: '防具', activities: '活动', lore: '世界观', glossary: '术语', builds: '构筑' },
    footer: { brand: '命运2 知识中枢', disclaimer: 'Destiny 2 及相关内容版权归 Bungie, Inc. 所有。本站为学习与参考用途，与 Bungie 无关。' },
    pages: {
      home: { title: '以光为刃，以知为盾', explore: '知识中枢', featured: '热门构筑推荐', classes: '三大职业' },
      classes: { title: '职业百科', subtitle: '三大职业、十五个普通元素分支、三个棱镜职业、天赋与构筑方向', search: '搜索职业或分支名称…', all: '全部' },
      weapons: { title: '武器百科', subtitle: '19 类武器原型、新原型（爆能枪/十字弓）、异域武器图鉴', search: '搜索武器类型或异域武器…', archetypes: '武器原型', exotics: '异域武器精选', allSlots: '全部槽位', noMatch: '未找到匹配的武器类型', noExotic: '未找到匹配的异域武器' },
      armor: { title: '防具与套装', subtitle: '护甲 3.0、套装配置、异域护甲、构筑思路', search: '搜索套装或异域护甲…', slots: '护甲部位', sets: '代表套装', exotics: '异域护甲' },
      activities: { title: '活动图鉴', subtitle: '门户行动、突袭、地牢、限时事件、当前状态', search: '搜索…', ops: '门户行动', raids: '突袭', dungeons: '地牢', events: '限时事件', status: '当前游戏状态' },
      lore: { title: '世界观', subtitle: '两大传奇、势力与敌人、重要角色、资料片年表', search: '搜索势力 / 角色 / 敌人…' },
      glossary: { title: '术语表', subtitle: '中英对照、按分类检索、快速查阅', search: '搜索术语（中文 / 英文）…' },
      prismatic: { title: '棱镜职业', subtitle: '棱镜不是第六种元素。它从职业专属的光暗技能池选取能力，并通过超越把两侧能量连接起来。', chooseClass: '选择职业', current: '当前配置', supers: '超能力池', melee: '近战池', grenades: '手雷池', aspects: '星相池', meleeAndGrenade: '近战与手雷', classAspects: '职业专属棱镜星相', transcendence: '超越', facet: '棱镜特性' },
      buildLab: { title: '构筑实验室', subtitle: '只展示通过职业技能池、异域限制、武器槽位、词条和模组容量校验的完整方案。没有精确匹配时，明确告诉你没有结果。' },
      workbench: { title: '自定义构筑工作台', subtitle: '用与站内精选构筑相同的规则引擎验证自己的配置。导入后，错误会定位到具体 JSON 路径；通过校验后才会计算属性、机制倍率和获取顺序。' },
      manifest: { title: '官方实体目录', subtitle: '检索 Bungie Manifest 标准化的武器、护甲、装备模组、技能和活动。官方定义与本站构筑建议分开显示，所有条目都保留 Manifest Hash。' },
      dataStatus: { title: '数据状态与可信度', subtitle: '我们明确展示当前做到了什么、还缺什么，以及每类判断来自哪里。' },
      notFound: { title: '这条路径不在星图上', subtitle: '页面可能已经移动，或构筑 ID 不存在。' }
    }
  },
  en: {
    common: {
      home: 'Home', classes: 'Classes', prismatic: 'Prismatic', weapons: 'Weapons', armor: 'Armor & Sets', manualLoadout: 'Manual Loadout',
      activities: 'Activities', lore: 'Lore', buildLab: 'Build Lab', workbench: 'Custom Workbench',
      manifest: 'Official Catalog', glossary: 'Glossary', dataStatus: 'Data Status', language: 'Language', chinese: '中文', english: 'English',
      all: 'All', search: 'Search…', open: 'Open ↗', back: 'Back', none: 'No data', pending: 'Pending',
      official: 'Official', verified: 'Verified', source: 'Source', description: 'Description', save: 'Save', reset: 'Reset',
      pve: 'PvE', pvp: 'PvP', confirm: 'Confirm', close: 'Close', page: 'page', total: 'items',
      skipToMain: 'Skip to main content', notFound: 'Not found', menu: 'Menu', clear: 'Clear', searchPlaceholder: 'Search classes, weapons, activities, terms, or builds…', searchNoResults: 'No matching content', searchCatalog: 'Search the full Manifest in Official Catalog'
    },
    nav: { home: 'Home', knowledge: 'Knowledge', build: 'Build Tools', data: 'Data Hub', classes: 'Classes', prismatic: 'Prismatic', weaponTierList: 'Weapon Tier List', weapons: 'Weapons', armor: 'Armor & Sets', activities: 'Activities', lore: 'Lore', buildLab: 'Build Lab', workbench: 'Custom Workbench', smartLoadout: 'Smart Loadout', manualLoadout: 'Manual Loadout', manifest: 'Official Catalog', glossary: 'Glossary', dataStatus: 'Data Status' },
    searchTypes: { classes: 'CLASS', subclasses: 'SUBCLASS', weapons: 'WEAPON', armor: 'ARMOR', activities: 'ACTIVITY', lore: 'LORE', glossary: 'TERM', builds: 'BUILD' },
    footer: { brand: 'Destiny 2 Knowledge Hub', disclaimer: 'Destiny 2 and related content are copyright Bungie, Inc. This site is for learning and reference and is not affiliated with Bungie.' },
    pages: {
      home: { title: 'Light as a blade, knowledge as a shield', explore: 'Explore the Hub', featured: 'Featured Builds', classes: 'The Three Classes' },
      classes: { title: 'Classes', subtitle: 'Three classes / fifteen elemental branches / three Prismatic subclasses / aspects and build direction', search: 'Search classes or subclass names…', all: 'All' },
      weapons: { title: 'Weapons', subtitle: '19 weapon archetypes / new archetypes (Blaster/Crossbow) / Exotic weapon index', search: 'Search weapon types or Exotic weapons…', archetypes: 'Weapon Archetypes', exotics: 'Featured Exotics', allSlots: 'All slots', noMatch: 'No matching weapon types', noExotic: 'No matching Exotic weapons' },
      armor: { title: 'Armor & Sets', subtitle: 'Armor 3.0 / set configuration / Exotic armor / build direction', search: 'Search armor sets or Exotic armor…', slots: 'Armor Slots', sets: 'Featured Sets', exotics: 'Exotic Armor' },
      activities: { title: 'Activities', subtitle: 'Portal Ops / raids / dungeons / limited events / current status', search: 'Search…', ops: 'Portal Ops', raids: 'Raids', dungeons: 'Dungeons', events: 'Limited Events', status: 'Current Game Status' },
      lore: { title: 'Lore', subtitle: 'Two legendary forces / factions and enemies / key characters / expansion timeline', search: 'Search factions / characters / enemies…' },
      glossary: { title: 'Glossary', subtitle: 'Chinese-English reference / filter by category / quick lookup', search: 'Search terms (Chinese / English)…' },
      prismatic: { title: 'Prismatic Subclass', subtitle: 'Prismatic is not a sixth element. It draws from a class-specific pool of Light and Darkness abilities, connecting both sides through Transcendence.', chooseClass: 'Choose class', current: 'Current Build', supers: 'Super pool', melee: 'Melee pool', grenades: 'Grenade pool', aspects: 'Aspect pool', meleeAndGrenade: 'Melee & Grenades', classAspects: 'Class Prismatic Aspects', transcendence: 'Transcendence', facet: 'Prismatic Facets' },
      buildLab: { title: 'Build Lab', subtitle: 'Only complete builds that pass class pools, Exotic limits, weapon slots, perks, and mod capacity checks are shown. Exact misses are reported clearly.' },
      workbench: { title: 'Custom Build Workbench', subtitle: 'Validate your own configuration with the same rule engine used by curated builds. Import errors point to exact JSON paths; stats, multipliers, and acquisition order are calculated only after validation.' },
      manifest: { title: 'Official Entity Catalog', subtitle: 'Search Bungie Manifest-normalized weapons, armor, mods, abilities, and activities. Official definitions are shown separately from build recommendations, and every entry keeps its Manifest hash.' },
      dataStatus: { title: 'Data Status & Confidence', subtitle: 'See what is covered, what is missing, and where each type of decision comes from.' },
      notFound: { title: 'This path is not on the star chart', subtitle: 'The page may have moved, or the build ID does not exist.' }
    }
  }
}

function resolve(path, source) {
  return path.split('.').reduce((value, key) => value?.[key], source)
}

export function translate(key, fallback = key) {
  return resolve(key, messages[locale.value]) ?? fallback
}

export function localized(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return locale.value === 'en' ? (item.nameEn || item.en || item.name || item.label || '') : (item.name || item.label || item.en || '')
}

export function setLocale(next) {
  locale.value = next === 'en' ? 'en' : 'zh'
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, locale.value)
  if (typeof document !== 'undefined') document.documentElement.lang = locale.value === 'en' ? 'en' : 'zh-CN'
}

export function useI18n() {
  return { locale: computed(() => locale.value), t: translate, localized, setLocale, isEnglish: computed(() => locale.value === 'en') }
}

if (typeof document !== 'undefined') document.documentElement.lang = locale.value === 'en' ? 'en' : 'zh-CN'
