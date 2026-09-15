import { createRouter, createWebHashHistory } from 'vue-router'
import { installNavigationLoading } from '@/utils/navigationLoading'
import { updateNavigationLoading } from '@/composables/useNavigationLoading'

const routes = [
  { path: '/encyclopedia/:kind/:id', name: 'encyclopedia-entry', component: () => import('@/views/EncyclopediaEntryView.vue') },
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/classes', name: 'classes', component: () => import('@/views/ClassesView.vue') },
  { path: '/classes/:classId', name: 'class-detail', component: () => import('@/views/ClassDetailView.vue') },
  { path: '/prismatic', redirect: '/classes/titan?el=prismatic' },
  { path: '/weapon-tier-list', name: 'weapon-tier-list', component: () => import('@/views/WeaponTierListView.vue') },
  { path: '/weapons', name: 'weapons', component: () => import('@/views/WeaponsView.vue') },
  { path: '/armor', name: 'armor', component: () => import('@/views/ArmorView.vue') },
  { path: '/activities', name: 'activities', component: () => import('@/views/ActivitiesView.vue') },
  { path: '/weekly-rotation', name: 'weekly-rotation', component: () => import('@/views/WeeklyRotationView.vue') },
  { path: '/lore', name: 'lore', component: () => import('@/views/LoreView.vue') },
  { path: '/glossary', name: 'glossary', component: () => import('@/views/GlossaryView.vue') },
  { path: '/data-status', name: 'data-status', component: () => import('@/views/DataStatusView.vue') },
  { path: '/manifest', name: 'manifest', component: () => import('@/views/ManifestCatalogView.vue') },
  { path: '/builds', name: 'public-builds', component: () => import('@/views/BuildLabView.vue') },
  { path: '/builds/community/:issueNumber', name: 'community-build-detail', component: () => import('@/views/CommunityBuildDetailView.vue') },
  { path: '/builds/draft/:draftId', name: 'local-draft-preview', component: () => import('@/views/LocalDraftPreviewView.vue') },
  { path: '/build-lab', redirect: '/builds' },
  { path: '/build-workbench', name: 'build-workbench', component: () => import('@/views/BuildWorkbenchView.vue') },
  { path: '/smart-loadout', redirect: '/builds' },
  { path: '/manual-loadout', name: 'manual-loadout', component: () => import('@/views/ManualLoadoutView.vue') },
  { path: '/builds/:buildId', name: 'build-detail', component: () => import('@/views/BuildDetailView.vue') },
  { path: '/tools', redirect: '/builds' },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0 }
  }
})

installNavigationLoading(router, updateNavigationLoading)

export default router
