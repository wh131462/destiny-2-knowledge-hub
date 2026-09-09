import { SCHEMA, blankDraft, armorLabels, statLabels, perkColumns, MAX_PERK_COMBINATIONS } from '../loadout-planner/index.js'
import { validateLoadout } from '../loadout-planner/validation.js'

export const SUBMISSION_SCHEMA = 'd2hub-community-build-v1'
export const MAX_BODY_BYTES = 48 * 1024
const bytes = text => new TextEncoder().encode(text).length
function fail(path, message = '格式不正确') { throw new Error(`${path}：${message}`) }
function object(value, keys, path, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path)
  if (Object.keys(value).some(k => !keys.includes(k) && !optional.includes(k))) fail(path, '包含不支持的字段')
  if (keys.some(k => !Object.hasOwn(value, k))) fail(path, '缺少必需字段')
}
function string(value, max, path, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(path, `需要${required ? '非空' : ''}文本，最多 ${max} 字`)
}
function array(value, max, path) { if (!Array.isArray(value) || value.length > max) fail(path, `需要列表，最多 ${max} 项`) }
function hash(value, path, nullable = true) { if (!(nullable && value === null) && (!Number.isSafeInteger(value) || value <= 0 || value > 4294967295)) fail(path, 'Hash 需要为正整数') }
function strings(value, max, length, path) {
  array(value, max, path); value.forEach(v => string(v, length, path, true))
  if (new Set(value).size !== value.length) fail(path, '列表不能重复')
}
const perkKey = key => perkColumns.some(c => c.key === key) || /^socket-\d{1,2}$/.test(key)

// Strict, lossless validation: unlike legacy draft migration, never coerce or truncate.
export function assertLoadout(d) {
  object(d, Object.keys(blankDraft()), 'loadout')
  if (d.schema !== SCHEMA) fail('loadout.schema', '请先在编辑器导入并转换为 v3 配装')
  for (const key of ['name', 'classId', 'subclassId', 'manifestVersion', 'statNotes', 'farmingNotes', 'notes', 'armorNotes']) string(d[key], key === 'name' ? 120 : key.endsWith('Id') || key === 'manifestVersion' ? 160 : 10000, `loadout.${key}`, key === 'name')
  object(d.abilities, Object.keys(blankDraft().abilities), 'loadout.abilities')
  for (const [key, value] of Object.entries(d.abilities)) {
    if (key.endsWith('Ids')) strings(value, 20, 160, `loadout.abilities.${key}`)
    else string(value, 160, `loadout.abilities.${key}`)
  }
  array(d.weapons, 3, 'loadout.weapons')
  if (d.weapons.length !== 3) fail('loadout.weapons', '需要三个武器栏位')
  d.weapons.forEach((w, i) => {
    const path = `loadout.weapons[${i}]`
    object(w, ['manifestHash', 'perkCombinations', 'notes'], path)
    hash(w.manifestHash, path); string(w.notes, 10000, `${path}.notes`)
    array(w.perkCombinations, MAX_PERK_COMBINATIONS, `${path}.perkCombinations`)
    if (!w.perkCombinations.length) fail(path, '至少保留一组词条组合')
    const ids = new Set()
    w.perkCombinations.forEach((c, j) => {
      const cp = `${path}.perkCombinations[${j}]`
      object(c, ['id', 'name', 'recommendedPerks', 'notes'], cp, ['recommendedPerkHashes'])
      if (typeof c.id !== 'string' || !/^[\w-]{1,64}$/.test(c.id) || ids.has(c.id)) fail(cp, '组合 ID 无效或重复')
      ids.add(c.id); string(c.name, 80, `${cp}.name`); string(c.notes, 10000, `${cp}.notes`)
      for (const key of ['recommendedPerks', 'recommendedPerkHashes']) {
        const values = c[key]
        if (key === 'recommendedPerkHashes' && values === undefined) continue
        object(values, [], `${cp}.${key}`, Object.keys(values || {}).filter(perkKey))
        for (const list of Object.values(values)) {
          array(list, 30, `${cp}.${key}`)
          list.forEach(v => key === 'recommendedPerks' ? string(v, 200, `${cp}.${key}`, true) : hash(v, `${cp}.${key}`, false))
        }
      }
    })
  })
  object(d.armor, Object.keys(armorLabels), 'loadout.armor')
  object(d.mods, Object.keys(armorLabels), 'loadout.mods')
  for (const slot of Object.keys(armorLabels)) {
    if (d.armor[slot] !== null) { object(d.armor[slot], ['manifestHash'], `loadout.armor.${slot}`); hash(d.armor[slot].manifestHash, `loadout.armor.${slot}`, false) }
    array(d.mods[slot], 10, `loadout.mods.${slot}`)
    d.mods[slot].forEach(row => {
      object(row, ['socketIndex', 'manifestHash'], `loadout.mods.${slot}`)
      if (!Number.isInteger(row.socketIndex) || row.socketIndex < 0 || row.socketIndex > 99) fail(`loadout.mods.${slot}`, '插槽序号无效')
      hash(row.manifestHash, `loadout.mods.${slot}`, false)
    })
  }
  object(d.statRecommendations, Object.keys(statLabels), 'loadout.statRecommendations')
  for (const [key, range] of Object.entries(d.statRecommendations)) {
    object(range, ['min', 'max'], `loadout.statRecommendations.${key}`)
    for (const n of Object.values(range)) if (n !== null && (!Number.isInteger(n) || n < 0 || n > 200)) fail(`loadout.statRecommendations.${key}`)
    if (range.min !== null && range.max !== null && range.min > range.max) fail(`loadout.statRecommendations.${key}`, '下限不能超过上限')
  }
  hash(d.artifactHash, 'loadout.artifactHash'); hash(d.ghostArmorerHash, 'loadout.ghostArmorerHash')
  array(d.artifactNodeHashes, 30, 'loadout.artifactNodeHashes'); d.artifactNodeHashes.forEach(h => hash(h, 'loadout.artifactNodeHashes', false))
  array(d.artifactAssignments, 30, 'loadout.artifactAssignments')
  d.artifactAssignments.forEach(row => {
    object(row, ['socketIndex', 'nodeHash'], 'loadout.artifactAssignments')
    if (!Number.isInteger(row.socketIndex) || row.socketIndex < 0 || row.socketIndex > 99) fail('loadout.artifactAssignments')
    hash(row.nodeHash, 'loadout.artifactAssignments', false)
  })
  return d
}

export function assertSubmission(value) {
  object(value, ['schema', 'summary', 'activityIds', 'tags', 'loadout'], '投稿')
  if (value.schema !== SUBMISSION_SCHEMA) fail('schema', '不支持的投稿版本')
  string(value.summary, 2000, 'summary', true)
  strings(value.activityIds, 12, 160, 'activityIds'); strings(value.tags, 12, 40, 'tags')
  assertLoadout(value.loadout)
  if (bytes(JSON.stringify(value)) > MAX_BODY_BYTES) fail('投稿', '数据超过 48 KiB')
  return value
}
export function createSubmission(loadout, metadata = {}) {
  return assertSubmission({ schema: SUBMISSION_SCHEMA, summary: metadata.summary || '', activityIds: metadata.activityIds || [], tags: metadata.tags || [], loadout: JSON.parse(JSON.stringify(loadout)) })
}
export function submissionBody(value) {
  assertSubmission(value)
  const body = `<!-- d2hub-community-build-v1 -->\n这是一份社区构筑。请保留下面的数据块；在本站编辑后可替换整个正文。\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`
  if (bytes(body) > MAX_BODY_BYTES) fail('投稿正文', '超过 48 KiB，请精简备注后重试')
  return body
}
export function parseSubmission(body) {
  if (typeof body !== 'string' || bytes(body) > MAX_BODY_BYTES) fail('投稿正文', '为空或超过 48 KiB')
  const blocks = [...body.matchAll(/^```json[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm)]
  if (blocks.length !== 1) fail('投稿正文', '需要且只能有一个 json 数据块')
  let value
  try { value = JSON.parse(blocks[0][1]) } catch { fail('投稿 JSON', '无法解析，请重新复制完整投稿内容') }
  return assertSubmission(value)
}
export function validateSubmission(value, context) {
  assertSubmission(value)
  const errors = validateLoadout(value.loadout, context), d = value.loadout
  if (!d.weapons.some(w => w.manifestHash) && !Object.values(d.armor).some(Boolean) && !Object.values(d.abilities).some(v => v.length)) errors.push('请至少配置一项装备或天赋')
  if (value.activityIds.some(id => !context.activities.some(a => a.id === id))) errors.push('activityIds：包含目录中不存在的活动')
  const warnings = d.manifestVersion !== context.manifestVersion ? ['投稿配装版本与校验快照不同，请核对当前配置。'] : []
  return { valid: errors.length === 0, errors, warnings }
}
export function assertRepository(repository) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(repository) || ['.', '..'].includes(repository.split('/')[1])) fail('投稿仓库', '需要 owner/repo')
  return repository
}
export function issueUrl(repository, number) {
  assertRepository(repository)
  if (!Number.isSafeInteger(number) || number <= 0) fail('Issue 编号')
  return `https://github.com/${repository}/issues/${number}`
}
export function newIssueUrl(repository, name) {
  assertRepository(repository)
  return `https://github.com/${repository}/issues/new?${new URLSearchParams({ template: 'build.md', title: String(name).slice(0, 120) })}`
}

export function buildSnapshot(issues, context, { repository, generatedAt = new Date().toISOString(), validatorRevision = 'local' }) {
  assertRepository(repository)
  if (!Array.isArray(issues)) fail('GitHub 响应')
  const builds = [], issueStates = [], seen = new Set()
  for (const issue of issues) {
    if (issue.pull_request) continue
    const url = issueUrl(repository, issue.number)
    if (seen.has(issue.number)) continue
    seen.add(issue.number)
    if (!Array.isArray(issue.labels) || !['open', 'closed'].includes(issue.state)) fail('Issue 元数据')
    const labels = issue.labels.map(l => typeof l === 'string' ? l : l.name)
    if (!labels.includes('build')) continue
    if (issue.state !== 'open' || labels.includes('moderation:blocked')) {
      issueStates.push({ number: issue.number, status: 'unavailable' }); continue
    }
    let submission, validation
    try {
      submission = parseSubmission(issue.body)
      validation = validateSubmission(submission, context)
    } catch (e) { validation = { valid: false, errors: [e.message] } }
    if (!validation.valid) { issueStates.push({ number: issue.number, status: 'invalid', errors: validation.errors }); continue }
    if (!Number.isSafeInteger(issue.user?.id) || !/^[a-z\d-]+(?:\[bot\])?$/i.test(issue.user?.login || '') || !Number.isFinite(Date.parse(issue.updated_at)) || !Number.isFinite(Date.parse(issue.created_at)) || typeof issue.node_id !== 'string') fail('Issue 身份元数据')
    builds.push({
      id: `${repository}#${issue.number}`, number: issue.number, nodeId: issue.node_id, issueUrl: url,
      author: { id: issue.user.id, login: issue.user.login, displayName: issue.user.login, avatarUrl: `https://avatars.githubusercontent.com/u/${issue.user.id}?s=80` },
      createdAt: issue.created_at, updatedAt: issue.updated_at, submission, warnings: validation.warnings
    })
    issueStates.push({ number: issue.number, status: 'public' })
  }
  builds.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.number - a.number)
  issueStates.sort((a, b) => a.number - b.number)
  return { schemaVersion: 1, generatedAt, sourceRepository: repository, manifestVersion: context.manifestVersion, validatorRevision, builds, issueStates }
}

export function assertSnapshot(value, repository) {
  if (!value || value.schemaVersion !== 1 || value.sourceRepository !== repository || !Number.isFinite(Date.parse(value.generatedAt)) || typeof value.manifestVersion !== 'string' || typeof value.validatorRevision !== 'string') fail('社区快照', '来源或版本不正确')
  array(value.builds, 100000, 'builds'); array(value.issueStates, 100000, 'issueStates')
  const seen = new Set(), states = new Map()
  for (const state of value.issueStates) {
    issueUrl(repository, state.number)
    if (states.has(state.number) || !['public', 'invalid', 'unavailable'].includes(state.status)) fail('issueStates')
    if (state.errors !== undefined) strings(state.errors, 200, 500, 'issueStates.errors')
    states.set(state.number, state.status)
  }
  for (const build of value.builds) {
    if (build.issueUrl !== issueUrl(repository, build.number) || build.id !== `${repository}#${build.number}` || seen.has(build.number) || states.get(build.number) !== 'public') fail('builds', '记录身份或状态不一致')
    seen.add(build.number); assertSubmission(build.submission)
    if (!Number.isSafeInteger(build.author?.id) || !/^[a-z\d-]+(?:\[bot\])?$/i.test(build.author?.login || '') || !Number.isFinite(Date.parse(build.updatedAt)) || !Number.isFinite(Date.parse(build.createdAt))) fail('builds', '作者或更新时间无效')
    strings(build.warnings, 100, 500, 'builds.warnings')
  }
  if ([...states].some(([number, status]) => status === 'public' && !seen.has(number))) fail('issueStates', '公开记录缺失')
  return value
}
