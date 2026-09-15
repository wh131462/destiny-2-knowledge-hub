import { computed, ref } from 'vue'
import { translateUi, translateGeneratedMessage } from './messages.js'

const STORAGE_KEY = 'd2-hub-locale'
const initialLocale = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) || 'zh' : 'zh'
const locale = ref(initialLocale === 'en' ? 'en' : 'zh')

const messages = {
  zh: {
    common: {
      home: '首页', classes: '职业百科', weapons: '武器百科', armor: '防具与套装', manualLoadout: '创建构筑', publicBuilds: '构筑方案',
      activities: '活动图鉴', lore: '世界观', buildLab: '构筑实验室', workbench: '自定义工作台',
      manifest: '官方目录', glossary: '术语表', dataStatus: '数据状态', language: '语言', chinese: '中文', english: 'English',
      all: '全部', search: '搜索…', open: '打开 ↗', back: '返回', none: '暂无数据', pending: '待补充',
      official: '官方', verified: '已核验', source: '来源', description: '说明', save: '保存', reset: '重置',
      pve: 'PvE', pvp: 'PvP', confirm: '确认', close: '关闭', page: '页', total: '条',
      skipToMain: '跳到主要内容', notFound: '未找到页面', menu: '目录', clear: '清除',
      searchPlaceholder: '搜索武器、职业、构筑…',
      searchHint: '全局搜索：武器、护甲、职业、活动、剧情、术语和构筑',
      searchNoResults: '暂无结果，试试其他关键词',
      searchCatalog: '前往官方目录搜索',
      refresh: '刷新列表', refreshing: '刷新中…', loading: '正在加载…', clearFilters: '清除筛选',
      allClasses: '全部职业', allActivities: '全部玩法', sort: '排序', recentlyUpdated: '最近更新', sortByName: '名称排序',
      createBuild: '创建构筑', viewDetails: '查看完整方案', anonymousGuardian: '匿名守护者', updatedAt: '更新于',
      noMatches: '没有符合筛选的构筑', noPublicBuilds: '暂时没有公开构筑方案', tryOtherFilters: '试试其他关键词，或清除筛选，重新发现适合你的方案。',
      startBuild: '从职业与技能开始，记录你的装备搭配与玩法思路。', connectionInterrupted: '暂时无法读取构筑', retry: '重新加载',
      networkRetry: '请检查网络后重试。你也可以先创建自己的构筑。', communitySubmission: '社区投稿', coreArmor: '核心护甲', recommendedWeapon: '推荐武器',
      buildCount: '份方案', totalCount: '共', snapshotUpdated: '数据更新于', syncing: '正在读取社区构筑…', syncHint: '投稿与更新会在同步完成后显示',
      notSynced: '当前页面尚未启用列表同步；可以创建构筑并通过 GitHub 提交。', lastSyncedData: '当前显示上次成功同步的数据。',
      noData: '暂无数据'
    },
    nav: { home: '首页', knowledge: '知识图鉴', build: '构筑工具', data: '数据中心', classes: '职业百科', weaponTierList: '武器天梯', weapons: '武器百科', armor: '防具与套装', activities: '活动图鉴', weeklyRotation: '本周轮换', lore: '世界观', buildLab: '构筑实验室', workbench: '自定义工作台', smartLoadout: '智能配装', publicBuilds: '构筑方案', manualLoadout: '创建构筑', manifest: '官方目录', glossary: '术语表', dataStatus: '数据状态' },
    searchTypes: { classes: '职业', subclasses: '子职业', weapons: '武器', armor: '防具', activities: '活动', lore: '世界观', glossary: '术语', builds: '构筑' },
    footer: { brand: '命运2 知识中枢', disclaimer: 'Destiny 2 及相关内容版权归 Bungie, Inc. 所有。本站为学习与参考用途，与 Bungie 无关。' },
    pages: {
      home: { title: '以光为刃，以知为盾', explore: '知识中枢', featured: '热门构筑推荐', classes: '三大职业' },
      classes: { title: '职业百科', subtitle: '三大职业、十五个普通元素分支、三个棱镜职业、天赋与构筑方向', search: '搜索职业或分支名称…', all: '全部' },
      weapons: { title: '武器百科', subtitle: '按当前 Bungie Manifest 查阅武器定义、元素、版本与 Perk 数据', search: '搜索武器类型或异域武器…', archetypes: '武器原型', exotics: '异域武器索引', allSlots: '全部槽位', noMatch: '未找到匹配的武器类型', noExotic: '未找到匹配的异域武器' },
      armor: { title: '防具与套装', subtitle: '护甲 3.0、套装配置、异域护甲、构筑思路', search: '搜索套装或异域护甲…', slots: '护甲部位', sets: '代表套装', exotics: '异域护甲' },
      activities: { title: '活动图鉴', subtitle: '按游玩目的选择内容，或查阅突袭、地牢与限时事件', search: '搜索活动…', ops: '玩法选择', raids: '突袭', dungeons: '地牢', events: '限时事件', status: '当前游戏状态' },
      weeklyRotation: { title: '本周轮换', subtitle: '查看当前周的官方活动轮换、周期、修饰词与数据状态' },
      lore: { title: '世界观', subtitle: '沿着宇宙法则、剧情因果、阵营关系与人物选择理解命运宇宙', search: '搜索名称、别名、地点或关联条目…' },
      glossary: { title: '术语表', subtitle: '中英对照、按分类检索、快速查阅', search: '搜索术语（中文 / 英文）…' },
      buildLab: { title: '构筑实验室', subtitle: '只展示通过职业技能池、异域限制、武器槽位、词条和模组容量校验的完整方案。没有精确匹配时，明确告诉你没有结果。' },
      workbench: { title: '自定义构筑工作台', subtitle: '用与站内精选构筑相同的规则引擎验证自己的配置。导入后，错误会定位到具体 JSON 路径；通过校验后才会计算属性、机制倍率和获取顺序。' },
      manifest: { title: '官方实体目录', subtitle: '检索 Bungie Manifest 标准化的武器、护甲、装备模组、技能和活动。官方定义与本站构筑建议分开显示，所有条目都保留 Manifest Hash。' },
      dataStatus: { title: '数据状态与可信度', subtitle: '我们明确展示当前做到了什么、还缺什么，以及每类判断来自哪里。' },
      notFound: { title: '这条路径不在星图上', subtitle: '页面可能已经移动，或构筑 ID 不存在。' }
    }
  },
  en: {
    common: {
      home: 'Home', classes: 'Classes', weapons: 'Weapons', armor: 'Armor & Sets', manualLoadout: 'Create Build', publicBuilds: 'Builds',
      activities: 'Activities', lore: 'Lore', buildLab: 'Build Lab', workbench: 'Custom Workbench',
      manifest: 'Official Catalog', glossary: 'Glossary', dataStatus: 'Data Status', language: 'Language', chinese: '中文', english: 'English',
      all: 'All', search: 'Search…', open: 'Open ↗', back: 'Back', none: 'No data', pending: 'Pending',
      official: 'Official', verified: 'Verified', source: 'Source', description: 'Description', save: 'Save', reset: 'Reset',
      pve: 'PvE', pvp: 'PvP', confirm: 'Confirm', close: 'Close', page: 'page', total: 'items',
      skipToMain: 'Skip to main content', notFound: 'Not found', menu: 'Menu', clear: 'Clear',
      searchPlaceholder: 'Search weapons, classes, builds…',
      searchHint: 'Global search: weapons, armor, classes, activities, lore, terms, and builds',
      searchNoResults: 'No results. Try another keyword.',
      searchCatalog: 'Search the official catalog',
      refresh: 'Refresh list', refreshing: 'Refreshing…', loading: 'Loading…', clearFilters: 'Clear filters',
      allClasses: 'All classes', allActivities: 'All activities', sort: 'Sort', recentlyUpdated: 'Recently updated', sortByName: 'Sort by name',
      createBuild: 'Create build', viewDetails: 'View full build', anonymousGuardian: 'Anonymous Guardian', updatedAt: 'Updated',
      noMatches: 'No builds match these filters', noPublicBuilds: 'No public builds yet', tryOtherFilters: 'Try another keyword or clear the filters to discover a suitable build.',
      startBuild: 'Start with a class and abilities, then record your gear and playstyle.', connectionInterrupted: 'Unable to load builds', retry: 'Reload',
      networkRetry: 'Check your connection and try again. You can also create your own build first.', communitySubmission: 'Community submission', coreArmor: 'Core armor', recommendedWeapon: 'Recommended weapon',
      buildCount: 'builds', totalCount: 'of', snapshotUpdated: 'Data updated', syncing: 'Loading community builds…', syncHint: 'Submissions and updates appear after synchronization',
      notSynced: 'List synchronization is not enabled yet; create a build and submit it through GitHub.', lastSyncedData: 'Showing the last successfully synchronized data.',
      noData: 'No data'
    },
    nav: { home: 'Home', knowledge: 'Knowledge', build: 'Build Tools', data: 'Data Hub', classes: 'Classes', weaponTierList: 'Weapon Tier List', weapons: 'Weapons', armor: 'Armor & Sets', activities: 'Activities', weeklyRotation: 'Weekly Rotation', lore: 'Lore', buildLab: 'Build Lab', workbench: 'Custom Workbench', smartLoadout: 'Smart Loadout', publicBuilds: 'Builds', manualLoadout: 'Create Build', manifest: 'Official Catalog', glossary: 'Glossary', dataStatus: 'Data Status' },
    searchTypes: { classes: 'CLASS', subclasses: 'SUBCLASS', weapons: 'WEAPON', armor: 'ARMOR', activities: 'ACTIVITY', lore: 'LORE', glossary: 'TERM', builds: 'BUILD' },
    footer: { brand: 'Destiny 2 Knowledge Hub', disclaimer: 'Destiny 2 and related content are copyright Bungie, Inc. This site is for learning and reference and is not affiliated with Bungie.' },
    pages: {
      home: { title: 'Light as a blade, knowledge as a shield', explore: 'Explore the Hub', featured: 'Featured Builds', classes: 'The Three Classes' },
      classes: { title: 'Classes', subtitle: 'Three classes / fifteen elemental branches / three Prismatic subclasses / aspects and build direction', search: 'Search classes or subclass names…', all: 'All' },
      weapons: { title: 'Weapons', subtitle: 'Browse weapon definitions, elements, versions, and perk data from the current Bungie Manifest', search: 'Search weapon types or Exotic weapons…', archetypes: 'Weapon Archetypes', exotics: 'Exotic Index', allSlots: 'All slots', noMatch: 'No matching weapon types', noExotic: 'No matching Exotic weapons' },
      armor: { title: 'Armor & Sets', subtitle: 'Armor 3.0 / set configuration / Exotic armor / build direction', search: 'Search armor sets or Exotic armor…', slots: 'Armor Slots', sets: 'Featured Sets', exotics: 'Exotic Armor' },
      activities: { title: 'Activities', subtitle: 'Choose by play intent, or browse raids, dungeons, and limited events', search: 'Search activities…', ops: 'Choose an activity', raids: 'Raids', dungeons: 'Dungeons', events: 'Limited Events', status: 'Current Game Status' },
      weeklyRotation: { title: 'Weekly Rotation', subtitle: 'Browse the current official activity rotation, reset window, modifiers, and data state' },
      lore: { title: 'Lore', subtitle: 'Understand Destiny through cosmic rules, story causality, faction ties, and character choices', search: 'Search names, aliases, places, or related entries…' },
      glossary: { title: 'Glossary', subtitle: 'Chinese-English reference / filter by category / quick lookup', search: 'Search terms (Chinese / English)…' },
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

// Source-key messages are restricted to site-authored interface copy.
// Never pass author names, notes, imported drafts, or other user content here.
export function ui(source, parameters) {
  return translateUi(source, locale.value, parameters)
}

export function uiMessage(source) {
  return translateGeneratedMessage(source, locale.value)
}

export function manifestName(item, fallback = '') {
  if (!item) return fallback
  return locale.value === 'en' ? item.name || item.nameZh || fallback : item.nameZh || item.name || fallback
}

export function manifestDescription(item) {
  return locale.value === 'en' ? item?.description || item?.descriptionZh || '' : item?.descriptionZh || item?.description || ''
}

export function localizedOptions(options) {
  return options?.map(option => ({ ...option, label: ui(option.label), ...(option.options ? { options: localizedOptions(option.options) } : {}) }))
}

export function localized(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return locale.value === 'en' ? (item.nameEn || item.en || ui(item.name || item.label || item.nameZh || '')) : (item.nameZh || item.name || item.label || item.en || '')
}

/** Select a localized field while retaining a safe fallback for partial snapshots. */
export function localizedField(item, field, fallback = '') {
  if (!item) return fallback
  const english = item[`${field}En`] || (item[`${field}Zh`] !== undefined ? item[field] : undefined)
  const chinese = item[`${field}Zh`] || item[field]
  return locale.value === 'en' ? (english || ui(chinese) || fallback) : (chinese || english || fallback)
}

export function formatDate(value, options = {}) {
  if (!value) return ''
  try { return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'zh-CN', options).format(new Date(value)) } catch { return String(value) }
}

function updateDocumentLanguage() {
  if (typeof document === 'undefined') return
  const english = locale.value === 'en'
  document.documentElement.lang = english ? 'en' : 'zh-CN'
  document.title = english ? 'Destiny 2 Knowledge Hub' : '命运2 知识中枢 | Destiny 2 Hub'
  const description = english ? 'Destiny 2 reference guides, classes, equipment, and build planning.' : '命运2（Destiny 2）知识库主题站 - 信息查阅、推荐搭配、套装配置'
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
}

export function setLocale(next) {
  locale.value = next === 'en' ? 'en' : 'zh'
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, locale.value)
  updateDocumentLanguage()
}

export function useI18n() {
  return { locale: computed(() => locale.value), t: translate, localized, localizedField, formatDate, setLocale, isEnglish: computed(() => locale.value === 'en') }
}

updateDocumentLanguage()
