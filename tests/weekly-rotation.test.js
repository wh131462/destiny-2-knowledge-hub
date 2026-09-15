import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { filterRotationRecords, normalizeMilestones, remainingTime, rotationQuery, validateMilestonesPayload, validateRotationSnapshot, snapshotStatus, summarizeRotation } from '../packages/weekly-rotation/index.js'

const run = promisify(execFile)

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
  const snapshot = normalizeMilestones(mapped, { manifestActivities: [{ hash: 42, name: 'The Glassway', nameZh: '玻璃小径', isPlaylist: true }], manifestVersion: 'test-manifest' })
  assert.equal(snapshot.activities.length, 1)
  assert.equal(snapshot.activities[0].nameZh, '玻璃小径')
  assert.equal(snapshot.activities[0].category, 'pve')
  assert.equal(snapshot.week.end, '2026-09-16T17:00:00.000Z')
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
  const mock = `import assert from 'node:assert/strict';
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://www.bungie.net/Platform/Destiny2/Milestones/');
      assert.equal(options.headers['X-API-Key'], ${JSON.stringify(apiKey)});
      return { ok: true, json: async () => (${JSON.stringify(mapped)}) };
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
