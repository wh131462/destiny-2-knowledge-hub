import { assertRepository } from '../../../packages/community-builds/index.js'

const repository = (import.meta.env.VITE_COMMUNITY_REPOSITORY || 'wh131462/destiny-2-knowledge-hub').trim()
const snapshotUrl = (import.meta.env.VITE_COMMUNITY_SNAPSHOT_URL || '').trim()
let error = '', submissionEnabled = false
try { assertRepository(repository); submissionEnabled = true }
catch { error = '投稿仓库配置无效，请联系站点维护者。' }
if (snapshotUrl && submissionEnabled) {
  try {
    assertRepository(repository)
    const url = new URL(snapshotUrl, window.location.href)
    if (!snapshotUrl || (url.protocol !== 'https:' && !(import.meta.env.DEV && url.origin === window.location.origin))) throw new Error('快照地址需要 HTTPS')
  } catch { error = '社区数据配置不完整或无效，请联系站点维护者。' }
}
export const communityConfig = {
  repository, snapshotUrl, error, submissionEnabled,
  repositoryUrl: submissionEnabled ? `https://github.com/${repository}` : '',
  issuesUrl: submissionEnabled ? `https://github.com/${repository}/issues` : '',
  enabled: Boolean(submissionEnabled && snapshotUrl && !error)
}
