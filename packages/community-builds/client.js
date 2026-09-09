import { assertSnapshot } from './index.js'

export async function fetchSnapshot(config, previous, fetchImpl = fetch) {
  const response = await fetchImpl(config.snapshotUrl, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`社区构筑加载失败（${response.status}），请稍后重试。`)
  const next = assertSnapshot(await response.json(), config.repository)
  if (previous && Date.parse(next.generatedAt) < Date.parse(previous.generatedAt)) throw new Error('数据节点尚未更新，已保留较新的快照，请稍后重试。')
  return next
}
