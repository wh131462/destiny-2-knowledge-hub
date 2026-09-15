import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readBungieApiKey } from '../scripts/lib/bungie-api-key.js'

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'bungie-api-key-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('reads dotenv quoting and comments without changing the process environment', async t => {
  const root = await setup(t)
  const env = {}
  await writeFile(join(root, '.env'), '# Local credentials\nexport BUNGIE_API_KEY=" local-key=#value " # comment\nOTHER_SETTING=ignored\n')
  assert.equal(await readBungieApiKey({ root, env }), 'local-key=#value')
  assert.deepEqual(env, {})
})

test('uses environment, local config, then base config in priority order', async t => {
  const root = await setup(t)
  await writeFile(join(root, '.env'), 'BUNGIE_API_KEY=base-key\n')
  await writeFile(join(root, '.env.local'), 'OTHER_SETTING=ignored\n')
  assert.equal(await readBungieApiKey({ root, env: {} }), 'base-key')
  await writeFile(join(root, '.env.local'), "BUNGIE_API_KEY='local-key'\n")
  assert.equal(await readBungieApiKey({ root, env: {} }), 'local-key')
  assert.equal(await readBungieApiKey({ root, env: { BUNGIE_API_KEY: ' ci-key ' } }), 'ci-key')
  assert.equal(await readBungieApiKey({ root, env: { BUNGIE_API_KEY: '' } }), '')
  await writeFile(join(root, '.env.local'), 'BUNGIE_API_KEY=\n')
  assert.equal(await readBungieApiKey({ root, env: {} }), '')
})

test('missing configuration is optional but unreadable configuration reports an error', async t => {
  const root = await setup(t)
  assert.equal(await readBungieApiKey({ root, env: {} }), '')
  await mkdir(join(root, '.env.local'))
  await assert.rejects(readBungieApiKey({ root, env: {} }), /无法读取本地 Key 配置/)
  assert.equal(await readBungieApiKey({ root, env: { BUNGIE_API_KEY: 'ci-key' } }), 'ci-key')
})
