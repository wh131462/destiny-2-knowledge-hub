const clean = value => typeof value === 'string' ? value.trim() : ''
const nameKey = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLowerCase()

// Keep exact activity rewards separate from guide examples: neither is a live drop guarantee.
export function createRewardResolver({ items = [], entries = [] } = {}) {
  const byHash = new Map(items.map(item => [String(item.hash), item]))
  const equipmentByName = new Map()
  for (const item of items) {
    if (![2, 3].includes(item.itemType) || item.redacted || item.blacklisted) continue
    const key = nameKey(item.name)
    if (!key) continue
    if (!equipmentByName.has(key)) equipmentByName.set(key, [])
    equipmentByName.get(key).push(item)
  }
  const byActivity = new Map()
  for (const entry of entries) {
    const key = String(entry.activityHash)
    if (!byActivity.has(key)) byActivity.set(key, [])
    byActivity.get(key).push(entry)
  }
  const describe = item => ({
    name: clean(item?.name), nameZh: clean(item?.nameZh), icon: clean(item?.icon),
    description: clean(item?.description), descriptionZh: clean(item?.descriptionZh)
  })
  return (activityHash, guide) => {
    const official = []
    const seen = new Set()
    for (const entry of byActivity.get(String(activityHash)) || []) {
      const key = `${entry.itemHash}:${entry.quantity}:${Boolean(entry.conditional)}`
      if (seen.has(key)) continue
      seen.add(key)
      const item = byHash.get(String(entry.itemHash))
      if (!item || item.redacted || item.blacklisted || (!clean(item.name) && !clean(item.nameZh))) continue
      official.push({
        ...describe(item), itemHash: entry.itemHash,
        quantity: entry.quantity > 0 ? entry.quantity : null,
        conditional: Boolean(entry.conditional), source: 'activity-definition'
      })
    }
    const examples = []
    const seenNames = new Set()
    for (const rewardName of guide?.rewards || []) {
      const key = nameKey(rewardName)
      if (!key || seenNames.has(key)) continue
      seenNames.add(key)
      const candidates = (equipmentByName.get(key) || []).slice().sort((a, b) => a.hash - b.hash)
      const item = candidates[0]
      examples.push({
        name: clean(item?.name) || clean(rewardName), nameZh: clean(item?.nameZh), icon: clean(item?.icon),
        itemHashes: candidates.map(candidate => candidate.hash), source: 'editorial-guide'
      })
    }
    return { official, examples, note: clean(guide?.rewardNote), reference: guide?.reference || null }
  }
}
