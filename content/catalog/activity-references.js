import snapshots from './activity-reference-snapshots.json' with { type: 'json' }

export function withActivityReferences(guide) {
  const enrich = reference => {
    const snapshot = snapshots[reference.url]
    const title = snapshot && new URL(snapshot.revisionUrl).searchParams.get('title')
    // Preserve the actual article behind a reviewed redirect, e.g. Eater of Worlds.
    return { ...reference, ...snapshot, ...(title ? { url: `https://www.destinypedia.com/${title}` } : {}) }
  }
  return { ...guide, reference: enrich(guide.reference), references: (guide.references || []).map(enrich) }
}
