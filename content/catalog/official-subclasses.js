import catalog from '../../data/catalog/manifest-subclasses.json' with { type: 'json' }

export const officialSubclasses = catalog.subclasses
export const subclassSnapshot = { manifestVersion: catalog.manifestVersion, syncedAt: catalog.syncedAt }

// Editorial aliases/mechanic tags remain useful, but never define membership.
// Facts, descriptions, variants and allowed pools come from the generated catalog.
export function completeSkills(curated, kinds) {
  const annotations = new Map(curated.map(item => [item.id, item]))
  return catalog.skills.filter(item => kinds.includes(item.kind)).map(item => {
    const previous = annotations.get(item.id)
    return {
      ...previous, ...item, name: previous?.name || item.name,
      ...(previous?.name && previous.name !== item.name ? { officialName: item.name } : {})
    }
  })
}
