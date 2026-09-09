import { computed, readonly, ref, shallowRef, onMounted } from 'vue'
import { curatedBuilds } from '@/data/v2'
import { communityConfig } from '@/utils/communityConfig'
import { fetchSnapshot } from '../../../packages/community-builds/client.js'
import { listLocalDrafts } from '@/utils/localDrafts'
import { decodeDraft } from '../../../packages/loadout-planner/index.js'

const sourceStatus = ref(communityConfig.error ? 'error' : communityConfig.enabled ? 'idle' : 'unconfigured')
const snapshot = shallowRef(null), error = ref(communityConfig.error)
let pending = null
async function refresh() {
  if (!communityConfig.enabled) return
  if (pending) return pending
  sourceStatus.value = 'loading'; error.value = ''
  pending = (async () => {
    try {
      snapshot.value = await fetchSnapshot(communityConfig, snapshot.value)
      sourceStatus.value = 'ready'
    } catch (e) { error.value = e.message || '社区构筑加载失败，请重试。'; sourceStatus.value = 'error' }
    finally { pending = null }
  })()
  return pending
}

function loadPublicBuilds() {
  const local = listLocalDrafts().map(entry => {
    let draft = null
    try { draft = decodeDraft(entry.encoded) } catch { draft = { name: entry.name } }
    return { ...draft, id: entry.id, name: entry.name, goal: draft?.goal || draft?.notes || '保存在此浏览器的本地草稿', source: 'local-draft', detailPath: `/builds/draft/${encodeURIComponent(entry.id)}`, editPath: `/manual-loadout?draft=${encodeURIComponent(entry.id)}`, author: { displayName: '本地草稿' }, publishedAt: entry.updatedAt, activityIds: [] }
  })
  const editorial = curatedBuilds
    .filter(build => (build.visibility || (build.isTemplateBaseline ? 'private' : 'public')) === 'public')
    .map(build => ({
      ...build,
      source: 'editorial', detailPath: `/builds/${build.id}`,
      visibility: 'public',
      author: build.author || { id: 'editorial', displayName: '站内编辑' },
      publishedAt: build.publishedAt || build.verifiedAt || ''
    }))
  const community = (snapshot.value?.builds || []).map(build => ({
    ...build, source: 'community', detailPath: `/builds/community/${build.number}`,
    name: build.submission.loadout.name, classId: build.submission.loadout.classId,
    subclassId: build.submission.loadout.subclassId, goal: build.submission.summary,
    tags: build.submission.tags, activityIds: build.submission.activityIds,
    author: { ...build.author, displayName: build.author.login }, publishedAt: build.updatedAt
  }))
  return [...local, ...community, ...editorial]
}

export function usePublicBuilds() {
  onMounted(() => { if (sourceStatus.value === 'idle') refresh() })
  const publicBuilds = computed(loadPublicBuilds)
  return {
    publicBuilds,
    status: readonly(sourceStatus), snapshot: readonly(snapshot), error: readonly(error), refresh,
    config: communityConfig
  }
}
