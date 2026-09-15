import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadRotationDefinitions } from '../scripts/lib/rotation-definitions.js'

test('definition cache resolves both languages, updates by official path and supports offline sync', async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'rotation-definitions-'))
  t.after(() => rm(cacheDir, { recursive: true, force: true }))
  let requests = []
  let version = 'v1'
  const fetcher = async url => {
    requests.push(url)
    if (url.endsWith('/Manifest/')) return { ok: true, json: async () => ({ Response: {
      version,
      jsonWorldComponentContentPaths: Object.fromEntries(['en', 'zh-chs'].map(locale => [locale, Object.fromEntries(['DestinyActivityModifierDefinition', 'DestinyMilestoneDefinition'].map(component => [component, `/common/destiny2_content/${version}/${locale}/${component}.json`]))]))
    } }) }
    return { ok: true, json: async () => ({ 1: { displayProperties: { name: url.includes('/zh-chs/') ? '挑战名称' : 'Challenge name' } } }) }
  }
  const first = await loadRotationDefinitions({ cacheDir, fetcher })
  assert.equal(requests.length, 5)
  assert.equal(first.modifiers['zh-chs'][1].displayProperties.name, '挑战名称')
  assert.equal(first.milestones.en[1].displayProperties.name, 'Challenge name')
  requests = []
  await loadRotationDefinitions({ cacheDir, fetcher })
  assert.equal(requests.length, 1)
  const offline = await loadRotationDefinitions({ cacheDir, offline: true, fetcher: () => { throw new Error('offline must not fetch') } })
  assert.deepEqual(offline, first)
  version = 'v2'
  requests = []
  const updated = await loadRotationDefinitions({ cacheDir, fetcher })
  assert.equal(requests.length, 5)
  assert.equal(updated.versions['modifiers:en'], 'v2')
  assert.equal(JSON.parse(await readFile(join(cacheDir, 'DestinyMilestoneDefinition.en.json'), 'utf8')).manifestVersion, 'v2')
})

test('unavailable definitions allow a snapshot with explicitly unresolved names', async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'rotation-definitions-'))
  t.after(() => rm(cacheDir, { recursive: true, force: true }))
  const warnings = []
  const result = await loadRotationDefinitions({ cacheDir, fetcher: async () => { throw new Error('offline') }, warn: value => warnings.push(value) })
  assert.equal(warnings.length, 1)
  assert.deepEqual(result.modifiers, { en: {}, 'zh-chs': {} })
})
