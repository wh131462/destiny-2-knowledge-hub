import test from 'node:test'
import assert from 'node:assert/strict'
import { blankDraft, addPerkCombination } from '../packages/loadout-planner/index.js'
import { createLoadoutExportModel } from '../web/src/utils/loadoutExportModel.js'
import { renderLoadoutHtml, renderLoadoutContent, collectImageUrls, exportDimensions, exportFilename } from '../packages/loadout-export/index.js'
import { allowedImageSource, embedLoadoutImages } from '../web/src/utils/loadoutImage.js'

const icon = 'https://www.bungie.net/common/destiny2_content/icons/test.png'
const png = 'data:image/png;base64,iVBORw0KGgo='
function fixture() {
  const draft = blankDraft()
  draft.name = '技能与两套 Perk 组合'
  draft.weapons[0] = addPerkCombination(draft.weapons[0])
  Object.assign(draft.weapons[0].perkCombinations[0], { name: '组合甲', notes: '甲的使用方式' })
  Object.assign(draft.weapons[0].perkCombinations[1], { name: '组合乙', notes: '乙的使用方式' })
  draft.weapons[0].perkCombinations[0].recommendedPerks.trait1 = ['甲一']
  draft.weapons[0].perkCombinations[0].recommendedPerks.trait2 = ['甲二']
  draft.weapons[0].perkCombinations[1].recommendedPerks.trait1 = ['乙一']
  draft.weapons[0].perkCombinations[1].recommendedPerks.trait2 = ['乙二']
  draft.weapons[0].notes = '武器职责'
  draft.abilities.superId = 'test-super'; draft.abilities.aspectIds = ['test-aspect']
  draft.abilities.facetIds = ['unmatched-facet']; draft.abilities.fragmentIds = ['unmatched-fragment']
  draft.artifactHash = 123; draft.artifactAssignments = [{ socketIndex: 2, nodeHash: 456 }]; draft.artifactNodeHashes = [456, 789]
  draft.mods.helmet = [{ socketIndex: 4, manifestHash: 42 }, { socketIndex: 8, manifestHash: 99 }]
  draft.ghostArmorerHash = 42
  draft.statRecommendations.weapons = { min: 150, max: 200 }
  draft.statNotes = '属性取舍'; draft.farmingNotes = '刷装建议'; draft.armorNotes = '护甲备注'; draft.notes = '循环第一步\n循环最后一步'
  const context = {
    abilities: [{ id: 'test-super', name: '超能测试' }], aspects: [{ id: 'test-aspect', name: '星相测试' }],
    mods: [{ hash: 42, name: '模组测试', energyCost: 3 }], artifacts: [{ hash: 123, name: '神器测试', nodes: [{ hash: 456, name: '节点测试' }] }],
    snapshot: { manifestVersion: 'current', syncedAt: '2026-09-08T00:00:00Z' }, iconFor: () => icon, descriptionFor: () => '效果说明', issues: ['需游戏内核对']
  }
  return { draft, context, model: createLoadoutExportModel(draft, context) }
}

test('独立导出模型包含所有 Perk 组合、全部备注，不依赖编辑器展开状态', () => {
  const { model } = fixture()
  assert.deepEqual(model.weapons[0].combinations.map(c => c.name), ['组合甲', '组合乙'])
  assert.deepEqual(model.weapons[0].combinations[0].columns.flatMap(c => c.items.map(p => p.name)), ['甲一', '甲二'])
  assert.deepEqual(model.weapons[0].combinations[1].columns.flatMap(c => c.items.map(p => p.name)), ['乙一', '乙二'])
  const html = renderLoadoutHtml(model)
  for (const text of ['甲的使用方式', '乙的使用方式', '武器职责', '属性取舍', '刷装建议', '护甲备注', '循环最后一步', '150–200']) assert.ok(html.includes(text), text)
  assert.doesNotMatch(html, /<input\b|<textarea\b|<button\b|window\.print|@media print|ant-modal|<script\b/)
})

test('未匹配的技能、旧神器节点和模组不会在长图中静默丢失', () => {
  const { model } = fixture()
  const html = renderLoadoutHtml(model)
  for (const text of ['超能测试', '星相测试', 'unmatched-facet', 'unmatched-fragment', '神器测试', '节点测试', '#789', '插槽 3', '模组测试', '#99', '插槽 9']) assert.ok(html.includes(text), text)
})

test('导出使用冻结的展示数据，后续编辑不改变已经生成的组合', () => {
  const { draft, model } = fixture()
  draft.name = '改名'; draft.weapons[0].perkCombinations[0].recommendedPerks.trait1.push('新选项')
  draft.notes = '改写备注'
  assert.equal(model.title, '技能与两套 Perk 组合')
  assert.deepEqual(model.weapons[0].combinations[0].columns[0].items.map(p => p.name), ['甲一'])
  assert.match(model.notes, /循环最后一步/)
})

test('独立 HTML 转义用户和目录文本，禁止脚本及远程资源依赖', () => {
  const { model } = fixture()
  model.title = '</title><script>alert(1)</script>'
  model.notes = '<img src=x onerror="alert(1)">\n</style><script>evil</script>'
  const html = renderLoadoutHtml(model, new Map([[icon, png]]))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'))
  assert.doesNotMatch(html, /<script\b|<img src=x|https:\/\//)
  assert.match(html, /Content-Security-Policy/)
  assert.match(html, /data:image\/png;base64/)
  assert.doesNotMatch(renderLoadoutHtml(model, new Map([[icon, 'data:image/svg+xml,<svg onload=evil()>']])), /src="data:image\/svg/)
})

test('长备注保留首尾和换行，不使用省略号截断或固定高度', () => {
  const { model } = fixture()
  model.notes = '开头\n' + '长文本说明。'.repeat(3000) + '\n末尾标记'
  const html = renderLoadoutHtml(model)
  assert.ok(html.includes(model.notes))
  assert.doesNotMatch(html, /line-clamp|text-overflow:ellipsis/)
})

test('网页预览加载官方图标并转义文本，离线导出仍只接受内嵌图片', () => {
  const { model } = fixture()
  model.title = '<img src=x onerror=alert(1)>'
  model.weapons[0].image = 'javascript:alert(1)'
  model.weapons[1].image = 'https://www.bungie.net.evil.test/common/destiny2_content/test.png'
  model.weapons[2].image = 'https://www.bungie.net/common/destiny2_content/test.png" onerror="alert(1)'
  const html = renderLoadoutContent(model, new Map(), { preview: true })
  assert.ok(html.includes(`src="${icon}"`))
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html, /<img src=x|src="javascript:|src="https:\/\/www\.bungie\.net\.evil| onerror="/)
  assert.doesNotMatch(html, /<iframe|<script|<!doctype|<style/)
  assert.doesNotMatch(renderLoadoutHtml(model), /src="https:/)
})

test('网页构筑预览只为有来源身份的条目提供详情入口', () => {
  const { model } = fixture()
  assert.equal(model.talentGroups[0].items[0].detail.kind, 'curated')
  assert.equal(model.talentGroups[0].items[0].detail.id, 'test-super')
  assert.equal(model.talentGroups[0].items[0].detail.description, '效果说明')
  assert.equal(model.artifact.detail.kind, 'artifacts')
  assert.equal(model.artifactNodes[0].detail.kind, 'plugs')
  assert.equal(model.armor[0].mods[0].detail.kind, 'mods')
  assert.equal(model.talentGroups.find(group => group.items.some(item => item.name.includes('unmatched-facet'))).items[0].detail, null)

  const preview = renderLoadoutContent(model, new Map(), { preview: true })
  assert.match(preview, /data-detail-key="curated:test-super" role="button" tabindex="0"/)
  assert.match(preview, /data-detail-key="artifacts:123" role="button" tabindex="0"/)
  assert.match(preview, /data-detail-key="plugs:456" role="button" tabindex="0"/)
  assert.match(preview, /data-detail-key="mods:42" role="button" tabindex="0"/)
  assert.doesNotMatch(renderLoadoutHtml(model), /data-detail-key=|role="button"|tabindex="0"/)
})

test('网页构筑与独立导出保持精简，详情模型仍保留核对信息', () => {
  const { model } = fixture()
  model.weapons[0].caption = '动能栏位 / 来源已登记 / 普通外观版 / 未登记锻造配方 / 赛季发行 v510'
  model.weapons[0].previewCaption = '动能栏位'
  model.weapons[0].hash = 3593598010
  model.weapons[0].detail = { key: 'equipment:3593598010', kind: 'equipment', hash: 3593598010, caption: model.weapons[0].caption }

  const preview = renderLoadoutContent(model, new Map(), { preview: true })
  assert.match(preview, />动能栏位</)
  assert.doesNotMatch(preview, /来源已登记|普通外观版|未登记锻造配方|赛季发行 v510|#3593598010/)
  assert.equal(model.weapons[0].detail.caption, model.weapons[0].caption)

  const exported = renderLoadoutHtml(model)
  assert.match(exported, />动能栏位</)
  assert.doesNotMatch(exported, /来源已登记|普通外观版|未登记锻造配方|赛季发行 v510|#3593598010/)
})

test('详情入口转义身份与可访问名称', () => {
  const { model } = fixture()
  model.talentGroups[0].items[0].detail.key = 'curated:&quot; onmouseover="bad'
  model.talentGroups[0].items[0].name = '<技能>'
  const preview = renderLoadoutContent(model, new Map(), { preview: true })
  assert.match(preview, /data-detail-key="curated:&amp;quot; onmouseover=&quot;bad"/)
  assert.match(preview, /aria-label="查看 &lt;技能&gt; 详情"/)
  assert.doesNotMatch(preview, / onmouseover="bad/)
})

test('图片去重内嵌；超大图明确拒绝 PNG 并保留 HTML 路径，不自动裁切', () => {
  const { model } = fixture()
  assert.deepEqual(collectImageUrls(model), [icon])
  assert.equal(exportDimensions(3000).pixelRatio, 1.5)
  assert.equal(exportDimensions(4135).pixelHeight, 6202)
  for (const height of [3000, 8000, 16000]) {
    const size = exportDimensions(height)
    assert.ok(size.pixelHeight <= 16000)
    assert.ok(size.pixelWidth * size.pixelHeight <= 24_000_000)
    assert.equal(size.height, height)
  }
  assert.throws(() => exportDimensions(16001), /下载完整 HTML/)
  assert.throws(() => exportDimensions(NaN), /安全尺寸/)
  assert.equal(exportFilename('推荐/组合:甲?'), '推荐_组合_甲_')
})

test('只访问官方图片及本站资源，拒绝任意外部 URL', () => {
  assert.equal(allowedImageSource(icon, 'http://localhost:9999'), true)
  assert.equal(allowedImageSource('/assets/icon.png', 'http://localhost:9999'), true)
  for (const url of ['https://evil.test/icon.png', 'https://www.bungie.net.evil.test/common/destiny2_content/a.png', 'https://www.bungie.net/Platform/Account', 'javascript:alert(1)']) assert.equal(allowedImageSource(url, 'http://localhost:9999'), false)
})

test('图片内嵌有失败清单、CORS 与无凭据约束，失败不影响其他图片', async () => {
  const good = icon, bad = icon.replace('test.png', 'missing.png')
  const requests = []
  const result = await embedLoadoutImages({ images: [{ image: good }, { image: good }, { image: bad }, { image: 'https://evil.test/a.png' }] }, {
    origin: 'http://localhost:9999', fetcher: async (url, options) => {
      requests.push(url); assert.equal(options.credentials, 'omit'); assert.equal(options.mode, 'cors')
      return { ok: url === good, status: 404, blob: async () => new Blob(['png-data'], { type: 'image/png' }) }
    }
  })
  assert.equal(result.assets.size, 1)
  assert.match(result.assets.get(good), /^data:image\/png;base64,/)
  assert.deepEqual(new Set(result.failed), new Set([bad, 'https://evil.test/a.png']))
  assert.deepEqual(requests, [good, bad])
})

test('关闭预览会取消尚未开始的图片任务', async () => {
  const controller = new AbortController(); controller.abort()
  await assert.rejects(embedLoadoutImages({ image: icon }, { signal: controller.signal, origin: 'http://localhost:9999', fetcher: () => { throw new Error('不应请求') } }), { name: 'AbortError' })
})
