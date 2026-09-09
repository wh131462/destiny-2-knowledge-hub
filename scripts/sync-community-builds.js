import { parseArgs } from 'node:util'
import { syncBuilds } from '../packages/community-builds/sync.js'

const { values } = parseArgs({ options: {
  repository: { type: 'string' }, out: { type: 'string', default: 'dist/community' },
  fixture: { type: 'string' }, 'catalog-dir': { type: 'string' }, revision: { type: 'string', default: 'local' }, help: { type: 'boolean' }
} })
if (values.help) {
  console.log('node scripts/sync-community-builds.js --repository owner/repo [--out dist/community] [--fixture issues.json] [--revision commit-sha] [--catalog-dir path]\nGH_TOKEN or GITHUB_TOKEN is used for API reads; never pass tokens as command arguments.')
} else {
  try {
    const snapshot = await syncBuilds({ repository: values.repository, outputDir: values.out, fixture: values.fixture, catalogDir: values['catalog-dir'], validatorRevision: values.revision, token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN })
    console.log(`已生成 ${snapshot.builds.length} 份公开构筑；${snapshot.issueStates.filter(s => s.status === 'invalid').length} 份投稿需修复。`)
    for (const state of snapshot.issueStates.filter(s => s.status === 'invalid')) console.log(`#${state.number}: ${state.errors.join('；')}`)
  } catch (e) { console.error(e.message); process.exitCode = 1 }
}
