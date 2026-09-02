import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/classes', name: 'classes', component: () => import('@/views/ClassesView.vue') },
  { path: '/classes/:classId', name: 'class-detail', component: () => import('@/views/ClassDetailView.vue') },
  { path: '/prismatic', name: 'prismatic', component: () => import('@/views/PrismaticView.vue') },
  { path: '/weapon-tier-list', name: 'weapon-tier-list', component: () => import('@/views/WeaponTierListView.vue') },
  { path: '/weapons', name: 'weapons', component: () => import('@/views/WeaponsView.vue') },
  { path: '/armor', name: 'armor', component: () => import('@/views/ArmorView.vue') },
  { path: '/activities', name: 'activities', component: () => import('@/views/ActivitiesView.vue') },
  { path: '/lore', name: 'lore', component: () => import('@/views/LoreView.vue') },
  { path: '/glossary', name: 'glossary', component: () => import('@/views/GlossaryView.vue') },
  { path: '/data-status', name: 'data-status', component: () => import('@/views/DataStatusView.vue') },
  { path: '/manifest', name: 'manifest', component: () => import('@/views/ManifestCatalogView.vue') },
  { path: '/build-lab', name: 'build-lab', component: () => import('@/views/BuildLabView.vue') },
  { path: '/build-workbench', name: 'build-workbench', component: () => import('@/views/BuildWorkbenchView.vue') },
  { path: '/smart-loadout', name: 'smart-loadout', component: () => import('@/views/SmartLoadoutView.vue') },
  { path: '/manual-loadout', name: 'manual-loadout', component: () => import('@/views/ManualLoadoutView.vue') },
  { path: '/builds/:buildId', name: 'build-detail', component: () => import('@/views/BuildDetailView.vue') },
  { path: '/tools', redirect: '/smart-loadout' },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})
