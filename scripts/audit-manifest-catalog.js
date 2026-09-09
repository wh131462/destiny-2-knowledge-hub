import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { isPublic, isArtifactItem, isReprisedArtifact, isPlaceholder, plugHashes, compareKeys } from '../packages/manifest-catalog/index.js'

const root = new URL('../', import.meta.url)
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const digest = async path => createHash('sha256').update(await readFile(new URL(path, root))).digest('hex')
let inventory
try { if (!process.argv.includes('--verify-published')) inventory = await read('data/manifest/DestinyInventoryItemDefinition.json') }
catch (e) {
  if (e.code !== 'ENOENT') throw e
}
if (!inventory) {
  // Bulk raw snapshots are intentionally gitignored. A clean checkout can verify
  // the exact audited outputs, but must never pretend to rerun a raw-source audit.
  const evidence = await read('data/catalog/manifest-coverage-evidence.json')
  const report = await read('data/catalog/manifest-coverage.json')
  if (report.status !== 'passed' || evidence.manifestVersion !== report.manifestVersion) throw new Error('Invalid saved coverage evidence')
  for (const [path, expected] of Object.entries(evidence.digests)) if (await digest(path) !== expected) throw new Error(`目录已改变，需要完整同步后重新对账：${path}`)
  console.log(`已验证上次源数据对账的发布指纹（${evidence.manifestVersion}）；本次仅验证发布副本，未重新对账源数据。运行 manifest:sync:knowledge 可更新。`)
  process.exit(0)
}
const version = inventory.manifestVersion, inv = inventory.data, rows = [], errors = []
const sources = new Map(), catalogs = new Map()
async function source(component) {
  if (!sources.has(component)) sources.set(component, await read(`data/manifest/${component}.json`))
  const s = sources.get(component)
  if (s.manifestVersion !== version) errors.push(`版本不一致：${component}`)
  return s.data
}
async function catalog(file, key = 'items') {
  if (!catalogs.has(file)) {
    const s = await read(`data/catalog/${file}.json`), published = await read(`web/public/data/${file}.json`)
    if (s.manifestVersion !== version) errors.push(`版本不一致：${file}`)
    if (JSON.stringify(s) !== JSON.stringify(published)) errors.push(`发布副本不一致：${file}`)
    catalogs.set(file, s)
  }
  const s = catalogs.get(file)
  if (!Array.isArray(s[key])) throw new Error(`Missing collection: ${file}.${key}`)
  if (s.count !== s[key].length) errors.push(`count 与实际数量不符：${file}`)
  return s[key]
}
function compare(id, label, scope, expected, actual, key = i => i.hash) {
  const coverage = compareKeys(expected.map(key), actual.map(key))
  const status = coverage.missing.length || coverage.extra.length || coverage.duplicates ? 'failed' : 'complete-in-scope'
  if (status === 'failed') errors.push(`${label} 缺失 ${coverage.missing.length}，多余 ${coverage.extra.length}，重复 ${coverage.duplicates}`)
  rows.push({ id, label, scope, ...coverage, status,
    missingIcons: actual.filter(i => Object.hasOwn(i, 'icon') && !i.icon).length,
    missingChineseNames: actual.filter(i => i.name && !i.nameZh && !(i.en && i.name !== i.en)).length })
}
const publicItems = Object.values(inv).filter(isPublic)
compare('items', '物品定义', '全部有名称、非隐藏/黑名单物品；包含历史版本，不代表当前可获取', publicItems, await catalog('manifest-items'))
const equipment = await catalog('manifest-equipment-rich')
for (const [type, label] of [[3, '武器'], [2, '护甲']]) compare('equipment-' + type, label, '按 itemType；按 Hash 保留同名版本', publicItems.filter(i => i.itemType === type), equipment.filter(i => i.itemType === type))
compare('equipment-index', '装备浏览索引', '轻量目录必须与完整装备目录 Hash 一致', equipment, await catalog('manifest-equipment-catalog'))
compare('equipment-base', '装备基础索引', '基础与完整装备目录 Hash 一致', equipment, await catalog('manifest-equipment'))
const subclassPayload = await read('data/catalog/manifest-subclasses.json')
compare('subclasses', '子职业', '全部可装备公开子职业；池内关系由 audit:skills 逐项核对', publicItems.filter(i => i.itemType === 16 && i.equippable && [0, 1, 2].includes(i.classType) && i.sockets?.socketEntries?.length), subclassPayload.subclasses, i => i.manifestHash || i.hash)
const abilityRows = await catalog('manifest-abilities')
compare('abilities', '子职业技能具体定义', '由官方子职业插槽池生成；共享名称按具体 Hash 保留', [...new Set(subclassPayload.skills.flatMap(s => Object.values(s.manifestHashesBySubclass || {})))], abilityRows.map(i => i.hash), i => i)
compare('ghosts', '机灵外壳', '全部公开机灵外壳定义', publicItems.filter(i => i.itemType === 24), (await catalog('manifest-items')).filter(i => i.itemType === 24))
compare('plugs', '插槽词条 / 模组', '全部公开 plug 定义；武器、护甲、机灵、神器、调谐、外观等按官方 category 区分', publicItems.filter(i => i.plug), await catalog('manifest-plugs'))
const armorModScope = i => (i.plug?.plugCategoryIdentifier || '').startsWith('enhancements.') || i.plug?.plugCategoryIdentifier === 'mods' && /Enhancement Mod$/i.test(i.displayProperties?.name)
compare('mods', '护甲 / 机灵增强模组目录', 'enhancements.* 及 Enhancement Mod；其他插槽类型见完整词条目录', publicItems.filter(armorModScope), await catalog('manifest-mods'))
const rawSets = await source('DestinyPlugSetDefinition')
const sets = await catalog('manifest-plugsets', 'sets')
compare('plugsets', '插槽候选池', '全部非隐藏 / 黑名单 PlugSet', Object.values(rawSets).filter(s => !s.redacted && !s.blacklisted), sets)
for (const set of sets) {
  const expected = (rawSets[set.hash].reusablePlugItems || []).map(i => i.plugItemHash).filter(Boolean)
  if (JSON.stringify(expected) !== JSON.stringify(set.plugItemHashes)) errors.push(`PlugSet 候选被截断：${set.hash}`)
}
for (const item of equipment) for (const socket of item.socketPools.filter(s => /WEAPON PERK/i.test(s.socketCategory || ''))) {
  const expected = plugHashes(inv[item.hash].sockets.socketEntries[socket.socketIndex], rawSets)
  if (JSON.stringify(expected) !== JSON.stringify(socket.plugItemHashes)) errors.push(`武器词条被截断：${item.hash}/${socket.socketIndex}`)
}
const artifacts = await catalog('manifest-artifact')
compare('reprised-artifacts', '复刻神器', '按物品槽位与复刻预览类型识别，不使用旧赛季 singleton 表', publicItems.filter(isReprisedArtifact), artifacts.filter(a => a.kind === 'reprised'))
compare('historical-artifacts', '历史神器物品', '保留独立 Hash；不借用其他神器节点', publicItems.filter(i => isArtifactItem(i) && !isReprisedArtifact(i)), artifacts.filter(a => a.kind === 'historical'))
compare('legacy-artifacts', '旧赛季节点树', '独立留档，不可用于当前配置', Object.values(await source('DestinyArtifactDefinition')).filter(isPublic), artifacts.filter(a => a.kind === 'legacy'))
const nodeExpected = [], nodeActual = []
for (const a of artifacts.filter(a => a.kind === 'reprised')) {
  const expectedSockets = []
  for (const [index, socket] of inv[a.hash].sockets.socketEntries.entries()) {
    const expected = plugHashes(socket, rawSets).filter(h => inv[h]?.plug?.plugCategoryIdentifier === 'artifact_perks' && !isPlaceholder(inv[h]))
    if (!expected.length) continue
    expectedSockets.push(index)
    for (const hash of expected) nodeExpected.push(`${a.hash}:${index}:${hash}`)
  }
  if (a.selectionLimit !== expectedSockets.length || a.sockets.length !== expectedSockets.length) errors.push(`神器插槽数不一致：${a.hash}`)
  for (const s of a.sockets) for (const h of s.nodeHashes) {
    nodeActual.push(`${a.hash}:${s.socketIndex}:${h}`)
    if (!a.nodes.some(n => n.hash === h)) errors.push(`神器节点详情缺失：${a.hash}/${h}`)
  }
  for (const n of a.nodes) if (!n.icon || !n.nameZh || !(n.descriptionZh || n.perkDetails.some(p => p.visibility !== 2 && p.descriptionZh))) errors.push(`神器图文数据缺失：${a.hash}/${n.hash}`)
}
compare('artifact-sockets', '神器插槽与节点关系', '逐神器逐插槽完整候选池；包含高阶槽可装的低阶节点', nodeExpected, nodeActual, i => i)
const rawPerks = await source('DestinySandboxPerkDefinition')
compare('perks', 'Sandbox 效果', '全部非隐藏 / 黑名单效果，保留无名称的效果描述', Object.values(rawPerks).filter(i => !i.redacted && !i.blacklisted), await catalog('manifest-perks', 'perks'))
for (const plug of await catalog('manifest-plugs')) {
  if (JSON.stringify((inv[plug.hash].perks || []).map(p => p.perkHash)) !== JSON.stringify(plug.perkDetails.map(p => p.hash))) errors.push(`词条效果缺失：${plug.hash}`)
}
const rawItemSets = await source('DestinyEquipableItemSetDefinition')
compare('itemsets', '护甲套装', '全部公开官方套装、成员 Hash 与套装效果', Object.values(rawItemSets).filter(isPublic), await catalog('manifest-item-sets', 'sets'))
for (const set of await catalog('manifest-item-sets', 'sets')) {
  if (JSON.stringify(set.itemHashes) !== JSON.stringify(rawItemSets[set.hash].setItems || [])) errors.push(`套装成员缺失：${set.hash}`)
  if (set.perks.length !== rawItemSets[set.hash].setPerks.length) errors.push(`套装效果缺失：${set.hash}`)
}
const rawActivities = await source('DestinyActivityDefinition')
compare('activities', '活动', '全部公开具名活动；不代表本周轮换或当前可进入', Object.values(rawActivities).filter(isPublic), await catalog('manifest-activities', 'activities'))
const rawVendors = await source('DestinyVendorDefinition')
const expectedSales = Object.values(rawVendors).filter(v => v.enabled !== false && v.visible !== false).flatMap(v => (v.itemList || []).filter(i => i.itemHash).map(i => `${v.hash}:${i.vendorItemIndex}:${i.itemHash}`))
const sales = await catalog('manifest-vendor-inventory', 'entries')
compare('vendors', '供应商静态候选', '启用 / 可见供应商的完整 itemList；不是实时在售', expectedSales, sales.map(s => `${s.vendorHash}:${s.vendorItemIndex}:${s.itemHash}`), i => i)
const expectedRewards = Object.values(rawActivities).filter(isPublic).flatMap(a => (a.rewards || []).flatMap((r, ri) => (r.rewardItems || []).flatMap((i, ii) => i.itemHash ? [`${a.hash}:${ri}:${ii}:${i.itemHash}`] : [])))
compare('rewards', '活动奖励关系', '全部具名公开活动显式 rewards；不是精确遭遇战掉落表', expectedRewards, (await catalog('manifest-activity-rewards', 'entries')).map(i => `${i.activityHash}:${i.rewardIndex}:${i.itemIndex}:${i.itemHash}`), i => i)
const references = await catalog('manifest-references')
for (const component of ['DestinyClassDefinition', 'DestinyDamageTypeDefinition', 'DestinyStatDefinition', 'DestinyActivityTypeDefinition', 'DestinyItemCategoryDefinition', 'DestinyEquipmentSlotDefinition', 'DestinySocketCategoryDefinition', 'DestinySocketTypeDefinition']) {
  compare(component, component.replace('Destiny', '').replace('Definition', ''), '全部公开参考定义（含无名称 Hash）', Object.values(await source(component)).filter(i => !i.redacted && !i.blacklisted), references.filter(i => i.sourceComponent === component))
}
const locales = await read('data/catalog/manifest-locales-zh-chs.json')
if (locales.manifestVersion !== version) errors.push('中文本地化版本不一致')
const report = { schemaVersion: 1, manifestVersion: version, syncedAt: inventory.syncedAt, auditedAt: new Date().toISOString(),
  status: errors.length ? 'failed' : 'passed', scope: '已接入的官方定义与关系完整性，不等于全游戏实时状态或全部历史节点树。',
  rows, errors, limitations: ['账号拥有、解锁、实时商店与活动轮换需账号 / 实时 API，静态目录不作推断。',
    '历史神器可能仅保留物品记录；未提供独立节点树时明确标记缺失。',
    '编辑构筑、机制解读、推荐 Perk 与实测数值不属于官方全量目录，不自动认证为全面或最新。',
    'RewardMapping 当前没有非零映射，不能推导完整遭遇战掉落或概率。',
    '图标与中文名缺失数量如实登记；不伪造官方翻译或配图。',
    '游戏私有字形在界面用已知文字替代；未知字形保留编码提示，不猜测含义。原始文本不改写。'] }
for (const dir of ['data/catalog', 'web/public/data']) await writeFile(new URL(`${dir}/manifest-coverage.json`, root), JSON.stringify(report, null, 2) + '\n')
if (!errors.length) {
  const files = [...catalogs.keys(), 'manifest-subclasses', 'manifest-locales-zh-chs', 'manifest-coverage']
  const paths = files.flatMap(file => [`data/catalog/${file}.json`, `web/public/data/${file}.json`])
  const evidence = { schemaVersion: 1, manifestVersion: version, auditedAt: report.auditedAt,
    digests: Object.fromEntries(await Promise.all(paths.map(async path => [path, await digest(path)]))) }
  await writeFile(new URL('data/catalog/manifest-coverage-evidence.json', root), JSON.stringify(evidence, null, 2) + '\n')
}
console.log(JSON.stringify({ status: report.status, datasets: rows.length, rows: rows.map(r => `${r.label}: ${r.actual}/${r.expected}`), errors }, null, 2))
if (errors.length) process.exitCode = 1
