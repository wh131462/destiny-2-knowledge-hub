import { decodeDraft, encodeDraft } from '../../../packages/loadout-planner/index.js'

export const LOCAL_DRAFTS_KEY = 'd2hub-recommendation-drafts-v1'
const LEGACY_KEY = 'd2hub-recommendation-draft-v3'

function readRaw() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_DRAFTS_KEY) || '[]')
    if (Array.isArray(value)) return value
  } catch { /* malformed local data is ignored */ }
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    return legacy ? [{ id: `draft-${Date.now()}`, name: '我的配装一图流', updatedAt: new Date().toISOString(), encoded: legacy }] : []
  } catch { return [] }
}

export function listLocalDrafts() {
  return readRaw().filter(item => item && item.id && item.encoded).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

export function saveLocalDraft(draft, id = null) {
  const drafts = listLocalDrafts()
  const entry = { id: id || `draft-${Date.now()}`, name: draft.name || '未命名构筑', updatedAt: new Date().toISOString(), encoded: encodeDraft(draft) }
  const next = [entry, ...drafts.filter(item => item.id !== entry.id)]
  localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(next))
  return entry
}

export function removeLocalDraft(id) {
  const next = listLocalDrafts().filter(item => item.id !== id)
  localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(next))
  return next
}

export function draftFromEntry(entry, context) {
  return decodeDraft(entry.encoded, context)
}
