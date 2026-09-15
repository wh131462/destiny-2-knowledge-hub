import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { blankDraft } from '../packages/loadout-planner/index.js'
import { validateLoadout } from '../packages/loadout-planner/validation.js'
import { createSubmission, submissionBody, parseSubmission, validateSubmission, buildSnapshot, assertSnapshot, newIssueUrl } from '../packages/community-builds/index.js'
import { loadValidationContext, fetchIssues, publishSnapshot, syncBuilds } from '../packages/community-builds/sync.js'
import { fetchSnapshot } from '../packages/community-builds/client.js'

const context = await loadValidationContext(), repository = 'wh131462/destiny-2-knowledge-hub'
function submission() {
  const d = blankDraft(), subclass = context.subclasses.find(s => s.id === d.subclassId)
  d.name = '电猎 / 社区测试'; d.manifestVersion = context.manifestVersion
  d.abilities.superId = subclass.superIds[0]
  d.notes = '中文备注\n`$(echo should-not-run)` <script>alert(1)</script>'
  d.weapons[0].perkCombinations.push({ id: 'combo-2', name: '第二组', notes: '不同玩法', recommendedPerks: { trait1: ['手动建议'], 'socket-4': ['备选'] }, recommendedPerkHashes: { trait1: [123456] } })
  return createSubmission(d, { summary: '以天赋循环为核心的配装建议', tags: ['生存'], activityIds: [context.activities[0].id] })
}
function issue(number = 1, changes = {}) {
  return { number, node_id: `I_${number}`, state: 'open', labels: [{ name: 'build' }], body: submissionBody(submission()), user: { id: 123, login: 'guardian' }, created_at: '2026-09-08T00:00:00Z', updated_at: '2026-09-08T01:00:00Z', ...changes }
}
const snapshot = rows => buildSnapshot(rows, context, { repository })

test('submission round trip preserves all data and never executes notes', () => {
  const original = submission()
  assert.deepEqual(parseSubmission(submissionBody(original)), original)
  assert.equal(validateSubmission(original, context).valid, true)
  const url = newIssueUrl(repository, original.loadout.name)
  assert.equal(new URL(url).searchParams.has('body'), false)
  assert.throws(() => newIssueUrl('x/../../other', 'name'))
})
test('strict protocol rejects ambiguous JSON, oversized UTF-8 text, unknown fields and coercion', () => {
  const s = submission(), body = submissionBody(s)
  assert.throws(() => parseSubmission(body + body), /只能有一个/)
  assert.throws(() => parseSubmission('```json\n{bad}\n```'), /无法解析/)
  assert.throws(() => parseSubmission('界'.repeat(20000)), /48 KiB/)
  for (const mutate of [s => { s.loadout.weapons[0].manifestHash = '123' }, s => { s.author = 'owner' }, s => { s.loadout.notes = 'x'.repeat(10001) }, s => { s.loadout.weapons[0].perkCombinations[1].id = 'combo-1' }, s => { s.loadout.schema = 'd2hub-manual-loadout-v2' }, s => { s.loadout.mods.helmet = null }]) {
    const invalid = structuredClone(s); mutate(invalid); assert.throws(() => submissionBody(invalid))
  }
})
test('minimum completeness, catalog rules and version warnings', () => {
  const empty = createSubmission(blankDraft(), { summary: '玩法说明' })
  assert.ok(validateSubmission(empty, context).errors.some(e => e.includes('至少配置')))
  const s = submission(); s.loadout.classId = 'titan'
  assert.ok(validateLoadout(s.loadout, context).includes('职业与子职业不匹配'))
  s.loadout.classId = 'hunter'; s.loadout.manifestVersion = 'older'
  assert.equal(validateSubmission(s, context).warnings.length, 1)
  s.loadout.weapons[0].manifestHash = 4294967295
  assert.equal(validateSubmission(s, context).valid, false)
})
test('publication matrix: closed, blocked, edited, reopened, unblocked and unlabeled', () => {
  const published = snapshot([issue()]); assert.equal(published.builds.length, 1)
  assert.equal(published.builds[0].author.login, 'guardian')
  assertSnapshot(published, repository)
  for (const state of ['closed', 'open']) {
    const blocked = snapshot([issue(1, { state, labels: ['build', 'moderation:blocked'], sender: { login: 'owner' } })])
    assert.deepEqual(blocked.issueStates, [{ number: 1, status: 'unavailable' }])
    assert.equal(blocked.builds.length, 0)
    assert.ok(!JSON.stringify(blocked).includes('电猎'))
    assert.ok(!JSON.stringify(blocked).includes('guardian'))
  }
  assert.equal(snapshot([issue(1, { state: 'closed' })]).builds.length, 0)
  assert.equal(snapshot([issue(1, { state: 'open' })]).builds.length, 1)
  assert.equal(snapshot([issue(1, { labels: [] })]).issueStates.length, 0)
  const invalid = snapshot([issue(1, { body: 'no JSON' }), issue(2)])
  assert.deepEqual(invalid.builds.map(b => b.number), [2])
  assert.equal(invalid.issueStates[0].status, 'invalid')
  assert.deepEqual(snapshot([]).builds, []) // deleted/transferred: absent from current repository
})
test('current state wins over historical event fields; PRs excluded and numeric identity stable', () => {
  const rows = [issue(1, { action: 'reopened', changes: { labels: [] }, labels: ['build', 'moderation:blocked'] }), issue(2, { pull_request: {} }), issue(3)]
  const s = snapshot(rows)
  assert.deepEqual(s.builds.map(b => b.id), [`${repository}#3`])
  const modified = structuredClone(s); modified.builds[0].issueUrl = 'https://evil.test'
  assert.throws(() => assertSnapshot(modified, repository))
  assert.throws(() => assertSnapshot(s, 'someone/else'))
})
test('client rejects stale, malformed and unavailable snapshots without replacing the previous data', async () => {
  const previous = snapshot([issue()]), config = { repository, snapshotUrl: 'https://example.test/community-builds.json' }
  const older = { ...previous, generatedAt: '2000-01-01T00:00:00Z' }
  await assert.rejects(fetchSnapshot(config, previous, async () => new Response(JSON.stringify(older))), /保留较新/)
  await assert.rejects(fetchSnapshot(config, previous, async () => new Response('{}')), /来源或版本/)
  await assert.rejects(fetchSnapshot(config, previous, async () => new Response('', { status: 503 })), /加载失败/)
  const removed = { ...previous, generatedAt: '2090-01-01T00:00:00Z', builds: [], issueStates: [{ number: 1, status: 'unavailable' }] }
  assert.equal((await fetchSnapshot(config, previous, async () => new Response(JSON.stringify(removed)))).builds.length, 0)
  assert.equal(previous.builds.length, 1)
})
test('API pagination uses all pages and refuses partial failures without sending tokens to redirects', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    const page = new URL(url).searchParams.get('page')
    return new Response(JSON.stringify([issue(Number(page))]), { headers: page === '1' ? { link: '<https://api.github.com/example?page=2>; rel="next"' } : {} })
  }
  const rows = await fetchIssues(repository, { fetchImpl, token: 'test-only' })
  assert.equal(rows.length, 2); assert.equal(calls[0].options.redirect, 'error')
  assert.ok(calls.every(c => c.url.includes('state=all')))
  await assert.rejects(fetchIssues(repository, { fetchImpl: async url => new URL(url).searchParams.get('page') === '1' ? new Response('[]', { headers: { link: '<next>; rel="next"' } }) : new Response('rate limited', { status: 403 }) }), /第 2 页/)
})
test('successful rebuild removes old generated details; failures preserve previous artifact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'community-builds-')), out = join(dir, 'out')
  try {
    await publishSnapshot(snapshot([issue()]), out)
    await writeFile(join(out, 'obsolete-detail.json'), 'old')
    await publishSnapshot(snapshot([]), out)
    await assert.rejects(readFile(join(out, 'obsolete-detail.json')), { code: 'ENOENT' })
    const before = await readFile(join(out, 'community-builds.json'), 'utf8')
    await assert.rejects(syncBuilds({ repository, outputDir: out, fetchImpl: async () => new Response('', { status: 503 }) }))
    assert.equal(await readFile(join(out, 'community-builds.json'), 'utf8'), before)
    const other = join(dir, 'other'); await mkdir(other); await writeFile(join(other, 'important.txt'), 'keep')
    await assert.rejects(publishSnapshot(snapshot([]), other), /拒绝覆盖/)
    await assert.rejects(loadValidationContext(other))
  } finally { await rm(dir, { recursive: true, force: true }) }
})
