<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const route = useRoute()
const router = useRouter()
const { locale, t, setLocale } = useI18n()
const { query: searchQuery, results: searchResults } = useGlobalSearch()

const navGroups = [
  {
    key: 'knowledge',
    items: [
      { to: '/classes', key: 'classes' },
      { to: '/prismatic', key: 'prismatic' },
      { to: '/weapon-tier-list', key: 'weaponTierList' },
      { to: '/weapons', key: 'weapons' },
      { to: '/armor', key: 'armor' },
      { to: '/activities', key: 'activities' },
      { to: '/lore', key: 'lore' },
      { to: '/glossary', key: 'glossary' }
    ]
  },
  {
    key: 'build',
    items: [
      { to: '/smart-loadout', key: 'smartLoadout' },
      { to: '/manual-loadout', key: 'manualLoadout' }
    ]
  },
  {
    key: 'data',
    items: [
      { to: '/manifest', key: 'manifest' },
      { to: '/data-status', key: 'dataStatus' }
    ]
  }
]

const openGroup = ref(null)
const mobileOpen = ref(false)
const searchOpen = ref(false)
const searchInput = ref(null)
const activeSearchIndex = ref(0)

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isGroupActive = (group) => group.items.some(item => isActive(item.to))

function toggleGroup(key) {
  openGroup.value = openGroup.value === key ? null : key
}

function closeMenus() {
  openGroup.value = null
  mobileOpen.value = false
}

function closeSearch() {
  searchOpen.value = false
  activeSearchIndex.value = 0
}

function selectSearchResult(result) {
  if (!result) return
  router.push(result.route)
  searchQuery.value = ''
  closeSearch()
}

function onSearchKeydown(event) {
  if (event.key === 'Escape') {
    closeSearch()
    searchInput.value?.blur()
    return
  }
  if (event.key === 'ArrowDown' && searchResults.value.length) {
    event.preventDefault()
    activeSearchIndex.value = (activeSearchIndex.value + 1) % searchResults.value.length
  }
  if (event.key === 'ArrowUp' && searchResults.value.length) {
    event.preventDefault()
    activeSearchIndex.value = (activeSearchIndex.value - 1 + searchResults.value.length) % searchResults.value.length
  }
  if (event.key === 'Enter' && searchResults.value.length) {
    event.preventDefault()
    selectSearchResult(searchResults.value[activeSearchIndex.value])
  }
}

function focusSearch() {
  searchOpen.value = true
  requestAnimationFrame(() => searchInput.value?.focus())
}

function onDocumentClick(event) {
  if (!event.target.closest('.site-header')) {
    closeMenus()
    closeSearch()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') closeMenus()
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    focusSearch()
  }
}

watch(() => route.path, closeMenus)
watch(searchQuery, () => {
  searchOpen.value = Boolean(searchQuery.value.trim())
  activeSearchIndex.value = 0
})
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <router-link to="/" class="logo" aria-label="Destiny 2 Knowledge Hub">
        <img src="/favicon.svg" class="logo-icon" alt="" aria-hidden="true" />
        <span class="logo-text">
          <span class="cn">命运2</span>
          <span class="en">DESTINY 2 HUB</span>
        </span>
      </router-link>

      <div class="global-search" :class="{ focused: searchOpen }">
        <span class="search-icon" aria-hidden="true"></span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="search"
          :placeholder="t('common.searchPlaceholder')"
          :aria-label="t('common.searchPlaceholder')"
          aria-controls="global-search-results"
          :aria-expanded="searchOpen"
          autocomplete="off"
          @focus="searchOpen = true"
          @keydown="onSearchKeydown"
        />
        <kbd>⌘K</kbd>
        <button v-if="searchQuery" type="button" class="search-clear" :aria-label="t('common.clear')" @click="searchQuery = ''; focusSearch()">×</button>
        <div v-if="searchOpen && searchQuery.trim()" id="global-search-results" class="search-results" role="listbox">
          <template v-if="searchResults.length">
            <button
              v-for="(result, index) in searchResults"
              :key="result.id"
              type="button"
              class="search-result"
              :class="{ selected: index === activeSearchIndex }"
              role="option"
              :aria-selected="index === activeSearchIndex"
              @mouseenter="activeSearchIndex = index"
              @click="selectSearchResult(result)"
            >
              <span class="result-type">{{ t(`searchTypes.${result.type}`) }}</span>
              <span class="result-copy"><strong>{{ locale === 'en' ? result.titleEn : result.title }}</strong><small>{{ result.description }}</small></span>
              <span class="result-arrow" aria-hidden="true">→</span>
            </button>
          </template>
          <p v-else class="search-empty">{{ t('common.searchNoResults') }}</p>
          <router-link to="/manifest" class="search-catalog-link" @click="closeSearch">{{ t('common.searchCatalog') }} <span aria-hidden="true">→</span></router-link>
        </div>
      </div>

      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="mobileOpen"
        aria-controls="primary-navigation"
        :aria-label="mobileOpen ? t('common.close') : t('common.menu')"
        @click.stop="mobileOpen = !mobileOpen"
      >
        <span aria-hidden="true" class="menu-icon"><i></i><i></i><i></i></span>
        <span>{{ t('common.menu') }}</span>
      </button>

      <nav id="primary-navigation" class="nav" :class="{ 'is-open': mobileOpen }" :aria-label="t('common.home')">
        <router-link to="/" class="nav-link home-link" :class="{ active: isActive('/') }">{{ t('nav.home') }}</router-link>
        <div v-for="group in navGroups" :key="group.key" class="nav-group" :class="{ active: isGroupActive(group), expanded: openGroup === group.key }">
          <button type="button" class="nav-group-trigger" :aria-expanded="openGroup === group.key" @click.stop="toggleGroup(group.key)">
            {{ t(`nav.${group.key}`) }}<span class="chevron" aria-hidden="true"></span>
          </button>
          <div class="nav-dropdown">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="nav-dropdown-link"
              :class="{ active: isActive(item.to) }"
            >{{ t(`nav.${item.key}`) }}</router-link>
          </div>
        </div>
      </nav>

      <div class="locale-switch" role="group" :aria-label="t('common.language')">
        <button type="button" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中文</button>
        <button type="button" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header { position: sticky; top: 0; z-index: 100; background: rgba(6, 10, 20, .9); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line-soft); }
.header-inner { position: relative; max-width: 1240px; min-height: 64px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 14px; }
.logo { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; color: var(--text-main) !important; }
.logo-icon { width: 38px; height: 38px; filter: drop-shadow(0 0 8px rgba(232, 193, 90, .46)); }
.logo-text { display: flex; flex-direction: column; line-height: 1.1; }
.logo-text .cn { font-weight: 900; font-size: 1.02rem; letter-spacing: .1em; }
.logo-text .en { margin-top: 3px; color: var(--gold-dim); font: .57rem var(--font-en); letter-spacing: .2em; }
.global-search { position: relative; display: flex; align-items: center; flex: 0 1 270px; min-width: 170px; height: 36px; margin-left: auto; border: 1px solid var(--line-soft); border-radius: 7px; background: rgba(16, 24, 40, .72); transition: border-color .2s, box-shadow .2s, background .2s; }
.global-search.focused { border-color: var(--gold-dim); background: rgba(16, 24, 40, .96); box-shadow: 0 0 0 3px rgba(232, 193, 90, .1); }
.global-search input { min-width: 0; width: 100%; height: 100%; padding: 0 42px 0 34px; border: 0; outline: 0; background: transparent; color: var(--text-main); font: .78rem var(--font-cn); }
.global-search input::placeholder { color: var(--text-dim); }
.global-search input::-webkit-search-cancel-button { display: none; }
.search-icon { position: absolute; left: 12px; width: 12px; height: 12px; border: 1.5px solid var(--text-dim); border-radius: 50%; pointer-events: none; }
.search-icon::after { content: ''; position: absolute; right: -5px; bottom: -3px; width: 6px; height: 1.5px; background: var(--text-dim); transform: rotate(45deg); }
.global-search kbd { position: absolute; right: 10px; padding: 2px 4px; border: 1px solid var(--line-soft); border-radius: 3px; color: var(--text-dim); font: .56rem var(--font-en); pointer-events: none; }
.search-clear { position: absolute; right: 8px; width: 22px; height: 22px; border: 0; background: transparent; color: var(--text-dim); font-size: 1.05rem; line-height: 1; cursor: pointer; }
.global-search:has(.search-clear) kbd { display: none; }
.search-results { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 120; padding: 6px; border: 1px solid var(--line-soft); border-radius: 8px; background: rgba(16, 24, 40, .99); box-shadow: 0 18px 38px rgba(0, 0, 0, .45); }
.search-result { display: grid; grid-template-columns: 4.2rem 1fr auto; align-items: center; width: 100%; gap: 8px; padding: 9px 8px; border: 0; border-radius: 5px; background: transparent; color: var(--text-main); text-align: left; cursor: pointer; }
.search-result:hover, .search-result.selected { background: rgba(232, 193, 90, .1); }
.result-type { align-self: start; padding-top: 2px; color: var(--gold-dim); font: .57rem var(--font-en); }
.result-copy { display: grid; min-width: 0; gap: 2px; }
.result-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .75rem; }
.result-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-dim); font-size: .62rem; }
.result-arrow { color: var(--gold-bright); font-size: .9rem; }
.search-empty { padding: 14px 9px; color: var(--text-dim); font-size: .72rem; }
.search-catalog-link { display: flex; justify-content: space-between; margin: 4px 2px 0; padding: 8px 7px 3px; border-top: 1px solid var(--line-soft); color: var(--gold-dim); font-size: .68rem; }
.nav { display: flex; align-items: stretch; align-self: stretch; gap: 2px; }
.nav-link, .nav-group-trigger { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; margin: 12px 0; padding: 0 13px; border: 0; border-radius: 6px; color: var(--text-sub); background: transparent; font: inherit; font-size: .82rem; white-space: nowrap; cursor: pointer; transition: color .2s, background .2s; }
.nav-link:hover, .nav-group-trigger:hover, .nav-group.active > .nav-group-trigger { color: var(--gold-bright); background: rgba(232, 193, 90, .09); }
.nav-link.active { color: var(--gold-bright); background: rgba(232, 193, 90, .14); box-shadow: inset 0 0 0 1px var(--line); }
.nav-group { position: relative; display: flex; align-items: center; }
.nav-group-trigger { gap: 8px; }
.chevron { width: 6px; height: 6px; margin-top: -3px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; transform: rotate(45deg); transition: transform .2s; }
.nav-group.expanded .chevron, .nav-group:hover .chevron { transform: rotate(225deg); margin-top: 3px; }
.nav-dropdown { position: absolute; top: calc(100% - 7px); left: 0; min-width: 180px; padding: 7px; border: 1px solid var(--line-soft); border-radius: 8px; background: rgba(16, 24, 40, .98); box-shadow: 0 16px 36px rgba(0, 0, 0, .4); opacity: 0; visibility: hidden; transform: translateY(-5px); transition: opacity .18s, transform .18s, visibility .18s; }
.nav-group:hover .nav-dropdown, .nav-group.expanded .nav-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
.nav-dropdown-link { display: block; padding: 9px 11px; border-radius: 5px; color: var(--text-sub); font-size: .8rem; white-space: nowrap; }
.nav-dropdown-link:hover, .nav-dropdown-link.active { color: var(--gold-bright); background: rgba(232, 193, 90, .11); }
.locale-switch { display: inline-flex; flex: 0 0 auto; margin-left: 4px; border: 1px solid var(--line-soft); border-radius: 6px; overflow: hidden; }
.locale-switch button { border: 0; padding: 5px 8px; background: transparent; color: var(--text-dim); font: 600 .68rem var(--font-en); cursor: pointer; }
.locale-switch button + button { border-left: 1px solid var(--line-soft); }
.locale-switch button.active { color: var(--bg-deep); background: var(--gold); }
.menu-toggle { display: none; align-items: center; gap: 8px; margin-left: auto; padding: 8px 10px; border: 1px solid var(--line-soft); border-radius: 6px; background: rgba(255, 255, 255, .03); color: var(--text-sub); font: .76rem var(--font-cn); cursor: pointer; }
.menu-icon { display: grid; gap: 3px; width: 16px; }
.menu-icon i { display: block; height: 1px; background: currentColor; }

@media (max-width: 980px) {
  .header-inner { flex-wrap: wrap; padding: 10px 14px 0; gap: 10px; }
  .logo-text .en { display: none; }
  .menu-toggle { display: inline-flex; }
  .global-search { order: 4; flex-basis: 100%; width: 100%; margin: 0 0 10px; }
  .global-search kbd { display: none; }
  .nav { position: absolute; top: 100%; left: 0; right: 0; display: none; height: auto; padding: 8px 14px 14px; margin: 0; border-bottom: 1px solid var(--line-soft); background: rgba(6, 10, 20, .98); box-shadow: 0 16px 30px rgba(0, 0, 0, .32); }
  .nav.is-open { display: block; }
  .home-link, .nav-group-trigger { width: 100%; justify-content: space-between; min-height: 42px; margin: 2px 0; padding: 0 12px; }
  .nav-group { display: block; }
  .nav-dropdown { position: static; display: none; min-width: 0; padding: 0 0 5px 14px; border: 0; border-radius: 0; background: transparent; box-shadow: none; opacity: 1; visibility: visible; transform: none; }
  .nav-group.expanded .nav-dropdown { display: block; }
  .nav-dropdown-link { padding: 8px 12px; }
  .locale-switch { margin-left: 0; }
}
@media (max-width: 430px) {
  .header-inner { min-height: 58px; }
  .logo-icon { width: 34px; height: 34px; }
  .logo-text .cn { font-size: .94rem; }
  .locale-switch button { padding: 5px 6px; }
}
</style>
