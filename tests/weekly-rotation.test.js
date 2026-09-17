import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { filterRotationRecords, normalizeMilestones, remainingTime, rotationQuery, validateMilestonesPayload, validateRotationSnapshot, snapshotStatus, summarizeRotation, weeklyResetWindow, rotationTimeLabel, nextRotationBoundary, rotationRecordStatus, selectRotationSnapshot, groupRotationRecords } from '../packages/weekly-rotation/index.js'
import { createWeeklyRotationMiddleware } from '../scripts/lib/weekly-rotation-dev.js'

const run = promisify(execFile)

function invokeMiddleware(middleware, url = '/data/weekly-rotation.json') {
  return new Promise((resolve, reject) => {
    const headers = {}
    const response = {
      statusCode: 200,
      setHeader(name, value) { headers[name.toLowerCase()] = value },
      end(body) { resolve({ body: JSON.parse(body), headers, statusCode: this.statusCode }) }
    }
    Promise.resolve(middleware({ method: 'GET', url }, response, () => reject(new Error('middleware unexpectedly called next')))).catch(reject)
  })
}

function rotationSnapshot(startDate, endDate, generatedAt = startDate) {
  return normalizeMilestones({ Response: {
    weekly: {
      milestoneHash: 1001,
      displayProperties: { name: 'Nightfall' },
      startDate,
      endDate,
      activities: [{ activityHash: 42 }]
    }
  } }, { generatedAt })
}

const mapped = {
  Response: {
    nightfall: {
      milestoneHash: 1001,
      displayProperties: { name: 'Nightfall' },
      startDate: '2026-09-09T17:00:00Z', endDate: '2026-09-16T17:00:00Z',
      activities: [{ activityHash: 42, difficulty: 'Legend', champions: ['Barrier'], modifiers: ['Solar'] }]
    },
    duplicate: {
      milestoneHash: 1001,
      displayProperties: { name: 'Nightfall' },
      startDate: '2026-09-09T17:00:00Z', endDate: '2026-09-16T17:00:00Z',
      activities: [{ activityHash: 42 }]
    }
  }
}

test('normalizes milestones, deduplicates records, and reports missing categories', () => {
  const snapshot = normalizeMilestones(mapped, { manifestActivities: [{ hash: 42, name: 'The Glassway', nameZh: '玻璃小径', isPlaylist: true }], manifestVersion: 'test-manifest', generatedAt: '2026-09-12T00:00:00Z' })
  assert.equal(snapshot.activities.length, 1)
  assert.equal(snapshot.activities[0].nameZh, '玻璃小径')
  assert.equal(snapshot.activities[0].category, 'pve')
  assert.equal(snapshot.week.end, '2026-09-15T17:00:00.000Z')
  assert.equal(snapshot.source.manifestVersion, 'test-manifest')
  assert.equal(validateRotationSnapshot(snapshot).valid, true)
  assert.equal(snapshotStatus(snapshot, new Date('2026-09-12T00:00:00Z')), 'partial')
})

test('composable helpers restore query state, filter records, and expire countdowns', () => {
  assert.deepEqual(rotationQuery({ category: 'raid', difficulty: 'Legend', status: 'partial' }), { category: 'raid', difficulty: 'Legend', status: 'partial' })
  assert.deepEqual(rotationQuery({}), { category: 'all', difficulty: 'all', status: 'all' })
  assert.deepEqual(rotationQuery({ category: 'invalid', status: 'invalid' }), { category: 'all', difficulty: 'all', status: 'all' })
  const records = [
    { id: 'a', category: 'raid', difficulty: 'Legend' },
    { id: 'b', category: 'pve', difficulty: 'Normal' }
  ]
  assert.deepEqual(filterRotationRecords(records, { category: 'raid', difficulty: 'all', status: 'partial' }, 'partial').map(item => item.id), ['a'])
  assert.deepEqual(filterRotationRecords(records, { category: 'all', difficulty: 'Legend', status: 'fresh' }, 'partial'), [])
  assert.deepEqual(remainingTime('2026-09-12T01:00:00Z', '2026-09-12T00:00:00Z'), { expired: false, days: 0, hours: 1, minutes: 0, totalMs: 3_600_000 })
  assert.equal(remainingTime('2026-09-12T00:00:00Z', '2026-09-12T00:00:01Z').expired, true)
  assert.equal(remainingTime(null), null)
})

test('rejects malformed source payloads before normalization', () => {
  assert.equal(validateMilestonesPayload({ Response: { bad: { startDate: 'yesterday', activities: 'bad' } } }).valid, false)
  assert.equal(validateMilestonesPayload({ Response: {} }).valid, true)
  assert.equal(validateMilestonesPayload({ Response: [{ startDate: '2026-09-16T17:00:00Z', endDate: '2026-09-09T17:00:00Z' }] }).valid, false)
})

test('handles array responses, strict snapshot validation, and avoids blank editorial matches', () => {
  const snapshot = normalizeMilestones({ Response: [{ milestoneHash: 7, startDate: '2026-09-09T17:00:00Z', endDate: '2026-09-16T17:00:00Z', activities: [{ activityHash: 8 }] }] }, {
    editorialActivities: [{ id: 'first', name: 'Some Guide' }]
  })
  assert.equal(snapshot.activities.length, 1)
  assert.equal(snapshot.activities[0].guideId, null)
  assert.equal(validateRotationSnapshot({}).valid, false)
  assert.doesNotThrow(() => validateRotationSnapshot({ schema: 'bad', status: 'bad', activities: null, missingCategories: [] }))
})

test('summary uses localized names and marks expired snapshots', () => {
  const snapshot = normalizeMilestones(mapped, { generatedAt: '2026-09-17T00:00:00Z' })
  assert.equal(snapshotStatus({ ...snapshot, status: 'fresh' }, new Date('2026-09-17T00:00:00Z')), 'stale')
  assert.match(summarizeRotation(snapshot, { locale: 'en' }), /Destiny 2 weekly rotation/)
  const filtered = summarizeRotation(snapshot, { locale: 'en', records: [snapshot.activities[0]] })
  assert.equal(filtered.split('\n').filter(line => line.startsWith('- ')).length, 1)
})

test('sync script writes fixture output and preserves a stale artifact on failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'weekly-rotation-'))
  const out = join(dir, 'weekly-rotation.json')
  const fixture = join(dir, 'fixture.json')
  try {
    await writeFile(fixture, JSON.stringify(mapped))
    await run(process.execPath, ['scripts/sync-weekly-rotation.js', `--fixture=${fixture}`, `--out=${out}`], { cwd: process.cwd() })
    const before = JSON.parse(await readFile(out, 'utf8'))
    assert.equal(before.schema, 'd2hub-weekly-rotation-v1')
    await writeFile(fixture, JSON.stringify({ Response: { broken: { startDate: 'bad', activities: 'bad' } } }))
    await assert.rejects(run(process.execPath, ['scripts/sync-weekly-rotation.js', `--fixture=${fixture}`, `--out=${out}`], { cwd: process.cwd() }), /轮换同步失败/)
    const after = JSON.parse(await readFile(out, 'utf8'))
    assert.equal(after.status, 'stale')
    assert.equal(after.activities.length, before.activities.length)
    const optional = await run(process.execPath, ['scripts/sync-weekly-rotation.js', '--optional', `--fixture=${fixture}`, `--out=${out}`])
    assert.match(optional.stderr, /继续启动本地站点/)
    assert.equal(JSON.parse(await readFile(out, 'utf8')).activities.length, before.activities.length)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('local startup skips missing credentials without changing the existing snapshot', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'weekly-rotation-dev-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const out = join(dir, 'weekly-rotation.json')
  const original = JSON.stringify(normalizeMilestones(mapped))
  await writeFile(out, original)
  const result = await run(process.execPath, ['scripts/sync-weekly-rotation.js', '--optional', `--out=${out}`], {
    env: { ...process.env, BUNGIE_API_KEY: '' }
  })
  assert.match(result.stdout, /未配置 BUNGIE_API_KEY/)
  assert.equal(await readFile(out, 'utf8'), original)
})

test('local startup fetches and publishes rotation from the web directory without exposing the key', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'weekly-rotation-dev-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const out = join(dir, 'weekly-rotation.json')
  const apiKey = 'test-dev-key'
  const liveMapped = structuredClone(mapped)
  const week = weeklyResetWindow()
  for (const milestone of Object.values(liveMapped.Response)) Object.assign(milestone, { startDate: week.start, endDate: week.end })
  const mock = `import assert from 'node:assert/strict';
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://www.bungie.net/Platform/Destiny2/Milestones/');
      assert.equal(options.headers['X-API-Key'], ${JSON.stringify(apiKey)});
      return { ok: true, json: async () => (${JSON.stringify(liveMapped)}) };
    };`
  const script = fileURLToPath(new URL('../scripts/sync-weekly-rotation.js', import.meta.url))
  const result = await run(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(mock)}`, script, '--optional', `--out=${out}`], {
    cwd: fileURLToPath(new URL('../web', import.meta.url)),
    env: { ...process.env, BUNGIE_API_KEY: apiKey }
  })
  const published = await readFile(out, 'utf8')
  assert.equal(JSON.parse(published).activities.length, 1)
  assert.equal(validateRotationSnapshot(JSON.parse(published)).valid, true)
  assert.match(result.stdout, /"ok":true/)
  assert.equal(`${result.stdout}${result.stderr}${published}`.includes(apiKey), false)
})

test('official activity types classify named raids, dungeons and exotic missions before generic PvE', () => {
  const payload = { Response: { ...mapped.Response, nightfall: { ...mapped.Response.nightfall, activities: [{ activityHash: 1 }, { activityHash: 2 }, { activityHash: 3 }, { activityHash: 4 }] } } }
  delete payload.Response.duplicate
  const snapshot = normalizeMilestones(payload, {
    manifestActivities: [
      { hash: 1, name: "King's Fall: Standard", activityTypeHash: 2043403989 },
      { hash: 2, name: 'Prophecy', activityTypeHash: 608898761 },
      { hash: 3, name: 'Presage', activityTypeHash: 1227821118 },
      { hash: 4, name: 'Deep Stone Crypt', activityTypeHash: 999 }
    ],
    editorialActivities: [{ id: 'raid-deep-stone-crypt', name: '深岩墓室', en: 'Deep Stone Crypt', category: 'raid' }]
  })
  assert.deepEqual(snapshot.activities.map(item => item.category), ['raid', 'dungeon', 'exotic-mission', 'raid'])
  assert.equal(snapshot.activities[0].difficulty, 'Standard')
  assert.equal(snapshot.activities[1].difficulty, null)
})

test('resolves bilingual modifiers and milestone names, preserves unknown hashes without showing them as names', () => {
  const snapshot = normalizeMilestones({ Response: {
    raid: { ...mapped.Response.nightfall, activities: [{ activityHash: 42, modifierHashes: [3577304467, 3809788899, 1783825372, 999] }] },
    quest: { milestoneHash: 3281608164, availableQuests: [{ questItemHash: 1276528297 }] }
  } }, {
    definitions: {
      modifiers: {
        en: { 3577304467: { displayProperties: { name: 'The Grass Is Always Greener', description: 'A challenge awaits…' } }, 1783825372: { displayProperties: { name: '' } } },
        'zh-chs': { 3577304467: { displayProperties: { name: '邻家的草分外青', description: '一项挑战等待着你…' } }, 3809788899: { displayProperties: { name: '冰影激涌', description: '冰影伤害提升{var:2189146210}%。\uE043' } } }
      },
      milestones: { en: { 3281608164: { displayProperties: { name: 'Purification' } } }, 'zh-chs': { 3281608164: { displayProperties: { name: '净化', description: '完成一个囊肿。' } } } }
    }
  })
  const [raid, quest] = snapshot.activities
  assert.equal(raid.modifierDetails[0].nameZh, '邻家的草分外青')
  assert.equal(raid.modifierDetails[0].kind, 'challenge')
  assert.equal(raid.modifierDetails[1].nameZh, '冰影激涌')
  assert.doesNotMatch(raid.modifierDetails[1].descriptionZh, /2189146210|\{var:|[\uE000-\uF8FF]/)
  assert.equal(raid.modifierDetails[2].hidden, true)
  assert.equal(raid.modifierDetails[3].resolved, false)
  assert.equal(raid.modifierDetails[3].name, '')
  assert.equal(raid.modifierDetails[3].hash, 999)
  assert.equal(quest.nameZh, '净化')
  assert.equal(quest.descriptionZh, '完成一个囊肿。')
  assert.equal(quest.activityHash, null)
  assert.equal(quest.startDate, null)
  assert.equal(quest.category, 'other')
})

test('weekly windows switch at Tuesday 17:00 UTC including year and timezone boundaries', () => {
  assert.deepEqual(weeklyResetWindow('2026-09-15T16:59:59Z'), { start: '2026-09-08T17:00:00.000Z', end: '2026-09-15T17:00:00.000Z' })
  assert.deepEqual(weeklyResetWindow('2026-09-16T01:00:00+08:00'), { start: '2026-09-15T17:00:00.000Z', end: '2026-09-22T17:00:00.000Z' })
  assert.deepEqual(weeklyResetWindow('2027-01-01T00:00:00Z'), { start: '2026-12-29T17:00:00.000Z', end: '2027-01-05T17:00:00.000Z' })
  assert.equal(weeklyResetWindow('invalid'), null)
})

test('countdowns distinguish ended, upcoming, missing/invalid dates, and sub-minute resets in both languages', () => {
  const now = '2026-09-15T17:00:00Z'
  assert.equal(rotationTimeLabel({ endDate: now }, now), '本期已结束')
  assert.equal(rotationTimeLabel({ endDate: now }, now, 'en'), 'Period ended')
  assert.equal(rotationTimeLabel({ endDate: '2026-09-15T17:00:30Z' }, now), '即将重置')
  assert.equal(rotationTimeLabel({ endDate: '2026-09-15T18:00:00Z' }, now), '剩余 1小时 0分')
  assert.equal(rotationTimeLabel({ endDate: '2026-09-15T18:00:00Z' }, now, 'en'), '1h 0m left')
  assert.equal(rotationTimeLabel({ startDate: '2026-09-16T17:00:00Z', endDate: '2026-09-22T17:00:00Z' }, now), '尚未开始')
  for (const item of [{}, { endDate: 'bad' }, { startDate: 'bad', endDate: now }, { startDate: now, endDate: now }]) {
    assert.equal(rotationTimeLabel(item, now), '周期未提供')
  }
  assert.equal(remainingTime('invalid', now), null)
})

test('long events do not stretch the weekly window or hide expired daily records', () => {
  const now = '2026-09-17T10:00:00Z'
  const snapshot = normalizeMilestones({ Response: {
    daily: { ...mapped.Response.nightfall, milestoneHash: 1, startDate: '2026-09-15T17:00:00Z', endDate: '2026-09-16T17:00:00Z' },
    event: { ...mapped.Response.nightfall, milestoneHash: 2, startDate: '2026-08-01T17:00:00Z', endDate: '2026-10-01T17:00:00Z' }
  } }, { generatedAt: '2026-09-17T09:00:00Z' })
  assert.deepEqual(snapshot.week, weeklyResetWindow(now))
  assert.equal(snapshotStatus(snapshot, now), 'partial')
  const rows = snapshot.activities.map(item => ({ ...item, dataStatus: rotationRecordStatus(item, snapshotStatus(snapshot, now), now) }))
  assert.deepEqual(filterRotationRecords(rows, { status: 'stale' }).map(item => item.milestoneHash), [1])
  assert.deepEqual(filterRotationRecords(rows, { status: 'partial' }).map(item => item.milestoneHash), [2])
  assert.equal(snapshotStatus(snapshot, '2026-09-22T17:00:00Z'), 'stale')
  assert.equal(nextRotationBoundary(snapshot, now), Date.parse('2026-09-22T17:00:00Z'))
  snapshot.activities[1].endDate = '2026-09-17T17:00:00Z'
  assert.equal(nextRotationBoundary(snapshot, now), Date.parse('2026-09-17T17:00:00Z'))
})

test('snapshots fetched after reset cannot relabel expired activities as current', () => {
  const snapshot = rotationSnapshot('2026-09-08T17:00:00Z', '2026-09-15T17:00:00Z', '2026-09-17T10:00:00Z')
  assert.equal(snapshotStatus(snapshot, '2026-09-17T10:01:00Z'), 'stale')
  assert.equal(validateRotationSnapshot({ ...snapshot, activities: [null] }).valid, false)
  snapshot.activities[0].startDate = snapshot.activities[0].endDate
  assert.equal(validateRotationSnapshot(snapshot).valid, false)
})

test('snapshot selection retains useful data on empty, older, or expired replacements', () => {
  const now = '2026-09-17T10:00:00Z'
  const previous = rotationSnapshot('2026-09-15T17:00:00Z', '2026-09-22T17:00:00Z', '2026-09-17T09:00:00Z')
  const expired = rotationSnapshot('2026-09-08T17:00:00Z', '2026-09-15T17:00:00Z', now)
  assert.equal(selectRotationSnapshot(previous, { ...previous, activities: [], generatedAt: now }, now), previous)
  assert.equal(selectRotationSnapshot(previous, { ...previous, generatedAt: '2026-09-16T09:00:00Z' }, now), previous)
  assert.equal(selectRotationSnapshot(previous, expired, now), previous)
  const next = { ...previous, generatedAt: now }
  assert.equal(selectRotationSnapshot(previous, next, now), next)
  const retainedAfterFailure = { ...next, status: 'stale', error: 'Upstream unavailable' }
  assert.equal(selectRotationSnapshot(previous, retainedAfterFailure, now), retainedAfterFailure)
})

test('rotation groups prioritize current and expiring activities across categories and retain old records last', () => {
  const now = '2026-09-17T10:00:00Z'
  const current = { category: 'raid', startDate: '2026-09-15T17:00:00Z', endDate: '2026-09-22T17:00:00Z', dataStatus: 'partial' }
  const rows = [
    { ...current, id: 'expired-raid', endDate: '2026-09-16T17:00:00Z' },
    { ...current, id: 'raid' },
    { ...current, id: 'unknown', endDate: null },
    { ...current, id: 'future', startDate: '2026-09-18T17:00:00Z' },
    { ...current, id: 'ending-soon', category: 'pvp', endDate: '2026-09-17T17:00:00Z' },
    { ...current, id: 'retained-pvp', category: 'pvp', dataStatus: 'stale', rewards: ['Reward'] }
  ]
  const before = structuredClone(rows)
  const groups = groupRotationRecords(rows, now)
  assert.deepEqual(groups.map(group => group.key), ['active:pvp', 'active:raid', 'upcoming:raid', 'unknown:raid', 'stale:pvp', 'stale:raid'])
  assert.deepEqual(groups.flatMap(group => group.items).map(item => item.id), ['ending-soon', 'raid', 'future', 'unknown', 'retained-pvp', 'expired-raid'])
  assert.deepEqual(rows, before)
  assert.deepEqual(groupRotationRecords([], now), [])
})

test('rotation relevance uses available reward, challenge and guide information with stable ties', () => {
  const current = { category: 'raid', endDate: '2026-09-22T17:00:00Z', dataStatus: 'partial' }
  const rows = [
    { ...current, id: '10', difficulty: 'Master', modifiers: [123], rewards: [123, '456'] },
    { ...current, id: '2', difficulty: 'Standard' },
    { ...current, id: 'guide', guideId: 'raid-guide' },
    { ...current, id: 'challenge', modifierDetails: [{ kind: 'challenge', nameZh: '挑战' }] },
    { ...current, id: 'reward', rewardDetails: { official: [{ nameZh: '突袭装备' }] } },
    { ...current, id: 'complete', rewards: ['Raid Gear'], modifierDetails: [{ kind: 'challenge', name: 'Challenge' }], guideId: 'raid-guide' }
  ]
  const ordered = groupRotationRecords(rows, '2026-09-17T10:00:00Z')[0].items.map(item => item.id)
  assert.deepEqual(ordered, ['complete', 'reward', 'challenge', 'guide', '2', '10'])
  assert.deepEqual(groupRotationRecords([...rows].reverse(), '2026-09-17T10:00:00Z')[0].items.map(item => item.id), ordered)
  assert.deepEqual(groupRotationRecords(filterRotationRecords(rows, { difficulty: 'Master' }), '2026-09-17T10:00:00Z')[0].items.map(item => item.id), ['10'])
})

test('dev requests synchronize stale data once, bypass caches, and throttle concurrent refreshes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'rotation-middleware-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const output = join(dir, 'snapshot.json')
  let now = Date.parse('2026-09-17T10:00:00Z')
  const old = rotationSnapshot('2026-09-08T17:00:00Z', '2026-09-15T17:00:00Z')
  await writeFile(output, JSON.stringify(old))
  let calls = 0
  const middleware = createWeeklyRotationMiddleware({ output, clock: () => now, sync: async () => {
    calls++
    await new Promise(resolve => setTimeout(resolve, 10))
    await writeFile(output, JSON.stringify(rotationSnapshot('2026-09-15T17:00:00Z', '2026-09-22T17:00:00Z', new Date(now).toISOString())))
  } })
  const responses = await Promise.all([invokeMiddleware(middleware), invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=1')])
  assert.equal(calls, 1)
  for (const response of responses) {
    assert.equal(response.statusCode, 200)
    assert.equal(response.headers['cache-control'], 'no-store')
  }
  assert.deepEqual(responses[0].body.activities, old.activities)
  assert.equal(responses[0].body.refreshing, true)
  assert.equal(snapshotStatus(responses[1].body, new Date(now)), 'partial')
  await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=2')
  assert.equal(calls, 1)
  now += 60_000
  await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=3')
  assert.equal(calls, 2)
  now += 300_000
  assert.equal((await invokeMiddleware(middleware)).body.refreshing, true)
  await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=4')
  assert.equal(calls, 3)
})

test('dev sync failure retains activities and retries after cooldown; missing data returns 503', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'rotation-middleware-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const output = join(dir, 'snapshot.json')
  let now = Date.parse('2026-09-17T10:00:00Z')
  const previous = rotationSnapshot('2026-09-08T17:00:00Z', '2026-09-15T17:00:00Z')
  await writeFile(output, JSON.stringify(previous))
  let calls = 0
  const middleware = createWeeklyRotationMiddleware({ output, clock: () => now, sync: async () => { calls++; throw new Error('Upstream unavailable') } })
  const response = await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=1')
  assert.deepEqual(response.body.activities, previous.activities)
  assert.equal(response.body.error, 'Upstream unavailable')
  await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=2')
  assert.equal(calls, 1)
  now += 60_000
  await invokeMiddleware(middleware, '/data/weekly-rotation.json?refresh=3')
  assert.equal(calls, 2)
  await rm(output)
  now += 60_000
  assert.equal((await invokeMiddleware(middleware)).statusCode, 503)
})

test('CI fallback survives failed sync and does not roll back to an older checked-in artifact', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'rotation-ci-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const output = join(dir, 'published.json')
  const fallback = join(dir, 'checked-in.json')
  const published = rotationSnapshot('2026-09-15T17:00:00Z', '2026-09-22T17:00:00Z', '2026-09-17T09:00:00Z')
  await writeFile(output, JSON.stringify(published))
  await writeFile(fallback, JSON.stringify(rotationSnapshot('2026-09-08T17:00:00Z', '2026-09-15T17:00:00Z')))
  await run(process.execPath, ['scripts/sync-weekly-rotation.js', '--optional', `--out=${output}`, `--fallback=${fallback}`, '--fixture=data/fixtures/weekly-rotation-empty.json'])
  const retained = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(retained.generatedAt, published.generatedAt)
  assert.deepEqual(retained.activities, published.activities)
  assert.equal(retained.status, 'stale')
  await rm(output)
  await run(process.execPath, ['scripts/sync-weekly-rotation.js', '--optional', `--out=${output}`, `--fallback=${fallback}`], { env: { ...process.env, BUNGIE_API_KEY: '' } })
  assert.equal(JSON.parse(await readFile(output, 'utf8')).activities.length, 1)
})
